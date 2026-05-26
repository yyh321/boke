export const prerender = false

import type { APIRoute } from 'astro'

const KV_KEY = 'boke:posts'

export const GET: APIRoute = async () => {
  const result: Record<string, unknown> = {}

  // Show envs
  const envs: Record<string, string> = {}
  for (const k of ['KV_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_URL', 'REDIS_TOKEN']) {
    const v = (process.env as any)?.[k]
    envs[k] = v ? `${v.substring(0, 10)}...` : 'NOT SET'
  }
  result.envs = envs

  // Step 1: get REST URL (not rediss://)
  const restUrl = (process.env as any)?.KV_REST_API_URL
  const restToken = (process.env as any)?.KV_REST_API_TOKEN

  if (!restUrl || !restToken) {
    result.redis = 'MISSING REST credentials (KV_REST_API_URL + KV_REST_API_TOKEN)'
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Step 2: connect via REST
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url: restUrl, token: restToken })
    result.redis = 'connected'

    const pong = await redis.ping()
    result.ping = pong

    // Step 3: read existing data
    const raw: any = await redis.get(KV_KEY)
    if (raw) {
      const posts = JSON.parse(raw)
      result.redisData = { count: posts.length }
    } else {
      result.redisData = 'EMPTY'
    }

    // Step 4: test write
    const testKey = 'boke:test-' + Date.now()
    await redis.set(testKey, 'ok')
    const testVal = await redis.get(testKey)
    await redis.del(testKey)
    result.testWriteRead = testVal === 'ok' ? 'PASS' : 'FAIL'

  } catch (e: any) {
    result.redisError = {
      message: e.message,
      stack: e.stack?.substring(0, 300),
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}
