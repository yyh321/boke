export const prerender = false

import type { APIRoute } from 'astro'
import {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  getCommentsByPostId,
  getPendingComments,
  getCommentStats,
} from '../../../lib/db/comments'
import { getPostById, updatePost } from '../../../lib/db/posts'
import {
  validateCommentContent,
  validateAuthorName,
  validateEmail,
  isSpam,
  checkRateLimit,
} from '../../../lib/validation'
import { createNotification } from '../../../lib/notification'
import type { CommentData, ApiResponse } from '../../../lib/db/types'

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  const postId = url.searchParams.get('postId')
  const filter = url.searchParams.get('filter')

  if (id) {
    const comment = getCommentById(id)
    if (!comment) {
      return new Response(JSON.stringify({ success: false, error: '评论不存在' }), { status: 404 })
    }
    return new Response(JSON.stringify({ success: true, data: comment }))
  }

  if (postId) {
    const comments = getCommentsByPostId(postId)
    return new Response(JSON.stringify({ success: true, data: comments }))
  }

  if (filter === 'pending') {
    return new Response(JSON.stringify({ success: true, data: getPendingComments() }))
  }

  if (filter === 'stats') {
    return new Response(JSON.stringify({ success: true, data: getCommentStats() }))
  }

  return new Response(JSON.stringify({ success: true, data: getAllComments() }))
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json() as Partial<CommentData>

  const ip = clientAddress || 'unknown'
  if (!checkRateLimit(ip, 'comment')) {
    return new Response(JSON.stringify({
      success: false,
      error: '操作过于频繁，请稍后再试',
    } satisfies ApiResponse), { status: 429 })
  }

  const authorValidation = validateAuthorName(body.author || '')
  if (!authorValidation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: authorValidation.errors.join('; '),
    }), { status: 400 })
  }

  if (body.email && !validateEmail(body.email)) {
    return new Response(JSON.stringify({
      success: false,
      error: '邮箱格式不正确',
    } satisfies ApiResponse), { status: 400 })
  }

  const contentValidation = validateCommentContent(body.content || '')
  if (!contentValidation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: contentValidation.errors.join('; '),
    }), { status: 400 })
  }

  if (isSpam(body.content || '')) {
    return new Response(JSON.stringify({
      success: false,
      error: '评论包含垃圾信息',
    } satisfies ApiResponse), { status: 400 })
  }

  const post = getPostById(body.postId || '')

  const now = new Date().toISOString()
  const comment: CommentData = {
    id: crypto.randomUUID(),
    postId: body.postId || '',
    parentId: body.parentId || null,
    author: (body.author || '').trim(),
    email: body.email || '',
    content: (body.content || '').trim(),
    status: 'pending',
    isPinned: false,
    isGuest: body.isGuest ?? true,
    replyTo: body.replyTo || null,
    createdAt: now,
    updatedAt: now,
  }

  const created = createComment(comment)

  if (post) {
    updatePost(comment.postId, { commentCount: (post.commentCount || 0) + 1 })
  }

  createNotification({
    type: 'new_comment',
    comment: created,
    postTitle: post?.title || body.postId || '',
    postUrl: `/blog/${post?.slug || body.postId}`,
  })

  return new Response(JSON.stringify({
    success: true,
    data: created,
    message: '评论已提交，等待审核',
  } satisfies ApiResponse), { status: 201 })
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<CommentData> & { action?: string }
  const { id, action, ...updates } = body

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: '缺少评论 ID' }), { status: 400 })
  }

  const existing = getCommentById(id)
  if (!existing) {
    return new Response(JSON.stringify({ success: false, error: '评论不存在' }), { status: 404 })
  }

  if (action === 'approve') {
    const updated = updateComment(id, { status: 'approved' })
    const post = getPostById(existing.postId)
    if (post) {
      createNotification({
        type: 'comment_approved',
        comment: updated!,
        postTitle: post.title,
        postUrl: `/blog/${post.slug}`,
      })
    }
    return new Response(JSON.stringify({ success: true, data: updated }))
  }

  if (action === 'reject') {
    const updated = updateComment(id, { status: 'rejected' })
    return new Response(JSON.stringify({ success: true, data: updated }))
  }

  if (action === 'pin') {
    const updated = updateComment(id, { isPinned: !existing.isPinned })
    return new Response(JSON.stringify({ success: true, data: updated }))
  }

  if (action === 'reply') {
    const replyComment: CommentData = {
      id: crypto.randomUUID(),
      postId: existing.postId,
      parentId: existing.parentId || existing.id,
      author: '博主',
      email: 'admin@example.com',
      content: updates.content || '',
      status: 'approved',
      isPinned: false,
      isGuest: false,
      replyTo: existing.author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const created = createComment(replyComment)
    const post = getPostById(existing.postId)
    if (post) {
      createNotification({
        type: 'comment_reply',
        comment: created,
        postTitle: post.title,
        postUrl: `/blog/${post.slug}`,
      })
    }
    return new Response(JSON.stringify({ success: true, data: created }), { status: 201 })
  }

  const updated = updateComment(id, updates)
  return new Response(JSON.stringify({ success: true, data: updated }))
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json() as { id: string }

  if (!body.id) {
    return new Response(JSON.stringify({ success: false, error: '缺少评论 ID' }), { status: 400 })
  }

  const existing = getCommentById(body.id)
  if (!existing) {
    return new Response(JSON.stringify({ success: false, error: '评论不存在' }), { status: 404 })
  }

  deleteComment(body.id)
  return new Response(JSON.stringify({ success: true, message: '删除成功' }))
}
