# AI Tutor as an In-Listen Bottom Sheet + YouTube-Quality Answers

**Date:** 2026-05-25
**Status:** Executing — Phase 1 (backend prompt + payload) → Phase 2 (split-screen layout). Drag-handle sheet deferred.
**Related:** `docs/tech/technical-docs.html` §AI Tutor, `docs/tech/implementation-notes.html` Item 2 & Item 6

## Context

The user uploaded YouTube screenshots showing YouTube's "Ask about this video" feature: the video player stays at the top of the screen and keeps playing while a bottom sheet hosts the AI chat. SoundKnot's current `/ai-tutor` screen is registered as `fullScreenModal` in `app/app/_layout.tsx:83`, which replaces the Listen screen — the video unmounts and pauses, losing the in-context feel.

The user also wants the answers themselves to match YouTube quality. The reference screenshots show:

- A "Summarize the video" suggestion that produces a bulleted, themed summary citing multiple timestamps as clickable inline links (e.g. `(0:45)`, `(25:07)`, `(27:08)`).
- A "What is conundrum" vocabulary answer in plain Markdown (definition + bullet aspects).
- Follow-up question chips after each answer.

Today our `buildSystemPrompt` (in both `app/src/services/aiTutor.ts:62` and `api/src/lib/aiSystemPrompt.ts:9`) is single-purpose ("English listening tutor"), only sends a ~30s transcript window, and emits no machine-readable timestamps the UI can link.

**Goal:** keep the video mounted and playing while the AI panel is open, and lift answer quality for video-scope questions (especially "Summarize") to match the YouTube reference. Sources/grounding pills are out of scope for this round.

## Approach

Two coordinated changes, shipped together so the new prompt's `[t=MM:SS]` markers find a UI that can render them.

### Change 1 — Split-screen AI panel inside `listen.tsx` (drag handle deferred)

Move the AI Tutor UI from a separate route into a fixed-height panel rendered inside `listen.tsx` below the video. Listen owns the player and the chat simultaneously; the video never remounts.

- New component `app/src/components/ai/AskAboutVideoPanel.tsx`. Composition rather than verbatim extraction — the panel re-uses the same `chat()` call path and `Audio.Recording` flow as `app/app/ai-tutor.tsx` (which today is 922 lines, much of it screen-chrome we don't need inside a panel). The smaller panel is allowed to share helpers with `ai-tutor.tsx` via a new internal module (e.g. `src/components/ai/useAiTutorChat.ts`) if extraction becomes valuable; otherwise duplicated state is fine for one screen.
- `listen.tsx` keeps a fixed split: video region stays at its current 16:9 height at the top; when `aiOpen` is true, the transcript scroll area shrinks and the AI panel occupies the bottom ~55% of the remaining height. No drag, no gesture handlers, no Reanimated. The user can still see and tap inside the transcript if they want — same layout as today, just with a sibling panel.
- **Open triggers:**
  - Existing **Ask AI Tutor** action button at the bottom of Listen → `setAiOpen(true)`.
  - Existing **long-press → Ask AI Tutor** menu (`menuLineIdx` path in `listen.tsx`) → `setAiOpen(true)` + prefill the panel's `selection` state.
  - Tapping any `[t=MM:SS]` link inside a rendered AI answer → calls `playerRef.current?.seekTo(seconds)` and keeps the panel open.
- The existing `/ai-tutor` route stays registered for backward compatibility but is no longer pushed from Listen. The two existing call sites in `listen.tsx` swap to `setAiOpen(true)`.

**Deferred (not in this commit):** the drag-handle resizable bottom sheet (40/70/95 snaps) using `react-native-gesture-handler` + Reanimated v4. The deps are present but no other screen uses them yet — adding `GestureHandlerRootView` at the app root and verifying worklets in Expo SDK 54 is its own discrete change. Split-screen achieves the user's stated goal ("fill up except video area like YouTube") without that infrastructure.

### Change 2 — YouTube-quality answers (full transcript + intent routing + inline timestamps)

Three coordinated edits — one to the prompt, one to the message payload, one to the renderer.

**Prompt rewrite** in both `api/src/lib/aiSystemPrompt.ts` (canonical) and `app/src/services/aiTutor.ts:62` (direct-mode fallback). The new prompt:

- Names three intents the model should detect from the user message and shape its answer accordingly:
  1. **Summary** (`summarize`, `what is this video about`, `key themes`) → bulleted Markdown by theme, each bullet cites at least one `[t=MM:SS]` from the transcript.
  2. **Vocabulary / phrase** (`what does X mean`, `explain Y`) → 2–4 short paragraphs, definition + example, no timestamps unless the learner asked about a specific occurrence.
  3. **Comprehension** (`why did the speaker say X`, `what's the argument`) → grounded answer with 1–3 timestamp citations.
- Mandates a **citation format the UI can parse**: timestamps anywhere in the body as `[t=MM:SS]` (e.g. `[t=25:07]`). The UI converts these to tap-to-seek links. Stripped if not parseable.
- Keeps the existing language-mirroring rule.
- Adds: when the transcript is supplied with line-level timestamps (see below), the model should only cite timestamps that actually appear in that transcript — no inventing.

**Payload change** in `app/src/services/aiTutor.ts` and the sheet's send path:

- `AiContext` gains a new optional field `fullTranscript?: string` — a single string built from `TranscriptLine[]` as one line per row formatted `MM:SS  text` (using existing `formatTimestamp` from `app/src/services/transcript.ts:271`). Cap at ~30k characters to stay well under Gemini limits; truncate from the middle with a marker if exceeded.
- The send path decides which to attach based on a lightweight intent test on the user's message: if it matches `/summar|key theme|overall|what.*video.*about|main.*point/i`, attach `fullTranscript`. Otherwise attach `transcriptWindow` as today.
- The backend's `buildSystemPrompt` (`api/src/lib/aiSystemPrompt.ts`) is taught to render whichever field is present, with a clear header `Full transcript with timestamps` vs. `Nearby transcript`.

**Renderer** inside the new `AskAboutVideoSheet`:

- A small helper `renderAnswerWithTimestamps(text, onSeek)` walks the assistant message body, splits on the `[t=MM:SS]` regex, and renders the matched tokens as a `<Text style={{ color: colors.accent, textDecorationLine: 'underline' }} onPress={() => onSeek(parsedSeconds)}>` inline span. Non-matching text renders as plain `Text`. Bold (`**…**`) and bullets stay as the simple Markdown rendering the screen already does for AI replies.

**Model choice:** we deliberately do **not** bump the default model. The reference summary quality is achievable from `gemini-2.5-pro` *if* given the full transcript; today we send only ±15s and use `gemini-3.5-flash`, which is why summaries underperform. Once full-transcript + new prompt are live, the user can decide whether to also switch the default model in `app/app/ai-settings.tsx`.

## Files to Modify

| File | Change |
|---|---|
| `app/src/components/ai/AskAboutVideoSheet.tsx` | **New**, ~350 lines, lifts the UI from `app/app/ai-tutor.tsx` |
| `app/app/listen.tsx` | Mount the sheet, wire open triggers, handle `onSeek` from inline-timestamp taps, swap the two `router.push('/ai-tutor', ...)` call sites to `setAiOpen(true)` |
| `app/src/services/aiTutor.ts` | Add `fullTranscript` field to `AiContext`; rewrite `buildSystemPrompt` to match the API one; add the intent test that picks `fullTranscript` vs `transcriptWindow`; add `buildFullTranscript(lines)` helper using `formatTimestamp` |
| `api/src/lib/aiSystemPrompt.ts` | Rewrite `PREAMBLE`, support new `fullTranscript` field on `ChatContext`, render appropriate header |
| `app/app/ai-tutor.tsx` | **Kept** but no longer reached from Listen. Update its `chat()` call path to use the same new prompt/context plumbing so behavior matches the sheet if anyone deep-links to it |
| `app/app/_layout.tsx` | No change (route stays registered for backward compatibility) |

## Reused Existing Functions

- `chat()` from `app/src/services/aiTutor.ts` — the proxy/direct mode router. Unchanged.
- `buildTranscriptWindow(lines, currentSeconds, halfWindow=15)` from `app/src/services/aiTutor.ts` — still used for non-summary intents.
- `formatTimestamp(seconds)` from `app/src/services/transcript.ts:271` — used by new `buildFullTranscript` and by the renderer when parsing `[t=MM:SS]` back to seconds.
- `YoutubePlayerHandle.seekTo()` from `app/src/components/youtube/YoutubePlayerView.*` — invoked when an inline timestamp link is tapped.
- `react-native-gesture-handler` + `react-native-reanimated` (already in `package.json`) — the bottom sheet's drag interaction.
- `Audio.Recording` voice flow currently in `app/app/ai-tutor.tsx` — lifted verbatim into the new sheet.

## Verification

1. **Sheet behavior** — On Listen, tap **Ask AI Tutor**. Expect: video keeps playing, sheet rises from the bottom to ~70% height, drag-handle works (snap to 40% / 70% / 95%), tapping × closes it without unmounting the video.
2. **Long-press path** — Long-press a transcript line → menu → Ask AI Tutor. Expect: sheet opens with the line preloaded as selection text in the input.
3. **Inline-timestamp seek** — Ask "Summarize the video". Expect: response contains bulleted themes with inline `0:45`-style links (rendered orange/underlined). Tapping one seeks the still-playing video to that timestamp.
4. **Summary quality** — Compare a `Summarize the video` answer before/after on a known video. Expect: themed bullets covering the full video, multiple timestamp citations spread across the runtime (not just the first minute).
5. **Vocab path still works** — Ask "what does conundrum mean?" Expect: 2–4 paragraph definition, no timestamps. Confirms intent routing didn't break the existing usage.
6. **Voice still works** — Hold the mic, record a question. Expect: same behavior as today (audio attached, Gemini transcribes + answers in one call).
7. **Backward compatibility** — Manually navigate to `/ai-tutor` (e.g. via dev tools). Expect: screen still loads and works; uses the new prompt and context plumbing.
8. **Type-check** — `cd app && npx tsc --noEmit` clean. Backend: `cd api && npm run check` (or equivalent) clean.

## What this plan does NOT cover

- **Source citations** (Cambridge Dictionary / Vocabulary.com pills). Requires Gemini grounding or a separate web-search tool. Tracked as a follow-up.
- **Streaming token output.** Today's `/ai/chat` is request/response. Streaming would meaningfully improve the perceived latency of a long summary but doubles the backend work.
- **Persistent per-video chat history.** Each open of the sheet starts fresh. YouTube does the same.
