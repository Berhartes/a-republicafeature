import { test, expect } from '@playwright/test'

test('home redirects to deputados and has correct title', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('**/gastos/deputados')
  await expect(page).toHaveTitle(/Deputados v2 • Monitor de Gastos/i)
})