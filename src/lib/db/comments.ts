import fs from 'node:fs'
import path from 'node:path'
import type { CommentData } from './types'

const DATA_DIR = path.join(process.cwd(), '.data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readComments(): CommentData[] {
  ensureDir()
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, '[]', 'utf-8')
    return []
  }
  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeComments(comments: CommentData[]): void {
  ensureDir()
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8')
}

export function getAllComments(): CommentData[] {
  return readComments().sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getCommentsByPostId(postId: string): CommentData[] {
  return readComments()
    .filter((c) => c.postId === postId && c.status === 'approved')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export function getPendingComments(): CommentData[] {
  return readComments()
    .filter((c) => c.status === 'pending')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function getCommentById(id: string): CommentData | null {
  return readComments().find((c) => c.id === id) || null
}

export function createComment(comment: CommentData): CommentData {
  const comments = readComments()
  comments.push(comment)
  writeComments(comments)
  return comment
}

export function updateComment(
  id: string,
  updates: Partial<CommentData>
): CommentData | null {
  const comments = readComments()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return null
  comments[index] = { ...comments[index], ...updates }
  writeComments(comments)
  return comments[index]
}

export function deleteComment(id: string): boolean {
  const comments = readComments()
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return false
  comments.splice(index, 1)
  writeComments(comments)
  return true
}

export function getCommentsByParentId(parentId: string): CommentData[] {
  return readComments().filter(
    (c) => c.parentId === parentId && c.status === 'approved'
  )
}

export function getCommentStats(): {
  total: number
  approved: number
  pending: number
  rejected: number
} {
  const comments = readComments()
  return {
    total: comments.length,
    approved: comments.filter((c) => c.status === 'approved').length,
    pending: comments.filter((c) => c.status === 'pending').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }
}

export function getPostCommentCount(postId: string): number {
  return readComments().filter(
    (c) => c.postId === postId && c.status === 'approved'
  ).length
}
