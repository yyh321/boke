import type { PostData } from '../db/types'
import { generateSlug, generateSeoTitle, generateSeoDescription, calculateReadingTime, cleanSlug } from '../seo'
import { sanitizeHtml } from '../validation'

export class PostBuilder {
  private data: Partial<Record<keyof PostData, unknown>> = {}

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  setContent(content: string): this {
    this.data.content = sanitizeHtml(content)
    return this
  }

  setDescription(description: string): this {
    this.data.description = description
    return this
  }

  setCategory(category: string): this {
    this.data.category = category
    return this
  }

  setTags(tags: string[]): this {
    this.data.tags = tags
    return this
  }

  setCoverImage(url: string): this {
    this.data.coverImage = url
    return this
  }

  setSlug(slug: string): this {
    this.data.slug = cleanSlug(slug)
    return this
  }

  setAuthor(author: string): this {
    this.data.author = author
    return this
  }

  setSeoTitle(seoTitle: string): this {
    this.data.seoTitle = seoTitle
    return this
  }

  setSeoDescription(seoDescription: string): this {
    this.data.seoDescription = seoDescription
    return this
  }

  saveAsDraft(): this {
    this.data.status = 'draft'
    return this
  }

  publishNow(): this {
    this.data.status = 'published'
    return this
  }

  scheduleAt(date: string): this {
    this.data.status = 'scheduled'
    this.data.scheduledDate = date
    return this
  }

  build(): PostData {
    const title = (this.data.title as string) || ''
    const content = (this.data.content as string) || ''
    const now = new Date().toISOString()
    const slug = (this.data.slug as string) || cleanSlug(generateSlug(title))

    return {
      id: (this.data.id as string) || crypto.randomUUID(),
      title,
      content,
      description: (this.data.description as string) || generateSeoDescription(content),
      category: (this.data.category as string) || '未分类',
      tags: (this.data.tags as string[]) || [],
      coverImage: (this.data.coverImage as string) || '',
      status: (this.data.status as PostData['status']) || 'draft',
      scheduledDate: (this.data.scheduledDate as string | null) || null,
      publishDate: (this.data.publishDate as string) || (this.data.status === 'published' ? now : ''),
      createdAt: (this.data.createdAt as string) || now,
      updatedAt: now,
      slug,
      seoTitle: (this.data.seoTitle as string) || generateSeoTitle(title),
      seoDescription: (this.data.seoDescription as string) || generateSeoDescription(content),
      author: (this.data.author as string) || '博主',
      readingTime: (this.data.readingTime as number) || calculateReadingTime(content),
      commentCount: (this.data.commentCount as number) || 0,
    }
  }
}
