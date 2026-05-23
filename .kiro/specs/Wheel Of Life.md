# Wheel of Life App

## Background

See [Background.md](./Background.md) for comprehensive context on the Wheel of Life concept, psychological foundations, and coaching applications.

The Wheel of Life is a coaching tool for assessing and balancing life satisfaction across key dimensions. Originally developed by Paul J. Meyer in the 1960s, it helps individuals identify areas needing attention and set focused goals for improvement.

### Core Concept

According to Eakman (2016), life moves out of balance "when the fulfillment of basic psychological needs has been thwarted within ongoing patterns of day-to-day occupations" and it causes harm to wellbeing. The Wheel of Life helps restore equilibrium by identifying which areas meet basic psychological needs (autonomy, relatedness, competence) and which do not.

### Standard Dimensions

The wheel typically consists of 8-10 categories essential for a fulfilling life. Segment names vary, but common themes include:

- Money & Finances
- Career & Work
- Health & Fitness
- Fun & Recreation
- Environment (home/work)
- Community
- Family & Friends
- Partner & Love
- Personal Growth & Learning
- Spirituality

### Scoring Method

Users score each category from 1-10 to represent satisfaction level. The resulting "bumpy wheel" visually highlights imbalances. Regular re-scoring tracks progress.

## App Overview

**Mission**: Measure and improve life satisfaction across key aspects through journaling, coaching, and structured reflection.

---

## Phase 1: Onboarding

**Goal**: Establish user's vision and initial wheel of life

**Features**:
- User selects life aspects (health, finance, relationships, career, etc.)
- User describes ultimate vision for each aspect in plain text
- AI validates completeness, asks follow-up questions if needed
- AI summarizes each aspect into a single word
- AI generates initial wheel visualization

**Tech**: LangChain LLM for vision analysis/summarization

---

## Phase 2: Journaling

**Goal**: Daily reflection with structured output

**Features**:
- User inputs raw journal (text, emotion, location, voice note optional)
- Journal Agent processes input:
  - Extracts emotions + causes
  - Maps to relevant wheel aspects
  - Generates structured recap
- Scoring Agent adjusts wheel scores based on journal content
- Daily progress tracking

**Input Fields**:
- Title (30 chars)
- Raw journal
- Emotion (general + specific)
- Location
- Voice note
- Doodle (optional)

**Output**: Summary card with mapped wheel aspects

**Tech**: LangChain agents for journal processing, scoring logic

---

## Phase 3: Coach Development

**Goal**: Weekly coaching conversations with task planning

**Features**:
- Weekly conversation with Coach Agent (female voice)
- Coach reviews journal history, wheel scores
- Productivity Agent extracts tasks:
  - Task name
  - Description
  - Priority
  - Deadline
  - Mapped wheel aspect
- Task planner storage

**Design**: Green `#00312C`, Gold `#FFD700`

**Tech**: LangGraph for multi-agent workflow, FastAPI backend, React frontend

---

## Stack

- **Backend**: FastAPI + LangChain + LangGraph
- **Frontend**: React
- **LLM**: OpenAI (implied by voice, female agent)

## Architecture

### Container Structure

```
wheel-of-life/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── agents/
│       ├── services/
│       └── models/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── .env.example
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend (React) | 3000 | User interface for journaling, wheel visualization, coaching |
| Backend (FastAPI) | 8000 | REST API, LangChain/LangGraph agents, scoring logic |
| GenAI Service | 11434 | Local LLM (Ollama) for agent reasoning |

---

## References

Byrne, U. (2005). Wheel of life. Business Information Review, 22(2), 123–130.

Eakman, A. M. (2016). A subjectively-based definition of life balance using personal meaning in occupation. Journal of Occupational Science, 23(1), 108–127.

Ryan, R. M., & Deci, E. L. (2018). Self-determination theory: Basic psychological needs in motivation, development, and wellness. Guilford Press.
