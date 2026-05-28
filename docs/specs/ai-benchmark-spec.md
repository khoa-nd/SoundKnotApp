# Model Evaluation Benchmark Spec

## Goal
Establish fixed, reproducible test framework comparing LLM candidates against current default before promoting to production.

## Test Setup
- **Test Corpus:** 5 canonical YouTube videos pinned by ID:
  1. `dQw4w9WgXcQ` - Rick Astley (Short, well-punctuated)
  2. `jNQXAC9IVRw` - Me at the zoo (Short, conversational/historic)
  3. `9bZkp7q19f0` - PSY - GANGNAM STYLE (Music video, non-English heavy, repetitive)
  4. `oHg5SJYRHA0` - Rickroll original (Alternative short technical/conversational check)
  5. `L_LUpnjgPso` - 1-minute video (Short, fast conversational)

*Note: These IDs cover music, non-English, conversational, and short/fast speech styles.*

- **Test Prompts:**
  - `Summarize the video`
  - `List of keywords`
  - `List of grammars or phrases`
  - `Why did the speaker mention X?` (Comprehension question)
  - `What does Y mean in this context?` (Vocabulary question)

## Scoring Metrics
- **Format compliance:**
  - Summary: Bulleted by theme, no timestamps.
  - Keyword/Phrase list: `**term** - meaning. Transcript: "..."` with no intro/outro conversational filler.
- **Coverage:** Summary cites events from across entire runtime.
- **Latency:** Wall-clock request time.
- **Cost:** Input + output tokens calculated by rate.
- **Error rate:** 429s, empty replies, hallucinated quotes.

## Output
CSV: `app/test/resources/benchmarks/YYYY-MM-DD-<model>.csv`
Summary: `docs/specs/YYYY-MM-DD-<model>-report.md`
