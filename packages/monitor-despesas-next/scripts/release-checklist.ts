#!/usr/bin/env tsx

/**
 * Release Checklist - Validação Pré-Deploy
 * 
 * Valida todas as etapas do pipeline antes de fazer deploy:
 * 1. Contracts validation
 * 2. Datalake integrity
 * 3. Cache manifests refresh
 * 4. Cache publish dry-run
 * 5. Frontend type-check
 * 6. E2E tests (opcional)
 * 
 * Uso:
 *   pnpm tsx scripts/release-checklist.ts
 *   RUN_E2E=true pnpm tsx scripts/release-checklist.ts
 * 
 * @author A República
 * @since Nov 2025
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ========================================
// Types
// ========================================

interface CheckResult {
  step: string
  status: 'pass' | 'fail' | 'skip'
  output?: string
  duration?: number
  error?: string
}

// ========================================
// Check Functions
// ========================================

/**
 * Valida contratos com API Dados Abertos
 */
async function checkContractsValidation(): Promise<CheckResult> {
  const start = Date.now()
  
  try {
    const { stdout } = await execAsync('pnpm contracts:validate', {
      cwd: '../../..',
      timeout: 30000, // 30s
    })
    
    return {
      step: 'Contracts Validation',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'Contracts Validation',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

/**
 * Verifica integridade do datalake
 */
async function checkDatalakeIntegrity(): Promise<CheckResult> {
  const start = Date.now()
  
  try {
    const { stdout } = await execAsync(
      'pnpm --filter @a-republica/etl-python run datalake:verify',
      {
        cwd: '../../..',
        timeout: 60000, // 60s
      }
    )
    
    return {
      step: 'Datalake Integrity',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'Datalake Integrity',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

/**
 * Atualiza manifests de cache
 */
async function checkCacheManifestsRefresh(): Promise<CheckResult> {
  const start = Date.now()
  
  try {
    const { stdout } = await execAsync(
      'pnpm --filter @a-republica/monitor-despesas-next cache:manifests:refresh',
      {
        cwd: '../../..',
        timeout: 120000, // 120s
      }
    )
    
    return {
      step: 'Cache Manifests Refresh',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'Cache Manifests Refresh',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

/**
 * Dry-run de publicação de caches
 */
async function checkCachePublishDryRun(): Promise<CheckResult> {
  const start = Date.now()
  
  try {
    const { stdout } = await execAsync(
      'pnpm --filter @a-republica/monitor-despesas-next cache:publish:dry-run',
      {
        cwd: '../../..',
        timeout: 60000, // 60s
      }
    )
    
    return {
      step: 'Cache Publish (Dry-run)',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'Cache Publish (Dry-run)',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

/**
 * Type-check do frontend
 */
async function checkFrontendTypeCheck(): Promise<CheckResult> {
  const start = Date.now()
  
  try {
    const { stdout } = await execAsync(
      'pnpm --filter @a-republica/monitor-despesas-next type-check',
      {
        cwd: '../../..',
        timeout: 60000, // 60s
      }
    )
    
    return {
      step: 'Frontend Type-check',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'Frontend Type-check',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

/**
 * Testes E2E (opcional)
 */
async function checkE2ETests(): Promise<CheckResult> {
  const start = Date.now()
  
  if (process.env.RUN_E2E !== 'true') {
    return {
      step: 'E2E Tests',
      status: 'skip',
      output: 'Pulado (RUN_E2E não definido)',
    }
  }
  
  try {
    const { stdout } = await execAsync(
      'pnpm --filter @a-republica/monitor-despesas-next test:e2e',
      {
        cwd: '../../..',
        timeout: 300000, // 5min
      }
    )
    
    return {
      step: 'E2E Tests',
      status: 'pass',
      output: stdout.trim(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      step: 'E2E Tests',
      status: 'fail',
      error: (error as Error).message,
      duration: Date.now() - start,
    }
  }
}

// ========================================
// Main Checklist Runner
// ========================================

async function runChecklist(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  console.log('🚀 Release Checklist Iniciado')
  console.log('='.repeat(80))
  console.log()

  // Executar checks em sequência (alguns dependem de outros)
  const checks = [
    { name: 'Contracts Validation', fn: checkContractsValidation },
    { name: 'Datalake Integrity', fn: checkDatalakeIntegrity },
    { name: 'Cache Manifests Refresh', fn: checkCacheManifestsRefresh },
    { name: 'Cache Publish (Dry-run)', fn: checkCachePublishDryRun },
    { name: 'Frontend Type-check', fn: checkFrontendTypeCheck },
    { name: 'E2E Tests', fn: checkE2ETests },
  ]

  for (const check of checks) {
    console.log(`⏳ Executando: ${check.name}...`)
    const result = await check.fn()
    results.push(result)
    
    const icon =
      result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    const duration = result.duration ? `(${result.duration}ms)` : ''
    console.log(`${icon} ${result.step} ${duration}`)
    
    if (result.error) {
      console.error(`   Erro: ${result.error.slice(0, 200)}...`)
    }
    
    console.log()
  }

  return results
}

/**
 * Exibe sumário final
 */
function printSummary(results: CheckResult[]): void {
  console.log('='.repeat(80))
  console.log('📊 Sumário do Checklist')
  console.log('='.repeat(80))
  console.log()

  results.forEach((result) => {
    const icon =
      result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    const duration = result.duration ? `${(result.duration / 1000).toFixed(2)}s` : '-'
    console.log(`${icon} ${result.step.padEnd(30)} ${duration.padStart(8)}`)
  })

  console.log()

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const skipped = results.filter((r) => r.status === 'skip').length

  console.log(`📈 Resultados:`)
  console.log(`   ✅ Passou: ${passed}`)
  console.log(`   ❌ Falhou: ${failed}`)
  console.log(`   ⏭️  Pulado: ${skipped}`)
  console.log()

  if (failed > 0) {
    console.error('❌ CHECKLIST FALHOU - Corrija os erros antes de prosseguir')
    console.error()
    console.error('📚 Consulte o runbook para troubleshooting:')
    console.error('   docs/11-tools/RUNBOOK_PIPELINE.md')
    console.error()
  } else {
    console.log('✅ CHECKLIST PASSOU - Pronto para deploy!')
    console.log()
  }
}

// ========================================
// CLI
// ========================================

async function main() {
  try {
    const results = await runChecklist()
    printSummary(results)

    // Exit code baseado em falhas
    const hasFailures = results.some((r) => r.status === 'fail')
    process.exit(hasFailures ? 1 : 0)
  } catch (error) {
    console.error('❌ Erro fatal ao executar checklist:', error)
    process.exit(1)
  }
}

main()
