import type { CommentData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const COMMENTS_FILE = 'comments.json'

let redisClient: any = null
let redisInitialized = false

async function getRedis(): Promise<any> {
  if (redisInitialized) return redisClient
  redisInitialized = true
  try {
    const { Redis } = await import('@upstash/redis')
    const url = import.meta.env.KV_URL || import.meta.env.REDIS_URL
    const token = import.meta.env.KV_REST_API_TOKEN || import.meta.env.REDIS_TOKEN
    if (url && token) {
      redisClient = new Redis({ url, token })
    }
  } catch {
    // Redis not available
  }
  return redisClient
}

const KV_KEY = 'boke:comments'
let memoryCache: CommentData[] | null = null

async function ensureLoaded(): Promise<CommentData[]> {
  if (memoryCache) return memoryCache

  const redis = await getRedis()
  if (redis) {
    try {
      const data = await redis.get<string>(KV_KEY)
      memoryCache = data ? JSON.parse(data) : []
      return memoryCache
    } catch {
      memoryCache = []
      return memoryCache
    }
  }

  memoryCache = readJsonFile<CommentData[]>(COMMENTS_FILE, [])
  return memoryCache
}

async function saveAll(comments: CommentData[]): Promise<void> {
  memoryCache = comments
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(comments))
    } catch {
      // ignore
    }
  } else {
    writeJsonFile(COMMENTS_FILE, comments)
  }
}

function getSyncComments(): CommentData[] {
  return readJsonFile<CommentData[]>(COMMENTS_FILE, [])
}

export function getAllComments(): CommentData[] {
  return getSyncComments().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getAllCommentsAsync(): Promise<CommentData[]> {
  const comments = await ensureLoaded()
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getCommentsByPostId(postId: string): CommentData[] {
  return getSyncComments()
    .filter((c) => c.postId === postId && c.status === 'approved')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export async function getCommentsByPostIdAsync(postId: string): Promise<CommentData[]> {
  const comments = await ensureLoaded()
  return comments
    .filter((c) => c.postId === postId && c.status === 'approved')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export function getPendingComments(): CommentData[] {
  return getSyncComments()
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPendingCommentsAsync(): Promise<CommentData[]> {
  const comments = await ensureLoaded()
  return comments
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getCommentById(id: string): CommentData | null {
  return getSyncComments().find((c) => c.id === id) || null
}

export async function getCommentByIdAsync(id: string): Promise<CommentData | null> {
  const comments = await ensureLoaded()
  return comments.find((c) => c.id === id) || null
}

export function createComment(comment: CommentData): CommentData {
  const comments = getSyncComments()
  comments.push(comment)
  writeJsonFile(COMMENTS_FILE, comments)
  getRedis().then((redis) => {
    if (redis) {
      redis.set(KV_KEY, JSON.stringify(getSyncComments())).catch(() => {})
    }
  })
  return comment
}

export async function createCommentAsync(comment: CommentData): Promise<CommentData> {
  const comments = await ensureLoaded()
  comments.push(comment)
  await saveAll(comments)
  return comment
}

export function updateComment(id: string, updates: Partial<CommentData>): CommentData | null {
  const comments = getSyncComments()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return null
  comments[index] = { ...comments[index], ...updates }
  writeJsonFile(COMMENTS_FILE, comments)
  return comments[index]
}

export async function updateCommentAsync(id: string, updates: Partial<CommentData>): Promise<CommentData | null> {
  const comments = await ensureLoaded()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return null
  comments[index] = { ...comments[index], ...updates }
  await saveAll(comments)
  return comments[index]
}

export function deleteComment(id: string): boolean {
  const comments = getSyncComments()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return false
  comments.splice(index, 1)
  writeJsonFile(COMMENTS_FILE, comments)
  return true
}

export async function deleteCommentAsync(id: string): Promise<boolean> {
  const comments = await ensureLoaded()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return false
  comments.splice(index, 1)
  await saveAll(comments)
  return true
}

export function getCommentStats(): { total: number; approved: number; pending: number; rejected: number } {
  const comments = getSyncComments()
  return {
    total: comments.length,
    approved: comments.filter((c) => c.status === 'approved').length,
    pending: comments.filter((c) => c.status === 'pending').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }
}

export async function getCommentStatsAsync(): Promise<{ total: number; approved: number; pending: number; rejected: number }> {
  const comments = await ensureLoaded()
  return {
    total: comments.length,
    approved: comments.filter((c) => c.status === 'approved').length,
    pending: comments.filter((c) => c.status === 'pending').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }
}
