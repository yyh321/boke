export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'post'

  const timestamp = Date.now().toString(36)
  return `${slug}-${timestamp}`
}

export function cleanSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100) || 'post'
}

export function generateSeoTitle(title: string, siteName: string = '超越自我技术博客'): string {
  if (title.length <= 60) {
    return `${title} | ${siteName}`
  }
  return title.substring(0, 57) + '...'
}

export function generateSeoDescription(
  content: string,
  maxLength: number = 160
): string {
  const clean = content
    .replace(/[#*`~>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLength) {
    return clean
  }

  return clean.substring(0, maxLength - 3) + '...'
}

export function generateExcerpt(content: string, maxLength: number = 200): string {
  const clean = content
    .replace(/[#*`~>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLength) {
    return clean
  }

  const truncated = clean.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...'
}

export function calculateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = content
    .replace(/[\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length

  const totalMinutes = chineseChars / 300 + englishWords / 200
  return Math.max(1, Math.ceil(totalMinutes))
}
