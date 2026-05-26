export const prerender = false

import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const hasRedis = !!(import.meta.env.KV_URL || import.meta.env.REDIS_URL)

  return new Response(JSON.stringify({
    success: true,
    data: {
      hasRedis,
      message: hasRedis
        ? '✅ Redis 已配置，数据会持久化保存'
        : '⚠️ 未配置 Redis，文章数据将在部署后丢失。请在 Vercel 中创建 KV 存储。',
    },
  }))
}
