import { test, expect } from '@playwright/test'

test.describe('Private feature authentication', () => {
  for (const route of ['/calendar', '/finance', '/wellness']) {
    test(`${route} redirects unauthenticated visitors to login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
    })
  }
})
