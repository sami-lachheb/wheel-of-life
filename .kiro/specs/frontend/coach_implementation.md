# AI Coach Centered Fluid Blob (Riley) Implementation Guide

This document outlines the **MindHack AI Coach** page (`/coach`): the Riley (like railway) fluid-blob UI, stateful conversation flow, memory integration, and automatic background assessment extraction.

**Latest commit:** `950adef` — `feat(coach): implement Hayat AI coach page with fluid morphing blob UI`  
*Note: The coach has been renamed from Hayat to Riley.*

---

## 0. Implementation Status

| Area | Status | Spec / Target |
|------|--------|---------------|
| Morphing blob + `isSpeaking` | Shipped | Uses `animate-morph`, faster when speaking |
| Subtitles in blob | Shipped | Displays real-time assistant transcription |
| Controls & Drawer | Shipped | Mute / Hold / Chat buttons + extracted tasks drawer |
| Coach Naming | Pending | Rename coach from "Hayat" to "Riley" in backend/frontend |
| Voice & Session Stack | Shipped | Gemini Live bidirectional audio via WebSocket proxy (`/api/coach/live`) |
| Real-time Transcription Logging | Pending | Write user and assistant transcripts to SQLite `coach_transcripts` table in real-time |
| Context Injection | Pending | Inject current Wheel scores, vision, and accumulated memory into system instruction |
| Async State / Score Analyzer | Pending | On dashboard load, trigger background extraction to update scores and memory |
| Memory Storage | Pending | Store extracted memory (patterns, triggers, goals) nested inside the user `state` JSON |

---

## 1. Core Architecture (POC)

```mermaid
graph TD
    Mic[Browser Mic] -->|PCM 16kHz| Backend[FastAPI Live Proxy]
    Backend -->|WebSocket| Live[Gemini Live API]
    Live -->|PCM 24kHz + transcripts| Backend
    Backend -->|WS| CoachJS[Coach.js]
    CoachJS -->|Web Audio API| Blob[Morphing Blob + Subtitles]
    
    DB[(SQLite)] -->|Read aspects, vision, memory| PromptConfig[Riley System Prompt]
    PromptConfig -->|Inject context| Live
    
    Backend -->|Write finished turns in real-time| DBLog[(coach_transcripts table)]
    
    Dashboard[Dashboard.js] -->|GET /api/user/state| APIState[/api/user/state]
    APIState -->|Trigger background task| Analyzer[Background Score Analyzer]
    DBLog -->|Fetch raw transcripts| Analyzer
    Analyzer -->|Call Gemini Text API| Extractor[Gemini Flash]
    Extractor -->|Return scores + memory| Analyzer
    Analyzer -->|Write state.aspects & state.memory| DB
```

---

## 2. Database Schema Extension (SQLite)

The `users` table is extended to log raw chat transcripts in real-time. On application startup, the database initialization must run:

```sql
ALTER TABLE users ADD COLUMN coach_transcripts TEXT DEFAULT '[]';
```

### Transcript Log Format
The `coach_transcripts` column stores a JSON array of message objects:
```json
[
  {
    "role": "user" | "assistant",
    "text": "I feel like I'm working 60 hours a week and have no energy for the gym.",
    "timestamp": "2026-05-23T05:00:00Z"
  }
]
```

### Memory Schema (Nested in `users.state`)
Instead of a separate table, memory and analytical progression are stored nested inside the user's `state` JSON column:
```json
{
  "completedOnboarding": true,
  "vision": "To design simple, meaningful products and find daily peace.",
  "aspects": [
    { "name": "Mental clarity", "score": 4 },
    { "name": "Energy & health", "score": 3 },
    { "name": "Relationships", "score": 8 }
  ],
  "memory": {
    "user_patterns": [
      "feels lost professionally",
      "avoids difficult conversations",
      "wants structure but fears pressure"
    ],
    "emotional_triggers": [
      "work pressure",
      "gym guilt"
    ],
    "goals": [
      "exercise twice a week",
      "protect weekend boundaries"
    ],
    "last_analyzed_timestamp": "2026-05-23T05:00:00Z"
  }
}
```

---

## 3. Gemini Live System Prompt & User Progress

To ensure Riley knows the current progress of the user with their Wheel of Life, the backend fetches the user's `state` (including current aspects, vision, and accumulated memory) and dynamically compiles it into Riley's system prompt during WebSocket handshake.

The prompt templates and context compilation logic are defined in [prompts.py](file:///home/sami/Desktop/MindHack/backend/prompts.py).

---

## 4. Background Score & Memory Analyzer

Every time the user visits the Dashboard, a background process runs to analyze the transcripts, update the scores, and extract memory insights:

1. **Trigger:** `GET /api/user/state` spawns a FastAPI `BackgroundTask`.
2. **Delta Check:** If there are no new entries in `coach_transcripts` since `last_analyzed_timestamp`, the background task exits immediately.
3. **Execution:** If new transcripts exist:
   - Fetch the new transcripts.
   - Run a prompt against the Gemini Text API (`gemini-2.5-flash`) containing the existing `state` and the transcript delta.
   - Instruct the model to return a structured JSON update containing:
     - Adjusted scores for the 8 categories (only if the user explicitly rated or discussed improvements/declines).
     - Newly discovered patterns, triggers, or goals to append to `state.memory`.
     - An updated `last_analyzed_timestamp`.
4. **Persist:** Write the updated JSON back to the `state` column in SQLite.

---

## 5. Development Tasks

1. **Rename Coach:** Refactor references of `Hayat` to `Riley` in system prompts, files, and UI displays.
2. **DB Migration:** Update `database.py` to add `coach_transcripts` to the user schema.
3. **Transcript Recording:** Modify `backend/coach_live.py` inside `_relay_gemini_turns` to append finished user/assistant turns directly into SQLite.
4. **System Instruction Builder:** Update `build_live_config` to inject current aspects, vision, and `state.memory` into the system prompt.
5. **Background Analyzer:** Implement the async updater in a new module and attach it to the `GET /api/user/state` endpoint in `backend/main.py`.
