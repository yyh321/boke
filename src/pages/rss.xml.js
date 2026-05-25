import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context) {
  const posts = await getCollection('blog')
  const sortedPosts = posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime())

  return rss({
    title: '个人博客',
    description: '分享技术思考与生活感悟',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}/`,
      categories: post.data.tags,
    })),
    customData: `<language>zh-CN</language>`,
  })
}
