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

Proxy mode is the production path. Without it, every user has to bring their own API key.

---

## 2. What you need to build

A single endpoint:

```
POST /ai/chat
```

It accepts the user's chat history plus video context, forwards the conversation to the configured AI provider (Google Gemini), and returns the assistant's reply.

No streaming, no session storage, no chat history persistence — the client owns conversation state.

---

## 3. Auth

Same pattern as every other authenticated endpoint:

```
Authorization: Bearer <access_token>
```

Use the same middleware that protects `/videos`, `/sessions`, `/home`. Reject with `401` if the token is missing/invalid.

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
  "model": "gemini-3.5-flash",
  "messages": [
    { "role": "user", "content": "What does 'in the saddle' mean here?" },
    { "role": "assistant", "content": "..." },
    {
      "role": "user",
      "content": "🎙️ Voice question — please transcribe and answer.",
      "audio": { "base64": "AAAA...==", "mimeType": "audio/mp4" }
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
| `provider` | `"gemini"` | yes | Only one value today. Plan for `"openai"` / `"anthropic"` later. |
| `model` | string | yes | One of `gemini-3.5-flash`, `gemini-2.5-pro`, `gemini-3.1-pro`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite`. |
| `messages` | array | yes | Full conversation history, oldest first. |
| `messages[].role` | `"user"` \| `"assistant"` | yes | |
| `messages[].content` | string | yes | May be empty if `audio` is present. |
| `messages[].audio` | object | no | `base64` is raw audio (no `data:` prefix). `mimeType` ∈ `audio/mp4`, `audio/m4a`, `audio/aac`, `audio/wav`, `audio/webm`, `audio/ogg`. |
| `context.videoTitle` | string | no | May be empty. |
| `context.videoChannel` | string | no | May be empty. |
| `context.videoId` | string | no | YouTube ID (11 chars). |
| `context.transcriptWindow` | string | no | ~30 seconds of transcript around current playback time. |
| `context.selection` | string | no | Set when the user long-pressed a transcript line. |

Any context field is optional. Tolerate empty string and `null`.

---

## 5. Response shape

### Success — 200

```json
{ "reply": "In this context, 'in the saddle' means..." }
```

The client renders `reply` as plain text. Markdown OK — keep it light.

### Failure — non-2xx

```json
{ "error": "Human-readable message" }
```

The client surfaces `error` directly to the user. Map upstream errors:
- `400` — bad input from client
- `401` — auth failed (middleware)
- `429` — rate limited
- `502` — upstream provider failed / malformed response
- `500` — anything else

---

## 6. Gemini integration

### Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}
```

### Request body to Gemini

```json
{
  "systemInstruction": { "parts": [{ "text": "<system prompt — see §7>" }] },
  "contents": [
    { "role": "user",  "parts": [{ "text": "What does 'in the saddle' mean?" }] },
    { "role": "model", "parts": [{ "text": "..." }] },
    {
      "role": "user",
      "parts": [
        { "inlineData": { "mimeType": "audio/mp4", "data": "AAAA...==" } },
        { "text": "🎙️ Voice question — please transcribe and answer." }
      ]
    }
  ],
  "generationConfig": { "temperature": 0.4, "maxOutputTokens": 800 }
}
```

### Mapping rules

- App `role: "assistant"` → Gemini `role: "model"`. App `role: "user"` → Gemini `role: "user"`.
- If a message has `audio`, prepend an `inlineData` part **before** the `text` part. Gemini transcribes and answers in one round-trip.
- Drop empty `text` parts.

### Response parsing

Concatenate all `candidates[0].content.parts[*].text`. If empty, return `502`.

### Audio size cap

Reject any single message with `audio.base64` larger than **2 MB** with `413` (≈ 90 seconds of HIGH_QUALITY audio).

---

## 7. System prompt

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

Skip lines whose context value is empty/null. The client constructs the same prompt for `direct` mode — keep wording identical so responses are consistent.

---

## 8. Configuration

```
GEMINI_API_KEY=AIza...
AI_RATE_LIMIT_PER_USER_PER_MINUTE=20   # recommended
AI_MAX_AUDIO_BYTES=2097152             # 2 MB
```

Get a key at <https://aistudio.google.com>. Per-user rate limiting is important — a stuck UI loop could fire repeatedly.

---

## 9. Logging

Per request, log:
- `user_id`, `provider`, `model`, `messages.length`, `audio_count`, `latency_ms`, `upstream_status`, `outcome`

**Do not log** `messages[].content`, `messages[].audio.base64`, or `context.transcriptWindow` — they contain learner-typed content.

---

## 10. Testing

### Smoke test

```bash
curl -X POST https://api.soundknot.app/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "model": "gemini-3.5-flash",
    "messages": [{ "role": "user", "content": "Say ok if you can read this." }]
  }'
```

### From the app

Open AI Settings → **Test connection**. Sends a single message and surfaces success/failure inline.

### Failure cases worth covering

- Missing `GEMINI_API_KEY` → `500`
- Gemini 4xx (bad model, expired key) → `502` with upstream message
- Gemini 429 → `429`
- Audio over 2 MB → `413`
- `messages` empty/missing → `400`

---

## 11. Open questions

1. **Strict `provider` validation?** Client only sends `"gemini"` today.
2. **Multi-provider URL strategy.** One endpoint with `provider` switch, or `/ai/chat/{provider}`? Client doesn't care.
3. **Conversation persistence.** Currently nothing saved. Add an `ai_chats` table if you want analytics — out of scope for this delivery.

---

## 12. Client reference

| File | Purpose |
|------|---------|
| `src/services/aiTutor.ts` | `chat()`, mode router, prompt builder, audio shape |
| `src/stores/aiSettingsStore.ts` | Persisted user settings (mode, model, key) |
| `app/ai-tutor.tsx` | Chat UI, voice recording |
| `app/ai-settings.tsx` | Settings UI + Test connection |
| `specs/implementation-notes.html` | Full client-side decisions log |

The proxy call lives in `callProxy()` inside `src/services/aiTutor.ts` — that's the exact request shape this endpoint must accept.

---

## 13. Definition of done

- [ ] `POST /ai/chat` deployed behind existing auth middleware
- [ ] `GEMINI_API_KEY` set in production env
- [ ] Per-user rate limit in place
- [ ] Audio size cap enforced
- [ ] Logging without leaking content
- [ ] Smoke test from a real authenticated session returns a sensible reply
- [ ] Voice test from the app returns a transcription-aware reply
