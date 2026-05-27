const SENSITIVE_WORDS = [
  '赌博', '色情', '暴力', '毒品', '诈骗',
  '赌博网站', '色情网站', '违禁品',
]

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]{20,}/gi,
  /(.)\1{10,}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /(buy|cheap|free|click|subscribe|promotion|earn money)/gi,
]

const MAX_CONTENT_LENGTH = 100000
const MAX_TITLE_LENGTH = 200
const MAX_COMMENT_LENGTH = 2000
const MIN_CONTENT_LENGTH = 10
const MIN_TITLE_LENGTH = 2
const MIN_COMMENT_LENGTH = 1

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePostContent(content: string): ValidationResult {
  const errors: string[] = []

  if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
    errors.push(`文章内容至少需要 ${MIN_CONTENT_LENGTH} 个字符`)
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    errors.push(`文章内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`)
  }

  for (const word of SENSITIVE_WORDS) {
    if (content.includes(word)) {
      errors.push(`内容包含敏感词: ${word}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validatePostTitle(title: string): ValidationResult {
  const errors: string[] = []

  if (!title || title.trim().length < MIN_TITLE_LENGTH) {
    errors.push(`标题至少需要 ${MIN_TITLE_LENGTH} 个字符`)
  }

  if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`标题不能超过 ${MAX_TITLE_LENGTH} 个字符`)
  }

  for (const word of SENSITIVE_WORDS) {
    if (title.includes(word)) {
      errors.push(`标题包含敏感词: ${word}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateCommentContent(content: string): ValidationResult {
  const errors: string[] = []

  if (!content || content.trim().length < MIN_COMMENT_LENGTH) {
    errors.push('评论内容不能为空')
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    errors.push(`评论不能超过 ${MAX_COMMENT_LENGTH} 个字符`)
  }

  for (const word of SENSITIVE_WORDS) {
    if (content.includes(word)) {
      errors.push(`评论包含敏感词: ${word}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function isSpam(content: string): boolean {
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return true
    }
  }
  return false
}

export function filterSensitiveWords(content: string): string {
  let filtered = content
  for (const word of SENSITIVE_WORDS) {
    const regex = new RegExp(word, 'g')
    filtered = filtered.replace(regex, '***')
  }
  return filtered
}

export function sanitizeHtml(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:\s*/gi, '')
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateAuthorName(name: string): ValidationResult {
  const errors: string[] = []
  if (!name || name.trim().length < 1) {
    errors.push('昵称不能为空')
  }
  if (name.length > 50) {
    errors.push('昵称不能超过 50 个字符')
  }
  return { valid: errors.length === 0, errors }
}

export function checkRateLimit(
  ip: string,
  action: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean {
  const key = `ratelimit:${ip}:${action}`
  const now = Date.now()

  const store = globalThis.__rateLimitStore || {}
  if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = store
  }

  if (!store[key]) {
    store[key] = { count: 1, firstRequest: now }
    return true
  }

  const record = store[key]
  if (now - record.firstRequest > windowMs) {
    record.count = 1
    record.firstRequest = now
    return true
  }

  record.count++
  return record.count <= maxRequests
}

declare global {
  var __rateLimitStore: Record<string, { count: number; firstRequest: number }> | undefined
}
