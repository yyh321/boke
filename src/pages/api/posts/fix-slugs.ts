export const prerender = false

import type { APIRoute } from 'astro'
import { getAllPosts, updatePost } from '../../../lib/db/posts'
import { cleanSlug } from '../../../lib/seo'
import type { ApiResponse } from '../../../lib/db/types'

export const GET: APIRoute = async () => {
  const posts = getAllPosts()
  let fixedCount = 0

  for (const post of posts) {
    const cleaned = cleanSlug(post.slug)
    if (cleaned !== post.slug) {
      updatePost(post.id, { slug: cleaned })
      fixedCount++
    }
  }

  return new Response(JSON.stringify({
    success: true,
    data: { fixed: fixedCount, total: posts.length },
    message: `已修复 ${fixedCount} 个 slug`,
  } satisfies ApiResponse))
}
