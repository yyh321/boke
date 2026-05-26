export const prerender = false

import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const url = import.meta.env.KV_URL
    || import.meta.env.KV_REST_API_URL
    || import.meta.env.UPSTASH_REDIS_REST_URL
    || import.meta.env.REDIS_URL
  const token = import.meta.env.KV_REST_API_TOKEN
    || import.meta.env.KV_REST_API_READ_ONLY_TOKEN
    || import.meta.env.UPSTASH_REDIS_REST_TOKEN
    || import.meta.env.REDIS_TOKEN

  const hasRedis = !!(url && token)

  return new Response(JSON.stringify({
    success: true,
    data: {
      hasRedis,
      envFound: url ? 'url found' : token ? 'token only' : 'none',
      message: hasRedis
        ? '✅ Redis 已配置，数据会持久化保存'
        : '⚠️ 未配置 Redis，请在 Vercel 中创建 KV 存储。',
    },
  }))
}
