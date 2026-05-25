import fs from 'node:fs'
import path from 'node:path'
import type { PostData } from './types'

const DATA_DIR = path.join(process.cwd(), '.data')
const POSTS_FILE = path.join(DATA_DIR, 'posts.json')

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readPosts(): PostData[] {
  ensureDir()
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, '[]', 'utf-8')
    return []
  }
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writePosts(posts: PostData[]): void {
  ensureDir()
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8')
}

export function getAllPosts(): PostData[] {
  return readPosts()
}

export function getPublishedPosts(): PostData[] {
  return readPosts()
    .filter((p) => p.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    )
}

export function getPostById(id: string): PostData | null {
  return readPosts().find((p) => p.id === id) || null
}

export function getPostBySlug(slug: string): PostData | null {
  return readPosts().find((p) => p.slug === slug) || null
}

export function createPost(post: PostData): PostData {
  const posts = readPosts()
  posts.push(post)
  writePosts(posts)
  return post
}

export function updatePost(id: string, updates: Partial<PostData>): PostData | null {
  const posts = readPosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return null
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() }
  writePosts(posts)
  return posts[index]
}

export function deletePost(id: string): boolean {
  const posts = readPosts()
  const index = posts.findIndex((p) => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  writePosts(posts)
  return true
}

export function getPostsByCategory(category: string): PostData[] {
  return readPosts().filter((p) => p.category === category && p.status === 'published')
}

export function getPostsByTag(tag: string): PostData[] {
  return readPosts().filter(
    (p) => p.tags.includes(tag) && p.status === 'published'
  )
}

export function searchPosts(query: string): PostData[] {
  const term = query.toLowerCase()
  return getPublishedPosts().filter(
    (p) =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.content.toLowerCase().includes(term) ||
      p.tags.some((t) => t.toLowerCase().includes(term))
  )
}

export function getPostStats(): {
  total: number
  published: number
  draft: number
  scheduled: number
} {
  const posts = readPosts()
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }
}
