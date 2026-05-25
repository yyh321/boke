import { test, expect } from '@playwright/test'

test.describe('响应式设计', () => {
  const viewports = [
    { width: 1920, height: 1080, name: '桌面端' },
    { width: 768, height: 1024, name: '平板' },
    { width: 375, height: 812, name: '手机' },
  ]

  for (const viewport of viewports) {
    test(`首页在 ${viewport.name} 应该完整显示`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()
    })

    test(`文章页在 ${viewport.name} 应该完整显示`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/blog/first-post')
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('.prose')).toBeVisible()
    })
  }
})
