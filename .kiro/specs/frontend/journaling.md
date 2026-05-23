# Guided Journaling Specification

## 1. Overview
The Guided Journaling feature transforms the passive, open-ended journal text box into an active, context-aware coaching surface. It addresses the "blank canvas" friction by priming the user with personalized prompts, guiding their writing rhythm with a floating contextual nudge bubble (replacing inline ghost text autocompletions), and closing the loop post-save with actionable insights and coach transitions.

---

## 2. Architecture & Design

### Phase 1: Entry Point (Personalized Prompt Card)
To remove blank-page anxiety, opening `/journal` dynamically builds a prompt card based on the current state:
*   **Contextual Hook**: The card displays a custom-generated prompt derived from:
    *   **Lowest Wheel Score**: *"You rated Health at 3. What is one thing your body told you today?"*
    *   **Recent Coach Session**: *"Riley noticed you discussed boundary setting. What triggered that focus?"*
    *   **Active Goal**: *"Your current goal is 'Practice breathwork'. Did you find time for it today?"*
    *   **Mood Lifecycle**: *"You logged feeling anxious earlier. What is underlying that sensation?"*
*   **Prompt Caching Pool**: Rather than invoking the LLM on every page view, prompts are generated in persistent batches of 5 and stored in the database (`state["memory"]["guided_prompts"]`). When a user loads the page, one is popped off the list. If the pool drops low, a background Gemini call replenishes it.
*   **Structure Outline**: Underneath the prompt, the card hints at a structural flow:
    1. **Facts**: What happened
    2. **Emotions**: How you felt
    3. **Commitment**: What you will do next
*   **Interaction**: The user taps "Start Writing" or scrolls down, smoothly collapsing the card into a minimized header and revealing the editor text area.

### Phase 2: Active Writing & Floating Help Bubble
Instead of inline completions that write the user's sentences for them, the interface offers a non-intrusive guide:
*   **Standard Textarea**: Renders a standard, high-performance `<textarea>` for text entry.
*   **Floating Help Icon**: A small circle button containing `?` floats in the bottom right corner, positioned `bottom-28` to leave breathing room above the navigation bar.
*   **Peeking Tooltip**: A small text card next to or above the `?` icon displays thought-starters (e.g., *"Try writing about: How you handled work boundaries today"*).
*   **Dual-Path suggestion engine**:
    *   **Empty State (<15 characters)**: Pops a pre-generated prompt from `state["memory"]["journal_suggestions"]` to ensure instant loading.
    *   **Active State (>=15 characters)**: Invokes the Gemini API on typing pauses to generate a high-incentive, context-aware elaboration nudge based on what the user has already written.
*   **Throttling & UX Flow**:
    *   **Typing Dismissal**: The tooltip bubble immediately retracts (`setShowHelperBubble(false)`) the moment the user resumes typing, keeping the canvas distraction-free.
    *   **5-Second Cooldown**: Frontend requests are throttled to a maximum of one request every 5 seconds. Repeatedly pressing `?` or pausing will display the current suggestion in the bubble without making duplicate network requests.
    *   **Static Reflection Header**: The header of the suggestion card is kept static as `"Reflection cue"` to maintain visual cleanliness.

### Phase 3: Inline Emotional Intelligence
Rather than a separate, manual check-in step:
*   **Client-Side Scanners**: A lightweight dictionary matching utility checks input in real-time for ~80 emotion terms (e.g., "overwhelmed", "proud", "stuck").
*   **Dynamic Pill**: When matched, a small, non-blocking floating pill appears above the toolbar: *"Feeling overwhelmed?"*.
*   **Deduplication**: If the detected emotion has already been added to the entry's tag list, the scanner suppresses the banner to prevent spam.
*   **Tag it & Slide**: Clicking "Tag It" automatically pre-selects the emotion descriptor, dismisses the pill, and triggers the `EmotionSelectorSheet` to open on Step 2 (skipping the pleasantness slider stage since the emotion has already been confirmed, though the user can still navigate back to Step 1).

### Phase 4: Organically Emerging Section Dividers
*   Subtle visual indicators appear inside the layout flow to encourage progression:
    *   After ~150 characters with no emotional terms: `— how did that make you feel? —`
    *   After emotional words are registered: `— what will you do about it? —`

### Phase 5: Post-Save Feedback Loop
*   **Summary Screen**: Instead of immediately redirecting to the dashboard, saving displays a summary card showing:
    *   **Detected Emotions**: Mapped color pills.
    *   **Affected Aspects**: Mapped balance segments.
    *   **AI Micro-Insight**: A single sentence linking patterns (e.g., *"You've mentioned work boundaries twice this week. Riley can help you build actions around this."*).
*   **CTAs**:
    *   `Done`: Redirects to Dashboard.
    *   `Talk to Riley`: Redirects to Coach, passing the journal text as background context.

---

## 3. Data Flow & API Contracts

### A. Fetch Prompt
*   **Endpoint**: `GET /api/journal/prompt`
*   **Cache**: Cached for 30 minutes.
*   **Response**:
    ```json
    {
      "prompt": "You rated Career at 4/10 yesterday. What boundary did you struggle to hold today?",
      "aspect": "Career & Work"
    }
    ```

### B. Inline Suggestion (Topic Nudge)
*   **Endpoint**: `POST /api/journal/suggest`
*   **Payload**:
    ```json
    {
      "text": "I sat down to write my code but got distracted by Slack messages"
    }
    ```
*   **Response**:
    ```json
    {
      "suggestion": "How did your distraction affect your energy levels for the rest of the work day?"
    }
    ```
*   **Fail-safe Backend Fallback**: If the Gemini API rate limit is exceeded (e.g. `429 RESOURCE_EXHAUSTED`), the backend falls back to a randomized pool of high-quality reflective cues (or keyword-matched questions based on words like 'work', 'health', 'relationship' in the text) instead of returning an empty string.

### C. Save & Reflection Summary
*   **Endpoint**: `POST /api/journal/reflect`
*   **Response**:
    ```json
    {
      "insight": "You mapped this to Career. This marks your third reflection on focus this week.",
      "suggested_coach_topic": "Minimizing workspace distractions"
    }
    ```
