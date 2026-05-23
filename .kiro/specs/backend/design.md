# Backend Design - Wheel of Life

## Tech Stack

- **Framework**: Python + FastAPI
- **Database**: SQLite (utilizing JSON serialization to avoid complex table structures)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Integration**: LangChain (for Journal Analysis & Life Coach Agents)

---

## Database Schema (JSON-Centric Storage)

Instead of normalized SQL tables, a single SQLite database file (`data/db.sqlite`) will be used. All user data, features, and logs will be stored in unstructured JSON columns inside a single `users` table. This allows fast, migration-free changes.

### Users Table Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Username or Email
    password_hash TEXT NOT NULL,   -- Bcrypt hashed password
    state TEXT DEFAULT '{}',       -- JSON: Core vision, aspects configurations, onboarding state
    journals TEXT DEFAULT '[]',    -- JSON Array: List of daily journal entries
    tasks TEXT DEFAULT '[]',       -- JSON Array: To-do items mapped to life aspects
    coach_history TEXT DEFAULT '[]'-- JSON Array: Dialogue context for the AI coach agent
);
```

---

## JSON Structure Mapping

### 1. User State (`state` column)
Stores user configuration, global vision, aspect scores, and onboarding status.
```json
{
  "vision": "My primary driver is personal growth. I want to improve my physical health to feel energized.",
  "completedOnboarding": true,
  "aspects": [
    {
      "name": "Health & Fitness",
      "score": 7,
      "vision": "Run 3 times a week and sleep 8 hours."
    },
    {
      "name": "Finance & Wealth",
      "score": 5,
      "vision": "Save 20% of monthly income."
    }
  ]
}
```

### 2. Journal Entry (`journals` column)
Stores historical reflection logs, emotions, locations, and mapped aspects.
```json
[
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Productive morning",
    "content": "Completed my morning runs and finished the layout refactor. Felt highly focused.",
    "emotions": {
      "general": "Positive",
      "specific": "Motivated"
    },
    "location": "Home Office",
    "timestamp": "2026-05-22T23:51:00Z",
    "mapped_aspects": ["Health & Fitness", "Career & Work"],
    "voice_url": null,
    "doodle_url": null
  }
]
```

### 3. Action Tasks (`tasks` column)
Stores short-term actions linked to specific aspects.
```json
[
  {
    "id": "t1u2v3w4-x5y6-7z8a-9b0c-1d2e3f4a5b6c",
    "title": "Schedule dental checkup",
    "aspect": "Health & Fitness",
    "completed": false,
    "created_at": "2026-05-22T23:51:00Z",
    "due_date": "2026-05-25"
  }
]
```

### 4. Coaching Dialogues (`coach_history` column)
Stores chat history for the AI coaching bot.
```json
[
  {
    "id": "session-1",
    "started_at": "2026-05-22T23:51:00Z",
    "messages": [
      {
        "role": "user",
        "content": "I feel like I'm neglecting my health due to work."
      },
      {
        "role": "assistant",
        "content": "Let's review your 'Health & Fitness' vision. You wrote 'Run 3 times a week'. What's stopping you?"
      }
    ]
  }
]
```

---

## API Endpoints

### 1. Authentication
* **POST `/api/auth/register`**
  * Request: `{ "username": "sami", "password": "secure_password" }`
  * Action: Hash password, create database row with initialized empty JSON blocks.
* **POST `/api/auth/login`**
  * Request: `{ "username": "sami", "password": "secure_password" }`
  * Response: `{ "access_token": "jwt_token_here", "token_type": "bearer" }`

### 2. User State & Onboarding
* **GET `/api/user/state`**
  * Returns the current `state` column JSON.
* **PUT `/api/user/state`**
  * Request: `{ "vision": "...", "completedOnboarding": true, "aspects": [...] }`
  * Action: Overwrite the `state` JSON column.

### 3. Journal Management (Phase 2)
* **GET `/api/journals`**: Fetch all journal entries.
* **POST `/api/journals`**: Submit a new journal entry. Triggers the LangChain agent background task to:
  * Parse entry content for emotions/causes.
  * Adjust aspect scores inside the user `state` based on the entry context.
  * Return the processed entry object.

### 4. Task Management
* **GET `/api/tasks`**: Fetch tasks.
* **POST `/api/tasks`**: Create new task.
* **PATCH `/api/tasks/{id}`**: Toggle task completion status or update details.

### 5. Coaching Bot Chat (Phase 3)
* **POST `/api/coach/chat`**
  * Request: `{ "message": "..." }`
  * Action: Append user message to `coach_history`, query LLM agent with user context and wheel metrics, append assistant message, return assistant reply.
