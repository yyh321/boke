import type { CommentData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const COMMENTS_FILE = 'comments.json'

let redisClient: any = null
let redisInitPromise: Promise<any> | null = null

async function initRedis(): Promise<any> {
  if (redisClient) return redisClient
  if (redisInitPromise) return redisInitPromise

  redisInitPromise = (async () => {
    try {
      const { Redis } = await import('@upstash/redis')
      const url = import.meta.env.KV_URL
        || import.meta.env.KV_REST_API_URL
        || import.meta.env.UPSTASH_REDIS_REST_URL
        || import.meta.env.REDIS_URL
      const token = import.meta.env.KV_REST_API_TOKEN
        || import.meta.env.KV_REST_API_READ_ONLY_TOKEN
        || import.meta.env.UPSTASH_REDIS_REST_TOKEN
        || import.meta.env.REDIS_TOKEN
      if (url && token) {
        redisClient = new Redis({ url, token })
        console.log('[DB] ✅ Redis connected for comments')
      }
    } catch {
      // Redis not available
    }
    return redisClient
  })()

  return redisInitPromise
}

const KV_KEY = 'boke:comments'
let cache: CommentData[] | null = null
let cacheTime = 0
const CACHE_TTL = 5000

async function loadAll(): Promise<CommentData[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache
  }

  const redis = await initRedis()
  if (redis) {
    try {
      const data = await redis.get<string>(KV_KEY)
      if (data) {
        cache = JSON.parse(data)
        cacheTime = Date.now()
        return cache
      }
    } catch {
      // fall through
    }
  }

  cache = readJsonFile<CommentData[]>(COMMENTS_FILE, [])
  cacheTime = Date.now()
  return cache
}

async function persistAll(comments: CommentData[]): Promise<void> {
  cache = comments
  cacheTime = Date.now()

  const redis = await initRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(comments))
      return
    } catch {
      // fall through
    }
  }

  writeJsonFile(COMMENTS_FILE, comments)
}

export async function getAllCommentsAsync(): Promise<CommentData[]> {
  const comments = await loadAll()
  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCommentsByPostIdAsync(postId: string): Promise<CommentData[]> {
  const comments = await loadAll()
  return comments
    .filter((c) => c.postId === postId && c.status === 'approved')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export async function getPendingCommentsAsync(): Promise<CommentData[]> {
  const comments = await loadAll()
  return comments
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCommentByIdAsync(id: string): Promise<CommentData | null> {
  const comments = await loadAll()
  return comments.find((c) => c.id === id) || null
}

export async function createCommentAsync(comment: CommentData): Promise<CommentData> {
  const comments = await loadAll()
  comments.push(comment)
  await persistAll(comments)
  return comment
}

export async function updateCommentAsync(id: string, updates: Partial<CommentData>): Promise<CommentData | null> {
  const comments = await loadAll()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return null
  comments[index] = { ...comments[index], ...updates }
  await persistAll(comments)
  return comments[index]
}

export async function deleteCommentAsync(id: string): Promise<boolean> {
  const comments = await loadAll()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return false
  comments.splice(index, 1)
  await persistAll(comments)
  return true
}

export async function getCommentStatsAsync(): Promise<{ total: number; approved: number; pending: number; rejected: number }> {
  const comments = await loadAll()
  return {
    total: comments.length,
    approved: comments.filter((c) => c.status === 'approved').length,
    pending: comments.filter((c) => c.status === 'pending').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }
}
