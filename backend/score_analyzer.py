import json
import logging
import os
from google import genai
from google.genai import types

from database import get_db_connection, update_user_field
from prompts import get_analyzer_prompt

logger = logging.getLogger(__name__)

def get_genai_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    return genai.Client(
        api_key=api_key,
        http_options={"api_version": "v1beta"},
    )

def analyze_coach_transcripts_background(username: str):
    """Background task to extract Wheel of Life scores and memory patterns from new transcripts."""
    logger.info(f"Triggering transcript analysis for user: {username}")
    
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT state, coach_transcripts FROM users WHERE id = ?", (username,)).fetchone()
        conn.close()
        
        if not user:
            logger.warning(f"User {username} not found for analysis.")
            return

        state = json.loads(user["state"] or "{}")
        transcripts = json.loads(user["coach_transcripts"] or "[]")
        
        if not transcripts:
            logger.info("No transcripts found to analyze.")
            state["has_new_riley_conversation"] = False
            update_user_field(username, "state", state)
            return

        memory = state.get("memory") or {}
        last_analyzed = memory.get("last_analyzed_timestamp")

        # Filter new transcripts based on timestamp
        new_transcripts = []
        if last_analyzed:
            for t in transcripts:
                if t.get("timestamp", "") > last_analyzed:
                    new_transcripts.append(t)
        else:
            new_transcripts = transcripts

        if not new_transcripts:
            logger.info("No new transcripts since last analysis.")
            state["has_new_riley_conversation"] = False
            update_user_field(username, "state", state)
            return

        logger.info(f"Analyzing {len(new_transcripts)} new transcript turns.")
        
        # Get the timestamp of the latest analyzed transcript turn
        latest_timestamp = new_transcripts[-1].get("timestamp")

        # Compile the prompt
        prompt = get_analyzer_prompt(state, new_transcripts)
        
        # Call Gemini Text API
        client = get_genai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )

        if not response.text:
            logger.error("Empty response from Gemini analyzer.")
            return

        # Parse output JSON
        result = json.loads(response.text.strip())
        logger.debug(f"Gemini Analyzer Result: {result}")

        # 1. Apply delta updates and focus recommendations to satisfaction scores for matching aspects
        aspect_updates = result.get("aspect_updates", [])
        aspects = state.get("aspects") or []
        
        for update in aspect_updates:
            name = update.get("name")
            delta = update.get("delta")
            focus = update.get("focus")
            if not name:
                continue
            
            # Find matching aspect in state (case-insensitive)
            for aspect in aspects:
                if aspect.get("name", "").lower() == name.lower():
                    # Calculate new score if delta is provided, clamp between 1 and 10
                    if delta is not None:
                        current_score = aspect.get("score", 5)
                        aspect["score"] = max(1, min(10, current_score + delta))
                        logger.info(f"Updated aspect {aspect['name']} score: {current_score} -> {aspect['score']} (delta: {delta})")
                    # Update focus recommendation if provided
                    if focus:
                        aspect["focus"] = focus
                        logger.info(f"Updated aspect {aspect['name']} focus recommendation: {focus}")
                    break
        
        # 2. Merge memory patterns, triggers, goals (union sets to avoid duplicates)
        result_mem = result.get("memory") or {}
        
        memory["user_patterns"] = list(set(
            memory.get("user_patterns") or []
        ).union(result_mem.get("user_patterns") or []))

        memory["emotional_triggers"] = list(set(
            memory.get("emotional_triggers") or []
        ).union(result_mem.get("emotional_triggers") or []))

        memory["goals"] = list(set(
            memory.get("goals") or []
        ).union(result_mem.get("goals") or []))

        # 3. Overwrite or update coach advice
        if "coach_advice" in result:
            memory["coach_advice"] = result["coach_advice"]

        # Update last analyzed mark
        memory["last_analyzed_timestamp"] = latest_timestamp
        
        # Save nested state
        state["memory"] = memory
        state["aspects"] = aspects
        state["has_new_riley_conversation"] = False
        
        update_user_field(username, "state", state)
        logger.info(f"Successfully updated aspects, memory, and advice for {username}")

    except Exception as e:
        logger.exception(f"Error in transcript background analysis: {e}")
