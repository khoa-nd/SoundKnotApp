import type { AiContext, AiMode, AiProvider, AiSettings, OpenRouterModel } from './aiTutor';
import { chat } from './aiTutor';
import type { PlaygroundParams, ResultCardState, RunSnapshot } from '../stores/playgroundStore';

export const GEMINI_RATES: Record<string, { promptPerM: number; completionPerM: number }> = {
  'gemini-2.5-pro': { promptPerM: 1.25, completionPerM: 10.0 },
  'gemini-3.5-flash': { promptPerM: 0.3, completionPerM: 2.5 },
  'gemini-3.1-pro': { promptPerM: 1.25, completionPerM: 10.0 },
  'gemini-3-flash-preview': { promptPerM: 0.3, completionPerM: 2.5 },
  'gemini-3.1-flash-lite': { promptPerM: 0.1, completionPerM: 0.4 },
};

export interface PlaygroundRunRequest {
  provider: AiProvider;
  mode: AiMode;
  models: string[];
  systemPrompt: string;
  userPrompt: string;
  params: PlaygroundParams;
  apiKey: string;
  context?: AiContext;
  openRouterModels?: OpenRouterModel[] | null;
  onSnapshot: (snapshot: RunSnapshot) => void | Promise<void>;
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

export function normalizeUsage(usage?: { promptTokens: number; completionTokens: number } | null) {
  if (!usage) return null;
  return {
    promptTokens: Math.max(0, usage.promptTokens || 0),
    completionTokens: Math.max(0, usage.completionTokens || 0),
  };
}

export function estimateCost(
  provider: AiProvider,
  model: string,
  usage: { promptTokens: number; completionTokens: number } | null,
  openRouterModels?: OpenRouterModel[] | null
): number | null {
  if (!usage) return null;

  if (provider === 'gemini') {
    const rate = GEMINI_RATES[model];
    if (!rate) return null;
    return (usage.promptTokens / 1_000_000) * rate.promptPerM + (usage.completionTokens / 1_000_000) * rate.completionPerM;
  }

  const catalogModel = openRouterModels?.find((item) => item.id === model);
  const promptRate = Number(catalogModel?.pricing?.prompt);
  const completionRate = Number(catalogModel?.pricing?.completion);
  if (!Number.isFinite(promptRate) || !Number.isFinite(completionRate)) return null;
  return usage.promptTokens * promptRate + usage.completionTokens * completionRate;
}

function pendingResult(): ResultCardState {
  return {
    status: 'pending',
    reply: null,
    error: null,
    latencyMs: null,
    usage: null,
    cost: null,
  };
}

export async function startPlaygroundRun(req: PlaygroundRunRequest): Promise<RunSnapshot> {
  const startedAt = Date.now();
  const results: Record<string, ResultCardState> = Object.fromEntries(req.models.map((model) => [model, pendingResult()]));
  const snapshot: RunSnapshot = {
    startedAt,
    finishedAt: null,
    provider: req.provider,
    mode: req.mode,
    systemPrompt: req.systemPrompt,
    userPrompt: req.userPrompt,
    params: req.params,
    results,
  };

  await req.onSnapshot({ ...snapshot, results: { ...snapshot.results } });

  await Promise.all(req.models.map(async (model) => {
    const t0 = nowMs();
    console.log(`[Playground] Starting run for model: ${model}`);
    try {
      const settings: AiSettings = {
        provider: req.provider,
        mode: req.mode,
        model,
        apiKey: req.apiKey,
      };
      const response = await chat({
        settings,
        messages: [{ role: 'user', content: req.userPrompt }],
        context: req.context,
        systemPromptOverride: req.mode === 'direct' ? req.systemPrompt : undefined,
        params: req.mode === 'direct' ? req.params : undefined,
      });
      const latencyMs = Math.round(nowMs() - t0);
      const usage = normalizeUsage(response.usage);
      console.log(`[Playground] Success for model: ${model} in ${latencyMs}ms. Usage:`, usage);
      snapshot.results[model] = {
        status: 'done',
        reply: response.reply,
        error: null,
        latencyMs,
        usage,
        cost: estimateCost(req.provider, model, usage, req.openRouterModels),
      };
    } catch (error: any) {
      const latencyMs = Math.round(nowMs() - t0);
      console.error(`[Playground] Error for model: ${model} after ${latencyMs}ms:`, error);
      snapshot.results[model] = {
        status: 'error',
        reply: null,
        error: error?.message ?? String(error),
        latencyMs,
        usage: null,
        cost: null,
      };
    }
    await req.onSnapshot({ ...snapshot, results: { ...snapshot.results } });
  }));

  snapshot.finishedAt = Date.now();
  await req.onSnapshot({ ...snapshot, results: { ...snapshot.results } });
  return snapshot;
}
