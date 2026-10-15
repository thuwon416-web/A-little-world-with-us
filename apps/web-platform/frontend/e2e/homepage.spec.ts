import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/little world with us/i)
  }, { timeout: 30000 })

  test('should load without errors', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  }, { timeout: 30000 })
})
