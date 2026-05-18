# Sound Knot V2 — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Design System](#4-design-system)
5. [Component Library](#5-component-library)
6. [Screen Flow & Navigation](#6-screen-flow--navigation)
7. [State Management](#7-state-management)
8. [Types & Data Models](#8-types--data-models)
9. [Services & Hooks](#9-services--hooks)
10. [Key Algorithms](#10-key-algorithms)
11. [Configuration](#11-configuration)
12. [Development Guide](#12-development-guide)

---

## 1. Project Overview

Sound Knot is an English listening practice app built with Expo (React Native). The core philosophy: **"Work hard now, listen smart later."** Users accumulate deliberate listening hours by engaging with authentic expert content (podcasts, lectures, conversations), using active recall and dictation to build deep comprehension.

### Design Origin

The V2 design was prototyped in HTML/JSX at `design/SoundKnotAppV2Design/` and translated into this React Native codebase. The design system is documented in `design/SoundKnotAppDesignV2.pdf`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | ~54.0 |
| UI | React Native | 0.81.5 |
| Language | TypeScript | ~5.9 |
| Navigation | Expo Router (file-based) | ~6.0 |
| State | Zustand | ^5.0 |
| Audio | expo-av | ~15.0 |
| Video | react-native-youtube-iframe | ^2.4.1 |
| Transcript | youtube-transcript | ^1.3.1 |
| SVG | react-native-svg | 15.12.1 |
| Animations | react-native-reanimated | ~4.1 |
| Gestures | react-native-gesture-handler | ~2.28 |
| Storage | AsyncStorage + expo-sqlite | latest |
| Accessibility | expo-speech | ~13.1 |
| Haptics | expo-haptics | ~14.1 |

---

## 3. Directory Structure

```
SoundKnotApp/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root Stack navigator
│   ├── index.tsx                 # Entry redirect
│   ├── listen.tsx                # Listen screen (YouTube + auto-scroll transcript)
│   ├── dictation.tsx             # Dictation screen (recall + check)
│   ├── finished.tsx              # Session complete screen
│   └── (tabs)/                   # Tab navigator group
│       ├── _layout.tsx           # 3-tab bottom nav (Practice | Library | Progress)
│       ├── home.tsx              # Practice home (URL paste + today card + recents)
│       ├── library.tsx           # Content discovery (search + topic chips + list)
│       └── progress.tsx          # Stats dashboard (heatmap + indicators + mastery)
├── src/
│   ├── components/
│   │   ├── ui/                   # Design system primitives
│   │   │   ├── Button.tsx        # Primary / ghost / pill variants
│   │   │   ├── Card.tsx          # Paper-2 surface, accent variant
│   │   │   ├── Tag.tsx           # Filled / outlined / chip variants
│   │   │   ├── Chip.tsx          # Mono label badge with optional dot/icon
│   │   │   ├── ProgressBar.tsx   # Thin ink fill or 5-dot mastery display
│   │   │   ├── EmptyState.tsx    # Dashed-border placeholder
│   │   │   └── Knot.tsx          # Trefoil knot SVG (parametric curve)
│   │   ├── audio/                # Audio playback controls
│   │   │   └── PlaybackControls.tsx
│   │   ├── content/              # Content display
│   │   │   ├── ContentCard.tsx
│   │   │   ├── ContentList.tsx
│   │   │   └── CuriosityFeed.tsx
│   │   ├── tracker/              # Practice tracking
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── StreakBadge.tsx
│   │   │   └── TimeTracker.tsx
│   │   ├── practice/             # Drill exercises
│   │   │   └── PhraseRepeater.tsx
│   │   └── companion/            # AI chat
│   │       └── CompanionChat.tsx
│   ├── constants/
│   │   ├── Colors.ts             # Light + Dark color palettes + backward compat
│   │   ├── Typography.ts         # 20+ text style presets (sans/mono/serif)
│   │   ├── Spacing.ts            # Spacing & border radius scale
│   │   ├── Config.ts             # App config, milestones, voice commands
│   │   └── theme.ts              # useTheme() / useIsDark() hooks
│   ├── hooks/
│   │   ├── useAudioPlayer.ts     # expo-av Audio.Sound lifecycle
│   │   ├── useTimer.ts           # Session elapsed time tracking
│   │   ├── useAICompanion.ts     # Chat message state + API calls
│   │   ├── useVoiceCommands.ts   # Voice command recognition dispatch
│   │   └── useRecommendations.ts # Content recommendations by interest
│   ├── services/
│   │   ├── api.ts                # Generic ApiClient (GET/POST/PUT/DELETE)
│   │   ├── ai.ts                 # AI companion service
│   │   ├── content.ts            # Content library API
│   │   ├── transcript.ts         # YouTube transcript fetcher + sentence merger
│   │   └── voice.ts              # Voice command processing
│   ├── stores/                   # Zustand state management
│   │   ├── userStore.ts          # User profile, interests, level, streak
│   │   ├── playerStore.ts        # Audio playback state
│   │   ├── sessionStore.ts       # Listening sessions, bookmarks, AI queries
│   │   └── contentStore.ts       # Content library + filters
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   └── utils/
│       ├── audio.ts              # Audio session config, URL validation
│       └── time.ts               # Time formatting, greeting
├── assets/                       # App icons and splash
├── specs/                        # Documentation
│   ├── PRODUCT_PRD_1.MD          # Product philosophy / feature vision
│   └── technical_docs.md         # This file
├── design/                       # Prototype design files (reference only)
│   ├── SoundKnotAppDesignV2.pdf
│   └── SoundKnotAppV2Design/     # HTML/JSX prototype
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 4. Design System

### 4.1 Color Palette — Warm Orange on Paper

The design uses a restrained palette: warm off-white paper background, near-black charcoal ink, and a single warm orange accent. **The app is locked to light mode only** — dark mode colors are defined but unused (see Section 11 for config).

**Light Mode** (`src/constants/Colors.ts` — `LightColors`):

| Token | Value | Usage |
|-------|-------|-------|
| `paper` | `#F4F3EF` | Main background |
| `paper2` | `#ECEAE2` | Secondary surface / card background |
| `ink` | `#2A2522` | Primary text (warm charcoal) |
| `ink2` | `#4A4440` | Secondary text |
| `ink3` | `#7A756F` | Tertiary/muted text |
| `ink4` | `#9E9990` | Most subtle (labels, disabled) |
| `hair` | `rgba(42, 37, 34, 0.10)` | Hairline borders |
| `hair2` | `rgba(42, 37, 34, 0.06)` | Subtler dividers |
| `accent` | `#E8913A` | Warm orange accent |
| `accentSoft` | `rgba(232, 145, 58, 0.14)` | Transparent orange highlight |
| `accentInk` | `#7A3D0A` | Dark orange for text-on-light |
| `inkInverse` | `rgba(244, 243, 239, 0.60)` | Light text on dark/accent backgrounds (60% opacity) |
| `inkInverse2` | `rgba(244, 243, 239, 0.70)` | Light text on dark/accent backgrounds (70% opacity) |
| `positive` | `#00897B` | Success (green-cyan) |
| `negative` | `#E53935` | Error (red-orange) |

**Dark Mode** (`DarkColors`): Paper becomes `#1C1A17`, ink becomes `#F4F3EF`. Same orange accent (`#E8913A`). Currently unused — app is forced to light mode.

**Backward Compatibility**: A `Colors` export maps the new tokens to legacy property names (`primary`, `accent`, `background`, `text`, `card`, `border`, etc.) so that existing feature components (StatsGrid, StreakBadge, PlaybackControls, etc.) continue to function without changes.

**Theme Mode — Light Only:**

The app is currently locked to light theme. `useTheme()` always returns `LightColors`, and `useIsDark()` always returns `false`. This is enforced at three levels:
1. `src/constants/theme.ts` — hooks hardcoded to light
2. `app.json` — `"userInterfaceStyle": "light"`
3. `app/_layout.tsx` — `<StatusBar style="dark" />` (dark status bar icons for light backgrounds)

**Usage:**
```typescript
import { useTheme } from '../constants/theme';
const colors = useTheme(); // always returns LightColors
```

### 4.2 Typography Scale

Three font families mapped to React Native system fonts (custom fonts can be loaded via expo-font):

| Design Font | RN Fallback | Usage |
|------------|-------------|-------|
| Inter Tight | System (San Francisco / Roboto) | Body text, UI, buttons |
| JetBrains Mono | Menlo / monospace | Timestamps, markers, chips, tabs |
| Instrument Serif | Georgia / serif | Hero text, headings, italic emphasis |

**Preset styles** in `src/constants/Typography.ts`:

| Preset | Size | Weight | Letter Spacing | Use |
|--------|------|--------|---------------|-----|
| `heroLarge` | 56 | 400 | -2.2 | Big display numbers |
| `hero` | 34 | 400 | -0.68 | Finished screen hero text |
| `titleLarge` | 32 | 400 | -0.64 | Screen titles (serif) |
| `headingLarge` | 28 | 600 | -0.56 | Section headings |
| `heading` | 22 | 600 | -0.22 | Dictation context |
| `headingSmall` | 18 | 600 | -0.18 | Card titles |
| `bodyLarge` | 17 | 400 | -0.085 | Transcript text |
| `body` | 15 | 400 | -0.075 | General body |
| `bodyMedium` | 14 | 500 | -0.07 | Button text, card content |
| `bodySmall` | 13 | 400 | -0.065 | Secondary info |
| `marker` | 10 | 400 | +0.80 | Mono labels, metadata |
| `markerLarge` | 11 | 400 | +0.66 | Stat labels |
| `monoSmall` | 10.5 | 400 | +0.21 | Timestamps |
| `mono` | 13 | 400 | 0 | Input text |
| `monoDisplay` | 28 | 500 | -0.28 | Large mono display |
| `monoStat` | 30 | 500 | -0.60 | Stat card numbers |
| `tab` | 9 | 400 | +0.72 | Tab bar labels |
| `chip` | 10.5 | 400 | +0.21 | Chip labels |
| `button` | 14 | 500 | -0.07 | Button text |
| `buttonSmall` | 13 | 500 | -0.065 | Small button text |
| `serifItalic` | — | 400 | — | Italic emphasis overlay |

### 4.3 Spacing & Radius

**Spacing scale** (`src/constants/Spacing.ts`): `xs=4, sm=6, md=8, lg=10, xl=12, xxl=14, xxxl=16, huge=20, massive=24, screen=16`

**Border radius** (`Radius`): `xs=2, sm=3, md=6, lg=7, xl=10, xxl=12, xxxl=16, pill=26, circle=999`

---

## 5. Component Library

### 5.1 UI Primitives

#### Button (`src/components/ui/Button.tsx`)
- **Variants**: `primary` (ink-on-paper, full-width rounded), `ghost` (transparent + hairline border), `pill` (fully rounded, ink bg)
- **Sizes**: `sm`, `md`, `lg`
- **States**: Loading spinner, disabled (40% opacity)
- All colors derived from `useTheme()`

#### Card (`src/components/ui/Card.tsx`)
- **Variants**: `default` (paper2 bg + hairline border), `accent` (ink bg + paper text), `hair` (transparent)
- Optional `title` and `subtitle` props
- Border radius: 12px

#### Tag (`src/components/ui/Tag.tsx`)
- **Variants**: `chip` (mono font, uppercase, paper2 bg, optional dotColor/icon), `filled` (solid bg with 8% color opacity), `outlined` (border-only)
- Includes `LevelTag` sub-component with level→color mapping

#### Chip (`src/components/ui/Chip.tsx`)
- Specialized mono badge: `dotColor` prop renders a colored circle, `icon` prop for leading icon
- Used for streak display, hint labels, recall result badges

#### ProgressBar (`src/components/ui/ProgressBar.tsx`)
- Two modes:
  - **Continuous**: Thin 2px bar, ink fill with `progress` (0-1)
  - **Mastery dots**: 5-segment display when `mastery` prop is provided
- Accepts optional `color` and `backgroundColor` overrides
- Backward compatible with the old `color` / `showGlow` props

#### EmptyState (`src/components/ui/EmptyState.tsx`)
- Dashed-border placeholder card with title + description
- Used for "no recalls yet", "hidden transcript" states

#### Knot (`src/components/ui/Knot.tsx`)
- **Algorithm**: Parametric trefoil knot (3 self-crossings) via `x=sin(t)+2sin(2t)`, `y=cos(t)-2cos(2t)`, `z=sin(3t)`
- Renders SVG via `react-native-svg` with:
  - Base muted path (`subdued` opacity)
  - Over/under weave: paper-colored gap strokes at `z > 0.3` sections, then re-drawn over-strands
  - Played portion: amber stroke-dasharray proportional to `progress`
  - Pass rings: concentric dashed circles (up to 4)
  - 12 perimeter tick marks
  - Central dot sized by `mastery`
- **Props**: `size`, `progress` (0-1 playback), `mastery` (0-1 tightness), `pass` (ring count), `subdued` (opacity), `accentColor`

### 5.2 Feature Components

#### PlaybackControls (`src/components/audio/PlaybackControls.tsx`)
Transport bar with progress bar, time labels, rate button, rewind/play-pause/forward, bookmark button.

#### StatsGrid (`src/components/tracker/StatsGrid.tsx`)
2x2 grid of stat cards: Total Hours, Day Streak, Completed, Min Today.

#### StreakBadge (`src/components/tracker/StreakBadge.tsx`)
Color-coded streak display with fire emoji: Building (accent), Weekly (intermediate), Monthly (advanced), Century (master).

#### TimeTracker (`src/components/tracker/TimeTracker.tsx`)
Large elapsed time display with start/pause/end session controls.

#### ContentCard / ContentList / CuriosityFeed
Content item cards with thumbnails, level tags, topic tags, progress bars. CuriosityFeed provides horizontal snap-carousel sorted by interest overlap.

#### PhraseRepeater (`src/components/practice/PhraseRepeater.tsx`)
Key phrase drill: phrase text, translation, mastery progress, repeat count, play/record, speed selector (0.5x–1.5x).

#### CompanionChat (`src/components/companion/CompanionChat.tsx`)
Chat interface: FlatList with user bubbles (primary bg, right) vs assistant (surface bg, left), thinking indicator, voice toggle + send input.

---

## 6. Screen Flow & Navigation

### 6.1 Route Map

```
Root Stack (app/_layout.tsx)
├── /                          → index.tsx (redirect gate)
├── /(tabs)                    → Tab Navigator (3 tabs)
│   ├── /practice (home)       → home.tsx
│   ├── /library               → library.tsx
│   └── /progress              → progress.tsx
├── /listen                    → listen.tsx
├── /dictation                 → dictation.tsx
└── /finished                  → finished.tsx (modal)
```

### 6.2 User Flow

```
Home (Practice tab)
  ├── Paste YouTube URL → auto-extract video ID → /listen
  ├── Tap "Today" card → /listen
  └── Tap recent knot → /listen
      ↓
Listen Screen
  ├── YouTube video player (native controls — tap to play/pause)
  ├── Auto-scrolling transcript (live highlight follows playback)
  │   ├── Tap any line → seek to that timestamp
  │   ├── Manual scroll → auto-scroll pauses for 4 seconds
  │   └── Eye icon → hide/reveal transcript
  ├── [Close] → back to Home
  └── [Recall →] → /dictation
      ↓
Dictation Screen
  ├── Recall list (text or voice entries)
  ├── Text input dock + mic record + submit
  ├── [Listen again] → back to /listen
  ├── [Check all] → word-level diff results
  └── [Finish session] → /finished (modal)
      ↓
Finished Screen
  ├── Knot motif (orange accent, 100% played)
  ├── Session stats (recalls, avg match, streak)
  └── [Return home] → /practice
```

### 6.3 Tab Navigation

Bottom tab bar with 3 tabs:
- **Practice** (🎯): Home / session gateway
- **Library** (🔍): Content discovery
- **Progress** (📊): Stats dashboard

Tab bar styling: paper background, hairline top border, mono 9px uppercase labels, emoji icons.

### 6.4 Navigation Patterns

- `router.push()` for forward navigation (slide_from_right)
- `router.back()` for backward navigation
- `router.replace()` when returning to home after session
- Finished screen opens as **modal** (slide_from_bottom)
- All screens hide the Stack header (custom headers inline)

---

## 7. State Management

### 7.1 Stores (Zustand)

#### userStore (`src/stores/userStore.ts`)
```typescript
interface UserState {
  user: User | null;
  isOnboardingComplete: boolean;
  handsFreeEnabled: boolean;
  // Actions: setUser, updateInterests, addListeningMinutes,
  //          updateStreak, setLevel, completeOnboarding, toggleHandsFree
}
```
- Level auto-calculated from total minutes: beginner (<100h), intermediate (<500h), advanced (<1000h), master (≥1000h)
- Mock user as default until API integration

#### playerStore (`src/stores/playerStore.ts`)
```typescript
interface PlayerState extends AudioState {
  // Actions: loadContent, play, pause, togglePlay, seek,
  //          setPlaybackRate, setVolume, setLoopMode, updateProgress,
  //          setBuffering, reset
}
```
- Manages `AudioState`: isPlaying, isBuffering, isLoaded, currentTime, duration, playbackRate, volume, currentContentId, loopMode

#### sessionStore (`src/stores/sessionStore.ts`)
```typescript
interface SessionState {
  activeSession: ListeningSession | null;
  sessions: ListeningSession[];
  totalSecondsToday: number;
  isTracking: boolean;
  // Actions: startSession, pauseSession, resumeSession, endSession,
  //          tick, addBookmark, removeBookmark, addAIQuery, loadSessions
}
```
- Session lifecycle: start → track (heartbeat every 5s) → end
- On session end, accumulated listening minutes are added to userStore

#### contentStore (`src/stores/contentStore.ts`)
```typescript
interface ContentState {
  library: ContentItem[];
  recommendations: { contentId, reason, score }[];
  activeFilters: { topics, difficulty, speaker, query };
  // Actions: setLibrary, setFilter, clearFilters, getById, getFiltered
}
```
- Filter system: query (title/speaker), difficulty, speaker, topics array

### 7.2 State Flow Diagram

```
userStore          sessionStore        playerStore        contentStore
    |                    |                   |                   |
    ├─ interests         ├─ activeSession    ├─ isPlaying        ├─ library
    ├─ totalMinutes      ├─ sessions[]       ├─ currentTime      ├─ filters
    ├─ streak            ├─ totalSecToday    ├─ playbackRate     ├─ recommendations
    ├─ level             ├─ isTracking       └─ currentContentId └─ getFiltered()
    └─ onboardingDone    └─ bookmarks/AI
         |                    |
    addListeningMinutes ←── endSession()
         |
    calculateLevel()
```

---

## 8. Types & Data Models

All types defined in `src/types/index.ts`:

### User
```typescript
interface User {
  id, displayName, interests: string[], totalListeningMinutes,
  streak, longestStreak, level: UserLevel, onboardingComplete,
  handsFreeEnabled, createdAt
}
type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';
```

### Content
```typescript
interface ContentItem {
  id, title, speaker, speakerBio?, description, topics: string[],
  difficulty: ContentDifficulty, durationSeconds, audioUrl,
  transcript?: TranscriptSegment[], sourceUrl?, thumbnailUrl?,
  publishedAt, isDownloaded
}
type ContentDifficulty = 'beginner' | 'intermediate' | 'advanced';

interface TranscriptSegment { id, startTime, endTime, text, keyPhrases?: KeyPhrase[] }
interface KeyPhrase { id, original, translation?, startTime, endTime, masteryLevel }
```

### Session
```typescript
interface ListeningSession { id, contentId, startTime, endTime?, listenedSeconds, completed, bookmarks, aiQueries }
interface Bookmark { id, timestampSeconds, label?, note?, createdAt }
interface AIQuery { id, query, response, timestampSeconds, createdAt }
```

### Audio
```typescript
interface AudioState { isPlaying, isBuffering, isLoaded, currentTime, duration, playbackRate, volume, currentContentId, loopMode }
type LoopMode = 'off' | 'phrase' | 'segment' | 'full';
```

### Voice Commands
```typescript
interface VoiceCommand { id, phrase, action: VoiceAction, enabled }
type VoiceAction = 'play' | 'pause' | 'rewind_10s' | 'forward_30s' | 'bookmark' | 'ask_ai' | 'slow_down' | 'speed_up' | 'normal_speed' | 'repeat_phrase';
```

### Others
- `DrillSession` — phrase drill session tracking
- `Recommendation` — content recommendation with reason/score
- `Achievement` — milestone or streak achievement
- `RootStackParamList` — typed navigation params

---

## 9. Services & Hooks

### 9.1 Hooks

#### useAudioPlayer (`src/hooks/useAudioPlayer.ts`)
- Wraps `expo-av` `Audio.Sound` lifecycle
- Creates sound instance from URL, handles play/pause/seek/rate/volume
- 500ms progress update interval via `setOnPlaybackStatusUpdate`
- Auto-unloads on unmount, auto-pauses on track finish
- Coordinates with `playerStore` for state persistence

#### useTimer (`src/hooks/useTimer.ts`)
- Ticks every 5 seconds (`Config.tracker.sessionHeartbeatMs`)
- Tracks elapsed via `Date.now()` delta (wall-clock, not JS timers)
- Auto-adds listening minutes to userStore on session end
- Exposes formatted time strings (`formattedElapsed`, `formattedToday`)

#### useAICompanion (`src/hooks/useAICompanion.ts`)
- Manages chat message state (user + assistant bubble pairs)
- Calls `aiService.askQuestion()` with context parameters
- Stores AI queries in session via `addAIQuery`
- Loading/error states

#### useVoiceCommands (`src/hooks/useVoiceCommands.ts`)
- Toggle voice recognition on/off
- Dispatches recognized `VoiceAction` to playerStore (play, pause, seek, bookmark, rate change)
- Handles "ask_ai" and "repeat_phrase" as placeholders for future implementation

#### useRecommendations (`src/hooks/useRecommendations.ts`)
- Computes content recommendations by interest overlap score
- Refreshable from `contentService`

### 9.2 Services

#### ApiClient (`src/services/api.ts`)
- Generic HTTP client: `get<T>`, `post<T>`, `put<T>`, `delete<T>`
- Bearer token support via `setToken()`
- Base URL from `Config.apiBaseUrl`
- Singleton instance: `apiClient`

#### Content Service (`src/services/content.ts`)
- `fetchLibrary()` — retrieves content collection
- `fetchById()` — single content item
- `fetchRecommendations()` — AI-curated suggestions
- `search()` — text search with filters
- `fetchTopics()` — available topic list
- `getSignedUrl()` — authenticated audio URLs

#### AI Service (`src/services/ai.ts`)
- `askQuestion()` — sends query to AI endpoint with context
- `explainPhrase()` — explains a highlighted transcript phrase
- `buildQueryContext()` — assembles context object

#### Transcript Service (`src/services/transcript.ts`)
- **Package**: `youtube-transcript` (^1.3.1) — uses YouTube InnerTube API (Android client emulation) with HTML scraping fallback
- **API**: The npm package calls YouTube's internal `get_transcript` endpoint, emulating an Android client to avoid bot detection. Falls back to HTML scraping if InnerTube fails. Returns array of `{ text, offset, duration }` where offset and duration are in **milliseconds**.
- `fetchTranscript(videoId)` → `Promise<TranscriptData>` — fetches raw transcript fragments, converts ms→seconds, then merges into sentences (see Algorithm 10.5)
- `formatTimestamp(seconds)` → `string` — formats to `m:ss` or `h:mm:ss`
- `findCurrentLineIndex(lines, currentTime)` → `number` — reverse linear search for the last line whose `start ≤ currentTime`

**Types:**
```typescript
interface TranscriptLine { text: string; start: number; duration: number }
interface TranscriptData { lines: TranscriptLine[]; videoId: string }
```

**Why youtube-transcript and not youtubetranscript.com**: The web API (`youtubetranscript.com`) returns HTML content-type, not JSON — calling `response.json()` on it causes a JSON parse error. The npm package communicates directly with YouTube's API and is React Native compatible (uses standard `fetch()`).

#### Voice Service (`src/services/voice.ts`)
- `startListening(actionHandler)` — begins voice recognition
- `stopListening()` — ends voice recognition
- `processTranscript()` — matches spoken text to `VoiceAction`
- Command map with 25+ recognized phrases

---

## 10. Key Algorithms

### 10.1 Knot Rendering (`src/components/ui/Knot.tsx`)

The trefoil knot is rendered as an SVG using `react-native-svg`:

1. **Parametric Generation** (360 steps):
   ```
   x = cx + (sin(t) + 2·sin(2t)) × scale
   y = cy + (cos(t) - 2·cos(2t)) × scale
   z = sin(3t)
   scale = (size/2) × 0.28 × (1 - mastery × 0.12)
   ```

2. **Over/Under Weave**:
   - Split curve at `z > 0.3` into "over" segments
   - Draw base muted path (all strands)
   - Paint paper-colored "gap" strokes (wider) along over segments → creates visual break
   - Re-draw over segments on top (muted) → strand appears to pass over
   - Draw played portion (amber, stroke-dasharray proportional to progress)
   - Apply same gap process to played portion

3. **Accessories**:
   - Pass rings: concentric dashed circles (1 per completed pass)
   - 12 tick marks at equal angular intervals
   - Central dot sized by mastery level

### 10.2 Dictation Diff (`app/dictation.tsx`)

Word-level comparison algorithm (`checkRecall`):

1. Normalize user text: lowercase, strip punctuation, split to words
2. Walk target text word-by-word:
   - **Exact match** → `correct`
   - **One-word-ahead match** (user word matches next target) → mark current as `extra`, next as `correct`
   - **Prefix match** (both ≥4 chars, first 4 match) → `correct` (treats morphological errors as acceptable)
   - **No match** → `missed`
3. Returns accuracy %, correct/missed counts, and diff array with status per word

### 10.3 Level Calculation (`src/stores/userStore.ts`)
```
totalMinutes >= 60000 → master
totalMinutes >= 30000 → advanced
totalMinutes >= 6000  → intermediate
otherwise             → beginner
```

### 10.4 YouTube URL Extraction
```typescript
function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : 'dQw4w9WgcQ';
}
```

### 10.5 Transcript Sentence Merging (`src/services/transcript.ts`)

YouTube auto-generated transcripts are split into ~2-3 second fragments (often mid-sentence). The `mergeIntoSentences()` algorithm joins fragments into meaningful sentences:

**Algorithm:**
1. Maintain a buffer of text fragments and track `bufStart` / `bufEnd` timestamps
2. For each fragment:
   - If adding it would exceed `MAX_MERGE_DURATION` (15 seconds) from buffer start, flush the buffer first
   - Append fragment text to buffer, update `bufEnd`
   - If fragment text ends with sentence-ending punctuation (`.` `!` `?`), flush the buffer
3. Flush any remaining buffer content

**Constants:**
- `SENTENCE_END` = `/[.!?]$/` — regex for sentence-ending punctuation
- `MAX_MERGE_DURATION` = `15` seconds — prevents single merged lines from growing too long

**Result**: Typically reduces ~200 raw fragments down to ~40-60 readable sentence lines, each with accurate `start` time and cumulative `duration`.

### 10.6 Transcript Auto-Scroll (`app/listen.tsx`)

The listen screen auto-scrolls the transcript to follow video playback, with a mechanism to avoid fighting user scroll:

**Time polling:**
- When video is playing, a `setInterval` (500ms) polls `playerRef.current.getCurrentTime()`
- The current time is matched to transcript lines via `findCurrentLineIndex()` (reverse linear search)

**Auto-scroll mechanism:**
- Each transcript line measures its Y position via `onLayout` → stored in `lineYPositions` ref (keyed by index)
- When `currentLineIdx` changes, a `useEffect` scrolls the `ScrollView` so the active line is at ~1/3 from the top of the visible area
- Skip conditions: `currentLineIdx < 0`, user is scrolling, index hasn't changed since last scroll

**User scroll detection (anti-jank):**
- `onScrollBeginDrag` → sets `userIsScrolling = true`, clears any pending resume timer
- `onScrollEndDrag` / `onMomentumScrollEnd` → starts a 4-second timeout, after which `userIsScrolling` is reset to `false` and auto-scroll resumes

**Anti-pattern avoided:** Never use a ScrollView ref callback (`ref={(r) => ...}`) for imperative scroll — it fires on every render (every 500ms from polling), causing constant `scrollTo` calls and visible flickering. Always use `useRef<ScrollView>` + `useEffect` keyed on the tracked index instead.

---

## 11. Configuration

### app.json Highlights
```json
{
  "expo": {
    "name": "SoundKnot",
    "slug": "soundknot",
    "scheme": "soundknot",
    "userInterfaceStyle": "light",         // Forced light mode (no dark mode)
    "newArchEnabled": true,                // React Native New Architecture enabled
    "splash": { "backgroundColor": "#F4F3EF" },  // Paper background
    "ios": {
      "supportsTablet": true,
      "UIBackgroundModes": ["audio"],
      "NSMicrophoneUsageDescription": "..."
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "permissions": ["RECORD_AUDIO"]
    },
    "plugins": ["expo-router", "expo-av"]
  }
}
```

### Config.ts (`src/constants/Config.ts`)
| Setting | Value |
|---------|-------|
| API base URL | `process.env.EXPO_PUBLIC_API_URL` (default: `https://api.soundknot.app`) |
| AI endpoint | `process.env.EXPO_PUBLIC_AI_ENDPOINT` |
| Playback rate range | 0.5x – 2.0x |
| Rewind/forward | 10s / 30s |
| Session heartbeat | 5000ms (5s) |
| Milestones (minutes) | 600 (10h), 3000 (50h), 6000 (100h), 30000 (500h), 60000 (1000h) |
| Voice commands | 10 commands (play, pause, rewind, skip, bookmark, ask AI, speed controls) |

---

## 12. Development Guide

### Getting Started
```bash
npm install
npx expo start
```

### Scripts
| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start for iOS simulator |
| `npm run android` | Start for Android emulator |
| `npm run web` | Start for web |
| `npm run lint` | Run Expo linter |
| `npm run clean` | Start with cache clear |

### TypeScript
```bash
npx tsc --noEmit   # Type-check without emitting
```

### File-Based Routing Rules
- `app/` directory maps 1:1 to routes
- `_layout.tsx` files define navigators
- `(group)` directories are route groups (shared layout)
- `[param]` directories are dynamic segments
- Expo Router auto-generates typed routes at `.expo/types/router.d.ts` on first run

### Adding a New Screen
1. Create `app/screen-name.tsx`
2. Add `<Stack.Screen name="screen-name" />` to `app/_layout.tsx`
3. Navigate: `router.push('/screen-name')` or `router.push({ pathname: '/screen-name', params: {...} })`
4. Run `npx expo start` to regenerate typed routes

### Adding a New UI Component
1. Create `src/components/ui/ComponentName.tsx`
2. Use `useTheme()` for colors
3. Use `Typography` presets for text styles
4. Use `Spacing` and `Radius` scales for layout
5. Export as named export

### Theme Usage Pattern
```typescript
import { useTheme } from '../constants/theme';
import { Typography } from '../constants/Typography';
import { Spacing, Radius } from '../constants/Spacing';

function MyComponent() {
  const colors = useTheme();

  return (
    <View style={{ backgroundColor: colors.paper, padding: Spacing.screen }}>
      <Text style={[Typography.heading, { color: colors.ink }]}>Title</Text>
      <Text style={[Typography.body, { color: colors.ink2 }]}>Body text</Text>
    </View>
  );
}
```

### Design Tokens Reference

```
colors.paper        → #F4F3EF  Main background (warm off-white)
colors.paper2       → #ECEAE2  Cards, secondary surfaces
colors.ink          → #2A2522  Primary text (warm charcoal)
colors.ink2         → #4A4440  Secondary text
colors.ink3         → #7A756F  Muted text
colors.ink4         → #9E9990  Labels, disabled
colors.hair         → rgba(42,37,34, 0.10)  Hairline borders
colors.hair2        → rgba(42,37,34, 0.06)  Subtle dividers
colors.accent       → #E8913A  Warm orange accent
colors.accentSoft   → rgba(232,145,58, 0.14)  Transparent orange highlight
colors.accentInk    → #7A3D0A  Dark orange text
colors.inkInverse   → rgba(244,243,239, 0.60)  Light text on dark bg
colors.inkInverse2  → rgba(244,243,239, 0.70)  Light text on dark bg (brighter)
colors.positive     → #00897B  Success (green-cyan)
colors.negative     → #E53935  Error (red)

Typography.hero     → Serif 34px hero
Typography.headingLarge → Sans 28px semibold
Typography.body     → Sans 15px body
Typography.marker   → Mono 10px uppercase labels
Typography.chip     → Mono 10.5px chip labels
Typography.button   → Sans 14px medium button
Typography.serifItalic → Serif italic overlay

Spacing.screen      → 16px page padding
Spacing.xxxl        → 16px internal padding
Spacing.xl          → 12px gap
Radius.xl           → 10px buttons/cards
Radius.pill         → 26px fully rounded
```

---

*Last updated: May 2026 · Sound Knot V2 · Expo SDK 54*
