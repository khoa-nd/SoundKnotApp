# Model Playground — Design

**Status:** Approved (awaiting spec review)
**Date:** 2026-05-26
**Owner:** khoa-nd
**Scope:** A new web-only route inside the existing Expo app that lets the developer pick a provider, paste a key, fan out the same prompt to multiple models in parallel, and compare replies with latency / token / cost telemetry. Includes prompt + sampling-parameter editing.

## 1. Goals and non-goals

### Goals
- Compare model output for the same prompt, side-by-side, across 2–10 models per run.
- Iterate on system + user prompts, with `temperature`, `max_tokens`, and `top_p` knobs.
- Produce telemetry (latency, prompt/completion tokens, estimated cost, error state) shaped like what the 2026-05-25 benchmark plan will consume — so the playground feeds the benchmark, not duplicates it.
- Reuse the production AI client (`aiTutor.ts`) verbatim so the playground exercises the same code path real users hit.

### Non-goals
- Not a benchmark runner. The pinned-corpus + scored-metrics work in `todo.md` (2026-05-25) is a separate project that will use a `tsx` script (`app/test/scripts/ai-bench.ts`), not this UI.
- Not a fine-tuning UI in the literal sense (no training-data uploads or custom checkpoints).
- Not a streaming chat. Each call returns the full reply when done.
- Not mobile. The route returns a "Web only" placeholder on native.
- Not a separate package. The playground lives inside the existing `app/` workspace.

## 2. Decisions log (the locked Q&A)

| # | Question | Decision |
|---|---|---|
| Q1 | Where does it live? | **B** — web-only Expo Router route (`/playground`) inside the existing app |
| Q2 | Provider scope | **A** — Gemini + OpenRouter only, reusing `aiTutor.ts` |
| Q3 | What does "every possible" mean? | **B** — user picks 2–10 models, fan out in parallel |
| Q4 | What does "fine-tune prompts" mean? | **B** — prompt editing **plus** `temperature` / `max_tokens` / `top_p` |
| Q5 | What to show per model | **B** — reply + latency + tokens + estimated cost + error state |
| Q6 | Key handling | **C** — keys reused from `aiSettingsStore`; everything else in a new `playgroundStore` |
| Q7 | Auth | **A** — authenticated users only, same gate as `(tabs)` |
| Q8 | Run mode | **C** — per-run Direct/Proxy toggle, default Direct, prompt editor disabled in Proxy mode |
| Q9 | Model picker UX | **A** — single searchable list with filters (`Free tier only`, `≤ $1/M tokens`, text search) and selected-count badge |

## 3. Architecture

A new Expo Router route at `app/playground.tsx`, registered in `app/_layout.tsx` and gated three ways:

1. `Platform.OS === 'web'` — on iOS/Android the route renders a small "Web only" placeholder. No tab-bar entry, no deep-link affordance on native.
2. `useAuthStore.isAuthenticated` — same redirect-to-`/login` pattern used by `(tabs)`. Boot-time auth restoration in `app/_layout.tsx` already runs before any child mount, so the bearer token is attached before the playground tries to call the proxy.
3. Hidden from the tab bar. Reachable by typing `/playground` in the URL or via a small developer link added to the bottom of the Profile tab (gated on `Platform.OS === 'web'`).

The route reuses three pieces of the app verbatim:

- `app/src/services/aiTutor.ts` — `chat()` for both Direct and Proxy modes, `fetchOpenRouterModels()` for the live OpenRouter catalog.
- `app/src/stores/aiSettingsStore.ts` — for per-provider API keys only. The playground never overwrites `mode`, `provider`, or `model` on this store.
- Design tokens — `Typography`, `Spacing`, `Radius`, `useTheme()`.

Adds one new store and one new service module:

- `app/src/stores/playgroundStore.ts` — Zustand + AsyncStorage under `soundknot_playground`. Holds: per-provider selected-model lists, current prompt draft, slider values, named presets, last-run snapshot.
- `app/src/services/playgroundRun.ts` — orchestrates a fanout, captures per-call latency, normalizes usage payloads, computes cost.

No backend changes. Proxy-mode runs hit the existing `POST /ai/chat`. Direct-mode runs go straight to the provider.

```
/playground
  ├─ web only (else: placeholder)
  ├─ auth required (else: redirect to /login)
  │
  ├─ aiSettingsStore  (read keys)
  ├─ playgroundStore  (selected models, prompt draft, sliders, presets, lastRun)
  │
  └─ on Run:
       playgroundRun.start({ provider, mode, models, systemPrompt, userPrompt, params })
         └─ for each model in parallel:
              aiTutor.chat({ ... systemPromptOverride, params })
              → { reply, usage } | error
```

## 4. Components

| Component | File | Purpose |
|---|---|---|
| `PlaygroundScreen` | `app/playground.tsx` | Top-level layout, auth/web gates, wires the rest together |
| `ModelPicker` | `app/playground/ModelPicker.tsx` | Searchable list with three filters (free-text search over `id`/`name`, `Free tier only` toggle keyed on OpenRouter's `:free` suffix, `≤ $1/M tokens` toggle keyed on `pricing.prompt`); selected-count badge "N/10"; loads OpenRouter catalog on demand |
| `PromptEditor` | `app/playground/PromptEditor.tsx` | System + user prompt textareas, three sliders, preset save/load. Disabled state in Proxy mode |
| `RunBar` | `app/playground/RunBar.tsx` | Provider toggle, Mode toggle, Run button, total-cost-estimate readout |
| `ResultGrid` | `app/playground/ResultGrid.tsx` | One `ResultCard` per selected model |

Helper modules:

- `app/src/services/playgroundRun.ts` — fanout, latency capture, usage normalization, cost estimation.
- `app/src/services/aiTutor.ts` — extended (additive) with an optional `systemPromptOverride` parameter on `chat()`, and an optional `usage` field on the return shape. A new `fetchGeminiModels()` function so the Gemini list isn't hardcoded forever.

The split between `playgroundRun.ts` and `playground.tsx` is deliberate: the parallel-fanout + telemetry-normalization logic is the only genuinely new code. Keeping it out of the screen file makes it unit-testable without dragging in the UI tree.

### Component-level invariants

- `ModelPicker` enforces the 2–10 selection range. Run is disabled when `selected.length === 0`.
- `PromptEditor` reads `mode` from `RunBar` state and renders disabled inputs when `mode === 'proxy'`. The disabled state shows a one-line note: *"System prompt is set by the server in Proxy mode."*
- `RunBar` disables Run when (a) no models selected, (b) Direct mode and no key for the chosen provider, or (c) a run is already in flight.
- `ResultGrid` renders cards in the order models were selected (stable), even though replies arrive out of order.

## 5. Data model

### `playgroundStore` shape

```ts
interface PlaygroundState {
  // Selection (per-provider so switching provider doesn't lose your other set)
  selectedModels: Record<AiProvider, string[]>;

  // Prompt draft + sampling
  systemPrompt: string;
  userPrompt: string;
  params: {
    temperature: number;     // 0.0 – 2.0
    maxTokens: number;       // 16 – 4096
    topP: number;            // 0.0 – 1.0
  };

  // Saved presets — name → { systemPrompt, userPrompt, params }
  presets: Record<string, PromptPreset>;

  // Run UI state
  mode: 'direct' | 'proxy';
  provider: AiProvider;
  cachedOpenRouterModels: OpenRouterModel[] | null;
  lastRun: RunSnapshot | null;
  hydrated: boolean;
}
```

Persisted to AsyncStorage under `soundknot_playground`. `cachedOpenRouterModels` is persisted (so reopening the page doesn't always re-fetch) but invalidated by an explicit "Refresh catalog" button in `ModelPicker`. `lastRun` is persisted so a page reload restores the most recent comparison.

### `RunSnapshot` shape

```ts
interface RunSnapshot {
  startedAt: number;            // unix ms
  finishedAt: number | null;    // null while in flight
  provider: AiProvider;
  mode: 'direct' | 'proxy';
  systemPrompt: string;         // captured from the editor; recorded for display even in Proxy mode (where it isn't sent), so a re-run after a mode switch is reproducible
  userPrompt: string;
  params: { temperature; maxTokens; topP };
  results: Record<string, ResultCardState>;  // keyed by model id
}

interface ResultCardState {
  status: 'pending' | 'done' | 'error';
  reply: string | null;
  error: string | null;
  latencyMs: number | null;
  usage: { promptTokens: number; completionTokens: number } | null;
  cost: number | null;          // USD; null when rate is unknown (e.g. free OpenRouter models)
}
```

### Cost-rate map (Gemini)

Hard-coded in `playgroundRun.ts` until Gemini's API exposes pricing programmatically:

```ts
const GEMINI_RATES: Record<string, { promptPerM: number; completionPerM: number }> = {
  'gemini-2.5-pro':           { promptPerM: 1.25, completionPerM: 10.00 },
  'gemini-3.5-flash':         { promptPerM: 0.30, completionPerM: 2.50 },
  'gemini-3.1-pro':           { promptPerM: 1.25, completionPerM: 10.00 },
  'gemini-3-flash-preview':   { promptPerM: 0.30, completionPerM: 2.50 },
  'gemini-3.1-flash-lite':    { promptPerM: 0.10, completionPerM: 0.40 },
};
```

Rates are reference values only and shown with a `~` prefix in the UI to make it clear they're estimates. Models not in the map → `cost: null` and the card shows `—`.

### OpenRouter cost

Pulled from each model's `pricing.prompt` and `pricing.completion` fields in the catalog response. Already strings (USD per token); convert to per-million for display, multiply by usage. When `pricing` is missing → `cost: null`.

## 6. Data flow — one full run

```
User opens /playground
  ├─ playgroundStore.load()
  ├─ aiSettingsStore.load() if not yet hydrated
  └─ if provider === 'openrouter' && key present && cached catalog is null
       → fetchOpenRouterModels(key)  → write to playgroundStore.cachedOpenRouterModels

User edits provider / mode / models / prompts / sliders
  └─ each change → playgroundStore setter → AsyncStorage

User clicks Run
  └─ playgroundRun.start({ provider, mode, models, systemPrompt, userPrompt, params })
        ├─ snapshot = { startedAt: now, results: {model: {status:'pending', ...}} }
        ├─ playgroundStore.setLastRun(snapshot)
        │
        └─ for each model in parallel:
             t0 = performance.now()
             try:
               raw = await chat({
                 settings: { mode, provider, model, apiKey: aiSettingsStore.keyFor(provider) },
                 messages: [{ role:'user', content: userPrompt }],
                 context: undefined,
                 systemPromptOverride: mode === 'direct' ? systemPrompt : undefined,
                 params,
               })
               latency = performance.now() - t0
               usage = normalizeUsage(provider, raw.usage)
               cost  = estimateCost(provider, model, usage)
               update snapshot.results[model] = { status:'done', reply: raw.reply, latencyMs: latency, usage, cost, error: null }
             catch err:
               update snapshot.results[model] = { status:'error', error: err.message, latencyMs: performance.now() - t0, ... }
             playgroundStore.setLastRun(snapshot)   ← incremental updates, UI re-renders per model
        │
        └─ when all settle: snapshot.finishedAt = now → final write
```

### Why `systemPromptOverride` is the only edit to `aiTutor.ts`

The Direct paths (`callGeminiDirect`, `callOpenRouterDirect`) currently build their system prompt by calling the file-local `buildSystemPrompt(context)`. To let the playground actually fine-tune prompts, we need a caller-supplied prompt to win over the default. The change is additive:

```ts
// before
async function callGeminiDirect(req: AiChatRequest): Promise<AiChatResponse> {
  const systemPrompt = buildSystemPrompt(req.context);
  ...
}

// after
async function callGeminiDirect(req: AiChatRequest): Promise<AiChatResponse> {
  const systemPrompt = req.systemPromptOverride ?? buildSystemPrompt(req.context);
  ...
}
```

Same change in `callOpenRouterDirect`. The Tutor doesn't pass `systemPromptOverride`, so its behavior is unchanged. Proxy mode ignores the override — the server builds its own prompt — and the UI greys out the editor to make this honest.

We also extend `AiChatResponse` with an optional `usage` field:

```ts
export interface AiChatResponse {
  reply: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}
```

`callGeminiDirect` reads `data.usageMetadata?.promptTokenCount` / `candidatesTokenCount`. `callOpenRouterDirect` reads `data.usage?.prompt_tokens` / `completion_tokens`. `callProxy` returns `undefined` (the proxy doesn't surface usage today; could be added later).

### Sampling parameters wiring

`params` flows through the same path:

- Gemini direct → `generationConfig: { temperature, maxOutputTokens, topP }`
- OpenRouter direct → `temperature, max_tokens, top_p` at top level
- Proxy → ignored. Document this in the UI: *"Sampling parameters apply only in Direct mode. The server uses fixed values in Proxy mode."*

## 7. Error handling

Three layers; each catches what it owns and nothing more.

### Per-model (inside `playgroundRun`)
Every model call is independently `try/catch`ed. One model's failure never aborts the run; it lands in that card as `status: 'error'`. This is the load-bearing invariant for the fan-out — a single 402 from OpenRouter must not kill the other 9 in-flight calls.

| Error | Source | Card behavior |
|---|---|---|
| `Missing API key. Open AI settings to add one.` | `chat()` Direct | Show message + "Open settings" link to `/ai-settings` |
| `OpenRouter error: 402` (no credit) | OpenRouter HTTP | Raw provider message |
| `OpenRouter error: 429` | OpenRouter HTTP | Raw provider message; run continues for other models |
| `Gemini error: 429` (per-day cap) | Gemini HTTP | Raw provider message |
| `Gemini returned an empty response.` | `chat()` Direct | As-is |
| `OpenRouter returned an empty response.` | `chat()` Direct | As-is |
| `gemini is only available in Direct mode...` | `callProxy` guard | Defense-in-depth; UI prevents this combo |
| Proxy 401 (token expired) | `apiClient` | Card shows error; surface a single banner *"Session expired — sign in again"* with a `/login` link. Don't auto-redirect mid-run |
| `TypeError: fetch failed` / network | Browser | Card shows *"Network error — check your connection"* |

### Run-level (outside the fanout)
Two pre-flight checks:

1. **No models selected** → Run button is disabled in that state. Cannot fail at runtime.
2. **Direct mode and no key for the chosen provider** → Synchronous check before fanout starts. Inline message above the result grid: *"Add an [OpenRouter|Gemini] key in AI settings to run."* Fanout doesn't start, so we don't generate N identical "Missing API key" cards.

### Catalog fetch (OpenRouter `/api/v1/models`)
Runs once on first picker open with a key. On failure, the picker shows an empty state with a "Retry" button and the underlying error. The user can also type a model id manually as a fallback (OpenRouter returns 400 on unknown ids — a clean error path).

### What we explicitly don't do

- **No retry-on-failure.** A failed call stays failed; the user re-runs.
- **No timeout on individual calls.** Some models genuinely take 30+ seconds. A hung call leaves the card in `pending`; the user can hit Run again to start a fresh fanout.

## 8. Testing

### Unit tests
One new `tsx` runner: `app/test/scripts/playground-run-review.ts`. Pattern matches the existing `transcript-split-review.ts`. Run via `npm run test:playground -w app`. Pure logic, no network.

Coverage:
- Fanout returns one result per model in any order; all complete.
- A throwing model produces `status: 'error'` and doesn't abort others.
- Latency is measured per call (stub a `setTimeout` delay; assert recorded ms in range).
- `normalizeUsage()` produces the same `{promptTokens, completionTokens}` from a Gemini `usageMetadata` payload and an OpenRouter `usage` payload.
- `estimateCost()` returns `null` when no rate is known, and a finite number when rates are present.

### Manual web verification
Per project verification discipline, walk the feature in a browser before declaring done:

1. `/playground` redirects to `/login` when signed out.
2. iOS simulator shows the "Web only" placeholder.
3. After signing in: switch to OpenRouter, paste a key, model picker loads ~500 models. `Free tier only` filter narrows correctly.
4. Tick 3 free models, type a system + user prompt, Run — three cards populate, each with reply + latency + tokens (cost may be `null` for free models, which is correct).
5. Switch to Direct/Gemini, tick `gemini-2.5-pro` and `gemini-3.5-flash`, run — both cards populate.
6. Switch to Proxy/Gemini — prompt editor greys out; Run still works against `/ai/chat`.
7. Save a preset, refresh the page, the preset persists.
8. Run with one bogus OpenRouter model id alongside two valid ones — error card shows raw message; other two complete normally.

`npx tsc --noEmit` clean after edits.

### Out of scope for testing
- No mocking of provider responses for end-to-end correctness — that's the 2026-05-25 benchmark suite, not this UI.
- No screenshot diffs / visual regression.
- No iOS/Android UI testing (the route is web-gated).

## 9. File-by-file change summary

| File | Change |
|---|---|
| `app/playground.tsx` | New. Auth/web gates, layout, wires children. |
| `app/playground/ModelPicker.tsx` | New. Catalog list + filters + selection state from store. |
| `app/playground/PromptEditor.tsx` | New. System/user textareas, three sliders, preset save/load. |
| `app/playground/RunBar.tsx` | New. Provider toggle, Mode toggle, Run, cost-estimate readout. |
| `app/playground/ResultGrid.tsx` | New. Renders one `ResultCard` per model in selection order. |
| `app/src/stores/playgroundStore.ts` | New. Zustand store with AsyncStorage persistence. |
| `app/src/services/playgroundRun.ts` | New. Fanout + latency + normalize-usage + estimate-cost. |
| `app/src/services/aiTutor.ts` | Edit (additive). Add optional `systemPromptOverride` to `AiChatRequest` and use it in both Direct paths. Add optional `usage` to `AiChatResponse`. Add `fetchGeminiModels()`. |
| `app/_layout.tsx` | Add `<Stack.Screen name="playground" />` with default options. |
| `app/(tabs)/progress.tsx` | Add a small `Platform.OS === 'web'` developer link to `/playground` at the bottom. |
| `app/test/scripts/playground-run-review.ts` | New. Unit-test runner. |
| `app/package.json` | Add `test:playground` script. |

No changes in `api/`. No changes to deployment.

## 10. Open questions

None at design time. If anything surfaces during implementation it goes into `todo.md`, not back into this spec.
