# Frontend Design - Wheel of Life

## Tech Stack

- **Framework**: React 18+ (JavaScript, no TypeScript)
- **Styling**: Tailwind CSS
- **State**: React Context + useReducer
- **Routing**: React Router v6
- **UI Components**: Custom (Tailwind-based) + Lucide Icons + Custom SVG Components

## Design Philosophy

- **Mobile-Only Frame**: The entire frontend application is constrained to a mobile viewport aspect ratio (`max-w-[430px] w-full min-h-screen mx-auto bg-light-gray shadow-2xl relative flex flex-col`) centered on screen, with a dark slate background (`bg-slate-900`) filling the desktop space.
- **Touch-First Elements**: Layouts are optimized for compact mobile ratios (e.g. tight vertical paddings, compact margins, and touch-friendly controls).
- **No Emoji Policy**: All emoji characters in the UI have been replaced with Lucide React SVG icons or custom SVG components. Emojis are inconsistent across platforms and OS render engines. The design system relies exclusively on vector-based indicators.
- **MoodBloom Design Language**: Mood states throughout the application are visualized using a custom geometric SVG system (`MoodBloom.js`) rather than emoji faces. Each mood tier maps to a distinct animated geometric personality (wavy concentric circles, rotating squares, overlapping ellipses, petal mandalas, pointed leaf shapes). Colors are derived from a shared `PALETTES` constant to ensure consistency across all consumers.


---


## Docker Compose Configuration

```yaml
# Compose Specification (v2023.9+) - Legacy 3.x versions merged into spec
# https://docs.docker.com/compose/compose-file/

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wheel-of-life-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    restart: unless-stopped
    networks:
      - wheel-of-life-network

networks:
  wheel-of-life-network:
    driver: bridge
```

---

## Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── assets/
│   │   ├── logo/
│   │   └── images/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Container.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── WheelVisualization.tsx
│   │   │   ├── EmotionSelectorSheet.js
│   │   │   └── MoodBloom.js
│   │   └── onboarding/
│   │       ├── VisionInput.tsx
│   │       └── AspectSelector.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Journal.tsx
│   │   ├── Coach.tsx
│   │   └── Dashboard.tsx
│   ├── contexts/
│   │   ├── UserContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   └── useWheel.ts
│   ├── utils/
│   │   ├── api.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── Dockerfile
├── package.json
└── vite.config.ts
```

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Vibrant Indigo | `#6366f1` | Main brand color, buttons, accents |
| Sunset Orange/Coral | `#f97316` | Highlights, success states, special elements |
| White | `#FFFFFF` | Backgrounds, text on dark |
| Light Gray | `#F5F5F5` | Secondary backgrounds |
| Dark Gray | `#333333` | Primary text |

### MoodBloom Color Palettes

| Mood | Primary | Secondary | Usage |
|------|---------|-----------|-------|
| Rough | `#f43f5e` | `#ec4899` | Very Unpleasant state — rose/pink |
| Low | `#f59e0b` | `#f97316` | Slightly Unpleasant — amber/orange |
| Okay | `#94a3b8` | `#64748b` | Neutral state — slate |
| Good | `#8b5cf6` | `#a78bfa` | Slightly Pleasant — violet/indigo |
| Great | `#10b981` | `#2dd4bf` | Very Pleasant — emerald/teal |

---

## Landing Page (Onboarding Entry Point)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (transparent, scrolls with content)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [LOGO - Full Screen, Centered]                             │
│                                                             │
│  "Wheel of Life"                                            │
│  Your journey to balanced living                            │
│                                                             │
│  [Scroll Down Indicator]                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Feature Highlights (scrollable)                            │
│  - Journaling                                               │
│  - Habit Tracking                                           │
│  - Life Coach                                               │
│  - Wheel Visualization                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Navbar

- Constrained fixed width (`fixed top-0 left-0 right-0 max-w-[430px] mx-auto w-full z-50`) to match the centered mobile container.
- Mobile-only implementation: The desktop navigation layout is disabled, forcing the mobile hamburger toggle button and slide-down drawer layout to stay active across all desktop and mobile viewport sizes.

### Hero Section

- Logo: 60vh height, centered
- Tagline: "How good are you at what you're doing?"
- Scroll indicator: Animated arrow

### Feature Cards (Scrollable)

Each card includes:
- Icon
- Title
- Short description
- "Learn More" link

---

## Onboarding Flow

### Step 1: Aspect Selection

**URL**: `/onboarding/aspects`

**Components**:
- Header: "Which areas of your life are most important to you?"
- Multi-select grid of life aspects (health, finance, relationships, etc. - select 3 to 10)
- Next button

**Features**:
- Suggests/requires at least 3 aspects before moving forward.

### Step 2: Aspect Rating & Specific Visions (Focus Mode)

**URL**: `/onboarding/rates`

**Components**:
- Distraction-Free Layout: Header, footer, and navigation menus are hidden.
- One aspect per screen.
- Satisfaction score rating selection (slider 1-10).
- Text area to input the specific target vision for the current aspect.
- Progress indicator showing current aspect rating step.
- Back and Next/Continue navigation buttons.

### Step 3: Wheel Preview

**URL**: `/onboarding/preview`

**Components**:
- Interactive wheel visualization
- Hover details for segment satisfaction
- Aspect summary list
- Finish & Save button
- **Authentication Gate**: Prompt user to sign up or log in *after* previewing their wheel to persist their onboarding progress to the database and transition to the Dashboard.

---

## Navigation Structure

```
Landing (/)
├── About (/about)
└── Get Started (/onboarding)
    ├── Aspects (/onboarding/aspects)
    ├── Rates (/onboarding/rates)
    └── Preview (/onboarding/preview)

Dashboard (/dashboard)
├── Journal (/journal)
├── Coach (/coach)
├── Wheel (/wheel)
└── Tasks (/tasks)
```

### Dashboard Features & Layout
- **Daily Companion Greeting & State of Mind Check-in**:
  * Displays user greeting ("Hello, {username}") alongside a continuous mood check-in range slider (gradient track from rose-400 to emerald-400, corresponding to pleasantness scale 1-5).
  * Letting go of the slider (on pointer-up or touch-end) triggers the unified, three-step `EmotionSelectorSheet` modal to enter rich details and context.
  * Once submitted, the dashboard lists the selected specific tags beneath the slider to reinforce awareness.
- **Top Aspect Card**:
  * Highlights the user's highest-scored life aspect dynamically.
  * Renders with an encouraging, celebratory layout (e.g. gradient styling, star/trophy icon, and supportive messaging) to build momentum.
- **Swipable Focus Cards (Aspect Carousel)**:
  * Shows a horizontal swipable carousel of card components, one for each life aspect.
  * Uses CSS scroll-snap (`snap-x snap-mandatory overflow-x-auto flex gap-4`) for fluid swiping.
  * Each card displays the aspect name, satisfaction score, target vision, and a personalized, AI-generated focus recommendation (stored dynamically in the aspect's `focus` field).
- **Streak Tracker ("Your Week")**:
  * A horizontal calendar strip showing the last 7 days. Displays a small indicator dot above day capsules that have completed journal entries recorded.
- **Execution & Insight Cards**:
  * **Goals Card**: Displays active user goals extracted by the AI coach from `state.memory.goals`.
  * **Coach Advice Card**: Displays actionable advice bullet points generated by the AI from `state.memory.coach_advice`.
  * **Wheel Visualization Card**: A compact display of the `WheelVisualization` component serving as a visual reference of the current wheel shape.
- **Floating Bottom Navigation Bar**:
  * Relocates navigation links into a persistent bottom capsule (`fixed bottom-6 w-[90%] z-50 rounded-full bg-slate-900/95 backdrop-blur-md`) featuring bubble highlight states for active routes.

### Feature Navigation
- **Previous & Home Navigation Header**:
  * Every core feature page (Journaling, Coach session, Wheel page, Task manager) contains a standardized navigation header.
  * Top Left: Standardized back pill (`ArrowLeft` icon + "Previous") bound to `navigate(-1)`.
  * Persistent Home Button: A standardized home navigation button (linking to `/dashboard`) must be present in the header/navbar of all feature pages, including the Coach page and the Journal page.
- **Wheel of Life Page (`/wheel`)**:
  * **Layout Structure**: 
    - **Header Section**: Overall Balance Score Card (displaying average of all 8 aspects, e.g. "Score: 6.9/10" in prominent typography) and page title ("Your Personal Wheel of Life").
    - **Central Wheel Component**: A 360x360 SVG radar/spider chart showing 8 segments, concentric circle grid lines (at 2, 4, 6, 8, 10), dotted segment dividers, outer text path aspect labels, aspect-specific Lucide icon badges at the outer edges, white center mask containing user avatar, and white score labels inside filled segments.
    - **Score List Section**: Card list below the wheel displaying colored icon badges, bold aspect names, colored progress bars, and numerical scores.
    - **Action Button**: Full-width "Update Scores" blue button (#2196F3).
    - **Bottom Navigation**: Custom 4-tab bar (Dashboard, Goals, Community, Profile) matching the design specification.
  * **Interactivity (Aspect Score Editor)**:
    - Life aspects are fully editable. Clicking any segment on the wheel, any aspect in the score list, or the "Update Scores" button triggers a smooth slide-up bottom-sheet modal.
    - The bottom-sheet features the selected aspect's icon badge, title, an interactive score range slider (1.0 to 10.0), and textarea inputs for Target Vision and Immediate Action Steps.
    - Changes are committed locally to UserContext and synchronized to the backend database via the `/user/state` endpoint.

### Journal Entry Page Layout & Flow
- **Minimalistic Screen Canvas**:
  * The writing workspace occupies 100% of the viewport. Borders, input fields, card structures, and page headers are removed in favor of a clean, notebook-app feel.
- **Top Action Bar**:
  * Left: A compact "Previous" back-navigation button pill.
  * Center: Faintly colored current date stamp.
  * Right: A text-only "Save" button that lights up/activates dynamically once writing content has been entered.
- **Borderless Writing Canvas**:
  * **Title Input**: A bold, borderless single-line input field utilizing placeholders ("Untitled Entry") that auto-clears. Maximum length 30 characters.
  * **Body Workspace**: A full-height, borderless, transparent textarea that scales dynamically with content.
- **Contextual Journal Toolbar**:
  * The global navigation bar hides completely on `/journal`.
  * Mounted instead is a journal-specific floating toolbar capsule (`fixed bottom-6 w-[90%] bg-slate-900/95 rounded-full`) containing contextual tools:
    * **Mood & Emotion Sheet Toggle**: Triggers a bottom-sheet slide overlay.
    * **Location Tagging Input**: Toggles a micro-overlay to attach present surroundings.
    * **Voice Record**: Triggers audio input mechanics (future phase).
    * **AI Aspect Reflector**: Triggers real-time mapping suggestion cards.
- **Interactive Emotion Selector Flow (EmotionSelectorSheet)**:
  * Triggers a full-width overlay modal shared between the Journal editor and the Dashboard.
  * **Background**: Solid white (`#ffffff`) base with an absolutely-positioned mood-reactive gradient overlay (`primary` at 30% → `secondary` at 18% opacity) floating above it. The overlay transitions smoothly (700ms) as pleasantness changes. The solid white base ensures the underlying Dashboard is never visible.
  * **Screen 1 (General Mood Slider)**: Uses a range slider (1 to 5) to adjust pleasantness from "Very Unpleasant" to "Very Pleasant". Visualizes mood using the `MoodBloom` SVG component at size 180, backed by ambient glow blobs (outer: `blur-[80px]`, inner: `blur-[50px]`) that shift color with the active mood palette.
  * **Screen 2 (Feeling Descriptors)**: A tag cloud presenting rich emotional vocabulary (e.g. Grateful, Lonely, Stressed) mapped to the selected pleasantness tier. Includes a small `MoodBloom` at size 48 as a compact indicator, also surrounded by a mini glow blob (`blur-[25px]`).
  * **Screen 3 (Life Impact & Context)**: A tag cloud of contributing life aspect factors paired with an optional "Additional Context..." text area. Same small `MoodBloom` + mini glow indicator as Screen 2.
  * Persists the combined state and collapses cleanly on submission.

### Coach Page Layout & Flow
- **Riley Live Audio Interface**:
  * Emulates a live audio coaching session viewport set against a pure black background. The global navbar hides completely. The coach is named **Riley** (previously Hayat).
  * **Centered Fluid Blob**: An organic, morphing liquid blob centered on the screen styled with a gradient from Blue (`#2563eb`) to Fuchsia (`#d946ef`). During speaking state, renders animated bouncing audio visualizer bars inside the blob. During listening state, renders a downward chevron indicator.
  * **Dedicated Subtitle Reading Zone**: Coach speech transcripts are displayed in a dedicated text container **below** the central blob, not inside it. This eliminates text clipping from morph animation. Text persists on screen until the next speech turn begins.
  * **Word-by-Word Typewriter Queue**: Incoming WebSocket tokens are buffered in a word queue and dequeued one word at a time at a 320ms interval. This paces text reveal to match natural speech cadence and prevents desync between audio and subtitle display.
  * **Voice Pulse Glow**: A background indigo glow sphere scales up and down based on the state of speaking active.
- **Call Controls Panel (Bottom Overlay)**:
  * A 3-column minimalist grid containing the following actions:
    * **Mute Microphone**: Toggles mic state (shows Mic when open, `X` when muted).
    * **Hold Session**: Toggles pause/play state (shows Pause when active, Play when held; pauses voice playback and animation loops).
    * **Toggle Keyboard Input**: Opens a text bar overlay to type responses manually to chat with the model.
- **Top Utility Header**:
  * Includes back/previous navigation on the left, and a Goals list toggle button (`ListTodo`) paired with an active status badge on the right.

---

## Component Specifications

### Logo Component

```tsx
<Logo size="large" />
// Props: size: 'small' | 'medium' | 'large' | 'full'
```

- SVG format
- Indigo circle with orange/coral wheel icon
- Optional text: "Wheel of Life"

### Navbar Component

```tsx
<Navbar 
  transparent={true} 
  scrolled={false} 
  links={['Home', 'Features', 'About', 'Get Started']} 
/>
```

### Card Component

```tsx
<Card 
  title="Health & Fitness" 
  description="Your physical wellbeing" 
  score={7} 
  color="green"
/>
```

### Wheel Visualization Component

```tsx
<Wheel 
  aspects={aspects} 
  editable={false} 
  onClick={handleAspectClick} 
/>
```

---

## Responsive Design

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Single column, stacked cards |
| Tablet | 768-1024px | 2-column grid |
| Desktop | > 1024px | Full width, side-by-side |

---

## State Management

### UserContext

```typescript
interface UserState {
  aspects: Aspect[];
  vision: string;
  currentWheel: WheelData;
  completedOnboarding: boolean;
}
```

### ThemeContext

```typescript
interface ThemeState {
  primaryColor: string;
  accentColor: string;
  isDarkMode: boolean;
}
```

---

## API Integration

```typescript
// POST /api/onboarding/vision
{
  "vision": "I want to be healthy and balanced",
  "aspects": ["health", "finance", "relationships"]
}

// GET /api/wheel
{
  "aspects": [
    { "name": "health", "score": 7, "vision": "Healthy" },
    { "name": "finance", "score": 5, "vision": "Secure" }
  ]
}
```

---

## Future Enhancements

- Voice journal input
- Doodle canvas
- Location tagging (backend persistence)
- Weekly summary cards
- Progress animations
- Dashboard emoji replacement (Target, Lightbulb, Star, Flame for goals/advice/highlights cards) — pending
- MoodBloom integration in Dashboard mood selector row — pending

---

## MoodBloom Component (`MoodBloom.js`)

### Exports
- `default MoodBloom({ mood, size })` — renders the SVG geometric shape
- `getMoodTheme(mood)` — returns Tailwind class strings (`bg`, `border`, `ring`, `shadow`, `text`, `label`) for card theming
- `PALETTES` — raw hex/rgba color constants per mood tier

### Shape Personalities
| Mood | Shape | Animation |
|------|-------|-----------|
| rough | Wavy concentric outlines (feTurbulence-style via sine wobble) | Breathe scale pulse, 4s |
| low | Concentric rotating rounded rectangles | Clockwise spin, 20s |
| okay | Clean concentric circles | Gentle breathe, 5s |
| good | Overlapping ellipse petals | Counter-clockwise spin, 25s |
| great | Pointed leaf mandala with tip dots | Clockwise spin 18s + pulse dots |

### Ambient Glow Usage
When `MoodBloom` is placed in a container, wrap it with two `div` layers for the halo effect:
- Outer blob: `w-72 h-72 blur-[80px] animate-pulse` with `backgroundColor: moodColors.glow`
- Inner blob: `w-48 h-48 blur-[50px]` with `backgroundColor: moodColors.primary + '25'`
- SVG itself: `relative z-10`

Small indicators (size 48) use a single mini blob: `w-20 h-20 blur-[25px]`.