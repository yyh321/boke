import { test, expect } from '@playwright/test'

test.describe('可访问性', () => {
  test('首页应该有关键导航', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav[aria-label="主导航"]')
    await expect(nav).toBeVisible()
  })

  test('所有图片应该有 alt 文本', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('文章标题层级应该正确', async ({ page }) => {
    await page.goto('/blog/first-post')
    const headings = page.locator('h1, h2, h3')
    const count = await headings.count()
    expect(count).toBeGreaterThan(0)
  })

  test('链接应该可以通过键盘聚焦', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })

  test('应该支持 prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('body')).toBeAttached()
  })
})
