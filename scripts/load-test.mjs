/**
 * 接口压力测试脚本
 * 使用方法: node scripts/load-test.mjs
 *
 * 测试内容:
 * - 文章 CRUD 接口并发测试
 * - 评论提交接口并发测试
 * - 搜索接口压力测试
 * - 边界用例测试
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321'

const results = []

async function request(method, url, body) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { status: res.status, data }
}

function record(name, success, duration, status, error) {
  results.push({ name, success, duration, status, error })
  const icon = success ? '\u2713' : '\u2717'
  console.log(
    `  ${icon} ${name} (${duration}ms)${status ? ` [${status}]` : ''}${error ? `: ${error}` : ''}`
  )
}

async function testConcurrentRequests() {
  console.log('\n\u{1F4CA} 并发请求测试')

  const concurrent = 20
  const promises = Array.from({ length: concurrent }, async (_, i) => {
    const start = Date.now()
    try {
      const { status } = await request('POST', '/api/comments', {
        postId: 'first-post',
        author: `并发测试用户${i}`,
        email: `test${i}@example.com`,
        content: `并发测试评论内容 #${i}`,
        isGuest: true,
      })
      record(
        `并发提交评论 #${i + 1}`,
        status === 201 || status === 429,
        Date.now() - start,
        status
      )
    } catch (e) {
      record(`并发提交评论 #${i + 1}`, false, Date.now() - start, undefined, String(e))
    }
  })

  await Promise.all(promises)
}

async function testRateLimiting() {
  console.log('\n\u{1F6A6} 频率限制测试')

  const requests = 10
  let rateLimited = false

  for (let i = 0; i < requests; i++) {
    const start = Date.now()
    try {
      const { status } = await request('POST', '/api/comments', {
        postId: 'first-post',
        author: '频率测试',
        email: 'rate@test.com',
        content: `频率测试评论 #${i + 1}`,
        isGuest: true,
      })
      if (status === 429) rateLimited = true
      record(`请求 #${i + 1}`, true, Date.now() - start, status)
    } catch (e) {
      record(`请求 #${i + 1}`, false, Date.now() - start, undefined, String(e))
    }
  }

  console.log(`  频率限制生效: ${rateLimited ? '是' : '否（可能需要调整阈值）'}`)
}

async function testPostCrud() {
  console.log('\n\u{1F4DD} 文章 CRUD 测试')

  const start = Date.now()
  try {
    const { status, data: created } = await request('POST', '/api/posts', {
      title: '压力测试文章',
      content: '这是一篇压力测试文章的正文内容，用于验证 API 的可靠性。'.repeat(10),
      category: '技术',
      tags: ['测试'],
      status: 'draft',
    })
    record('创建文章', status === 201, Date.now() - start, status)

    if (status === 201 && created.data?.id) {
      const id = created.data.id

      const start2 = Date.now()
      const { status: s2 } = await request('GET', `/api/posts?id=${id}`)
      record('查询文章', s2 === 200, Date.now() - start2, s2)

      const start3 = Date.now()
      const { status: s3 } = await request('PUT', '/api/posts', {
        id,
        title: '压力测试文章(已更新)',
      })
      record('更新文章', s3 === 200, Date.now() - start3, s3)

      const start4 = Date.now()
      const { status: s4 } = await request('DELETE', '/api/posts', { id })
      record('删除文章', s4 === 200, Date.now() - start4, s4)
    }
  } catch (e) {
    record('文章 CRUD', false, Date.now() - start, undefined, String(e))
  }
}

async function testEdgeCases() {
  console.log('\n\u{1F532} 边界用例测试')

  const testCases = [
    {
      name: '空标题文章',
      payload: { title: '', content: '正文', category: '技术', tags: [], status: 'draft' },
      expectStatus: 400,
      endpoint: '/api/posts',
      method: 'POST',
    },
    {
      name: '空内容文章',
      payload: { title: '标题', content: '', category: '技术', tags: [], status: 'draft' },
      expectStatus: 400,
      endpoint: '/api/posts',
      method: 'POST',
    },
    {
      name: '超长标题',
      payload: {
        title: 'A'.repeat(201),
        content: '正文',
        category: '技术',
        tags: [],
        status: 'draft',
      },
      expectStatus: 400,
      endpoint: '/api/posts',
      method: 'POST',
    },
    {
      name: '空昵称评论',
      payload: {
        postId: 'first-post',
        author: '',
        content: '评论内容',
        isGuest: true,
      },
      expectStatus: 400,
      endpoint: '/api/comments',
      method: 'POST',
    },
    {
      name: '空内容评论',
      payload: {
        postId: 'first-post',
        author: '用户',
        content: '',
        isGuest: true,
      },
      expectStatus: 400,
      endpoint: '/api/comments',
      method: 'POST',
    },
    {
      name: '垃圾信息评论',
      payload: {
        postId: 'first-post',
        author: 'Spam Bot',
        content: 'Buy cheap watches now!!! Click here to subscribe!!!'.repeat(3),
        isGuest: true,
      },
      expectStatus: 400,
      endpoint: '/api/comments',
      method: 'POST',
    },
    {
      name: '不存在文章评论',
      payload: {
        postId: 'non-existent-article',
        author: '用户',
        content: '评论内容',
        isGuest: true,
      },
      expectStatus: 404,
      endpoint: '/api/comments',
      method: 'POST',
    },
    {
      name: '不存在文章查询',
      payload: null,
      endpoint: '/api/posts?id=non-existent-id',
      method: 'GET',
      expectStatus: 404,
    },
  ]

  for (const tc of testCases) {
    const start = Date.now()
    try {
      const { status } = await request(tc.method, tc.endpoint, tc.payload)
      const passed = status === tc.expectStatus
      record(
        tc.name,
        passed,
        Date.now() - start,
        status,
        passed ? undefined : `期望 ${tc.expectStatus}，实际 ${status}`
      )
    } catch (e) {
      record(tc.name, false, Date.now() - start, undefined, String(e))
    }
  }
}

async function testSearch() {
  console.log('\n\u{1F50D} 搜索与列表测试')

  const start = Date.now()
  try {
    const { status } = await request('GET', '/api/posts?filter=published')
    record('获取已发布文章列表', status === 200, Date.now() - start, status)
  } catch (e) {
    record('获取已发布文章列表', false, Date.now() - start, undefined, String(e))
  }

  const start2 = Date.now()
  try {
    const { status } = await request('GET', '/api/comments?filter=stats')
    record('获取评论统计', status === 200, Date.now() - start2, status)
  } catch (e) {
    record('获取评论统计', false, Date.now() - start2, undefined, String(e))
  }

  const start3 = Date.now()
  try {
    const { status } = await request('GET', '/api/comments?filter=pending')
    record('获取待审核评论', status === 200, Date.now() - start3, status)
  } catch (e) {
    record('获取待审核评论', false, Date.now() - start3, undefined, String(e))
  }
}

async function main() {
  console.log('='.repeat(50))
  console.log('  接口压力测试报告')
  console.log('  目标: ' + BASE_URL)
  console.log('  时间: ' + new Date().toISOString())
  console.log('='.repeat(50))

  await testEdgeCases()
  await testPostCrud()
  await testSearch()
  await testConcurrentRequests()
  await testRateLimiting()

  console.log('\n' + '='.repeat(50))
  console.log('  测试汇总')
  console.log('='.repeat(50))
  const total = results.length
  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const avgDuration = results.reduce((s, r) => s + r.duration, 0) / total

  console.log(`  总用例: ${total}`)
  console.log(`  通过: ${passed}`)
  console.log(`  失败: ${failed}`)
  console.log(`  平均响应: ${avgDuration.toFixed(2)}ms`)
  console.log(`  通过率: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n\u274C 失败的测试:')
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`))
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
