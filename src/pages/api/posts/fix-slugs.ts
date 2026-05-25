export const prerender = false

import type { APIRoute } from 'astro'
import { cleanSlug } from '../../../lib/seo'
import type { ApiResponse } from '../../../lib/db/types'
import { getAllPostsAsync, updatePostAsync } from '../../../lib/db/posts'

export const GET: APIRoute = async () => {
  const posts = await getAllPostsAsync()
  let fixedCount = 0

  for (const post of posts) {
    const cleaned = cleanSlug(post.slug)
    if (cleaned !== post.slug) {
      await updatePostAsync(post.id, { slug: cleaned })
      fixedCount++
    }
  }

  return new Response(JSON.stringify({
    success: true,
    data: { fixed: fixedCount, total: posts.length },
    message: `已修复 ${fixedCount} 个 slug`,
  } satisfies ApiResponse))
}
