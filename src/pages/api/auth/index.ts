export const prerender = false

import type { APIRoute } from 'astro'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json() as { username: string; password: string }

  if (body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ success: false, error: '用户名或密码错误' }),
      { status: 401 }
    )
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  cookies.set('admin_token', token, {
    path: '/',
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'lax',
  })

  cookies.set('admin_session', JSON.stringify({ token, username: ADMIN_USERNAME }), {
    path: '/',
    expires: expiresAt,
    sameSite: 'lax',
  })

  return new Response(
    JSON.stringify({ success: true, data: { token, expiresAt } })
  )
}

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('admin_token')?.value
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: '未登录' }),
      { status: 401 }
    )
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  cookies.set('admin_token', token, {
    path: '/',
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'lax',
  })

  const session = cookies.get('admin_session')?.value
  if (session) {
    cookies.set('admin_session', session, {
      path: '/',
      expires: expiresAt,
      sameSite: 'lax',
    })
  }

  return new Response(JSON.stringify({ success: true, message: '已刷新' }))
}

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('admin_token', { path: '/' })
  cookies.delete('admin_session', { path: '/' })
  return new Response(JSON.stringify({ success: true, message: '已退出登录' }))
}
