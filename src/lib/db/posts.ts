import type { PostData } from './types'
import { readJsonFile, writeJsonFile } from './storage'

const POSTS_FILE = 'posts.json'

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

const KV_KEY = 'boke:posts'
let memoryCache: PostData[] | null = null

async function ensureLoaded(): Promise<PostData[]> {
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

  memoryCache = readJsonFile<PostData[]>(POSTS_FILE, [])
  return memoryCache
}

async function saveAll(posts: PostData[]): Promise<void> {
  memoryCache = posts
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(KV_KEY, JSON.stringify(posts))
    } catch {
      // ignore
    }
  } else {
    writeJsonFile(POSTS_FILE, posts)
  }
}

function getSyncPosts(): PostData[] {
  return readJsonFile<PostData[]>(POSTS_FILE, [])
}

export function getAllPosts(): PostData[] {
  return getSyncPosts()
}

export async function getAllPostsAsync(): Promise<PostData[]> {
  return await ensureLoaded()
}

export function getPublishedPosts(): PostData[] {
  return getSyncPosts()
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
}

export async function getPublishedPostsAsync(): Promise<PostData[]> {
  const posts = await ensureLoaded()
  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
}

export function getPostById(id: string): PostData | null {
  return getSyncPosts().find((p) => p.id === id) || null
}

export async function getPostByIdAsync(id: string): Promise<PostData | null> {
  const posts = await ensureLoaded()
  return posts.find((p) => p.id === id) || null
}

export function getPostBySlug(slug: string): PostData | null {
  return getSyncPosts().find((p) => p.slug === slug) || null
}

export async function getPostBySlugAsync(slug: string): Promise<PostData | null> {
  const posts = await ensureLoaded()
  return posts.find((p) => p.slug === slug) || null
}

export function createPost(post: PostData): PostData {
  const posts = getSyncPosts()
  posts.push(post)
  writeJsonFile(POSTS_FILE, posts)
  getRedis().then((redis) => {
    if (redis) {
      const all = [...getSyncPosts()]
      redis.set(KV_KEY, JSON.stringify(all)).catch(() => {})
    }
  })
  return post
}

export async function createPostAsync(post: PostData): Promise<PostData> {
  const posts = await ensureLoaded()
  posts.push(post)
  await saveAll(posts)
  return post
}

export function updatePost(id: string, updates: Partial<PostData>): PostData | null {
  const posts = getSyncPosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return null
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() }
  writeJsonFile(POSTS_FILE, posts)
  return posts[index]
}

export async function updatePostAsync(id: string, updates: Partial<PostData>): Promise<PostData | null> {
  const posts = await ensureLoaded()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return null
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() }
  await saveAll(posts)
  return posts[index]
}

export function deletePost(id: string): boolean {
  const posts = getSyncPosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  writeJsonFile(POSTS_FILE, posts)
  return true
}

export async function deletePostAsync(id: string): Promise<boolean> {
  const posts = await ensureLoaded()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  await saveAll(posts)
  return true
}

export function getPostStats(): { total: number; published: number; draft: number; scheduled: number } {
  const posts = getSyncPosts()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}

export async function getPostStatsAsync(): Promise<{ total: number; published: number; draft: number; scheduled: number }> {
  const posts = await ensureLoaded()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}
