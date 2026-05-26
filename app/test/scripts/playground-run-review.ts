import { estimateCost, normalizeUsage } from '../../src/services/playgroundRun';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const usage = normalizeUsage({ promptTokens: 1000, completionTokens: 500 });
  assert(usage?.promptTokens === 1000, 'prompt tokens normalize');
  assert(usage?.completionTokens === 500, 'completion tokens normalize');

  const geminiCost = estimateCost('gemini', 'gemini-3.5-flash', usage, null);
  assert(geminiCost != null && geminiCost > 0, 'gemini cost estimates');

  const openRouterCost = estimateCost('openrouter', 'vendor/model', usage, [
    { id: 'vendor/model', pricing: { prompt: '0.0000001', completion: '0.0000002' } },
  ]);
  assert(openRouterCost != null && Math.abs(openRouterCost - 0.0002) < 0.00000001, 'openrouter cost estimates from per-token pricing');

  const unknown = estimateCost('gemini', 'unknown-model', usage, null);
  assert(unknown === null, 'unknown model cost is null');

  console.log('playground-run-review passed');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`playground-run-review failed: ${message}`);
  process.exit(1);
});
