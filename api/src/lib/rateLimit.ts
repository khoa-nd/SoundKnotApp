// Per-user sliding-window rate limiter.
//
// NOTE: This map lives in the current Worker isolate. Cloudflare may run
// multiple isolates per region, so the effective limit is "best-effort": a
// determined client could exceed the configured limit by up to a factor of
// the isolate count. For strict accuracy, swap this for a Durable Object or
// the Workers `RateLimit` binding. For protection against runaway UI loops
// (the threat model in the spec), best-effort is sufficient.

interface Bucket {
  // Timestamps (ms) of recent hits, oldest first. Trimmed on each check.
  hits: number[];
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;

// Periodic cleanup: drop buckets that have been idle for >5 windows so the
// map doesn't grow unbounded across long-lived isolates.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * WINDOW_MS;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  const cutoff = now - SWEEP_INTERVAL_MS;
  for (const [key, bucket] of buckets) {
    const last = bucket.hits[bucket.hits.length - 1];
    if (last === undefined || last < cutoff) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
}

export function checkRateLimit(
  userId: string,
  limitPerMinute: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  if (limitPerMinute <= 0) {
    return { allowed: true, retryAfterSeconds: 0, limit: limitPerMinute };
  }

  const cutoff = now - WINDOW_MS;
  let bucket = buckets.get(userId);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(userId, bucket);
  }

  // Trim expired hits.
  while (bucket.hits.length > 0 && bucket.hits[0] < cutoff) {
    bucket.hits.shift();
  }

  if (bucket.hits.length >= limitPerMinute) {
    const oldest = bucket.hits[0];
    const retryAfterMs = Math.max(0, oldest + WINDOW_MS - now);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      limit: limitPerMinute,
    };
  }

  bucket.hits.push(now);
  return { allowed: true, retryAfterSeconds: 0, limit: limitPerMinute };
}
