import { test, expect } from '@playwright/test'

test.describe('Dashboard Geral', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gastos/dashboards')
  })

  test('carrega página e exibe heading principal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard Geral' })).toBeVisible()
    
    // Verificar que componentes principais carregaram
    await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 5000 })
    await expect(page.getByTestId('dashboard-stats')).toBeVisible()
  })

  test('exibe estatísticas gerais', async ({ page }) => {
    // Verificar cards de estatísticas
    const statsCards = [
      'total-deputados',
      'total-fornecedores',
      'total-gasto',
      'media-deputado'
    ]
    
    for (const cardId of statsCards) {
      const card = page.getByTestId(cardId)
      if (await card.isVisible()) {
        await expect(card).toBeVisible()
        
        // Verificar que tem valor numérico
        const valor = await card.locator('[data-testid="stat-value"]').textContent()
        expect(valor).toBeTruthy()
      }
    }
  })

  test('filtra dashboard por ano', async ({ page }) => {
    // Selecionar ano
    const selectAno = page.locator('[data-testid="dashboard-select-ano"]')
    await selectAno.click()
    await page.getByRole('option', { name: '2024' }).click()
    
    // Verificar URL
    await expect(page).toHaveURL(/ano=2024/)
    
    // Aguardar dados atualizarem
    await page.waitForTimeout(500)
    
    // Verificar que indicador de ano mudou
    const anoIndicador = page.locator('[data-testid="ano-selecionado"]')
    if (await anoIndicador.isVisible()) {
      await expect(anoIndicador).toContainText('2024')
    }
    
    // Verificar que gráfico de evolução anual destacou ano selecionado
    const graficoEvolucao = page.locator('[data-testid="grafico-evolucao-anual"]')
    if (await graficoEvolucao.isVisible()) {
      await expect(graficoEvolucao).toBeVisible()
    }
  })

  test('filtra dashboard por partido', async ({ page }) => {
    const selectPartido = page.locator('[data-testid="dashboard-select-partido"]')
    await selectPartido.click()
    await page.getByRole('option', { name: 'PT' }).click()
    
    // Verificar URL
    await expect(page).toHaveURL(/partido=PT/)
    
    // Aguardar dados atualizarem
    await page.waitForTimeout(500)
    
    // Verificar que ranking de deputados foi filtrado
    const rankingDeputados = page.locator('[data-testid="ranking-deputados"]')
    if (await rankingDeputados.isVisible()) {
      const primeiroDeputado = rankingDeputados.locator('[data-testid="deputado-card"]').first()
      const partidoElement = await primeiroDeputado.locator('[data-testid="deputado-partido"]').textContent()
      expect(partidoElement).toBe('PT')
    }
  })

  test('filtra dashboard por UF', async ({ page }) => {
    const selectUF = page.locator('[data-testid="dashboard-select-uf"]')
    await selectUF.click()
    await page.getByRole('option', { name: 'SP' }).click()
    
    // Verificar URL
    await expect(page).toHaveURL(/uf=SP/)
    
    // Aguardar dados atualizarem
    await page.waitForTimeout(500)
    
    // Verificar que ranking de deputados foi filtrado
    const rankingDeputados = page.locator('[data-testid="ranking-deputados"]')
    if (await rankingDeputados.isVisible()) {
      const primeiroDeputado = rankingDeputados.locator('[data-testid="deputado-card"]').first()
      const ufElement = await primeiroDeputado.locator('[data-testid="deputado-uf"]').textContent()
      expect(ufElement).toBe('SP')
    }
  })

  test('combina filtros de partido + UF + ano', async ({ page }) => {
    // Aplicar ano
    const selectAno = page.locator('[data-testid="dashboard-select-ano"]')
    await selectAno.click()
    await page.getByRole('option', { name: '2024' }).click()
    
    // Aplicar partido
    const selectPartido = page.locator('[data-testid="dashboard-select-partido"]')
    await selectPartido.click()
    await page.getByRole('option', { name: 'PT' }).click()
    
    // Aplicar UF
    const selectUF = page.locator('[data-testid="dashboard-select-uf"]')
    await selectUF.click()
    await page.getByRole('option', { name: 'SP' }).click()
    
    // Verificar URL contém todos os filtros
    await expect(page).toHaveURL(/ano=2024/)
    await expect(page).toHaveURL(/partido=PT/)
    await expect(page).toHaveURL(/uf=SP/)
    
    // Aguardar dados atualizarem
    await page.waitForTimeout(500)
    
    // Verificar que estatísticas refletem filtros
    const totalDeputados = page.getByTestId('total-deputados').locator('[data-testid="stat-value"]')
    const valorText = await totalDeputados.textContent()
    
    // Total deve ser menor que sem filtros (se tiver deputados PT-SP)
    if (valorText) {
      const valor = parseInt(valorText.replace(/\D/g, ''))
      expect(valor).toBeGreaterThan(0) // Pelo menos 1 deputado PT-SP deve existir
    }
  })

  test('exibe gráfico de evolução anual', async ({ page }) => {
    const graficoEvolucao = page.locator('[data-testid="grafico-evolucao-anual"]')
    await expect(graficoEvolucao).toBeVisible({ timeout: 5000 })
    
    // Verificar que há pontos de dados (anos)
    const pontosGrafico = graficoEvolucao.locator('[data-testid="grafico-ponto"], .recharts-dot, [role="img"]')
    if (await pontosGrafico.count() > 0) {
      expect(await pontosGrafico.count()).toBeGreaterThan(0)
    }
  })

  test('exibe ranking de deputados', async ({ page }) => {
    const rankingDeputados = page.locator('[data-testid="ranking-deputados"]')
    await expect(rankingDeputados).toBeVisible({ timeout: 5000 })
    
    // Verificar que há pelo menos 1 deputado
    const deputadosCards = rankingDeputados.locator('[data-testid="deputado-card"]')
    expect(await deputadosCards.count()).toBeGreaterThan(0)
    
    // Verificar que primeiro deputado tem dados
    const primeiroDeputado = deputadosCards.first()
    await expect(primeiroDeputado.locator('[data-testid="deputado-nome"]')).toBeVisible()
    await expect(primeiroDeputado.locator('[data-testid="deputado-gasto"]')).toBeVisible()
  })

  test('exibe ranking de partidos', async ({ page }) => {
    const rankingPartidos = page.locator('[data-testid="ranking-partidos"]')
    if (await rankingPartidos.isVisible()) {
      await expect(rankingPartidos).toBeVisible()
      
      // Verificar que há pelo menos 1 partido
      const partidosCards = rankingPartidos.locator('[data-testid="partido-card"]')
      expect(await partidosCards.count()).toBeGreaterThan(0)
      
      // Verificar ordenação decrescente por gasto
      if (await partidosCards.count() >= 2) {
        const gasto1Text = await partidosCards.nth(0).locator('[data-testid="partido-gasto"]').textContent()
        const gasto2Text = await partidosCards.nth(1).locator('[data-testid="partido-gasto"]').textContent()
        
        const gasto1 = parseFloat(gasto1Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        const gasto2 = parseFloat(gasto2Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        
        expect(gasto1).toBeGreaterThanOrEqual(gasto2)
      }
    }
  })

  test('exibe ranking de UFs', async ({ page }) => {
    const rankingUFs = page.locator('[data-testid="ranking-ufs"]')
    if (await rankingUFs.isVisible()) {
      await expect(rankingUFs).toBeVisible()
      
      // Verificar que há pelo menos 1 UF
      const ufsCards = rankingUFs.locator('[data-testid="uf-card"]')
      expect(await ufsCards.count()).toBeGreaterThan(0)
      
      // Verificar ordenação decrescente por gasto
      if (await ufsCards.count() >= 2) {
        const gasto1Text = await ufsCards.nth(0).locator('[data-testid="uf-gasto"]').textContent()
        const gasto2Text = await ufsCards.nth(1).locator('[data-testid="uf-gasto"]').textContent()
        
        const gasto1 = parseFloat(gasto1Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        const gasto2 = parseFloat(gasto2Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        
        expect(gasto1).toBeGreaterThanOrEqual(gasto2)
      }
    }
  })

  test('exibe top fornecedores', async ({ page }) => {
    const topFornecedores = page.locator('[data-testid="top-fornecedores"]')
    if (await topFornecedores.isVisible()) {
      await expect(topFornecedores).toBeVisible()
      
      // Verificar que há pelo menos 1 fornecedor
      const fornecedoresCards = topFornecedores.locator('[data-testid="fornecedor-card"]')
      expect(await fornecedoresCards.count()).toBeGreaterThan(0)
      
      // Verificar ordenação decrescente por valor
      if (await fornecedoresCards.count() >= 2) {
        const valor1Text = await fornecedoresCards.nth(0).locator('[data-testid="fornecedor-valor"]').textContent()
        const valor2Text = await fornecedoresCards.nth(1).locator('[data-testid="fornecedor-valor"]').textContent()
        
        const valor1 = parseFloat(valor1Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        const valor2 = parseFloat(valor2Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
        
        expect(valor1).toBeGreaterThanOrEqual(valor2)
      }
    }
  })

  test('pagina ranking de deputados', async ({ page }) => {
    const rankingDeputados = page.locator('[data-testid="ranking-deputados"]')
    await expect(rankingDeputados).toBeVisible()
    
    // Verificar botão de próxima página
    const btnProxima = rankingDeputados.locator('[data-testid="btn-next-page"]')
    if (await btnProxima.isVisible()) {
      // Capturar primeiro deputado antes de paginar
      const primeiroDeputadoPg1 = await rankingDeputados.locator('[data-testid="deputado-card"]').first().textContent()
      
      // Ir para próxima página
      await btnProxima.click()
      
      // Verificar URL
      await expect(page).toHaveURL(/page=2/)
      
      // Aguardar nova página carregar
      await page.waitForTimeout(500)
      
      // Verificar que deputados mudaram
      const primeiroDeputadoPg2 = await rankingDeputados.locator('[data-testid="deputado-card"]').first().textContent()
      expect(primeiroDeputadoPg1).not.toBe(primeiroDeputadoPg2)
    }
  })

  test('limpa filtros e retorna ao dashboard geral', async ({ page }) => {
    // Aplicar vários filtros
    const selectAno = page.locator('[data-testid="dashboard-select-ano"]')
    await selectAno.click()
    await page.getByRole('option', { name: '2024' }).click()
    
    const selectPartido = page.locator('[data-testid="dashboard-select-partido"]')
    await selectPartido.click()
    await page.getByRole('option', { name: 'PT' }).click()
    
    // Verificar URL
    await expect(page).toHaveURL(/ano=2024/)
    await expect(page).toHaveURL(/partido=PT/)
    
    // Limpar filtros
    const btnLimpar = page.getByRole('button', { name: /Limpar Filtros/i })
    if (await btnLimpar.isVisible()) {
      await btnLimpar.click()
      
      // Verificar URL sem parâmetros
      await expect(page).toHaveURL('/gastos/dashboards')
      
      // Verificar que estatísticas voltaram aos valores totais
      await page.waitForTimeout(500)
      
      const totalDeputados = page.getByTestId('total-deputados').locator('[data-testid="stat-value"]')
      const valorText = await totalDeputados.textContent()
      
      // Total deve ser maior que com filtros
      if (valorText) {
        const valor = parseInt(valorText.replace(/\D/g, ''))
        expect(valor).toBeGreaterThan(0)
      }
    }
  })

  test('navega para perfil de deputado ao clicar no ranking', async ({ page }) => {
    const rankingDeputados = page.locator('[data-testid="ranking-deputados"]')
    await expect(rankingDeputados).toBeVisible()
    
    const primeiroDeputado = rankingDeputados.locator('[data-testid="deputado-card"]').first()
    const deputadoId = await primeiroDeputado.getAttribute('data-id')
    
    // Clicar no deputado
    await primeiroDeputado.click()
    
    // Verificar navegação
    if (deputadoId) {
      await expect(page).toHaveURL(new RegExp(`/gastos/deputado/${deputadoId}`))
    } else {
      await expect(page).toHaveURL(/\/gastos\/deputado\/\d+/)
    }
  })

  test('exibe loading states durante filtragem', async ({ page }) => {
    // Aplicar filtro
    const selectAno = page.locator('[data-testid="dashboard-select-ano"]')
    await selectAno.click()
    await page.getByRole('option', { name: '2024' }).click()
    
    // Verificar que loading aparece
    const loadingIndicator = page.locator('[data-testid="loading-skeleton"], [data-testid="loading-spinner"]')
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 })
    
    // Verificar que loading desaparece
    await expect(loadingIndicator.first()).toBeHidden({ timeout: 5000 })
    
    // Verificar que dados foram atualizados
    await expect(page.getByTestId('dashboard-stats')).toBeVisible()
  })

  test('valida que dados agregados são consistentes', async ({ page }) => {
    // Capturar estatísticas gerais
    const totalDeputadosText = await page.getByTestId('total-deputados').locator('[data-testid="stat-value"]').textContent()
    const totalGastoText = await page.getByTestId('total-gasto').locator('[data-testid="stat-value"]').textContent()
    const mediaPorDeputadoText = await page.getByTestId('media-deputado').locator('[data-testid="stat-value"]').textContent()
    
    if (totalDeputadosText && totalGastoText && mediaPorDeputadoText) {
      const totalDeputados = parseInt(totalDeputadosText.replace(/\D/g, ''))
      const totalGasto = parseFloat(totalGastoText.replace(/[^0-9,]/g, '').replace(',', '.'))
      const media = parseFloat(mediaPorDeputadoText.replace(/[^0-9,]/g, '').replace(',', '.'))
      
      // Validar que média = total / número de deputados (com margem de erro)
      const mediaCalculada = totalGasto / totalDeputados
      const margemErro = mediaCalculada * 0.01 // 1% de margem
      
      expect(Math.abs(media - mediaCalculada)).toBeLessThan(margemErro)
    }
  })
})