import { test, expect } from '@playwright/test'

test('non-existent route shows not-found UI', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByText('Página não encontrada')).toBeVisible()
})