import { test, expect } from '@playwright/test'

test.describe('New Features', () => {
  test('should load calendar page', async ({ page }) => {
    const response = await page.goto('/calendar')
    expect(response?.status()).toBe(200)
  }, { timeout: 30000 })

  test('should load finance page', async ({ page }) => {
    const response = await page.goto('/finance')
    expect(response?.status()).toBe(200)
  }, { timeout: 30000 })

  test('should load wellness page', async ({ page }) => {
    const response = await page.goto('/wellness')
    expect(response?.status()).toBe(200)
  }, { timeout: 30000 })
})
