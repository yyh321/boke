import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('应该成功加载首页', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/个人博客/)
    await expect(page.locator('h1')).toContainText('欢迎来到我的博客')
  })

  test('应该显示文章列表', async ({ page }) => {
    await page.goto('/')
    const articles = page.locator('article')
    await expect(articles.first()).toBeVisible()
  })

  test('导航链接应该能正常工作', async ({ page }) => {
    await page.goto('/')

    const navLinks = ['分类', '标签', '搜索', '关于']
    for (const link of navLinks) {
      await page.getByRole('link', { name: link }).first().click()
      await expect(page).not.toHaveURL('/')
      await page.goBack()
    }
  })

  test('点击文章应该跳转到详情页', async ({ page }) => {
    await page.goto('/')
    const firstArticle = page.locator('article').first()
    const link = firstArticle.locator('a').first()
    const href = await link.getAttribute('href')

    if (href) {
      await link.click()
      await expect(page).toHaveURL(new RegExp(href.replace(/^\//, '')))
    }
  })
})
