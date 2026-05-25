import type { PostData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const POSTS_FILE = 'posts.json'

let redisClient: any = null
let redisInitPromise: Promise<any> | null = null

async function initRedis(): Promise<any> {
  if (redisClient) return redisClient
  if (redisInitPromise) return redisInitPromise

  redisInitPromise = (async () => {
    try {
      const { Redis } = await import('@upstash/redis')
      const url = import.meta.env.KV_URL || import.meta.env.REDIS_URL
      const token = import.meta.env.KV_REST_API_TOKEN || import.meta.env.REDIS_TOKEN
      if (url && token) {
        redisClient = new Redis({ url, token })
        console.log('[DB] Redis connected')
      }
    } catch (e) {
      console.log('[DB] Redis not available, using file storage')
    }
    return redisClient
  })()

  return redisInitPromise
}

const KV_KEY = 'boke:posts'
let cache: PostData[] | null = null
let cacheTime = 0
const CACHE_TTL = 5000

async function ensureRedis(): Promise<any> {
  return await initRedis()
}

async function loadAll(): Promise<PostData[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache
  }

  const redis = await ensureRedis()
  if (redis) {
    try {
      const data = await redis.get<string>(KV_KEY)
      if (data) {
        cache = JSON.parse(data)
        cacheTime = Date.now()
        return cache
      }
    } catch {
      // Redis error, fall through
    }
  }

  cache = readJsonFile<PostData[]>(POSTS_FILE, [])
  cacheTime = Date.now()
  return cache
}

async function persistAll(posts: PostData[]): Promise<void> {
  cache = posts
  cacheTime = Date.now()

  const redis = await ensureRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(posts))
      console.log(`[DB] Saved ${posts.length} posts to Redis`)
      return
    } catch (e) {
      console.error('[DB] Redis save failed:', e)
    }
  }

  writeJsonFile(POSTS_FILE, posts)
}

export async function getPublishedPostsAsync(): Promise<PostData[]> {
  const posts = await loadAll()
  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
}

export async function getAllPostsAsync(): Promise<PostData[]> {
  return await loadAll()
}

export async function getPostByIdAsync(id: string): Promise<PostData | null> {
  const posts = await loadAll()
  return posts.find((p) => p.id === id) || null
}

export async function getPostBySlugAsync(slug: string): Promise<PostData | null> {
  const posts = await loadAll()
  return posts.find((p) => p.slug === slug) || null
}

export async function createPostAsync(post: PostData): Promise<PostData> {
  const posts = await loadAll()
  posts.push(post)
  await persistAll(posts)
  return post
}

export async function updatePostAsync(id: string, updates: Partial<PostData>): Promise<PostData | null> {
  const posts = await loadAll()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return null
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() }
  await persistAll(posts)
  return posts[index]
}

export async function deletePostAsync(id: string): Promise<boolean> {
  const posts = await loadAll()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  await persistAll(posts)
  return true
}

export async function getPostStatsAsync(): Promise<{ total: number; published: number; draft: number; scheduled: number }> {
  const posts = await loadAll()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}

// Sync versions for build-time prerendering only
function getFilePosts(): PostData[] {
  return readJsonFile<PostData[]>(POSTS_FILE, [])
}

export function getAllPosts(): PostData[] {
  return getFilePosts()
}

export function getPublishedPosts(): PostData[] {
  return getFilePosts()
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
}

export function getPostById(id: string): PostData | null {
  return getFilePosts().find((p) => p.id === id) || null
}

export function getPostBySlug(slug: string): PostData | null {
  return getFilePosts().find((p) => p.slug === slug) || null
}

export function createPost(post: PostData): PostData {
  const posts = getFilePosts()
  posts.push(post)
  writeJsonFile(POSTS_FILE, posts)
  return post
}

export function updatePost(id: string, updates: Partial<PostData>): PostData | null {
  const posts = getFilePosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return null
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() }
  writeJsonFile(POSTS_FILE, posts)
  return posts[index]
}

export function deletePost(id: string): boolean {
  const posts = getFilePosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  writeJsonFile(POSTS_FILE, posts)
  return true
}

export function getPostStats(): { total: number; published: number; draft: number; scheduled: number } {
  const posts = getFilePosts()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}
