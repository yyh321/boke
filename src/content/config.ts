import { defineCollection, z } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      heroImage: image().optional(),
      category: z.string(),
      tags: z.array(z.string()),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      readingTime: z.number().optional(),
    }),
})

export const collections = {
  blog: blogCollection,
}
