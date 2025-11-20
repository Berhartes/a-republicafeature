import { test, expect } from '@playwright/test'

test.describe('Deputados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gastos/deputados')
  })

  test('carrega página e exibe título', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Lista de Deputados' })).toBeVisible()
  })

  test('toggle filtros e aplica busca', async ({ page }) => {
    await page.getByRole('button', { name: /Filtros/ }).click()
    const inputBusca = page.getByPlaceholder('Buscar por nome...')
    await inputBusca.fill('silva')
    await expect(page).toHaveURL(/searchTerm=silva/)
    
    // Aguardar debounce
    await page.waitForTimeout(500)
    
    // Verificar que deputados foram filtrados
    const deputadosVisiveis = page.locator('[data-testid="deputado-card"]')
    await expect(deputadosVisiveis.first()).toBeVisible({ timeout: 5000 })
    
    // Verificar que nome contém busca
    const primeiroNome = await deputadosVisiveis.first().locator('[data-testid="deputado-nome"]').textContent()
    expect(primeiroNome?.toLowerCase()).toContain('silva')
  })

  test('filtra por partido e UF', async ({ page }) => {
    // Abrir filtros se necessário
    const btnFiltros = page.getByRole('button', { name: /Filtros/ })
    if (await btnFiltros.isVisible()) {
      await btnFiltros.click()
    }
    
    // Selecionar partido
    const selectPartido = page.locator('[data-testid="select-partido"]')
    await selectPartido.click()
    await page.getByRole('option', { name: 'PT' }).click()
    await expect(page).toHaveURL(/partido=PT/)
    
    // Selecionar UF
    const selectUF = page.locator('[data-testid="select-uf"]')
    await selectUF.click()
    await page.getByRole('option', { name: 'SP' }).click()
    await expect(page).toHaveURL(/uf=SP/)
    
    // Aguardar filtros aplicarem
    await page.waitForTimeout(500)
    
    // Verificar que deputados correspondem aos filtros
    const deputadosVisiveis = page.locator('[data-testid="deputado-card"]')
    if (await deputadosVisiveis.count() > 0) {
      const primeiroDeputado = deputadosVisiveis.first()
      const partidoElement = await primeiroDeputado.locator('[data-testid="deputado-partido"]').textContent()
      const ufElement = await primeiroDeputado.locator('[data-testid="deputado-uf"]').textContent()
      
      expect(partidoElement).toBe('PT')
      expect(ufElement).toBe('SP')
    }
  })

  test('filtra por ano', async ({ page }) => {
    const btnFiltros = page.getByRole('button', { name: /Filtros/ })
    if (await btnFiltros.isVisible()) {
      await btnFiltros.click()
    }
    
    const selectAno = page.locator('[data-testid="select-ano"]')
    await selectAno.click()
    await page.getByRole('option', { name: '2024' }).click()
    await expect(page).toHaveURL(/ano=2024/)
    
    // Verificar que valores exibidos são do ano correto
    await page.waitForTimeout(500)
    const anoIndicador = page.locator('[data-testid="ano-selecionado"]')
    if (await anoIndicador.isVisible()) {
      await expect(anoIndicador).toContainText('2024')
    }
  })

  test('ordena deputados por diferentes critérios', async ({ page }) => {
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    // Verificar ordenação padrão (por gasto desc)
    const deputadosCards = page.locator('[data-testid="deputado-card"]')
    const count = await deputadosCards.count()
    
    if (count >= 2) {
      const gasto1Text = await deputadosCards.nth(0).locator('[data-testid="deputado-gasto"]').textContent()
      const gasto2Text = await deputadosCards.nth(1).locator('[data-testid="deputado-gasto"]').textContent()
      
      // Extrair valores numéricos (assumindo formato "R$ 123.456,78")
      const gasto1 = parseFloat(gasto1Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
      const gasto2 = parseFloat(gasto2Text?.replace(/[^0-9,]/g, '').replace(',', '.') || '0')
      
      expect(gasto1).toBeGreaterThanOrEqual(gasto2)
    }
    
    // Alterar ordenação para nome
    const btnOrdenacao = page.locator('[data-testid="btn-ordenacao"]')
    if (await btnOrdenacao.isVisible()) {
      await btnOrdenacao.click()
      await page.getByRole('option', { name: /Nome/ }).click()
      await expect(page).toHaveURL(/ordenacao=nome/)
      
      // Aguardar reordenação
      await page.waitForTimeout(500)
      
      // Verificar ordenação alfabética
      const nome1 = await deputadosCards.nth(0).locator('[data-testid="deputado-nome"]').textContent()
      const nome2 = await deputadosCards.nth(1).locator('[data-testid="deputado-nome"]').textContent()
      
      expect(nome1?.localeCompare(nome2 || '')).toBeLessThanOrEqual(0)
    }
  })

  test('pagina resultados corretamente', async ({ page }) => {
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    // Capturar primeiro deputado da página 1
    const primeiroDeputadoPg1 = await page.locator('[data-testid="deputado-card"]').first().getAttribute('data-id') ||
                                 await page.locator('[data-testid="deputado-card"]').first().locator('[data-testid="deputado-nome"]').textContent()
    
    // Ir para página 2
    const btnProximaPagina = page.locator('[data-testid="btn-next-page"]')
    if (await btnProximaPagina.isVisible()) {
      await btnProximaPagina.click()
      await expect(page).toHaveURL(/page=2/)
      
      // Aguardar transição
      await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
      
      // Verificar que deputados são diferentes
      const primeiroDeputadoPg2 = await page.locator('[data-testid="deputado-card"]').first().getAttribute('data-id') ||
                                   await page.locator('[data-testid="deputado-card"]').first().locator('[data-testid="deputado-nome"]').textContent()
      
      expect(primeiroDeputadoPg1).not.toBe(primeiroDeputadoPg2)
    }
  })

  test('navega para perfil de deputado ao clicar no card', async ({ page }) => {
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    const deputadoId = await primeiroDeputado.getAttribute('data-id')
    
    // Clicar no card
    await primeiroDeputado.click()
    
    // Verificar navegação para perfil
    if (deputadoId) {
      await expect(page).toHaveURL(new RegExp(`/gastos/deputado/${deputadoId}`))
    } else {
      await expect(page).toHaveURL(/\/gastos\/deputado\/\d+/)
    }
  })

  test('limpa filtros e retorna ao estado inicial', async ({ page }) => {
    // Aplicar vários filtros
    const btnFiltros = page.getByRole('button', { name: /Filtros/ })
    if (await btnFiltros.isVisible()) {
      await btnFiltros.click()
    }
    
    const inputBusca = page.getByPlaceholder('Buscar por nome...')
    await inputBusca.fill('silva')
    
    const selectPartido = page.locator('[data-testid="select-partido"]')
    await selectPartido.click()
    await page.getByRole('option', { name: 'PT' }).click()
    
    // Verificar URL
    await expect(page).toHaveURL(/searchTerm=silva/)
    await expect(page).toHaveURL(/partido=PT/)
    
    // Limpar filtros
    const btnLimpar = page.getByRole('button', { name: /Limpar Filtros/i })
    if (await btnLimpar.isVisible()) {
      await btnLimpar.click()
      
      // Verificar URL sem parâmetros
      await expect(page).toHaveURL('/gastos/deputados')
      
      // Verificar inputs limpos
      await expect(inputBusca).toHaveValue('')
    }
  })
})

test.describe('Perfil de Deputado', () => {
  test('carrega perfil e exibe informações básicas', async ({ page }) => {
    // Primeiro, pegar um ID de deputado válido da lista
    await page.goto('/gastos/deputados')
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    const deputadoId = await primeiroDeputado.getAttribute('data-id')
    
    if (!deputadoId) {
      // Pular teste se não conseguimos obter ID
      test.skip()
      return
    }
    
    // Navegar para perfil
    await page.goto(`/gastos/deputado/${deputadoId}`)
    
    // Verificar elementos básicos
    await expect(page.getByTestId('deputado-nome')).toBeVisible()
    await expect(page.getByTestId('deputado-partido')).toBeVisible()
    await expect(page.getByTestId('deputado-uf')).toBeVisible()
    await expect(page.getByTestId('deputado-foto')).toBeVisible()
  })

  test('troca entre tabs e carrega dados lazy', async ({ page }) => {
    await page.goto('/gastos/deputados')
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    await primeiroDeputado.click()
    
    // Aguardar perfil carregar
    await expect(page.getByTestId('deputado-nome')).toBeVisible({ timeout: 5000 })
    
    // Tab Transações
    const tabTransacoes = page.getByRole('tab', { name: /Transações/i })
    await tabTransacoes.click()
    
    // Verificar loading aparece
    const loadingIndicator = page.locator('[data-testid="loading-skeleton"], [data-testid="loading-spinner"]')
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 })
    
    // Aguardar dados carregarem
    await expect(loadingIndicator.first()).toBeHidden({ timeout: 5000 })
    
    // Verificar conteúdo carregou
    const tabelaTransacoes = page.getByTestId('transacoes-table')
    await expect(tabelaTransacoes).toBeVisible()
    
    // Tab Comparativo de Categorias
    const tabComparativo = page.getByRole('tab', { name: /Comparativo/i })
    if (await tabComparativo.isVisible()) {
      await tabComparativo.click()
      
      // Aguardar dados carregarem
      await page.waitForTimeout(1000)
      
      // Verificar gráfico/tabela aparece
      const comparativoContent = page.locator('[data-testid="comparativo-categorias"]')
      await expect(comparativoContent).toBeVisible({ timeout: 5000 })
    }
  })

  test('filtra transações por ano e categoria', async ({ page }) => {
    await page.goto('/gastos/deputados')
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    await primeiroDeputado.click()
    
    // Ir para tab transações
    const tabTransacoes = page.getByRole('tab', { name: /Transações/i })
    await tabTransacoes.click()
    
    // Aguardar tabela carregar
    await page.waitForSelector('[data-testid="transacoes-table"]', { timeout: 5000 })
    
    // Filtrar por ano
    const selectAno = page.locator('[data-testid="transacoes-select-ano"]')
    if (await selectAno.isVisible()) {
      await selectAno.click()
      await page.getByRole('option', { name: '2024' }).click()
      await expect(page).toHaveURL(/ano=2024/)
      
      // Aguardar filtro aplicar
      await page.waitForTimeout(500)
    }
    
    // Filtrar por categoria
    const selectCategoria = page.locator('[data-testid="transacoes-select-categoria"]')
    if (await selectCategoria.isVisible()) {
      await selectCategoria.click()
      await page.getByRole('option', { name: /Combustível/i }).first().click()
      
      // Aguardar filtro aplicar
      await page.waitForTimeout(500)
      
      // Verificar que transações exibidas são da categoria
      const primeiraTransacao = page.locator('[data-testid="transacao-row"]').first()
      if (await primeiraTransacao.isVisible()) {
        const categoria = await primeiraTransacao.locator('[data-testid="transacao-categoria"]').textContent()
        expect(categoria?.toLowerCase()).toContain('combustível')
      }
    }
  })

  test('pagina transações corretamente', async ({ page }) => {
    await page.goto('/gastos/deputados')
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    await primeiroDeputado.click()
    
    // Ir para tab transações
    const tabTransacoes = page.getByRole('tab', { name: /Transações/i })
    await tabTransacoes.click()
    
    // Aguardar tabela carregar
    await page.waitForSelector('[data-testid="transacoes-table"]', { timeout: 5000 })
    
    // Verificar paginação existe
    const btnProximaPagina = page.locator('[data-testid="transacoes-btn-next"]')
    if (await btnProximaPagina.isVisible()) {
      // Capturar primeira transação
      const primeiraTransacaoPg1 = await page.locator('[data-testid="transacao-row"]').first().textContent()
      
      // Ir para próxima página
      await btnProximaPagina.click()
      
      // Aguardar nova página carregar
      await page.waitForTimeout(500)
      
      // Verificar que transações são diferentes
      const primeiraTransacaoPg2 = await page.locator('[data-testid="transacao-row"]').first().textContent()
      expect(primeiraTransacaoPg1).not.toBe(primeiraTransacaoPg2)
    }
  })

  test('exibe rede de relacionamentos do deputado', async ({ page }) => {
    await page.goto('/gastos/deputados')
    await page.waitForSelector('[data-testid="deputado-card"]', { timeout: 5000 })
    
    const primeiroDeputado = page.locator('[data-testid="deputado-card"]').first()
    await primeiroDeputado.click()
    
    // Ir para tab rede (se existir)
    const tabRede = page.getByRole('tab', { name: /Rede/i })
    if (await tabRede.isVisible()) {
      await tabRede.click()
      
      // Aguardar visualização carregar
      await page.waitForTimeout(1000)
      
      // Verificar que grafo/lista aparece
      const redeVisualization = page.locator('[data-testid="rede-relacionamentos"]')
      await expect(redeVisualization).toBeVisible({ timeout: 5000 })
      
      // Verificar que há nós/fornecedores
      const fornecedoresCount = page.locator('[data-testid="fornecedor-node"]')
      expect(await fornecedoresCount.count()).toBeGreaterThan(0)
    }
  })
})