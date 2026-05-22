# SoundKnot

> *"Work hard now, listen smart later."*

An English listening practice app that turns authentic YouTube content (podcasts, lectures, conversations) into deliberate practice sessions through active recall, dictation, and an AI tutor.

Runs on **iOS, Android, and Web** from a single Expo Router codebase.

---

## Architecture

```
[Expo App (React Native)]
        │
        │ HTTPS + Bearer JWT
        ▼
[Cloudflare Worker (Hono)]
        │
        │ supabase-js (service_role)
        ▼
[Supabase Auth + PostgreSQL]
```

- The app never talks to Supabase directly — the Cloudflare Worker is the sole API proxy
- Supabase Auth handles email/password authentication
- JWTs are persisted to AsyncStorage and validated server-side via `supabase.auth.getUser(token)`
- Google Gemini is the AI provider for transcript splitting and the conversational tutor; the Worker is the single egress to Gemini in production

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| SoundKnotApp | `app/` (this repo) | Expo React Native app |
| SoundKnotAPI | `api/` (this repo) | Cloudflare Worker API |

## Tech Stack

**App** — Expo SDK 54 · React Native 0.81 · TypeScript 5.9 · Expo Router 6 · Zustand 5 · react-native-youtube-iframe · react-native-svg · Inter + JetBrains Mono

**API** — Cloudflare Workers · Hono 4 · @supabase/supabase-js 2 · Wrangler 4

**Data** — Supabase (PostgreSQL + Auth, RLS enabled)

**AI** — Google Gemini (`gemini-1.5-flash` for transcript splitting; configurable model for tutor chat)

## Core Flow

```
Home  →  paste YouTube URL  →  preprocessing pipeline  →  Listen  →  Dictation  →  Finished
              │                  (5 steps, AI-driven)        │           │
              │                                              │           │
              └──→ POST /videos                              │           └──→ POST /sessions
                                                             │                (updates streak + minutes)
                                                             └──→ /ai-tutor (text + voice questions)
```

### Preprocessing pipeline (Home → Listen)

1. **provider** — extract YouTube ID
2. **duration** — oEmbed check + ≤ 30 min cap
3. **transcript** — fetch raw fragments via YouTube InnerTube
4. **language** — ASCII / common-word heuristic (English only)
5. **ai** — `POST /ai/split-transcript` → Gemini returns sentence-aligned 30–40-word segments; both AI and fallback paths are post-processed into strict 1/2/3 full-sentence practice chunks

### Practice loop

- **Listen** — YouTube player + auto-scrolling transcript; tap a line to seek, long-press to bookmark or ask the AI tutor
- **Dictation** — type or voice recalls, then word-level diff against the target text
- **Finished** — saves a `practice_session` row and updates `user_progress` (streak, minutes, total sessions) in the user's timezone

## AI Integration

Two surfaces share one provider, one proxy, one rate limiter:

| Surface | Endpoint | Purpose |
|---------|----------|---------|
| Transcript splitting | `POST /ai/split-transcript` | Chunks raw captions into practice-ready 1/2/3 full-sentence segments |
| Conversational tutor | `POST /ai/chat` | Explains words, idioms, grammar; accepts text and voice (audio sent as `inlineData`, transcribed by Gemini in one round trip) |

- **Proxy mode (default)** — Worker holds the Gemini key; auth-gated, rate-limited (20/min per user), audio capped at 2 MB
- **Direct mode (dev)** — On-device API key bypasses the Worker
- **Logging** — structured JSON per request (`user_id`, `latency_ms`, `outcome`, `upstream_status`); never logs message content, audio, or transcript

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` · `/auth/login` | No | Sign up / sign in |
| GET | `/auth/me` | Yes | Profile + progress |
| POST | `/auth/logout` | Yes | Logout |
| GET · POST | `/videos` | Yes | List / add YouTube videos (POST auto-fetches title via oEmbed) |
| DELETE | `/videos/:id` | Yes | Remove from library |
| GET | `/videos/:id/sessions` | Yes | Per-video practice history |
| POST | `/sessions` | Yes | Save a practice session + update streak |
| GET | `/home` | Yes | Aggregated home payload (progress + today + recent) |
| POST | `/ai/chat` · `/ai/split-transcript` | Yes | AI tutor + transcript splitter |

## Database

Four tables, all RLS-enabled, scoped by `auth.uid()`:

- `profiles` — extends `auth.users`, auto-created via trigger
- `user_videos` — saved YouTube videos (unique on `user_id + youtube_video_id`)
- `practice_sessions` — per-session records (mastery, accuracy, listened seconds)
- `user_progress` — aggregated streak / total minutes / total sessions, auto-created via trigger

Migration: `api/specs/migration.sql`

## Design System

Warm paper light mode with a single orange accent:

- **Background** — `#F4F3EF` (paper) · `#ECEAE2` (paper2)
- **Text** — `#2A2522` (ink) → `#9E9990` (ink4)
- **Accent** — `#E8913A` (warm orange)
- **Fonts** — Inter (body/UI) · JetBrains Mono (timestamps, chips, labels) · Instrument Serif (hero)
- **Locked to light mode** at three levels: theme hooks, `app.json`, and `<StatusBar>`

## Getting Started

### App

```bash
cd app
npm install
# Set EXPO_PUBLIC_API_URL in .env
npx expo start              # then choose i / a / w
```

### API

```bash
cd api
npm install
wrangler login
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

### Database

Run `api/specs/migration.sql` in Supabase Dashboard → SQL Editor.

## Documentation

Full technical reference (backend, frontend, AI integration with sequence diagrams, deployment) lives in [`docs/tech/technical-docs.html`](docs/tech/technical-docs.html).
