export interface PostData {
  id: string
  title: string
  content: string
  description: string
  category: string
  tags: string[]
  coverImage: string
  status: 'draft' | 'published' | 'scheduled'
  scheduledDate: string | null
  publishDate: string
  createdAt: string
  updatedAt: string
  slug: string
  seoTitle: string
  seoDescription: string
  author: string
  readingTime: number
  commentCount: number
}

export interface CommentData {
  id: string
  postId: string
  parentId: string | null
  author: string
  email: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  isPinned: boolean
  isGuest: boolean
  replyTo: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminSession {
  isAuthenticated: boolean
  token: string
  expiresAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CreatePostInput {
  title: string
  content: string
  description: string
  category: string
  tags: string[]
  coverImage: string
  status: 'draft' | 'published' | 'scheduled'
  scheduledDate: string | null
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string
}

export interface CreateCommentInput {
  postId: string
  author: string
  email: string
  content: string
  parentId?: string | null
  isGuest?: boolean
  replyTo?: string | null
}
