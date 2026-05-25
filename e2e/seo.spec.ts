import { test, expect } from '@playwright/test'

test.describe('SEO', () => {
  test('首页应该包含正确的 meta 标签', async ({ page }) => {
    await page.goto('/')

    const description = await page.getAttribute('meta[name="description"]', 'content')
    expect(description).toBeTruthy()

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    expect(ogTitle).toBeTruthy()

    const ogType = await page.getAttribute('meta[property="og:type"]', 'content')
    expect(ogType).toBe('website')
  })

  test('文章页应该包含 article 类型的 OG 标签', async ({ page }) => {
    await page.goto('/blog/first-post')

    const ogType = await page.getAttribute('meta[property="og:type"]', 'content')
    expect(ogType).toBe('article')
  })

  test('RSS 订阅源应该可访问', async ({ page }) => {
    const response = await page.goto('/rss.xml')
    expect(response?.ok()).toBeTruthy()
    expect(await response?.headerValue('content-type')).toContain('xml')
  })

  test('站点地图应该可访问', async ({ page }) => {
    const response = await page.goto('/sitemap-index.xml')
    expect(response?.ok()).toBeTruthy()
  })

  test('robots.txt 应该可访问', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.ok()).toBeTruthy()
  })

  test('页面应该包含结构化数据', async ({ page }) => {
    await page.goto('/')
    const script = page.locator('script[type="application/ld+json"]')
    await expect(script).toBeVisible()

    const content = await script.textContent()
    expect(content).toContain('schema.org')
  })
})
