import { test, expect } from '@playwright/test'

test('fornecedores page renders with correct title', async ({ page }) => {
  await page.goto('/gastos/fornecedores')
  await expect(page).toHaveTitle(/Fornecedores • Monitor de Gastos/i)
})