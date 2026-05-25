import type { CommentData } from './db/types'

interface NotificationPayload {
  type: 'new_comment' | 'comment_reply' | 'comment_approved'
  comment: CommentData
  postTitle: string
  postUrl: string
}

const ADMIN_EMAIL = 'admin@example.com'

export function createNotification(payload: NotificationPayload): void {
  switch (payload.type) {
    case 'new_comment':
      notifyNewComment(payload)
      break
    case 'comment_reply':
      notifyCommentReply(payload)
      break
    case 'comment_approved':
      notifyCommentApproved(payload)
      break
  }
}

function notifyNewComment(payload: NotificationPayload): void {
  const { comment, postTitle } = payload
  const message = [
    `[新评论] 收到了一条新评论`,
    `文章: ${postTitle}`,
    `作者: ${comment.author} (${comment.isGuest ? '游客' : '已登录用户'})`,
    `内容: ${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`,
    `时间: ${new Date(comment.createdAt).toLocaleString('zh-CN')}`,
  ].join('\n')

  logNotification('email', ADMIN_EMAIL, '新评论通知', message)
}

function notifyCommentReply(payload: NotificationPayload): void {
  const { comment, postTitle } = payload
  const message = [
    `[回复通知] 您的评论有了新回复`,
    `文章: ${postTitle}`,
    `回复者: ${comment.author}`,
    `回复内容: ${comment.content.substring(0, 100)}`,
  ].join('\n')

  logNotification('in-app', comment.email, '评论回复通知', message)
}

function notifyCommentApproved(payload: NotificationPayload): void {
  const { comment, postTitle } = payload
  const message = [
    `[审核通过] 您的评论已通过审核`,
    `文章: ${postTitle}`,
    `评论内容: ${comment.content.substring(0, 100)}`,
  ].join('\n')

  logNotification('in-app', comment.email, '评论审核通过', message)
}

function logNotification(
  channel: string,
  recipient: string,
  subject: string,
  message: string
): void {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] [${channel}] To: ${recipient} | Subject: ${subject}\n${message}\n---\n`

  console.log(logEntry)

  try {
    const fs = require('node:fs')
    const path = require('node:path')
    const os = require('node:os')
    const logDir = path.join(os.tmpdir(), 'boke-data')
    const logFile = path.join(logDir, 'notifications.log')

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    fs.appendFileSync(logFile, logEntry, 'utf-8')
  } catch {
    // silently fail
  }
}
