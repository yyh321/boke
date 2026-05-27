export const prerender = false

import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getAllPostsAsync, getPostByIdAsync, createPostAsync, updatePostAsync, deletePostAsync, ensureSeeded } from '../../../lib/db/posts'
import { validatePostTitle, validatePostContent } from '../../../lib/validation'
import { PostBuilder } from '../../../lib/builders/PostBuilder'
import type { PostData, ApiResponse } from '../../../lib/db/types'

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  const filter = url.searchParams.get('filter')

  const contentPosts = await getCollection('blog')
  const seedPosts = contentPosts
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

  await ensureSeeded(seedPosts)

  if (id) {
    const post = await getPostByIdAsync(id)
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: '文章不存在' }), { status: 404 })
    }
    return new Response(JSON.stringify({ success: true, data: post }))
  }

  let posts = await getAllPostsAsync()
  if (filter === 'published') {
    posts = posts.filter((p) => p.status === 'published')
  }

  const allPosts = [...posts, ...seedPosts]
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
    return new Response(JSON.stringify({ success: false, error: titleValidation.errors.join('; ') }), { status: 400 })
  }

  const contentValidation = validatePostContent(body.content || '')
  if (!contentValidation.valid) {
    return new Response(JSON.stringify({ success: false, error: contentValidation.errors.join('; ') }), { status: 400 })
  }

  const builder = new PostBuilder()
    .setTitle(body.title || '')
    .setContent(body.content || '')
    .setAuthor(body.author || '博主')

  if (body.description) builder.setDescription(body.description)
  if (body.category) builder.setCategory(body.category)
  if (body.tags) builder.setTags(body.tags)
  if (body.coverImage) builder.setCoverImage(body.coverImage)
  if (body.slug) builder.setSlug(body.slug)
  if (body.seoTitle) builder.setSeoTitle(body.seoTitle)
  if (body.seoDescription) builder.setSeoDescription(body.seoDescription)

  if (body.status === 'published') {
    builder.publishNow()
  } else if (body.status === 'scheduled' && body.scheduledDate) {
    builder.scheduleAt(body.scheduledDate)
  } else {
    builder.saveAsDraft()
  }

  const post = builder.build()

  const created = await createPostAsync(post)
  return new Response(JSON.stringify({ success: true, data: created } satisfies ApiResponse), { status: 201 })
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<PostData>
  const { id, ...updates } = body
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: '缺少文章 ID' } satisfies ApiResponse), { status: 400 })
  }
  const existing = await getPostByIdAsync(id)
  if (!existing) {
    return new Response(JSON.stringify({ success: false, error: '文章不存在' } satisfies ApiResponse), { status: 404 })
  }
  if (updates.title) {
    const r = validatePostTitle(updates.title)
    if (!r.valid) return new Response(JSON.stringify({ success: false, error: r.errors.join('; ') }), { status: 400 })
  }
  if (updates.content) {
    const r = validatePostContent(updates.content)
    if (!r.valid) return new Response(JSON.stringify({ success: false, error: r.errors.join('; ') }), { status: 400 })
    updates.content = sanitizeHtml(updates.content)
    updates.readingTime = calculateReadingTime(updates.content)
  }
  if (updates.slug) updates.slug = cleanSlug(updates.slug)
  if (updates.title && !updates.slug) updates.slug = cleanSlug(generateSlug(updates.title))
  const updated = await updatePostAsync(id, updates)
  return new Response(JSON.stringify({ success: true, data: updated } satisfies ApiResponse))
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json() as { id: string }
  if (!body.id) {
    return new Response(JSON.stringify({ success: false, error: '缺少文章 ID' } satisfies ApiResponse), { status: 400 })
  }
  const deleted = await deletePostAsync(body.id)
  if (!deleted) {
    return new Response(JSON.stringify({ success: false, error: '文章不存在' } satisfies ApiResponse), { status: 404 })
  }
  return new Response(JSON.stringify({ success: true, message: '删除成功' } satisfies ApiResponse))
}
