import { redis } from "../lib/redisClient.js";

type Allowed = { allowed: true; remaining: number };
type Denied = {
  allowed: false;
  retryAfterMs: number;
  remaining: number;
  hardDeny?: boolean;
};
export type RateLimitResult = Allowed | Denied;

const LUA = ` 
-- KEYS[1] = bucket key
-- ARGV[1] = cost
-- ARGV[2] = capacity
-- ARGV[3] = windowMs   (time to fully refill from 0 -> capacity)

local key = KEYS[1]
local cost = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local windowMs = tonumber(ARGV[3])

-- Redis server time (seconds, microseconds)
local t = redis.call("TIME")
local nowMs = (tonumber(t[1]) * 1000) + math.floor(tonumber(t[2]) / 1000)

-- Refill rate in tokens per millisecond
local rate = capacity / windowMs

-- Hard deny: operation is more expensive than max burst capacity
if cost > capacity then
  -- allowed=0, remaining=-1, retryAfterMs=0, hardDeny=1
  return {0, -1, 0, 1}
end

local tokensStr = redis.call("HGET", key, "tokens")
local lastStr = redis.call("HGET", key, "lastRefillMs")

local tokens
local lastRefillMs

if (not tokensStr) or (not lastStr) then
  tokens = capacity
  lastRefillMs = nowMs
else
  tokens = tonumber(tokensStr)
  lastRefillMs = tonumber(lastStr)
end

-- Refill
local elapsed = nowMs - lastRefillMs
if elapsed > 0 then
  tokens = math.min(capacity, tokens + (elapsed * rate))
  lastRefillMs = nowMs
end

-- Spend if possible
if tokens + 1e-9 < cost then
  local missing = cost - tokens
  local retryAfterMs = math.ceil(missing / rate)
  -- Store updated refill state even on deny (so tokens don't "time travel")
  redis.call("HSET", key, "tokens", tokens, "lastRefillMs", lastRefillMs)
  -- TTL: keep around long enough to cover quiet periods; 2x window is typical
  redis.call("PEXPIRE", key, windowMs * 2)
  return {0, tokens, retryAfterMs, 0}
end

tokens = tokens - cost
redis.call("HSET", key, "tokens", tokens, "lastRefillMs", lastRefillMs)
redis.call("PEXPIRE", key, windowMs * 2)

-- allowed=1, remaining=tokens, retryAfterMs=0, hardDeny=0
return {1, tokens, 0, 0} `;

let sha: string | null = null;

async function ensureLoaded() {
  if (sha) return sha;
  sha = await redis.scriptLoad(LUA);
  return sha;
}

export async function takeTokensTokenBucket(params: {
  key: string;
  cost: number;
  capacity: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, cost, capacity, windowMs } = params;

  const scriptSha = await ensureLoaded();

  const raw = (await redis.evalSha(scriptSha, {
    keys: [key],
    arguments: [String(cost), String(capacity), String(windowMs)],
  })) as unknown as Array<number | string>;

  const allowed = Number(raw[0]);
  const remaining = Number(raw[1]);
  const retryAfterMs = Number(raw[2]);
  const hardDeny = Number(raw[3]) === 1;

  if (allowed === 1) return { allowed: true, remaining };
  return { allowed: false, remaining, retryAfterMs, hardDeny };
}
