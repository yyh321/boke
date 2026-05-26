import type { PostData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const POSTS_FILE = 'posts.json'

// In-memory cache to avoid repeated reads during a single request
let memCache: PostData[] | null = null

// Lazy Redis initialization
let _redis: any = null
let _redisInit: Promise<any> | null = null

async function getRedis(): Promise<any> {
  if (_redis) return _redis
  if (_redisInit) return _redisInit
  _redisInit = (async () => {
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
        _redis = new Redis({ url, token })
        console.log('[DB] ✅ Redis connected, data will persist')
      } else {
        console.log('[DB] ⚠️ No Redis env vars found, using /tmp storage')
      }
    } catch (e) {
      console.log('[DB] ⚠️ Redis init error:', e)
    }
    return _redis
  })()
  return _redisInit
}

const KV_KEY = 'boke:posts'

async function loadAll(): Promise<PostData[]> {
  if (memCache) return memCache

  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get<string>(KV_KEY)
      if (raw) {
        memCache = JSON.parse(raw)
        return memCache
      }
    } catch {}
  }

  memCache = readJsonFile<PostData[]>(POSTS_FILE, [])
  return memCache
}

async function saveAll(posts: PostData[]): Promise<void> {
  memCache = posts

  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(posts))
      return
    } catch {}
  }

  writeJsonFile(POSTS_FILE, posts)
}

// Check if storage is empty and needs seeding
export async function ensureSeeded(posts: PostData[]): Promise<void> {
  if (memCache && memCache.length > 0) return
  const data = await loadAll()
  if (data.length === 0 && posts.length > 0) {
    await saveAll(posts)
  }
}

export async function getAllPostsAsync(): Promise<PostData[]> {
  return await loadAll()
}

export async function getPublishedPostsAsync(): Promise<PostData[]> {
  const posts = await loadAll()
  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
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
  await saveAll(posts)
  return post
}

export async function updatePostAsync(id: string, updates: Partial<PostData>): Promise<PostData | null> {
  const posts = await loadAll()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return null
  posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() }
  await saveAll(posts)
  return posts[idx]
}

export async function deletePostAsync(id: string): Promise<boolean> {
  const posts = await loadAll()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return false
  posts.splice(idx, 1)
  await saveAll(posts)
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

// Sync versions for build-time prerendering (read from committed .data/)
export function getAllPosts(): PostData[] {
  return readJsonFile<PostData[]>(POSTS_FILE, [])
}

export function getPublishedPosts(): PostData[] {
  return getAllPosts()
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
}

export function getPostById(id: string): PostData | null {
  return getAllPosts().find((p) => p.id === id) || null
}

export function getPostBySlug(slug: string): PostData | null {
  return getAllPosts().find((p) => p.slug === slug) || null
}

export function createPost(post: PostData): PostData {
  const posts = getAllPosts()
  posts.push(post)
  writeJsonFile(POSTS_FILE, posts)
  return post
}

export function updatePost(id: string, updates: Partial<PostData>): PostData | null {
  const posts = getAllPosts()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return null
  posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() }
  writeJsonFile(POSTS_FILE, posts)
  return posts[idx]
}

export function deletePost(id: string): boolean {
  const posts = getAllPosts()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return false
  posts.splice(idx, 1)
  writeJsonFile(POSTS_FILE, posts)
  return true
}

export function getPostStats(): { total: number; published: number; draft: number; scheduled: number } {
  const posts = getAllPosts()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}
