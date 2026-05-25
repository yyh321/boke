import type { CollectionEntry } from 'astro:content'

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function getAllTags(posts: CollectionEntry<'blog'>[]): string[] {
  const tags = new Set<string>()
  posts.forEach((post) => post.data.tags.forEach((tag) => tags.add(tag)))
  return Array.from(tags).sort()
}

export function getAllCategories(posts: CollectionEntry<'blog'>[]): string[] {
  const categories = new Set<string>()
  posts.forEach((post) => categories.add(post.data.category))
  return Array.from(categories).sort()
}

export function getPostsByTag(
  posts: CollectionEntry<'blog'>[],
  tag: string
): CollectionEntry<'blog'>[] {
  return posts.filter((post) => post.data.tags.includes(tag))
}

export function getPostsByCategory(
  posts: CollectionEntry<'blog'>[],
  category: string
): CollectionEntry<'blog'>[] {
  return posts.filter((post) => post.data.category === category)
}

export function searchPosts(
  posts: CollectionEntry<'blog'>[],
  query: string
): CollectionEntry<'blog'>[] {
  const searchTerm = query.toLowerCase()
  return posts.filter(
    (post) =>
      post.data.title.toLowerCase().includes(searchTerm) ||
      post.data.description.toLowerCase().includes(searchTerm) ||
      post.data.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
      post.body?.toLowerCase().includes(searchTerm)
  )
}

export function getSortedPosts(
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return posts
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
    )
}

export function getFeaturedPosts(
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return getSortedPosts(posts).filter((post) => post.data.featured)
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractToc(content: string): TocItem[] {
  const headingRegex = /^#{2,3}\s+(.+)$/gm
  const toc: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].replace(/[`*_~]/g, '')
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const level = match[0].startsWith('###') ? 3 : 2

    toc.push({ id, text, level })
  }

  return toc
}
