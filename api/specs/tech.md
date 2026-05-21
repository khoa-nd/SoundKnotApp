# SoundKnot  Technical Documentation

## Architecture

```
[Expo App (React Native)]
        
          HTTPS + Bearer JWT
        
[Cloudflare Worker (Hono)]
        
          supabase-js (service_role)
        
[Supabase Auth + PostgreSQL]
```

- The app never talks to Supabase directly  the CF Worker is the sole API proxy
- Supabase Auth handles email/password authentication
- The CF Worker validates JWTs via `supabase.auth.getUser(token)`
- AsyncStorage on the app persists JWT for session restoration on launch

---

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| SoundKnotAPI | `/Users/khoanguyen/Documents/SoundKnotAPI` | Cloudflare Worker API |
| SoundKnotApp | `/Users/khoanguyen/Documents/SoundKnotApp` | Expo React Native app |

---

## Database Schema (Supabase PostgreSQL)

Migration file: `specs/migration.sql`

### Tables

#### `profiles`
Extends `auth.users`  created automatically via trigger on signup.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID (PK) |  | References auth.users(id), ON DELETE CASCADE |
| display_name | TEXT |  | From signup metadata or email prefix |
| interests | TEXT[] | '{}' | User interest tags |
| level | TEXT | 'beginner' | beginner / intermediate / advanced / master |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | Auto-updated via trigger |

#### `user_videos`
YouTube videos a user has added to their library.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | gen_random_uuid() | |
| user_id | UUID (FK) |  | References auth.users(id) |
| youtube_video_id | TEXT |  | YouTube video ID (11 chars) |
| title | TEXT |  | Video title |
| channel | TEXT |  | Channel name |
| thumbnail_url | TEXT |  | Thumbnail image URL |
| added_at | TIMESTAMPTZ | now() | |

- **UNIQUE constraint**: `(user_id, youtube_video_id)`  enables upsert

#### `practice_sessions`
Individual practice session records.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | gen_random_uuid() | |
| user_id | UUID (FK) |  | References auth.users(id) |
| video_id | UUID (FK) |  | References user_videos(id) |
| segment | TEXT |  | Which segment was practiced |
| pass | INT | 1 | Number of recall passes |
| mastery | REAL | 0 | Mastery score 01 |
| accuracy | REAL | 0 | Dictation accuracy 01 |
| listened_seconds | INT | 0 | Total seconds listened |
| created_at | TIMESTAMPTZ | now() | |

#### `user_progress`
Aggregated stats per user  created automatically via trigger on signup.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID (PK) |  | References auth.users(id), ON DELETE CASCADE |
| current_streak | INT | 0 | Consecutive days practiced |
| longest_streak | INT | 0 | All-time longest streak |
| total_minutes | INT | 0 | Cumulative listening minutes |
| total_sessions | INT | 0 | Total practice sessions |
| last_session_date | DATE |  | For streak calculation |
| updated_at | TIMESTAMPTZ | now() | Auto-updated via trigger |

### Triggers

- **`on_auth_user_created`**  Fires after insert on `auth.users`. Auto-creates a `profiles` row (display_name from metadata or email prefix) and a `user_progress` row.
- **`profiles_updated_at`**  Auto-sets `updated_at` on profile update.
- **`user_progress_updated_at`**  Auto-sets `updated_at` on progress update.

### Row Level Security (RLS)

All tables have RLS enabled. Policies:
- Users can SELECT/UPDATE/INSERT/DELETE their own rows (scoped by `auth.uid()`)
- Service role (`auth.role() = 'service_role'`) has full access (used by CF Worker)

---

## API (Cloudflare Worker)

**Base URL**: `https://soundknot-api.ndkhoa-is.workers.dev`

### Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4
- **Database client**: @supabase/supabase-js v2 (admin/service_role)
- **Build tool**: Wrangler v4

### File Structure

```
soundknot-api/
  wrangler.toml              # CF config, secrets reference
  package.json
  tsconfig.json
  src/
    index.ts                 # Hono app, CORS, route registration
    middleware/auth.ts        # Bearer token validation  sets userId on context
    routes/auth.ts           # /auth/* endpoints
    routes/videos.ts         # /videos/* endpoints
    routes/sessions.ts       # /sessions/* endpoints
    routes/home.ts           # /home endpoint
    routes/ai.ts             # /ai/chat endpoint (Gemini proxy)
    lib/supabase.ts          # Supabase admin client factory + Env type
    lib/time.ts              # Timezone helpers (getLocalDate, getLocalYesterday, getLocalDayRange)
    lib/aiSystemPrompt.ts    # Builds system prompt from video context
    lib/gemini.ts            # Gemini REST client (text + audio inlineData)
    lib/rateLimit.ts         # Per-user sliding-window rate limiter (in-memory)
```

### Environment / Secrets

Set via `wrangler secret put <NAME>`:

| Secret | Description |
|--------|-------------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (admin access) |
| SUPABASE_JWT_SECRET | JWT secret for token validation |
| GEMINI_API_KEY | Google AI Studio key used by `/ai/chat` |

Optional `[vars]` (set in `wrangler.toml`, override defaults):

| Var | Default | Description |
|-----|---------|-------------|
| AI_RATE_LIMIT_PER_USER_PER_MINUTE | 20 | Per-user sliding window for `/ai/chat` |
| AI_MAX_AUDIO_BYTES | 2097152 (2 MB) | Hard cap on a single voice attachment |

### Auth Middleware

`src/middleware/auth.ts`  Extracts `Bearer <token>` from Authorization header, calls `supabase.auth.getUser(token)` to validate. On success, sets `c.set("userId", user.id)`. Returns 401 on failure.

### Endpoints

#### Auth (no auth required for register/login)

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/auth/register` | No | `{ email, password, display_name? }` | `{ session: { access_token, refresh_token, expires_at }, user: { id, email, profile } }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ session: { access_token, refresh_token, expires_at }, user: { id, email, profile } }` |
| POST | `/auth/logout` | Yes |  | `{ message: "Logged out" }` |
| GET | `/auth/me` | Yes |  | `{ profile, progress }` |

- Register uses `supabase.auth.admin.createUser()` with `email_confirm: true` (no email verification), then auto-signs in
- Login uses `supabase.auth.signInWithPassword()`

#### Videos (all require auth)

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/videos` |  | `{ videos: UserVideo[] }` (ordered by added_at DESC) |
| POST | `/videos` | `{ youtube_video_id, title?, channel?, thumbnail_url? }` | `{ video: UserVideo }` (upsert on user_id + youtube_video_id) |

- POST `/videos` auto-fetches title / channel / thumbnail from YouTube oEmbed (`https://www.youtube.com/oembed?url=...&format=json`) when any of those fields is missing in the request body, so the app no longer needs to scrape metadata client-side
| GET | `/videos/:id/sessions` |  | `{ sessions: PracticeSession[] }` |

#### Sessions (all require auth)

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/sessions` | `{ video_id, segment?, pass?, mastery?, accuracy?, listened_seconds?, tz? }` | `{ session: PracticeSession }` |

- Validates that `video_id` belongs to the authenticated user before insert
- Optional `tz` is an IANA timezone (e.g. `Asia/Ho_Chi_Minh`) used for streak day calculation; falls back to UTC if not provided
- Also updates `user_progress`: increments total_sessions, adds listened minutes, calculates streak in the user's timezone (checks if last_session_date was yesterday to continue streak, same day = no change, otherwise resets to 1)
- Extensive request/error logging for debugging session persistence

#### Home (requires auth)

| Method | Path | Response |
|--------|------|----------|
| GET | `/home` | `{ progress, todaySessions, recentKnots, videos }` |

- Runs 4 parallel queries: user_progress, today's sessions (with video join), recent 10 sessions (with video join), recent 10 videos

#### AI Tutor (requires auth)

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/ai/chat` | `{ provider: "gemini", model, messages: [{ role, content, audio? }], context? }` | `{ reply }` on 200, `{ error }` otherwise |

- Strict provider allowlist: only `"gemini"` is accepted today (returns 400 for anything else)
- `messages[].audio` carries voice questions: `{ base64, mimeType }`. Gemini transcribes and answers in one round-trip via `inlineData` parts
- `context` (optional) carries `videoTitle`, `videoChannel`, `videoId`, `transcriptWindow`, `selection` — used to build the system prompt server-side; empty/null fields are skipped cleanly
- Per-user sliding-window rate limit (default 20/min) returns 429 with a `Retry-After` header. In-memory and per-isolate (best-effort)
- Audio cap (default 2 MB base64) returns 413
- Upstream error mapping: Gemini 429 → 429; other Gemini 4xx/5xx, network errors, empty replies, or safety blocks → 502
- Logs `{ user_id, provider, model, messages_length, audio_count, latency_ms, upstream_status, outcome }` per request — never logs message content, audio, or transcript
- Spec: `specs/api-handoff-ai-chat.md`

### CORS

Configured to accept all origins (`*`) with methods GET, POST, PUT, DELETE, OPTIONS and headers Content-Type, Authorization.

---

## App (Expo React Native)

### Stack

- **Framework**: Expo SDK 54 + Expo Router v6
- **State management**: Zustand v5
- **Persistence**: @react-native-async-storage/async-storage
- **Navigation**: File-based routing (expo-router) with typed routes

### Environment

`.env` file:
```
EXPO_PUBLIC_API_URL=https://soundknot-api.ndkhoa-is.workers.dev
```

Read in `src/constants/Config.ts` via `process.env.EXPO_PUBLIC_API_URL`.

### Key Files

#### Services (`src/services/`)

| File | Purpose |
|------|---------|
| `api.ts` | Base API client  `ApiClient` class with `setToken()`, `clearToken()`, `get()`, `post()`, `put()`, `delete()`. Parses JSON error bodies. |
| `auth.ts` | `authService.register()`, `.login()`, `.logout()`, `.me()` |
| `videos.ts` | `videoService.list()`, `.add()`, `.getSessions()` |
| `sessions.ts` | `sessionService.create()` |
| `home.ts` | `homeService.fetch()` |

#### Stores (`src/stores/`)

| File | Purpose |
|------|---------|
| `authStore.ts` | Zustand store: `user`, `session`, `isAuthenticated`, `isLoading`, `error`. Actions: `login()`, `register()`, `logout()`, `restoreSession()`, `clearError()`. Persists JWT + user to AsyncStorage. `restoreSession()` checks token expiry and validates with `/auth/me`. |
| `userStore.ts` | Zustand store: `user` (User type). `loadFromApi()` fetches profile + progress from `/auth/me` and maps to local User shape. Removed hardcoded mock data. |
| `sessionStore.ts` | Zustand store: active session tracking + `saveSession()` action that calls `sessionService.create()`. |

#### Types (`src/types/index.ts`)

Added types:
- `AuthSession`  access_token, refresh_token, expires_at
- `AuthUser`  id, email, profile
- `Profile`  display_name, interests, level, timestamps
- `UserProgress`  current_streak, longest_streak, total_minutes, total_sessions, last_session_date
- `UserVideo`  youtube_video_id, title, channel, thumbnail_url, added_at
- `PracticeSession`  video_id, segment, pass, mastery, accuracy, listened_seconds (with optional user_videos join)
- `HomeData`  progress, todaySessions, recentKnots, videos
- Updated `RootStackParamList`  added `login` route, updated `listen`/`dictation`/`finished` params

### Screens

#### `app/index.tsx`  Entry point / Auth guard
- Calls `restoreSession()` on mount
- Shows splash with spinner while checking
- Redirects to `/(tabs)/home` if authenticated, `/login` if not

#### `app/login.tsx`  Login / Register
- Toggle between Sign In and Create Account modes
- Email + password inputs styled to match design system (paper bg, mono font, rounded inputs)
- Calls `authStore.login()` or `.register()`, redirects to home on success
- Error display using Chip component
- "Sign in with Google" button (disabled placeholder)

#### `app/_layout.tsx`  Root navigator
- Added `<Stack.Screen name="login">` with fade animation

#### `app/(tabs)/home.tsx`  Home screen
- `useFocusEffect` calls `homeService.fetch()` on every screen focus
- URL submission calls `videoService.add()` to persist video, then navigates to `/listen` with `userVideoId`
- Streak chip shows real `progress.current_streak`
- Single unified "Recent videos / sessions" list rendered from `homeData.recentKnots` (replaces the previous separate "Today" featured card + "Recent knots" list)
- Section header shows total session count; empty state when no sessions exist

#### `app/listen.tsx`  Listen screen
- Accepts `userVideoId` param alongside `videoId`
- Passes both to dictation screen on "Recall" navigation

#### `app/dictation.tsx`  Dictation screen
- Accepts `videoId` + `userVideoId` params
- Passes `userVideoId`, `recallsCount`, `averageAccuracy` to finished screen

#### `app/finished.tsx`  Session complete screen
- Accepts `userVideoId`, `recallsCount`, `averageAccuracy`, `listenedSeconds` params
- Calls `sessionStore.saveSession()` on mount to persist the practice session to API
- Displays real stats from params instead of hardcoded values

#### `app/(tabs)/progress.tsx`  Progress screen
- `useFocusEffect` fetches `authService.me()` and `homeService.fetch()` in parallel
- Stat grid shows real: current_streak, longest_streak, total_sessions, total_minutes
- Active knots mastery list from real session data

#### `app/(tabs)/library.tsx`  Library screen
- `useFocusEffect` fetches `videoService.list()`
- Shows user's saved videos with thumbnails
- Search filters by title
- Navigates to listen with real `youtube_video_id` + `userVideoId`

### Auth Flow

```
App launch
   index.tsx calls restoreSession()
   Reads JWT from AsyncStorage
   Checks expiry (expires_at)
   Validates with GET /auth/me
   If valid: set token on apiClient, redirect to home
   If invalid/expired/missing: clear storage, redirect to /login

Login / Register
   POST /auth/login or /auth/register
   Receive { session, user }
   Store JWT + user in AsyncStorage
   Set token on apiClient
   Redirect to /(tabs)/home

Logout
   POST /auth/logout
   Clear token from apiClient
   Remove JWT + user from AsyncStorage
   Reset auth state
```

### Data Flow: Practice Session

```
Home  paste URL  videoService.add()  navigate to /listen with userVideoId
   Listen screen (YouTube player + transcript)
   Tap "Recall"  navigate to /dictation with videoId + userVideoId
   Dictation screen (type/voice recalls, check accuracy)
   Tap "Finish session"  navigate to /finished with stats
   Finished screen  sessionService.create() persists to API
   Updates user_progress (streak, minutes, sessions) server-side
   Tap "Return home"  home refreshes data via useFocusEffect
```

---

## Deployment

### API (Cloudflare Worker)

```bash
cd SoundKnotAPI
npm install
wrangler login
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

### Database (Supabase)

Run `specs/migration.sql` in Supabase Dashboard > SQL Editor > New Query.

### App (Expo)

```bash
cd SoundKnotApp
# Ensure .env has EXPO_PUBLIC_API_URL set
npm install
expo start
```

---

## Design System Reference

- **Theme**: Warm paper light mode (`#F4F3EF` background, `#2A2522` text)
- **Accent**: Orange `#E8913A`
- **Fonts**: Inter (body/headings), JetBrains Mono (markers/chips/tabs)
- **Spacing scale**: xs(4) sm(6) md(8) lg(10) xl(12) xxl(14) xxxl(16) huge(20) massive(24)
- **Border radius**: xs(2) sm(3) md(6) lg(7) xl(10) xxl(12) pill(26)
- **Key components**: Chip, Knot (progress visualization), ProgressBar, Card, Button
