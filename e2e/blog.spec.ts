import { test, expect } from '@playwright/test'

test.describe('博客文章', () => {
  test('文章详情页应该成功加载', async ({ page }) => {
    await page.goto('/blog/first-post')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('article')).toBeVisible()
  })

  test('文章应该包含内容', async ({ page }) => {
    await page.goto('/blog/second-post')
    const content = page.locator('.prose')
    await expect(content).toBeVisible()
    await expect(content.locator('h2').first()).toBeVisible()
  })

  test('代码块应该正确渲染', async ({ page }) => {
    await page.goto('/blog/first-post')
    const codeBlock = page.locator('pre')
    await expect(codeBlock.first()).toBeVisible()
  })

  test('文章应该包含元数据信息', async ({ page }) => {
    await page.goto('/blog/life-post')
    await expect(page.locator('time')).toBeVisible()
    await expect(page.locator('.tag')).toBeVisible()
  })

  test('404 页面应该显示', async ({ page }) => {
    await page.goto('/blog/non-existent-article')
    await expect(page.locator('h1')).toContainText('404')
  })
})
