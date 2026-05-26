import type { PostData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const POSTS_FILE = 'posts.json'

let memCache: PostData[] | null = null

let _redis: any = null

function getEnv(key: string): string | undefined {
  return (process as any).env?.[key]
}

async function getRedis(): Promise<any> {
  if (_redis !== null) return _redis || undefined
  try {
    const { Redis } = await import('@upstash/redis')
    // Prefer REST API URL (https://) over direct rediss:// for serverless
    const url = getEnv('KV_REST_API_URL')
      || getEnv('UPSTASH_REDIS_REST_URL')
      || getEnv('KV_URL')
      || getEnv('REDIS_URL')

    const token = getEnv('KV_REST_API_TOKEN')
      || getEnv('UPSTASH_REDIS_REST_TOKEN')
      || getEnv('REDIS_TOKEN')

    if (url && token) {
      _redis = new Redis({ url, token })
      const pong = await _redis.ping()
      console.log(`[DB] Redis ping: ${pong}`)
    } else {
      _redis = false
      console.log('[DB] No Redis env vars:', { url: !!url, token: !!token })
    }
  } catch (e: any) {
    _redis = false
    console.error('[DB] Redis init error:', e.message)
  }
  return _redis || undefined
}

const KV_KEY = 'boke:posts'

async function loadAll(): Promise<PostData[]> {
  if (memCache) return memCache

  const redis = await getRedis()
  if (redis) {
    try {
      const raw: any = await redis.get(KV_KEY)
      if (raw) {
        memCache = typeof raw === 'string' ? JSON.parse(raw) : raw
        console.log(`[DB] Loaded ${memCache.length} posts from Redis`)
        return memCache
      }
    } catch (e) {
      console.error('[DB] Redis read error:', e)
    }
  }

  memCache = readJsonFile<PostData[]>(POSTS_FILE, [])
  console.log(`[DB] Loaded ${memCache.length} posts from file`)
  return memCache
}

async function saveAll(posts: PostData[]): Promise<void> {
  memCache = posts

  const redis = await getRedis()
  let redisOk = false
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(posts))
      redisOk = true
      console.log(`[DB] Saved ${posts.length} posts to Redis`)
    } catch (e) {
      console.error('[DB] Redis write error:', e)
    }
  }

  writeJsonFile(POSTS_FILE, posts)
  console.log(`[DB] Saved ${posts.length} posts to file (Redis: ${redisOk})`)
}

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

// Sync versions
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
