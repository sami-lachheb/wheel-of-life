from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import json
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

from database import init_db, get_user, create_user, update_user_field
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    decode_token_username,
)
from coach_live import run_coach_live_proxy
from score_analyzer import analyze_coach_transcripts_background

app = FastAPI(title="Wheel of Life API")

# Enable CORS for frontend application (and local tools)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic Schemas
class AuthRequest(BaseModel):
    username: str
    password: str

class AspectSchema(BaseModel):
    name: str
    score: int
    vision: Optional[str] = ""

class StateSchema(BaseModel):
    vision: Optional[str] = ""
    completedOnboarding: Optional[bool] = False
    aspects: List[AspectSchema] = []
    memory: Optional[dict] = {}
    mood: Optional[dict] = None

class JournalRequest(BaseModel):
    title: str
    content: str
    emotions: Optional[Any] = None
    aspects: Optional[List[str]] = []
    location: Optional[str] = ""
    voice_url: Optional[str] = None
    doodle_url: Optional[str] = None

class TaskRequest(BaseModel):
    title: str
    aspect: str
    due_date: Optional[str] = ""

class SuggestionRequest(BaseModel):
    text: str

class ReflectRequest(BaseModel):
    journal_id: str

# Routes
@app.post("/api/auth/register")
def register(req: AuthRequest):
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    existing = get_user(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed = hash_password(req.password)
    success = create_user(req.username, hashed)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    return {"message": "User registered successfully"}

@app.post("/api/auth/login")
def login(req: AuthRequest):
    user = get_user(req.username)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    token = create_access_token(req.username)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/user/state")
def get_state(background_tasks: BackgroundTasks, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    state = json.loads(user["state"] or "{}")
    
    # Check 12-hour expiration on mood check-in
    mood = state.get("mood")
    if mood and "timestamp" in mood:
        try:
            # Handle possible 'Z' suffix by replacing it or parsing appropriately
            ts_str = mood["timestamp"].replace("Z", "+00:00")
            mood_time = datetime.fromisoformat(ts_str)
            # Compare in UTC
            now = datetime.now(mood_time.tzinfo)
            diff = (now - mood_time).total_seconds() / 3600.0
            if diff >= 12.0:
                # Expire the mood
                state["mood"] = None
                update_user_field(username, "state", state)
        except Exception:
            pass

    if state.get("has_new_riley_conversation"):
        logger.info(f"New Riley conversation detected. Queueing background transcript analysis for user {username}")
        background_tasks.add_task(analyze_coach_transcripts_background, username)
    return state

@app.put("/api/user/state")
def update_state(state_data: StateSchema, username: str = Depends(get_current_user)):
    update_user_field(username, "state", state_data.dict())
    return {"message": "State updated successfully", "state": state_data}

@app.get("/api/journals")
def get_journals(username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return json.loads(user["journals"] or "[]")

@app.post("/api/journals")
def add_journal(req: JournalRequest, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    journals = json.loads(user["journals"] or "[]")
    
    mapped = req.aspects or []
    if not mapped:
        # Mock journal aspect mapping logic (Phase 2 LLM Integration Stub)
        content_lower = req.content.lower()
        if "health" in content_lower or "run" in content_lower or "gym" in content_lower or "sleep" in content_lower:
            mapped.append("Health & Fitness")
        if "work" in content_lower or "code" in content_lower or "job" in content_lower or "career" in content_lower:
            mapped.append("Career & Work")
        if "money" in content_lower or "finance" in content_lower or "wealth" in content_lower or "save" in content_lower:
            mapped.append("Finance & Wealth")
        if "family" in content_lower or "friend" in content_lower or "relation" in content_lower:
            mapped.append("Relationships & Family")
            
        if not mapped:
            mapped.append("Personal Growth")
        
    new_entry = {
      "id": str(uuid.uuid4()),
      "title": req.title,
      "content": req.content,
      "emotions": req.emotions or {"general": "neutral", "specific": "calm"},
      "location": req.location,
      "timestamp": datetime.utcnow().isoformat(),
      "mapped_aspects": mapped,
      "voice_url": req.voice_url,
      "doodle_url": req.doodle_url
    }
    
    journals.append(new_entry)
    update_user_field(username, "journals", journals)
    return new_entry

# Simple cache store
prompt_cache = {}

@app.get("/api/journal/prompt")
def get_journal_prompt(username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    state_data = json.loads(user["state"] or "{}")
    memory = state_data.get("memory", {})
    goals = memory.get("goals", [])
    advice = memory.get("coach_advice", [])
    aspects = state_data.get("aspects", [])
    
    lowest_aspect = None
    if aspects:
        lowest_aspect = min(aspects, key=lambda a: a.get("score", 10))
        
    # Build context lines
    context_lines = []
    if goals:
        context_lines.append(f"- Active Goals: {', '.join(goals)}")
    if advice:
        context_lines.append(f"- Coach Advice: {', '.join(advice)}")
    if lowest_aspect:
        context_lines.append(f"- Lowest Aspect: {lowest_aspect.get('name')} (Score: {lowest_aspect.get('score')}/10, Vision: {lowest_aspect.get('vision')})")
        
    context = "\n".join(context_lines)
    
    guided_prompts = memory.get("guided_prompts") or []
    
    # If pool is empty or low, generate a new batch of 5
    if len(guided_prompts) <= 1:
        system_instruction = (
            "You are a supportive personal coach. Based on the user's profile context (active goals, coach advice, and lowest aspect satisfaction), "
            "generate 5 distinct, high-quality, personalized, and deep journaling reflection questions (12 to 25 words each) "
            "designed to serve as their main entry prompt. Avoid generic or robotic prompts. Each prompt must be a complete question or statement.\n"
            "Return the output as a JSON object containing a 'prompts' list of strings.\n"
            "Example: {\"prompts\": [\"Considering your goal to exercise more, what specifically stopped you from completing your workout today?\", \"What small boundary did you hold today that improved your focus at work?\"]}"
        )
        prompt_input = f"User's profile context:\n{context}"
        
        from score_analyzer import get_genai_client
        from google.genai import types
        
        try:
            client = get_genai_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_input,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=300,
                    temperature=0.8,
                    response_mime_type="application/json",
                )
            )
            res_data = json.loads(response.text.strip())
            new_prompts = res_data.get("prompts", [])
            # Merge with existing ones (to avoid losing any, though pool is low)
            guided_prompts = list(set(guided_prompts).union(new_prompts))
        except Exception as e:
            logger.error(f"Error generating guided prompts batch: {e}")
            if not guided_prompts:
                guided_prompts = [
                    "What's on your mind today? Reflect on your recent commitments.",
                    "How is your progress aligning with your core goals?",
                    "What is a win you had today, however small?"
                ]
                
    # Pop one prompt
    if guided_prompts:
        prompt_str = guided_prompts.pop(0)
    else:
        prompt_str = "What's on your mind today? Reflect on your personal growth."
        
    memory["guided_prompts"] = guided_prompts
    state_data["memory"] = memory
    
    # Save to DB
    from database import update_user_field
    update_user_field(username, "state", state_data)
    
    return {"prompt": prompt_str}

FALLBACK_SUGGESTIONS = [
    "What is one small win you achieved today, and how did it make you feel?",
    "Did you face any obstacles today? How did you respond to them?",
    "What aspect of your day brought you the most energy or excitement?",
    "Is there anyone you felt particularly grateful for today? Why?",
    "If you could redo one interaction from today, what would you do differently?",
    "How did you progress toward your primary life goals today?",
    "What did you do today that aligned with your core values?",
    "How did you take care of your mental or physical health today?",
    "What boundaries did you set or struggle with today?",
    "What is one commitment you want to make for tomorrow?"
]

FALLBACK_ACTIVE_NUDGES = {
    "work": [
        "What specifically about work is on your mind?",
        "How does this impact your professional boundaries?",
        "What is the next step you can take to resolve this work challenge?"
    ],
    "health": [
        "How is this affecting your physical or mental well-being?",
        "What small self-care action can you take right now?",
        "How does this connect to your health goals?"
    ],
    "relationship": [
        "How did this interaction affect your connection with them?",
        "What feelings did this bring up in you?",
        "How can you communicate your needs more clearly here?"
    ],
    "feel": [
        "Can you describe that feeling in more detail?",
        "What do you think triggered this emotional response?",
        "How are you holding that feeling right now?"
    ],
    "stuck": [
        "What specifically makes you feel stuck in this situation?",
        "If there were no constraints, what would you do next?",
        "What support do you need to move forward?"
    ]
}

GENERAL_ACTIVE_FALLBACKS = [
    "Can you expand on what that experience was like for you?",
    "How did you feel in that exact moment?",
    "What did you learn about yourself from this?",
    "What is the underlying cause of this, in your view?",
    "How does this relate to the person you are striving to become?"
]

@app.post("/api/journal/suggest")
def get_journal_suggestion(req: SuggestionRequest, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    state_data = json.loads(user["state"] or "{}")
    memory = state_data.get("memory", {})
    goals = memory.get("goals", [])
    advice = memory.get("coach_advice", [])
    aspects = state_data.get("aspects", [])
    
    lowest_aspect = None
    if aspects:
        lowest_aspect = min(aspects, key=lambda a: a.get("score", 10))
        
    # Build context lines
    context_lines = []
    if goals:
        context_lines.append(f"- Active Goals: {', '.join(goals)}")
    if advice:
        context_lines.append(f"- Coach Advice: {', '.join(advice)}")
    if lowest_aspect:
        context_lines.append(f"- Lowest Aspect: {lowest_aspect.get('name')} (Score: {lowest_aspect.get('score')}/10, Vision: {lowest_aspect.get('vision')})")
        
    context = "\n".join(context_lines)
    
    is_empty_or_short = not req.text or len(req.text.strip()) < 15
    
    from score_analyzer import get_genai_client
    from google.genai import types
    import random
    
    if is_empty_or_short:
        # Check database pre-generated suggestions
        suggestions_list = memory.get("journal_suggestions") or []
        if not suggestions_list:
            # Generate a new batch of 5 suggestions
            system_instruction = (
                "You are a context-aware journaling guide. Based on the user's profile context (active goals, coach advice, and lowest aspect satisfaction), "
                "generate 5 distinct, high-quality, thought-provoking reflective questions or prompt starters (4 to 12 words each) "
                "designed to help them start writing their journal. Each prompt must be a complete sentence/question, NOT a single word or fragment.\n"
                "Return the output as a JSON object containing a 'suggestions' list of strings.\n"
                "Example: {\"suggestions\": [\"How did today's distractions affect your stress levels?\", \"What boundaries did you hold or break today?\"]}"
            )
            prompt_input = f"User's profile context:\n{context}"
            try:
                client = get_genai_client()
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt_input,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        max_output_tokens=200,
                        temperature=0.8,
                        response_mime_type="application/json",
                    )
                )
                res_data = json.loads(response.text.strip())
                suggestions_list = res_data.get("suggestions", [])
            except Exception as e:
                logger.error(f"Error pre-generating suggestions: {e}")
                suggestions_list = list(FALLBACK_SUGGESTIONS)
                random.shuffle(suggestions_list)
            
        # Pop the first suggestion and save the rest
        if suggestions_list:
            suggestion_str = suggestions_list.pop(0)
        else:
            suggestion_str = random.choice(FALLBACK_SUGGESTIONS)
            
        memory["journal_suggestions"] = suggestions_list
        memory["active_suggestion"] = suggestion_str
        state_data["memory"] = memory
        
        # Save to DB
        from database import update_user_field
        update_user_field(username, "state", state_data)
        
        return {"suggestion": suggestion_str}
        
    else:
        # User has written something; incentivize them to write more details
        system_instruction = (
            "You are a context-aware journaling guide. The user has already started writing a journal entry.\n"
            "Analyze their current text and their profile context (goals, lowest aspect, advice).\n"
            "Suggest a single, short complete question (4 to 12 words) designed to push/incentivize them "
            "to elaborate, write more details, explain their emotions, or state next action steps related to what they wrote.\n"
            "Constraints:\n"
            "1. Do NOT just complete their sentence. Ask them to expand.\n"
            "2. Do NOT output single words, fragments, or conversational padding (e.g. no 'Here is a hint:').\n"
            "3. Output ONLY the raw question string."
        )
        prompt_input = f"User's profile context:\n{context}\n\nUser's current text input:\n{req.text}"
        
        try:
            client = get_genai_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_input,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=60,
                    temperature=0.7,
                )
            )
            suggestion_str = response.text.strip().replace('"', '')
            if not suggestion_str:
                raise ValueError("Empty suggestion text returned")
        except Exception as e:
            logger.error(f"Error generating active nudge: {e}")
            # Intelligent keyword-based fallback system
            text_lower = req.text.lower()
            matched_nudge = None
            for key, nudges in FALLBACK_ACTIVE_NUDGES.items():
                if key in text_lower:
                    matched_nudge = random.choice(nudges)
                    break
            if matched_nudge:
                suggestion_str = matched_nudge
            else:
                suggestion_str = random.choice(GENERAL_ACTIVE_FALLBACKS)
            
        # Save to DB
        memory["active_suggestion"] = suggestion_str
        state_data["memory"] = memory
        from database import update_user_field
        update_user_field(username, "state", state_data)
        
        return {"suggestion": suggestion_str}

@app.post("/api/journal/reflect")
def get_journal_reflection(req: ReflectRequest, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    journals = json.loads(user["journals"] or "[]")
    target_entry = None
    for entry in journals:
        if entry.get("id") == req.journal_id:
            target_entry = entry
            break
            
    if not target_entry:
        if journals:
            target_entry = journals[-1]
        else:
            raise HTTPException(status_code=404, detail="No journal entries found")
            
    title = target_entry.get("title", "")
    content = target_entry.get("content", "")
    aspects = target_entry.get("mapped_aspects", [])
    
    system_instruction = (
        "You are an insightful life coach. Read the user's journal entry and produce a response. "
        "Output a JSON object with two fields:\n"
        "1. 'insight': A single-sentence warm, observant reflection/micro-insight pointing out a pattern or strength.\n"
        "2. 'suggested_coach_topic': A short phrase (2-4 words) defining a topic they should discuss with their coach.\n"
        "Output ONLY valid JSON. Do not wrap in markdown code blocks."
    )
    
    prompt_input = f"Journal Title: {title}\nJournal Mapped Aspects: {', '.join(aspects)}\nJournal Content: {content}"
    
    from score_analyzer import get_genai_client
    from google.genai import types
    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_input,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                max_output_tokens=150,
                temperature=0.7,
                response_mime_type="application/json",
            )
        )
        res_json = json.loads(response.text.strip())
        insight = res_json.get("insight", "Nice reflection. Keep up the journaling practice.")
        topic = res_json.get("suggested_coach_topic", "General Growth")
    except Exception as e:
        logger.error(f"Error generating reflection: {e}")
        insight = "A thoughtful entry. Each reflection is a step towards self-understanding."
        topic = "Personal Development"
        
    return {
        "insight": insight,
        "suggested_coach_topic": topic
    }

@app.get("/api/tasks")
def get_tasks(username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return json.loads(user["tasks"] or "[]")

@app.post("/api/tasks")
def add_task(req: TaskRequest, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    tasks = json.loads(user["tasks"] or "[]")
    new_task = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "aspect": req.aspect,
        "completed": False,
        "created_at": datetime.utcnow().isoformat(),
        "due_date": req.due_date
    }
    tasks.append(new_task)
    update_user_field(username, "tasks", tasks)
    return new_task

@app.patch("/api/tasks/{task_id}")
def toggle_task(task_id: str, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    tasks = json.loads(user["tasks"] or "[]")
    updated = False
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            updated = True
            break
            
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_user_field(username, "tasks", tasks)
    return {"message": "Task completion toggled"}

@app.post("/api/coach/chat")
def coach_chat(req: dict, username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    history = json.loads(user["coach_history"] or "[]")
    user_msg = req.get("message", "")
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message is required")
        
    history.append({"role": "user", "content": user_msg})
    
    # Mock bot response matching the user context and wheel scores
    state = json.loads(user["state"] or "{}")
    aspect_scores = ", ".join([f"{a['name']}: {a['score']}/10" for a in state.get("aspects", [])])
    
    bot_reply = f"I hear you. Looking at your current Wheel of Life ({aspect_scores}), how does your concern relate to your goals in these areas?"
    
    history.append({"role": "assistant", "content": bot_reply})
    update_user_field(username, "coach_history", history)
    
    return {"reply": bot_reply, "history": history}


@app.websocket("/api/coach/live")
async def coach_live_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT access token"),
):
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return

    try:
        username = decode_token_username(token)
    except HTTPException:
        await websocket.close(code=1008, reason="Unauthorized")
        return

    user = get_user(username)
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return

    user_state = json.loads(user["state"] or "{}")
    await websocket.accept()

    try:
        await run_coach_live_proxy(websocket, username, user_state)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": str(exc)})
            )
        except Exception:
            pass
        await websocket.close(code=1011)
    finally:
        try:
            user = get_user(username)
            if user:
                current_state = json.loads(user["state"] or "{}")
                current_state["has_new_riley_conversation"] = True
                update_user_field(username, "state", current_state)
                logger.info(f"Set has_new_riley_conversation=True for user {username}")
        except Exception as e:
            logger.error(f"Failed to set has_new_riley_conversation flag: {e}")
