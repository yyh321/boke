import { test, expect } from '@playwright/test'

test.describe('分类与标签', () => {
  test('分类页应该显示所有分类', async ({ page }) => {
    await page.goto('/categories')
    await expect(page.locator('h1')).toContainText('文章分类')
    const categorySections = page.locator('section h2')
    const count = await categorySections.count()
    expect(count).toBeGreaterThan(0)
  })

  test('点击分类标签应该筛选文章', async ({ page }) => {
    await page.goto('/categories')
    const categoryLink = page.locator('.tag').first()
    const categoryName = await categoryLink.textContent()

    if (categoryName) {
      await categoryLink.click()
      await expect(page.locator('h1')).toContainText(categoryName.trim())
    }
  })

  test('标签页应该显示所有标签', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('h1')).toContainText('文章标签')
    const tags = page.locator('.tag')
    await expect(tags.first()).toBeVisible()
  })

  test('点击标签应该跳转到标签详情页', async ({ page }) => {
    await page.goto('/tags')
    const tagLink = page.locator('.tag').first()
    const tagName = await tagLink.textContent()

    if (tagName) {
      await tagLink.click()
      await expect(page.locator('h1')).toContainText(tagName.split('(')[0].trim())
    }
  })
})
