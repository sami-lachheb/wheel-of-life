from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import uuid
from datetime import datetime

from database import init_db, get_user, create_user, update_user_field
from auth import hash_password, verify_password, create_access_token, get_current_user

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

class JournalRequest(BaseModel):
    title: str
    content: str
    emotions: Optional[dict] = {"general": "neutral", "specific": "calm"}
    location: Optional[str] = ""
    voice_url: Optional[str] = None
    doodle_url: Optional[str] = None

class TaskRequest(BaseModel):
    title: str
    aspect: str
    due_date: Optional[str] = ""

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
def get_state(username: str = Depends(get_current_user)):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return json.loads(user["state"] or "{}")

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
    
    # Mock journal aspect mapping logic (Phase 2 LLM Integration Stub)
    content_lower = req.content.lower()
    mapped = []
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
