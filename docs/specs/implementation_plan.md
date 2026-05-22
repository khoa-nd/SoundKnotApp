SoundKnot: Auth, API & Database Implementation Plan

 Architecture

 [Expo App] --Bearer JWT--> [Cloudflare Worker (Hono)] --supabase-js--> [Supabase Auth + PostgreSQL]

 - App never talks to Supabase directly; CF Worker is the API proxy
 - Supabase Auth handles email/password auth; CF Worker validates JWTs
 - AsyncStorage persists JWT for session restoration on app launch

 ---
 Phase 0: Supabase Database Schema

 Run SQL migration to create:

 | Table             | Purpose                                                                              |
 |-------------------|--------------------------------------------------------------------------------------|
 | profiles          | Extends auth.users — display_name, interests, level                                  |
 | user_videos       | YouTube videos user has added (youtube_video_id, title, channel, thumbnail_url)      |
 | practice_sessions | Each practice session (video_id, segment, pass, mastery, accuracy, listened_seconds) |
 | user_progress     | Aggregated stats (streak, total_minutes, total_sessions)                             |

 - Trigger on_auth_user_created auto-creates profiles + user_progress rows
 - Row Level Security enabled on all tables
 - UNIQUE(user_id, youtube_video_id) on user_videos for upsert support

 ---
 Phase 1: Cloudflare Worker API

 Separate repo: [SoundKnotAPI](https://github.com/khoa-nd/SoundKnotAPI)

 Dependencies: hono, @supabase/supabase-js, wrangler (dev)

 File structure:
 soundknot-api/
   .env 
   wrangler.toml          -- CF config, env vars (SUPABASE_URL, secrets)
   package.json
   tsconfig.json
   src/
     index.ts             -- Hono app, CORS, route registration
     middleware/auth.ts    -- Extracts Bearer token, validates via Supabase, sets userId on context
     routes/auth.ts       -- POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
     routes/videos.ts     -- GET /videos, POST /videos, GET /videos/:id/sessions
     routes/sessions.ts   -- POST /sessions (saves session + updates user_progress streak/minutes)
     routes/home.ts       -- GET /home (parallel queries: progress + recent sessions + videos)
     lib/supabase.ts      -- Creates supabase admin client from env

 Key endpoints:

 | Endpoint            | Auth | Description                                                       |
 |---------------------|------|-------------------------------------------------------------------|
 | POST /auth/register | No   | Create user via Supabase Auth admin API, auto sign-in, return JWT |
 | POST /auth/login    | No   | Sign in, return JWT + profile                                     |
 | GET /auth/me        | Yes  | Return profile + progress                                         |
 | GET /videos         | Yes  | User's videos ordered by added_at DESC                            |
 | POST /videos        | Yes  | Upsert a video (youtube_video_id is the natural key)              |
 | POST /sessions      | Yes  | Record practice session, update streak + listening minutes        |
 | GET /home           | Yes  | Aggregated: todaySession, recentKnots, progress, videos           |

 ---
 Phase 2: App — Auth Store + Login Screen

 New files:

 - src/stores/authStore.ts — Zustand store following existing pattern
   - State: user, session, isAuthenticated, isLoading, error
   - Actions: login(), register(), logout(), restoreSession(), clearError()
   - restoreSession() reads JWT from AsyncStorage on launch, checks expiry, sets apiClient token
   - login()/register() call API, persist JWT+user to AsyncStorage, set apiClient token
 - app/login.tsx — Login/Register screen
   - Matches design system: paper background, ink text, accent orange buttons
   - Email + password inputs (styled like existing urlInput in home.tsx)
   - Toggle between Sign In / Create Account modes
   - "Sign in with Google" button (placeholder/disabled for now, wired up later)
   - Error display using existing Chip component
   - Calls authStore.login() or .register(), redirects to home on success

 Modified files:

 - src/services/api.ts — Add clearToken() method, improve error handling to parse JSON error body
 - app/index.tsx — Replace static <Redirect> with auth check: call restoreSession(), then redirect to /login or /(tabs)/home
 - app/_layout.tsx — Add <Stack.Screen name="login"> to the navigator

 ---
 Phase 3: App — Service Layer

 New files:

 - src/services/auth.ts — login(), register(), logout(), me() wrappers around apiClient
 - src/services/videos.ts — list(), add(), getSessions() wrappers
 - src/services/sessions.ts — create() wrapper for POST /sessions
 - src/services/home.ts — fetch() wrapper for GET /home

 ---
 Phase 4: App — Wire Screens to Real Data

 app/(tabs)/home.tsx

 - Remove RECENT_ITEMS mock data
 - Add useFocusEffect to call homeService.fetch() on screen focus
 - Replace hardcoded streak chip with progress.current_streak
 - Replace Today card with todaySession data (or "Start your first session" empty state)
 - Replace Recent knots list with recentKnots array
 - On URL submit: call videoService.add() to persist, then navigate to /listen with userVideoId

 app/listen.tsx

 - Accept userVideoId param alongside videoId
 - Pass both forward to dictation screen on navigation

 app/dictation.tsx

 - Accept videoId + userVideoId params
 - Pass forward to finished screen with recall stats (recallsCount, averageAccuracy)

 app/finished.tsx

 - Accept session params (userVideoId, recallsCount, averageAccuracy)
 - Call sessionService.create() on mount to persist the practice session
 - Display real stats from params instead of hardcoded values

 app/(tabs)/progress.tsx

 - Remove mock data constants
 - Fetch progress from authService.me() and sessions from API
 - Display real stats, streaks, mastery data

 app/(tabs)/library.tsx

 - Remove LIBRARY_ITEMS mock
 - Fetch user's videos from videoService.list()
 - Navigate with real video IDs

 ---
 Phase 5: Store Updates + Types

 src/stores/userStore.ts

 - Remove mockUser, set initial user to null
 - Add loadFromApi() action that calls authService.me() to populate profile + progress

 src/stores/sessionStore.ts

 - Add saveSession() action that calls sessionService.create() after ending a session

 src/types/index.ts

 - Add types: AuthSession, AuthUser, UserVideo, PracticeSession, UserProgress
 - Update RootStackParamList with login route and updated params for listen/dictation/finished

 src/constants/Config.ts

 - No code changes needed (already reads EXPO_PUBLIC_API_URL)
 - Create .env.example with EXPO_PUBLIC_API_URL=https://soundknot-api.<account>.workers.dev

 ---
 Files Summary

 New files (app):

 1. src/stores/authStore.ts
 2. app/login.tsx
 3. src/services/auth.ts
 4. src/services/videos.ts
 5. src/services/sessions.ts (replaces stub)
 6. src/services/home.ts

 New files (API — separate repo soundknot-api/):

 7. wrangler.toml
 8. package.json
 9. tsconfig.json
 10. src/index.ts
 11. src/middleware/auth.ts
 12. src/routes/auth.ts
 13. src/routes/videos.ts
 14. src/routes/sessions.ts
 15. src/routes/home.ts
 16. src/lib/supabase.ts

 Modified files:

 17. src/services/api.ts — add clearToken, better error handling
 18. app/index.tsx — auth guard logic
 19. app/_layout.tsx — add login screen to navigator
 20. app/(tabs)/home.tsx — replace mock data with API calls
 21. app/listen.tsx — accept/pass userVideoId param
 22. app/dictation.tsx — accept/pass params + recall stats
 23. app/finished.tsx — persist session via API
 24. app/(tabs)/progress.tsx — replace mock data with API calls
 25. app/(tabs)/library.tsx — replace mock data with API calls
 26. src/stores/userStore.ts — remove mock, add loadFromApi
 27. src/stores/sessionStore.ts — add saveSession action
 28. src/types/index.ts — add auth/video/session types

 SQL migration:

 29. Supabase SQL (profiles, user_videos, practice_sessions, user_progress tables + triggers + RLS)

 ---
 Prerequisites (User Action Required)

 User confirmed both Supabase and Cloudflare accounts are ready. During implementation:
 
 1. Provide Supabase credentials — project URL and service role key (for CF Worker secrets) - supplied in the .env file 
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
 2. Provide Supabase JWT secret — found in Supabase Dashboard > Settings > API > JWT Secret
 SUPABASE_URL_JWT
 3. Run the SQL migration — I'll provide the SQL; user runs it in Supabase SQL Editor
 4. Deploy CF Worker — I'll provide the code; user runs wrangler deploy and sets secrets
 CF_WORKER_API_TOKEN
 5. Set app env — EXPO_PUBLIC_API_URL pointing to the deployed CF Worker URL

 Implementation Order

 I'll implement in this order, pausing for your input when credentials are needed:

 1. Write all CF Worker API code (separate repo) + SQL migration
 2. PAUSE — you run the SQL migration and deploy the worker, provide the API URL
 3. Write app auth store + login screen + auth guard
 4. Write app service layer
 5. Wire all screens to real data
 6. Update stores and types