export const prerender = false

import type { APIRoute } from 'astro'

// Direct env access without any abstractions
function getEnv(key: string): string | undefined {
  try {
    return (process as any).env?.[key] || (import.meta as any).env?.[key]
  } catch {
    return undefined
  }
}

const KV_KEY = 'boke:posts'

export const GET: APIRoute = async () => {
  const result: Record<string, unknown> = {}

  // List all relevant env vars
  const keys = ['KV_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_URL', 'REDIS_TOKEN']
  const envs: Record<string, string> = {}
  for (const k of keys) {
    const v = getEnv(k)
    envs[k] = v ? `${v.substring(0, 10)}...` : 'NOT SET'
  }
  result.envs = envs

  // Try redis
  let redis: any = null
  try {
    const { Redis } = await import('@upstash/redis')
    const url = getEnv('KV_URL') || getEnv('KV_REST_API_URL') || getEnv('UPSTASH_REDIS_REST_URL') || getEnv('REDIS_URL')
    const token = getEnv('KV_REST_API_TOKEN') || getEnv('KV_REST_API_READ_ONLY_TOKEN') || getEnv('UPSTASH_REDIS_REST_TOKEN') || getEnv('REDIS_TOKEN')

    if (!url || !token) {
      result.redis = 'no credentials'
    } else {
      redis = new Redis({ url, token })
      const pong = await redis.ping()
      result.ping = pong

      const raw = await redis.get<string>(KV_KEY)
      if (raw) {
        const posts = JSON.parse(raw)
        result.redisData = { count: posts.length, posts: posts.slice(0, 3) }
      } else {
        result.redisData = 'EMPTY'
      }

      // Test write + read
      const testKey = 'boke:test-' + Date.now()
      await redis.set(testKey, 'ok')
      const testVal = await redis.get(testKey)
      await redis.del(testKey)
      result.testWriteRead = testVal === 'ok' ? 'PASS' : 'FAIL'
    }
  } catch (e: any) {
    result.redisError = e.message || String(e)
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}
