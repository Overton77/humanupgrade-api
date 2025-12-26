type Bucket = { tokens: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

export function takeTokens(params: {
  key: string;
  // user or ip (authenticated person or machine)
  cost: number;
  // cost assigned to the operation comes from lib/operationCosts
  capacity: number;
  // the capacity of the bucket (The cost counter)
  windowMs: number;
  // wait time forced upon the caller
}) {
  const { key, cost, capacity, windowMs } = params;

  const t = nowMs();

  // current time 8:00pm

  const b = buckets.get(key);
  // get the bucket of current user or ip

  if (!b || t >= b.resetAt) {
    // Either the bucket wasn't created or it's reset has been reached

    const next: Bucket = { tokens: capacity - cost, resetAt: t + windowMs };

    // Create a new bucket, detract cost from capacity and set resetAt t+ windowMs

    if (next.tokens < 0) return { allowed: false, retryAfterMs: windowMs };

    // if all tokens consumed return {allowed: false, retryAfterMs: windowMs}

    buckets.set(key, next);

    // set the key to the bucket buckets.set(user or ip, RateLimitBucket)
    return { allowed: true, remaining: next.tokens, resetAt: next.resetAt };

    // return {allowed: true, remaining: next.tokens, resetAt: next.resetAt}
  }

  if (b.tokens - cost < 0) {
    return { allowed: false, retryAfterMs: Math.max(0, b.resetAt - t) };

    // Returning bucket: If the tokens - cost < 0 return {allowed: false, retryAfter: }
  }

  b.tokens -= cost;
  return { allowed: true, remaining: b.tokens, resetAt: b.resetAt };
}
