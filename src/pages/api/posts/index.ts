export const prerender = false

import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getAllPosts, getPostById, createPost, updatePost, deletePost } from '../../../lib/db/posts'
import { validatePostTitle, validatePostContent, sanitizeHtml } from '../../../lib/validation'
import { generateSlug, generateSeoTitle, generateSeoDescription, calculateReadingTime, cleanSlug } from '../../../lib/seo'
import type { PostData, ApiResponse } from '../../../lib/db/types'

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  const filter = url.searchParams.get('filter')

  if (id) {
    const post = getPostById(id)
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: '文章不存在' }), { status: 404 })
    }
    return new Response(JSON.stringify({ success: true, data: post }))
  }

  let posts = getAllPosts()
  if (filter === 'published') {
    posts = posts.filter((p) => p.status === 'published')
  }

  const contentPosts = await getCollection('blog')
  const publishedContentPosts = contentPosts
    .filter((p) => !p.data.draft)
    .map((p) => ({
      id: p.slug,
      title: p.data.title,
      content: p.body || '',
      description: p.data.description,
      category: p.data.category,
      tags: p.data.tags,
      coverImage: '',
      status: 'published' as const,
      scheduledDate: null,
      publishDate: p.data.pubDate.toISOString(),
      createdAt: p.data.pubDate.toISOString(),
      updatedAt: (p.data.updatedDate || p.data.pubDate).toISOString(),
      slug: p.slug,
      seoTitle: p.data.title,
      seoDescription: p.data.description,
      author: '博主',
      readingTime: p.data.readingTime || 0,
      commentCount: 0,
    }))

  const allPosts = [...posts, ...publishedContentPosts]
  const seen = new Set<string>()
  const merged = allPosts.filter((p) => {
    if (seen.has(p.slug)) return false
    seen.add(p.slug)
    return true
  })

  merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return new Response(JSON.stringify({ success: true, data: merged }))
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<PostData>

  const titleValidation = validatePostTitle(body.title || '')
  if (!titleValidation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: titleValidation.errors.join('; '),
    } satisfies ApiResponse), { status: 400 })
  }

  const contentValidation = validatePostContent(body.content || '')
  if (!contentValidation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: contentValidation.errors.join('; '),
    } satisfies ApiResponse), { status: 400 })
  }

  const now = new Date().toISOString()
  const slug = cleanSlug(body.slug || generateSlug(body.title || ''))
  const sanitizedContent = sanitizeHtml(body.content || '')

  const post: PostData = {
    id: crypto.randomUUID(),
    title: body.title || '',
    content: sanitizedContent,
    description: body.description || generateSeoDescription(sanitizedContent),
    category: body.category || '未分类',
    tags: body.tags || [],
    coverImage: body.coverImage || '',
    status: body.status || 'draft',
    scheduledDate: body.status === 'scheduled' ? (body.scheduledDate || null) : null,
    publishDate: body.status === 'published' ? now : '',
    createdAt: now,
    updatedAt: now,
    slug,
    seoTitle: body.seoTitle || generateSeoTitle(body.title || ''),
    seoDescription: body.seoDescription || generateSeoDescription(sanitizedContent),
    author: body.author || '博主',
    readingTime: calculateReadingTime(sanitizedContent),
    commentCount: 0,
  }

  const created = createPost(post)
  return new Response(JSON.stringify({ success: true, data: created } satisfies ApiResponse), { status: 201 })
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<PostData>
  const { id, ...updates } = body

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: '缺少文章 ID' } satisfies ApiResponse), { status: 400 })
  }

  const existing = getPostById(id)
  if (!existing) {
    return new Response(JSON.stringify({ success: false, error: '文章不存在' } satisfies ApiResponse), { status: 404 })
  }

  if (updates.title) {
    const titleValidation = validatePostTitle(updates.title)
    if (!titleValidation.valid) {
      return new Response(JSON.stringify({ success: false, error: titleValidation.errors.join('; ') }), { status: 400 })
    }
  }

  if (updates.content) {
    const contentValidation = validatePostContent(updates.content)
    if (!contentValidation.valid) {
      return new Response(JSON.stringify({ success: false, error: contentValidation.errors.join('; ') }), { status: 400 })
    }
    updates.content = sanitizeHtml(updates.content)
  }

  if (updates.content) {
    updates.readingTime = calculateReadingTime(updates.content)
  }

  if (updates.slug) {
    updates.slug = cleanSlug(updates.slug)
  }
  if (updates.title && !updates.slug) {
    updates.slug = cleanSlug(generateSlug(updates.title))
  }

  const updated = updatePost(id, updates)
  return new Response(JSON.stringify({ success: true, data: updated } satisfies ApiResponse))
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json() as { id: string }

  if (!body.id) {
    return new Response(JSON.stringify({ success: false, error: '缺少文章 ID' } satisfies ApiResponse), { status: 400 })
  }

  const deleted = deletePost(body.id)
  if (!deleted) {
    return new Response(JSON.stringify({ success: false, error: '文章不存在' } satisfies ApiResponse), { status: 404 })
  }

  return new Response(JSON.stringify({ success: true, message: '删除成功' } satisfies ApiResponse))
}
