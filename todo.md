# TODO — 2026-05-21

0. **Formal specs first** — sit down and write formal specs before going to next implementation.
1. **Mono repo** — consolidate related projects into a single monorepo.
2. **Rework transcript splitting** — improve the sentence/chunk splitting algorithm.
3. **Pre-process video and transcript** — ingest video + transcript ahead of time and let the user compose their own TS (transcript segments) before practice.

# TODO — 2026-05-22
1. AI tutor screen, you could send a long sentence to AI service as a detailed prompt. But you should display user a short sentence like 'List of keywords' and 'List of grammars or phrases' for consistency.
2. ![ ](image.png) : slider implementation is wrong. can you refer this UI ![alt text](image-1.png) for your reference? Each keyword or phrase you should display in a slider like that. in each slider item, you should allow user to add (plus icon) this keyword into vocabulary or phrase into their lists.
3. In every situation pls Keep welcome message and original initial prompts on top for me. 
4. At Home screen, delete video button seems not work, i delete one video but it does not actually delete.
5. ![ ](image-2.png) at AI tutor screen, Ask about text and Xclose button at the top are overlapping happens again, please fix it

# TODO — 2026-05-25
1. **Model evaluation benchmark before promoting to production.** Before changing the default model (Gemini or OpenRouter), run a fixed test suite against the candidate and compare against the incumbent. Don't ship a new default based on a single ad-hoc query.
   - **Test corpus:** pick 5 canonical videos that cover the range we care about — short well-punctuated, long with sparse punctuation, fast technical speech, conversational/interview, non-English-heavy. Pin them by YouTube ID in `app/test/resources/`.
   - **Test prompts per video** (all of them, every time): `Summarize the video`, `List of keywords`, `List of grammars or phrases`, one comprehension question (`Why did the speaker mention X?`), one vocabulary question (`What does <word> mean in this context?`).
   - **Metrics to score:**
     - Format compliance — does summary follow the bulleted-by-theme shape and *omit* timestamps? Do keyword/phrase lists obey the `**term** - meaning. Transcript: "..."` format with no intro/outro?
     - Coverage — for summary, does the answer cite events from across the runtime, not just the first minute?
     - Latency — wall-clock per request.
     - Cost — input + output tokens × model rate.
     - Error rate — 429s, empty replies, hallucinated transcript quotes.
   - **Output:** one row per (video × prompt × model) in a CSV under `app/test/resources/benchmarks/YYYY-MM-DD-<model>.csv`, plus a short markdown summary in `docs/specs/` with the recommendation.
   - **Acceptance bar for promotion:** the candidate must match or beat the incumbent on format compliance and coverage, and not regress latency by more than ~30%. Otherwise no swap.
   - **Implementation note:** the existing `app/test/scripts/transcript-split-review.ts` runner pattern is the right shape — a new `app/test/scripts/ai-bench.ts` can reuse the proxy/direct `chat()` service so the benchmark exercises the exact code path users hit.
