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
12. [Platform Support](#12-platform-support)
13. [Development Guide](#13-development-guide)

---

## 1. Project Overview

Sound Knot is an English listening practice app built with Expo (React Native) and runs on **iOS, Android, and the web**. The core philosophy: **"Work hard now, listen smart later."** Users accumulate deliberate listening hours by engaging with authentic expert content (podcasts, lectures, conversations), using active recall and dictation to build deep comprehension.

### Design Origin

The V2 design was prototyped in HTML/JSX at `design/SoundKnotAppV2Design/` and translated into this React Native codebase. The design system is documented in `design/SoundKnotAppDesignV2.pdf`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | ~54.0.33 |
| UI | React Native | 0.81.5 |
| Web | React DOM + react-native-web | 19.1 / ~0.21 |
| Language | TypeScript | ~5.9 |
| Navigation | Expo Router (file-based) | ~6.0 |
| State | Zustand | ^5.0 |
| Auth storage | @react-native-async-storage/async-storage | 2.1.2 |
| Audio (native) | expo-av | ~15.0 |
| Video (native) | react-native-youtube-iframe | ^2.4.1 |
| Video (web) | YouTube IFrame embed + postMessage API | — |
| WebView (native) | react-native-webview | 13.15.0 |
| Transcript | youtube-transcript | ^1.3.1 |
| Icons | @expo/vector-icons (Ionicons) | ^15.0.3 |
| SVG | react-native-svg | 15.12.1 |
| Animations | react-native-reanimated | ~4.1 |
| Gestures | react-native-gesture-handler | ~2.28 |
| Local DB | expo-sqlite | ~16.0 |
| Speech | expo-speech | ~13.1 |
| Haptics | expo-haptics | ~14.1 |
| Fonts | @expo-google-fonts/inter, @expo-google-fonts/jetbrains-mono | latest |

---

## 3. Directory Structure

```
SoundKnotApp/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root Stack navigator + font loading + splash
│   ├── index.tsx                 # Entry redirect with auth check
│   ├── login.tsx                 # Login / register screen
│   ├── listen.tsx                # Listen screen (YouTube + clipped transcript box + bookmarks)
│   ├── dictation.tsx             # Dictation screen (recall + check)
│   ├── finished.tsx              # Session complete screen (saves session to API)
│   ├── ai-tutor.tsx              # AI tutor chat (fullScreenModal, KAV-wrapped)
│   ├── ai-settings.tsx           # AI provider/model picker
│   └── (tabs)/                   # Tab navigator group
│       ├── _layout.tsx           # Tab bottom nav (Home | Library | Profile)
│       ├── home.tsx              # URL paste + library list with per-row delete (X)
│       ├── library.tsx           # Phrase + Vocabulary tabs (saved bookmarks)
│       └── progress.tsx          # Stats dashboard (streak + sessions + mastery)
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
│   │   ├── youtube/              # Platform-split YouTube player
│   │   │   ├── YoutubePlayerView.tsx       # TS fallback (re-exports .native)
│   │   │   ├── YoutubePlayerView.native.tsx # Wraps react-native-youtube-iframe
│   │   │   └── YoutubePlayerView.web.tsx    # iframe + postMessage YT API
│   │   ├── audio/                # Audio playback controls (legacy)
│   │   ├── content/              # Content card / list / curiosity feed (legacy)
│   │   ├── tracker/              # Stats grid / streak badge / time tracker (legacy)
│   │   ├── practice/             # PhraseRepeater drill (legacy)
│   │   └── companion/            # AI chat (legacy)
│   ├── constants/
│   │   ├── Colors.ts             # Light + Dark color palettes + backward compat
│   │   ├── Typography.ts         # 20+ text style presets (sans/mono/serif)
│   │   ├── Spacing.ts            # Spacing & border radius scale
│   │   ├── Config.ts             # App config, milestones, voice commands
│   │   └── theme.ts              # useTheme() / useIsDark() hooks (light only)
│   ├── hooks/
│   │   ├── useAudioPlayer.ts     # expo-av Audio.Sound lifecycle (legacy)
│   │   ├── useTimer.ts           # Session elapsed time tracking
│   │   ├── useAICompanion.ts     # Chat message state + API calls
│   │   ├── useVoiceCommands.ts   # Voice command recognition dispatch
│   │   └── useRecommendations.ts # Content recommendations by interest
│   ├── services/
│   │   ├── api.ts                # Generic ApiClient with bearer token
│   │   ├── auth.ts               # /auth/register, /auth/login, /auth/logout, /auth/me
│   │   ├── home.ts               # GET /home (HomeData payload)
│   │   ├── videos.ts             # /videos CRUD + per-video sessions
│   │   ├── sessions.ts           # POST /sessions
│   │   ├── transcript.ts         # YouTube transcript fetcher + sentence merger
│   │   ├── ai.ts                 # AI companion service (legacy)
│   │   ├── content.ts            # Content library API (legacy)
│   │   └── voice.ts              # Voice command processing (legacy)
│   ├── stores/                   # Zustand state management
│   │   ├── authStore.ts          # Auth session + token + persistence
│   │   ├── userStore.ts          # User profile, level, streak (loaded from API)
│   │   ├── playerStore.ts        # Audio playback state (legacy)
│   │   ├── sessionStore.ts       # Local session + saveSession() API call
│   │   └── contentStore.ts       # Content library + filters (legacy)
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   └── utils/
│       ├── audio.ts              # Audio session config (web-guarded), URL validation
│       └── time.ts               # Time formatting, greeting
├── assets/                       # App icons, splash, favicon
├── specs/                        # Documentation
│   ├── PRODUCT_PRD_1.MD          # Product philosophy / feature vision
│   ├── implementation_plan.md    # Implementation roadmap
│   └── technical_docs.md         # This file
├── design/                       # Prototype design files (reference only)
├── app.json                      # Expo configuration (iOS / Android / Web)
├── package.json
└── tsconfig.json
```

---

## 4. Design System

### 4.1 Color Palette — Warm Orange on Paper

The design uses a restrained palette: warm off-white paper background, near-black charcoal ink, and a single warm orange accent. **The app is locked to light mode only** — dark mode colors are defined but unused.

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
| `inkInverse` | `rgba(244, 243, 239, 0.60)` | Light text on dark/accent backgrounds |
| `inkInverse2` | `rgba(244, 243, 239, 0.70)` | Light text on dark/accent (brighter) |
| `positive` | `#00897B` | Success (green-cyan) |
| `negative` | `#E53935` | Error (red-orange) |

**Theme Mode — Light Only:** Enforced at three levels:
1. `src/constants/theme.ts` — hooks hardcoded to light
2. `app.json` — `"userInterfaceStyle": "light"`
3. `app/_layout.tsx` — `<StatusBar style="dark" />`

### 4.2 Typography Scale

Three font families:

| Family | Loaded via | Usage |
|--------|------------|-------|
| Inter Tight (400/500/600/700) | `@expo-google-fonts/inter` | Body text, UI, buttons |
| JetBrains Mono (400/500) | `@expo-google-fonts/jetbrains-mono` | Timestamps, markers, chips |
| Instrument Serif | System serif fallback (Georgia) | Hero text, italic emphasis |

20+ presets in `src/constants/Typography.ts` — see `heroLarge`, `hero`, `titleLarge`, `headingLarge`, `heading`, `bodyLarge`, `body`, `bodyMedium`, `bodySmall`, `marker`, `markerLarge`, `monoSmall`, `mono`, `monoDisplay`, `monoStat`, `tab`, `chip`, `button`, `buttonSmall`, `serifItalic`.

### 4.3 Spacing & Radius

**Spacing scale** (`src/constants/Spacing.ts`): `xs=4, sm=6, md=8, lg=10, xl=12, xxl=14, xxxl=16, huge=20, massive=24, screen=16`

**Border radius** (`Radius`): `xs=2, sm=3, md=6, lg=7, xl=10, xxl=12, xxxl=16, pill=26, circle=999`

---

## 5. Component Library

### 5.1 UI Primitives

#### Button (`src/components/ui/Button.tsx`)
- **Variants**: `primary`, `ghost`, `pill`
- **Sizes**: `sm`, `md`, `lg`
- Loading spinner, disabled (40% opacity)

#### Card / Tag / Chip / ProgressBar / EmptyState
Standard variants — see file headers in `src/components/ui/`. ProgressBar supports both continuous progress and 5-segment mastery dots.

#### Knot (`src/components/ui/Knot.tsx`)
Parametric trefoil knot SVG. See [Algorithm 10.1](#101-knot-rendering-srccomponentsuiknottsx).

### 5.2 YouTube Player — Platform-Split

`src/components/youtube/YoutubePlayerView.{web,native,tsx}`

The player is split across three files so Metro picks the right implementation per platform:

| File | Platform | Implementation |
|------|----------|----------------|
| `YoutubePlayerView.native.tsx` | iOS / Android | Wraps `react-native-youtube-iframe` (which uses `react-native-webview` internally) |
| `YoutubePlayerView.web.tsx` | Web | Native HTML `<iframe>` to `youtube.com/embed/{id}` + YT IFrame postMessage API |
| `YoutubePlayerView.tsx` | TypeScript | Re-exports from `.native` so `tsc --noEmit` resolves types |

**Shared interface:**
```typescript
interface YoutubePlayerHandle {
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  seekTo: (seconds: number) => Promise<void>;
}
interface YoutubePlayerViewProps {
  videoId: string;
  width: number;
  height: number;
  play: boolean;
  onReady: () => void;
  onStateChange: (state: 'playing' | 'paused' | 'ended') => void;
  onError: (error: string) => void;
}
```

**Web implementation details:**
- Embeds `https://www.youtube.com/embed/{id}?enablejsapi=1&origin={origin}&...`
- Listens to `window.message` events, parses YT JSON payloads (`onReady`, `onStateChange`, `onError`, `infoDelivery`)
- Caches `currentTime` / `duration` from `infoDelivery` events; `getCurrentTime()` posts a `listening` event then waits 100ms and returns the cached value
- Sends `playVideo` / `pauseVideo` / `seekTo` commands via `postMessage`

**Why platform split**: a runtime `if (Platform.OS !== 'web') require(...)` guard does not work — Metro statically resolves all `require()` calls at bundle time. Using the `.web.tsx` / `.native.tsx` file convention lets Metro pick the correct file per platform during bundling.

### 5.3 Tab Bar

`app/(tabs)/_layout.tsx` defines three tabs using `@expo/vector-icons` Ionicons:

| Tab | Title | Icon (focused / default) |
|-----|-------|--------------------------|
| `home` | Home | `home` / `home-outline` |
| `library` | Library | `book` / `book-outline` |
| `progress` | Profile | `person-circle` / `person-circle-outline` |

Active tint: `colors.accent` (#E8913A). Inactive tint: `colors.ink4`. Labels: 10px JetBrains Mono uppercase with 0.6 letter-spacing.

### 5.4 Legacy Feature Components

`PlaybackControls`, `StatsGrid`, `StreakBadge`, `TimeTracker`, `ContentCard`, `ContentList`, `CuriosityFeed`, `PhraseRepeater`, `CompanionChat` exist under `src/components/{audio,tracker,content,practice,companion}/` but are not currently wired into the V2 screen flow. They are kept for reference.

---

## 6. Screen Flow & Navigation

### 6.1 Route Map

```
Root Stack (app/_layout.tsx)
├── /                          → index.tsx (auth gate → login or tabs)
├── /login                     → login.tsx (login + register)
├── /(tabs)                    → Tab Navigator
│   ├── /home                  → home.tsx
│   ├── /library               → library.tsx
│   └── /progress              → progress.tsx (titled "Profile")
├── /listen                    → listen.tsx
├── /dictation                 → dictation.tsx
├── /finished                  → finished.tsx (modal, slide_from_bottom)
├── /ai-tutor                  → ai-tutor.tsx (fullScreenModal, slide_from_bottom)
└── /ai-settings               → ai-settings.tsx (slide_from_right)
```

### 6.2 User Flow

```
Splash (font loading)
  ↓
Index (auth check via authStore.restoreSession)
  ├── unauthenticated → /login
  └── authenticated   → /(tabs)/home
      ↓
Home (Home tab)
  ├── Paste YouTube URL → POST /videos → /listen
  └── Tap recent knot → /listen
      ↓
Listen Screen
  ├── YouTube player (clipped rounded box)
  ├── Fixed transcript header ("Transcript" + N LINES) above a border
  ├── Scrolling transcript inside a clipped box (no bleed into video)
  │   ├── Active sentence rendered ink + fontWeight '900'
  │   ├── Auto-scrolls to keep active line ~1/3 from the top
  │   ├── Tap any line → seek to timestamp
  │   ├── Long-press → bookmark / saved-phrase menu
  │   └── Eye icon → hide/reveal transcript
  ├── [Ask AI Tutor] → /ai-tutor (full-screen modal)
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
  ├── Session stats (recalls, avg match)
  ├── POST /sessions on mount (one-shot via saved ref)
  └── [Return home] → /(tabs)/home
```

### 6.3 Navigation Patterns

- `router.push()` for forward navigation (slide_from_right)
- `router.back()` for backward navigation
- `router.replace()` when returning to home after session and after login
- Login uses `animation: 'fade'`; Finished opens as **modal** (slide_from_bottom)
- All screens hide the Stack header (custom inline headers)

---

## 7. State Management

### 7.1 Stores (Zustand)

#### authStore (`src/stores/authStore.ts`)
```typescript
interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  login(email, password): Promise<void>;
  register(email, password, displayName?): Promise<void>;
  logout(): Promise<void>;
  restoreSession(): Promise<boolean>;
  clearError(): void;
}
```
- Persists session + user to **AsyncStorage** under `soundknot_session` and `soundknot_user`
- On `restoreSession()`: loads from storage, checks `expires_at`, calls `apiClient.setToken()`, validates with `/auth/me`, clears storage on failure
- Throws on login/register failure so callers can react; error message also stored in state

#### userStore (`src/stores/userStore.ts`)
```typescript
interface UserState {
  user: User | null;
  isOnboardingComplete: boolean;
  handsFreeEnabled: boolean;
  // Actions: setUser, loadFromApi, updateInterests, addListeningMinutes,
  //          updateStreak, setLevel, completeOnboarding, toggleHandsFree, reset
}
```
- `loadFromApi()` calls `authService.me()` and maps the API `Profile` + `UserProgress` into the local `User` shape
- `addListeningMinutes()` recomputes level via `calculateLevel(totalMinutes)`:
  `>= 60000 → master, >= 30000 → advanced, >= 6000 → intermediate, else beginner`

#### sessionStore (`src/stores/sessionStore.ts`)
```typescript
interface SessionState {
  activeSession: ListeningSession | null;
  sessions: ListeningSession[];
  totalSecondsToday: number;
  isTracking: boolean;
  // Actions: startSession, pauseSession, resumeSession, endSession, tick,
  //          addBookmark, removeBookmark, addAIQuery, loadSessions, saveSession
}
```
- `saveSession(data)` posts to `/sessions` via `sessionService.create()` and swallows errors with `console.warn`
- Used by `app/finished.tsx` to persist the practice session on mount (guarded by a `useRef` so it only fires once)

#### playerStore / contentStore (legacy)
Defined but not used by V2 screens.

### 7.2 Auth + State Lifecycle

```
app/_layout.tsx (RootLayout)
  ├── Loads fonts → renders splash for 300ms
  └── Renders Stack
      ↓
app/index.tsx
  ├── authStore.restoreSession()
  │   ├── reads AsyncStorage
  │   ├── apiClient.setToken()
  │   └── validates with /auth/me
  ├── if isAuthenticated → <Redirect href="/(tabs)/home" />
  └── else → <Redirect href="/login" />
      ↓
app/login.tsx
  ├── authStore.login(email, password) or .register(...)
  └── on success → router.replace('/(tabs)/home')
      ↓
Authenticated tabs
  ├── Home: homeService.fetch() (GET /home)
  ├── Library: videoService.list() (GET /videos)
  └── Profile: authService.me() + homeService.fetch()
```

---

## 8. Types & Data Models

All types defined in `src/types/index.ts`.

### Auth & Profile
```typescript
interface AuthSession { access_token, refresh_token, expires_at? }
interface AuthUser    { id, email, profile: Profile | null }
interface Profile     { id, display_name, interests: string[], level, created_at, updated_at }
interface UserProgress {
  id, current_streak, longest_streak, total_minutes,
  total_sessions, last_session_date, updated_at
}
```

### User-owned content
```typescript
interface UserVideo {
  id, user_id, youtube_video_id,
  title: string | null,
  channel: string | null,
  thumbnail_url: string | null,
  added_at
}

interface PracticeSession {
  id, user_id, video_id,
  segment: string | null,
  pass: number,
  mastery: number,    // 0..1
  accuracy: number,   // 0..1
  listened_seconds: number,
  created_at,
  user_videos?: { title, youtube_video_id, thumbnail_url }
}

interface HomeData {
  progress: UserProgress | null;
  todaySessions: PracticeSession[];
  recentKnots: PracticeSession[];
  videos: UserVideo[];
}
```

### Local types (legacy / non-API)
- `User` — denormalized client-side user shape (`displayName`, `totalListeningMinutes`, `streak`, `level`, etc.)
- `ContentItem`, `TranscriptSegment`, `KeyPhrase` — content library types
- `ListeningSession`, `Bookmark`, `AIQuery` — local session tracking
- `DrillSession`, `Recommendation`, `Achievement`
- `AudioState`, `LoopMode`, `VoiceCommand`, `VoiceAction`

### Navigation
```typescript
type RootStackParamList = {
  index: undefined;
  login: undefined;
  onboarding: undefined;
  '(tabs)': undefined;
  listen: { videoId: string; userVideoId?: string };
  dictation: { videoId: string; userVideoId?: string };
  finished: {
    userVideoId?: string;
    recallsCount?: string;
    averageAccuracy?: string;
    listenedSeconds?: string;
  };
  // ...
};
```

---

## 9. Services & Hooks

### 9.1 ApiClient (`src/services/api.ts`)

Singleton `apiClient` with:
- `get<T>`, `post<T>`, `put<T>`, `delete<T>`
- `setToken(token)` / `clearToken()` — bearer auth
- Base URL from `Config.apiBaseUrl` (env: `EXPO_PUBLIC_API_URL`, default `https://api.soundknot.app`)
- Throws `Error(body.error || 'API Error: {status} {statusText}')` on non-2xx

### 9.2 Domain services

| Service | Endpoints | Used by |
|---------|-----------|---------|
| `authService` (`auth.ts`) | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | `authStore`, `userStore`, `progress.tsx` |
| `homeService` (`home.ts`) | `GET /home` → `HomeData` | `home.tsx`, `progress.tsx` |
| `videoService` (`videos.ts`) | `GET /videos`, `POST /videos`, `GET /videos/:id/sessions`, `DELETE /videos/:id` | `home.tsx` (add + remove), `library.tsx` (list) |
| `sessionService` (`sessions.ts`) | `POST /sessions` | `sessionStore.saveSession` → `finished.tsx` |
| `transcript` (`transcript.ts`) | YouTube InnerTube via `youtube-transcript` | `listen.tsx` |

### 9.3 Transcript Service

- **Package**: `youtube-transcript` (^1.3.1) — calls YouTube's internal `get_transcript` endpoint with Android client emulation, falls back to HTML scraping
- `fetchTranscript(videoId)` → fetches raw fragments, converts ms→seconds, merges into sentences (Algorithm 10.5)
- `formatTimestamp(seconds)` → `m:ss` or `h:mm:ss`
- `findCurrentLineIndex(lines, currentTime)` → reverse linear search for the last line whose `start ≤ currentTime`

### 9.4 Hooks (legacy)

`useAudioPlayer`, `useTimer`, `useAICompanion`, `useVoiceCommands`, `useRecommendations` — present but not used by V2 screens.

---

## 10. Key Algorithms

### 10.1 Knot Rendering (`src/components/ui/Knot.tsx`)

Parametric trefoil knot rendered via `react-native-svg`:

1. **Parametric generation** (360 steps):
   ```
   x = cx + (sin(t) + 2·sin(2t)) × scale
   y = cy + (cos(t) - 2·cos(2t)) × scale
   z = sin(3t)
   scale = (size/2) × 0.28 × (1 - mastery × 0.12)
   ```
2. **Over/under weave**: split curve at `z > 0.3`, draw paper-colored gap strokes, redraw over-strands.
3. **Played portion**: amber stroke-dasharray proportional to `progress`.
4. **Pass rings**: concentric dashed circles (1 per completed pass).
5. **Tick marks**: 12 perimeter ticks; central dot sized by `mastery`.

### 10.2 Dictation Diff (`app/dictation.tsx:33`)

Word-level comparison (`checkRecall`):
1. Normalize user text: lowercase, strip punctuation, split to words
2. Walk target text:
   - **Exact match** → `correct`
   - **One-word-ahead** (user word matches next target) → mark current `extra`, next `correct`
   - **Prefix match** (both ≥4 chars, first 4 match) → `correct`
   - **No match** → `missed`
3. Returns accuracy %, correct/missed counts, diff array.

### 10.3 Level Calculation (`src/stores/userStore.ts:92`)
```
totalMinutes >= 60000 → master
totalMinutes >= 30000 → advanced
totalMinutes >= 6000  → intermediate
otherwise             → beginner
```

### 10.4 YouTube URL Extraction (`app/(tabs)/home.tsx:43`)
```typescript
const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
return m ? m[1] : null;
```
On the home screen, a successful match calls `videoService.add({ youtube_video_id })` then navigates to `/listen` with both `videoId` and the returned `userVideoId`.

### 10.5 Transcript Sentence Merging (`src/services/transcript.ts`)

YouTube returns transcripts as ~2-3 second fragments. The merger groups them into readable chunks using a two-strategy approach:

**Strategy A — Sentence-based (when punctuation exists)**
1. `hasSentencePunctuation()` scans all fragments for `.` or `?`
2. If found, `mergeBySentence()` accumulates fragments and flushes when both:
   - `sentenceCount >= SENTENCES_PER_CHUNK` (default `2`)
   - The current fragment ends with a sentence terminator (`SENTENCE_END_RE = /[.?]["'”’)\]]?\s*$/`)
3. `countSentenceEndings()` skips decimals — a `.` flanked by digits on both sides (e.g. `3.14`) does not count as a sentence end

**Strategy B — Word-count fallback (auto-generated captions)**
- Auto-generated YouTube captions have no punctuation. When `hasSentencePunctuation()` returns false, `mergeByWordCount()` flushes every `UNPUNCTUATED_WORDS_PER_CHUNK = 30` words.
- This prevents the entire transcript from collapsing into a single multi-thousand-word line (the previously-observed `kkwHhNitf8A` failure mode).

Each merged line preserves `start` from the first fragment in the buffer and `duration = bufEnd - bufStart`.

### 10.6 Active-Line Highlight + Auto-Scroll (`app/listen.tsx`)

- 500ms `setInterval` polls `playerRef.current.getCurrentTime()` while the player is `ready` (not gated on `playing`, so the highlight keeps following even if YouTube state callbacks misfire)
- `findCurrentLineIndex()` does a reverse linear scan to locate the last line with `start <= currentTime`
- Active line styling: `color: colors.ink` and `fontWeight: '900'` (heavier than `bold`/`700` for clearer visual emphasis); inactive lines render as `colors.ink4` with `fontWeight: '400'`
- Each line measures its Y via `onLayout` and writes into a `lineYPositions` ref keyed by index
- A `useEffect` on `currentLineIdx` change scrolls so the active line sits ~1/3 from the top: `target = max(0, lineY - scrollViewHeight * 0.33)`
- The transcript ScrollView is wrapped in a `transcriptBox` View with `overflow: 'hidden'` and a top hairline border, so scrolled content is clipped at a clear boundary below the video player
- The `Transcript` label and `N LINES` counter render in a fixed `transcriptHeaderFixed` row above the boundary so they remain visible while the transcript scrolls
- **Anti-pattern avoided**: never use a ScrollView ref callback for imperative scroll — it fires every render. Always use `useRef` + `useEffect` keyed on the tracked index.

### 10.7 Home Library Item Removal (`app/(tabs)/home.tsx`)

Each video row in the Home library has an X icon (Ionicons `close`). Tapping it shows an `Alert.alert` confirm sheet, then performs an optimistic update:

1. Snapshot current `videos` array
2. Filter the doomed item out and `setVideos()` immediately for instant feedback
3. `await videoService.remove(id)` (DELETE `/videos/:id`)
4. On error, restore the snapshot — the item reappears in place

### 10.8 AI Tutor Keyboard Handling (`app/ai-tutor.tsx` + `app/_layout.tsx`)

iOS modal presentation interacts poorly with `KeyboardAvoidingView`: in the default `presentation: 'modal'` (page sheet) mode, the keyboard offset is measured against the sheet's frame rather than the screen, so the input docks too low and gets covered. Fix:

- `app/_layout.tsx` declares the route with `presentation: 'fullScreenModal'` so it covers the screen
- `app/ai-tutor.tsx` puts `KeyboardAvoidingView` (`behavior="padding"` on iOS, `"height"` on Android) as the **outermost** wrapper above `SafeAreaView`
- The chat ScrollView sets `keyboardShouldPersistTaps="handled"` so taps on suggestion chips don't dismiss the keyboard

### 10.9 Session Persistence (`app/finished.tsx:30`)

```typescript
const saved = useRef(false);
useEffect(() => {
  if (saved.current || !userVideoId) return;
  saved.current = true;
  saveSession({
    video_id: userVideoId,
    accuracy: accuracy / 100,
    listened_seconds: seconds,
    pass: recalls,
    mastery: accuracy / 100,
  });
}, [userVideoId]);
```
The `saved` ref ensures `POST /sessions` fires exactly once on mount, even if the screen re-renders.

---

## 11. Configuration

### app.json Highlights
```json
{
  "expo": {
    "name": "SoundKnot",
    "slug": "soundknot",
    "scheme": "soundknot",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": { "backgroundColor": "#F4F3EF" },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "..."
      }
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "permissions": ["RECORD_AUDIO"]
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro",
      "output": "single",
      "name": "SoundKnot",
      "shortName": "SoundKnot",
      "description": "Practice English listening with YouTube videos",
      "backgroundColor": "#F4F3EF",
      "themeColor": "#E8913A"
    },
    "plugins": ["expo-router", "expo-av"],
    "experiments": { "typedRoutes": true }
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
| Session heartbeat | 5000ms |
| Milestones (minutes) | 600, 3000, 6000, 30000, 60000 |
| Voice commands | 10 phrases (play, pause, rewind, skip, bookmark, ask AI, speed) |

### AsyncStorage keys (`src/stores/authStore.ts`)
| Key | Contents |
|-----|----------|
| `soundknot_session` | `AuthSession` JSON (access_token, refresh_token, expires_at) |
| `soundknot_user` | `AuthUser` JSON (id, email, profile) |

---

## 12. Platform Support

The app targets **iOS, Android, and the web** from a single Expo Router codebase.

### 12.1 Web Bundling

`app.json` configures `"bundler": "metro"` and `"output": "single"` so Expo's Metro web bundler emits a single-page app. Build with:

```bash
npx expo export --platform web
```

The output goes to `dist/`.

### 12.2 Platform-specific files

Metro resolves files in this order: `*.web.tsx` → `*.native.tsx` → `*.tsx`. The codebase uses this for the YouTube player ([§5.2](#52-youtube-player--platform-split)). The base `.tsx` file re-exports from `.native` so TypeScript type-checking resolves cleanly without seeing platform conditionals.

### 12.3 Runtime platform guards

Where a single file must run on all platforms but a specific API is unavailable on web:

- **`src/utils/audio.ts:6`** — `configureAudioSession()` returns early on web because `expo-av`'s native audio mode is not implemented for web.
- **`app/login.tsx:53`** — `KeyboardAvoidingView` uses `behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}` to avoid the noisy "Layout children must be specified" warning on web.

### 12.4 Web-only constraints

- Audio session config (background playback, silent-mode override) is a no-op on web; the browser handles audio policy.
- Voice commands and microphone recording in dictation are unimplemented on web (the existing recording UI is a UI-only simulation).
- Background tracking via `UIBackgroundModes` only applies to iOS native builds.

---

## 13. Development Guide

### Getting Started
```bash
npm install
npx expo start              # Choose i / a / w in the prompt
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

### Web build
```bash
npx expo export --platform web   # outputs to dist/
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
3. Navigate: `router.push('/screen-name')` or with params
4. Run `npx expo start` to regenerate typed routes

### Adding a Web/Native Split
1. Create `Component.native.tsx` (RN-only APIs)
2. Create `Component.web.tsx` (browser/DOM APIs)
3. Optionally create `Component.tsx` that re-exports from `.native` for TypeScript
4. Import as `from './Component'` — Metro picks the right one per platform

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
      <Text style={[Typography.body, { color: colors.ink2 }]}>Body</Text>
    </View>
  );
}
```

### Design Tokens Reference

```
colors.paper        → #F4F3EF  Main background
colors.paper2       → #ECEAE2  Cards, secondary surfaces
colors.ink          → #2A2522  Primary text
colors.ink2-4       → progressively lighter ink
colors.hair / hair2 → hairline borders / dividers
colors.accent       → #E8913A  Warm orange accent
colors.accentSoft   → translucent orange highlight
colors.accentInk    → #7A3D0A  Dark orange text
colors.positive     → #00897B  Success
colors.negative     → #E53935  Error

Spacing.screen      → 16px page padding
Spacing.xxxl        → 16px internal padding
Spacing.xl          → 12px gap
Radius.xl           → 10px buttons/cards
Radius.pill         → 26px fully rounded
```

---

*Last updated: 2026-05-20 · Sound Knot V2 · Expo SDK 54 · iOS / Android / Web*
