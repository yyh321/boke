import { test, expect } from '@playwright/test'

test.describe('搜索功能', () => {
  test('搜索页应该成功加载', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('h1')).toContainText('搜索文章')
    await expect(page.locator('input[type="search"]')).toBeVisible()
  })

  test('输入关键词应该显示搜索结果', async ({ page }) => {
    await page.goto('/search')
    const searchInput = page.locator('input[type="search"]')

    await searchInput.fill('TypeScript')
    await page.waitForTimeout(500)

    const results = page.locator('[role="listitem"]')
    await expect(results.first()).toBeVisible()
  })

  test('搜索不存在的关键词应该显示提示', async ({ page }) => {
    await page.goto('/search')
    const searchInput = page.locator('input[type="search"]')

    await searchInput.fill('xyz123nonexistent')
    await page.waitForTimeout(500)

    await expect(page.locator('text=未找到匹配的文章')).toBeVisible()
  })
})
