# SoundKnot API — `/ai/chat` Endpoint Handoff

**For:** SoundKnot backend repo
**From:** Mobile/Web app (`SoundKnotApp`)
**Created:** 2026-05-20
**Status:** Client side shipped; server side not yet implemented

---

## 1. Why this exists

The SoundKnot app now has an **AI Tutor** feature. While practicing with a YouTube video, learners can ask questions like "what does this slang mean?" or "explain this sentence" — by typing or by voice.

The client supports two runtime modes:

| Mode | Where the API key lives | Used when |
|------|--------------------------|-----------|
| **`proxy`** (default) | On the SoundKnot API server | This is what we're asking you to build |
| **`direct`** | Pasted into the app by the user (AsyncStorage) | Escape hatch / testing — already implemented client-side |

Proxy mode is the production path. Without it, every user has to bring their own API key, which we don't want.

---

## 2. What you need to build

A single endpoint:

```
POST /ai/chat
```

It accepts the user's chat history plus video context, forwards the conversation to the configured AI provider (Google Gemini), and returns the assistant's reply.

That's it. No streaming, no session storage, no chat history persistence — the client owns conversation state.

---

## 3. Auth

Same pattern as every other authenticated endpoint:

```
Authorization: Bearer <access_token>
```

The token comes from the existing `/auth/login` flow (Supabase). Use the same middleware that protects `/videos`, `/sessions`, `/home`. No new auth mechanism required.

Reject with `401` if the token is missing/invalid.

---

## 4. Request shape

```http
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "messages": [
    {
      "role": "user",
      "content": "What does 'in the saddle' mean here?"
    },
    {
      "role": "assistant",
      "content": "..."
    },
    {
      "role": "user",
      "content": "🎙️ Voice question — please transcribe and answer.",
      "audio": {
        "base64": "AAAA...==",
        "mimeType": "audio/mp4"
      }
    }
  ],
  "context": {
    "videoTitle": "Lex Fridman: Andrej Karpathy on AGI",
    "videoChannel": "Lex Fridman Podcast",
    "videoId": "dQw4w9WgcQ",
    "transcriptWindow": "...about 30 seconds of nearby transcript text...",
    "selection": "in the saddle"
  }
}
```

### Field reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `provider` | `"gemini"` | yes | Only one value today. Plan for `"openai"` / `"anthropic"` later — keep this field even though it's a single enum now. |
| `model` | string | yes | Whatever the user picked in app Settings. Currently one of `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-1.5-flash`. Don't hardcode an allowlist on the server unless you want to be the gatekeeper — the client already restricts it. |
| `messages` | array | yes | Full conversation history, oldest first. Includes both user and assistant turns. |
| `messages[].role` | `"user"` \| `"assistant"` | yes | |
| `messages[].content` | string | yes | May be empty string if `audio` is present (but the client always sends a placeholder). |
| `messages[].audio` | object | no | Present only on voice messages. `base64` is the raw audio (no `data:` prefix). `mimeType` will be one of `audio/mp4`, `audio/m4a`, `audio/aac`, `audio/wav`, `audio/webm`, `audio/ogg`. |
| `context.videoTitle` | string | no | YouTube video title — may be empty. |
| `context.videoChannel` | string | no | May be empty. |
| `context.videoId` | string | no | YouTube ID (11 chars). |
| `context.transcriptWindow` | string | no | ~30 seconds of transcript around current playback time. Pre-built by the client; just embed it verbatim in the system prompt. |
| `context.selection` | string | no | Set when the user long-pressed a transcript line. The user's question typically references this. |

Treat any context field as optional. Empty string and `null` should both be tolerated.

---

## 5. Response shape

### Success — 200

```json
{ "reply": "In this context, 'in the saddle' means..." }
```

The client renders `reply` as plain text. Markdown is OK — keep it light (bold/italic/lists fine, no tables or code blocks expected for this use case).

### Failure — non-2xx

```json
{ "error": "Human-readable message" }
```

The client surfaces `error` directly to the user, so write messages someone learning English would understand.

Map upstream Gemini errors to:
- `400` — bad input from client
- `401` — auth failed (handled by middleware)
- `429` — rate limited (either us upstream or your own quota)
- `502` — upstream provider failed / returned malformed response
- `500` — anything else

---

## 6. Provider integration — Gemini

Use Google's REST API. SDK optional.

### Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}
```

`{model}` is the user-selected one, URL-encoded.

### Request body (what you send to Gemini)

```json
{
  "systemInstruction": {
    "parts": [{ "text": "<system prompt — see §7>" }]
  },
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "What does 'in the saddle' mean here?" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "..." }]
    },
    {
      "role": "user",
      "parts": [
        { "inlineData": { "mimeType": "audio/mp4", "data": "AAAA...==" } },
        { "text": "🎙️ Voice question — please transcribe and answer." }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.4,
    "maxOutputTokens": 800
  }
}
```

### Mapping rules

- App `role: "assistant"` → Gemini `role: "model"`. App `role: "user"` → Gemini `role: "user"`.
- If a message has `audio`, prepend an `inlineData` part **before** the `text` part. Gemini accepts audio + text in the same turn and will transcribe and answer in a single round-trip.
- Drop empty `text` parts (don't send `{ "text": "" }`).

### Response parsing

```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "In this context..." }]
      }
    }
  ]
}
```

Concatenate all `candidates[0].content.parts[*].text`. If empty, return a `502` to the client.

### Audio size cap

The client uses `expo-av`'s `HIGH_QUALITY` preset. A 30-second clip is roughly 250-400 KB base64-encoded. Reject any single message with `audio.base64` larger than **2 MB** with a `413` — that's roughly 90 seconds, more than enough for a question.

---

## 7. System prompt

Build it server-side from the `context` block. Use this as the starting template:

```
You are an English listening tutor inside the Sound Knot app.
The learner is practicing with a YouTube video and may ask you to explain words, phrases, idioms, slang, grammar, or pronunciation.
Keep answers concise (2-4 short paragraphs at most), warm, and concrete. Use plain Markdown only when it helps comprehension.
Always answer in the language the learner uses. If they write in English, answer in English; if they write in another language, mirror them.

Video: "{videoTitle}" — {videoChannel}.

Nearby transcript:
"""
{transcriptWindow}
"""

The learner has selected: "{selection}".
```

Skip lines whose context value is empty/null. The client constructs the same prompt for `direct` mode — keeping the wording identical between modes makes responses consistent.

---

## 8. Configuration

Add an env var:

```
GEMINI_API_KEY=AIza...
```

Get a key at <https://aistudio.google.com>. The free tier is sufficient for testing. For production, set up a billed key with appropriate per-minute and per-day quotas.

Optional but recommended:

```
AI_RATE_LIMIT_PER_USER_PER_MINUTE=20
AI_MAX_AUDIO_BYTES=2097152
```

Per-user rate limiting is important — the AI Tutor is in the user's hand and a stuck UI loop could fire the endpoint repeatedly.

---

## 9. Logging & observability

Log per request (no PII beyond what's already in your stack):

- `user_id` (from token)
- `provider`, `model`
- `messages.length`
- `audio_count` (how many messages had audio)
- `latency_ms`
- `upstream_status` (Gemini's HTTP status)
- `outcome` (`ok` / `error`)

**Do not log** `messages[].content`, `messages[].audio.base64`, or `context.transcriptWindow`. They contain learner-typed content.

---

## 10. Testing

### Manual smoke test

```bash
curl -X POST https://api.soundknot.app/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "model": "gemini-2.0-flash",
    "messages": [{ "role": "user", "content": "Say ok if you can read this." }]
  }'
```

Expect `{ "reply": "ok" }` or similar.

### Voice test

The app has a built-in test path: open AI Settings, hit **Test connection**. That sends a single text message and surfaces success/failure inline.

For voice, record a short clip in the AI Tutor screen and send it. The reply should be a transcription-aware answer, not "I can't access audio."

### Failure cases worth covering

- Missing `GEMINI_API_KEY` → `500` with a clear server-side log, generic message to client.
- Gemini returns 4xx (bad model name, expired key) → `502` to client with the upstream message.
- Gemini returns 429 → `429` to client.
- Audio over 2 MB → `413`.
- `messages` empty or missing → `400`.

---

## 11. Open questions for the API team

1. **Should `provider` validation be strict?** The client only sends `"gemini"` today. If you want to gatekeep, return `400` for unknown values; otherwise pass-through and add provider adapters later.
2. **Multi-provider strategy.** When we add OpenAI/Anthropic, do you want one endpoint with a `provider` switch (current shape), or `/ai/chat/{provider}`? The client doesn't care.
3. **Conversation persistence.** Currently nothing is saved. If you want to log conversations for product analytics, the cleanest hook is a write to a new `ai_chats` table on each call. Out of scope for this delivery — just flagging.

---

## 12. Reference — files on the client

If you need to read the client side:

| File | What it does |
|------|--------------|
| `src/services/aiTutor.ts` | `chat()` entry point, mode router, prompt builder, audio attachment shape |
| `src/stores/aiSettingsStore.ts` | Persisted user settings (mode, model, key) |
| `app/ai-tutor.tsx` | Chat UI, voice recording, sends to `chat()` |
| `app/ai-settings.tsx` | Settings UI + Test connection button |
| `specs/implementation-notes.html` | Full client-side decisions log |

The proxy call lives in `callProxy()` inside `src/services/aiTutor.ts` — that's the exact request shape this endpoint needs to accept.

---

## 13. Definition of done

- [ ] `POST /ai/chat` deployed behind the existing auth middleware
- [ ] `GEMINI_API_KEY` set in production env
- [ ] Per-user rate limit in place
- [ ] Audio size cap enforced
- [ ] Logging without leaking content
- [ ] Smoke test from a real authenticated app session returns a sensible reply
- [ ] Voice test from the app returns a transcription-aware reply
