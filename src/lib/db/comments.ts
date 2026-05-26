import type { CommentData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const COMMENTS_FILE = 'comments.json'

let _redis: any = null
let cache: CommentData[] | null = null

function getEnv(key: string): string | undefined {
  return (process as any).env?.[key]
}

async function getRedis(): Promise<any> {
  if (_redis !== null) return _redis || undefined
  try {
    const { Redis } = await import('@upstash/redis')
    const url = getEnv('KV_URL') || getEnv('KV_REST_API_URL')
      || getEnv('UPSTASH_REDIS_REST_URL') || getEnv('REDIS_URL')
    const token = getEnv('KV_REST_API_TOKEN') || getEnv('KV_REST_API_READ_ONLY_TOKEN')
      || getEnv('UPSTASH_REDIS_REST_TOKEN') || getEnv('REDIS_TOKEN')
    if (url && token) {
      _redis = new Redis({ url, token })
    } else {
      _redis = false
    }
  } catch {
    _redis = false
  }
  return _redis || undefined
}

const KV_KEY = 'boke:comments'

async function loadAll(): Promise<CommentData[]> {
  if (cache) return cache

  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get<string>(KV_KEY)
      if (raw) {
        cache = JSON.parse(raw)
        return cache
      }
    } catch {
      // fall through
    }
  }

  cache = readJsonFile<CommentData[]>(COMMENTS_FILE, [])
  return cache
}

async function saveAll(comments: CommentData[]): Promise<void> {
  cache = comments

  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(comments))
    } catch {
      // fall through
    }
  }

  writeJsonFile(COMMENTS_FILE, comments)
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

export async function getAllCommentsAsync(): Promise<CommentData[]> {
  return (await loadAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getPendingCommentsAsync(): Promise<CommentData[]> {
  return (await loadAll())
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCommentByIdAsync(id: string): Promise<CommentData | null> {
  return (await loadAll()).find((c) => c.id === id) || null
}

export async function createCommentAsync(comment: CommentData): Promise<CommentData> {
  const comments = await loadAll()
  comments.push(comment)
  await saveAll(comments)
  return comment
}

export async function updateCommentAsync(id: string, updates: Partial<CommentData>): Promise<CommentData | null> {
  const comments = await loadAll()
  const idx = comments.findIndex((c) => c.id === id)
  if (idx === -1) return null
  comments[idx] = { ...comments[idx], ...updates }
  await saveAll(comments)
  return comments[idx]
}

export async function deleteCommentAsync(id: string): Promise<boolean> {
  const comments = await loadAll()
  const idx = comments.findIndex((c) => c.id === id)
  if (idx === -1) return false
  comments.splice(idx, 1)
  await saveAll(comments)
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

// Sync versions
export function getAllComments(): CommentData[] {
  return readJsonFile<CommentData[]>(COMMENTS_FILE, [])
}

export function getCommentsByPostId(postId: string): CommentData[] {
  return getAllComments()
    .filter((c) => c.postId === postId && c.status === 'approved')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export function getPendingComments(): CommentData[] {
  return getAllComments()
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getCommentById(id: string): CommentData | null {
  return getAllComments().find((c) => c.id === id) || null
}

export function createComment(comment: CommentData): CommentData {
  const comments = getAllComments()
  comments.push(comment)
  writeJsonFile(COMMENTS_FILE, comments)
  return comment
}

export function updateComment(id: string, updates: Partial<CommentData>): CommentData | null {
  const comments = getAllComments()
  const idx = comments.findIndex((c) => c.id === id)
  if (idx === -1) return null
  comments[idx] = { ...comments[idx], ...updates }
  writeJsonFile(COMMENTS_FILE, comments)
  return comments[idx]
}

export function deleteComment(id: string): boolean {
  const comments = getAllComments()
  const idx = comments.findIndex((c) => c.id === id)
  if (idx === -1) return false
  comments.splice(idx, 1)
  writeJsonFile(COMMENTS_FILE, comments)
  return true
}

export function getCommentStats(): { total: number; approved: number; pending: number; rejected: number } {
  const comments = getAllComments()
  return {
    total: comments.length,
    approved: comments.filter((c) => c.status === 'approved').length,
    pending: comments.filter((c) => c.status === 'pending').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }
}
