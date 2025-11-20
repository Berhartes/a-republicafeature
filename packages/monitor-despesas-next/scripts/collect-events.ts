#!/usr/bin/env tsx

/**
 * Coletor de Eventos do Pipeline
 * 
 * Consolida manifests de ETL, Datalake e Cache em eventos estruturados
 * para observabilidade centralizada.
 * 
 * Uso:
 *   pnpm tsx scripts/collect-events.ts
 *   pnpm tsx scripts/collect-events.ts --output json
 *   pnpm tsx scripts/collect-events.ts --output sheets --sheet-id YOUR_SHEET_ID
 * 
 * @author A República
 * @since Nov 2025
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========================================
// Types
// ========================================

interface PipelineEvent {
  type: string
  timestamp: string
  status: 'success' | 'failure' | 'warning' | 'unknown'
  metadata: Record<string, unknown>
}

interface CollectorOptions {
  output: 'json' | 'sheets' | 'console'
  sheetId?: string
}

// ========================================
// Event Collectors
// ========================================

/**
 * Coleta eventos do ETL Run Manifest
 */
async function collectETLEvents(): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = []
  const manifestPath = path.join(
    __dirname,
    '../../../bancoDados/monitordespesas/_etl-run-manifest.json'
  )

  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(content)

    events.push({
      type: 'etl_run_manifest',
      timestamp: manifest.endTime || new Date().toISOString(),
      status: manifest.success ? 'success' : 'failure',
      metadata: {
        duration: manifest.duration || 0,
        recordsProcessed: manifest.summary?.totalRecords || 0,
        deputiesProcessed: manifest.summary?.deputiesProcessed || 0,
        transactionsProcessed: manifest.summary?.transactionsProcessed || 0,
        commit: manifest.gitCommit || 'unknown',
        branch: manifest.gitBranch || 'unknown',
        errors: manifest.errors || [],
      },
    })

    console.log('✅ ETL manifest coletado:', manifestPath)
  } catch (error) {
    console.warn('⚠️  ETL manifest não encontrado:', manifestPath)
    events.push({
      type: 'etl_run_manifest',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      metadata: {
        error: 'Manifest file not found',
        path: manifestPath,
      },
    })
  }

  return events
}

/**
 * Coleta eventos do Datalake Manifest
 */
async function collectDatalakeEvents(): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = []
  const manifestPath = path.join(
    __dirname,
    '../../../bancoDados/monitordespesas/_datalake-manifest.json'
  )

  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(content)

    const totalFiles = Object.keys(manifest.files || {}).length
    const totalSize = manifest.totalSize || 0
    const legislaturas = manifest.legislaturas || []

    events.push({
      type: 'datalake_verify',
      timestamp: manifest.generatedAt || new Date().toISOString(),
      status: 'success',
      metadata: {
        filesChecked: totalFiles,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        legislaturas,
        partitionedBy: manifest.partitionedBy || 'unknown',
      },
    })

    console.log('✅ Datalake manifest coletado:', manifestPath)
  } catch (error) {
    console.warn('⚠️  Datalake manifest não encontrado:', manifestPath)
    events.push({
      type: 'datalake_verify',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      metadata: {
        error: 'Manifest file not found',
        path: manifestPath,
      },
    })
  }

  return events
}

/**
 * Coleta eventos dos Cache Manifests
 */
async function collectCacheEvents(): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = []

  // 1. Caches Manifest (suppliers, deputies, dashboard, etc.)
  const cachesManifestPath = path.join(__dirname, '../public/cache/caches-manifest.json')
  
  try {
    const content = await fs.readFile(cachesManifestPath, 'utf-8')
    const manifest = JSON.parse(content)

    const totalSize = manifest.entries?.reduce(
      (sum: number, entry: { size: number }) => sum + entry.size,
      0
    ) || 0

    events.push({
      type: 'cache_publish_caches',
      timestamp: manifest.generatedAt || new Date().toISOString(),
      status: 'success',
      metadata: {
        filesPublished: manifest.entries?.length || 0,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        entries: manifest.entries?.map((e: { name: string; size: number }) => ({
          name: e.name,
          sizeMB: (e.size / (1024 * 1024)).toFixed(2),
        })) || [],
      },
    })

    console.log('✅ Caches manifest coletado:', cachesManifestPath)
  } catch (error) {
    console.warn('⚠️  Caches manifest não encontrado:', cachesManifestPath)
    events.push({
      type: 'cache_publish_caches',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      metadata: {
        error: 'Manifest file not found',
        path: cachesManifestPath,
      },
    })
  }

  // 2. Transactions Manifest
  const transactionsManifestPath = path.join(
    __dirname,
    '../public/cache/transactions/transactions-manifest.json'
  )

  try {
    const content = await fs.readFile(transactionsManifestPath, 'utf-8')
    const manifest = JSON.parse(content)

    events.push({
      type: 'cache_publish_transactions',
      timestamp: manifest.generatedAt || new Date().toISOString(),
      status: 'success',
      metadata: {
        deputiesWithPages: manifest.deputiesWithPages || 0,
        totalPages: manifest.totalPages || 0,
        totalTransactions: manifest.totalTransactions || 0,
        avgPagesPerDeputy: manifest.deputiesWithPages
          ? (manifest.totalPages / manifest.deputiesWithPages).toFixed(2)
          : 0,
      },
    })

    console.log('✅ Transactions manifest coletado:', transactionsManifestPath)
  } catch (error) {
    console.warn('⚠️  Transactions manifest não encontrado:', transactionsManifestPath)
    events.push({
      type: 'cache_publish_transactions',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      metadata: {
        error: 'Manifest file not found',
        path: transactionsManifestPath,
      },
    })
  }

  return events
}

/**
 * Coleta todos os eventos do pipeline
 */
async function collectAllEvents(): Promise<PipelineEvent[]> {
  console.log('🔍 Coletando eventos do pipeline...\n')

  const [etlEvents, datalakeEvents, cacheEvents] = await Promise.all([
    collectETLEvents(),
    collectDatalakeEvents(),
    collectCacheEvents(),
  ])

  const allEvents = [...etlEvents, ...datalakeEvents, ...cacheEvents]

  // Ordenar por timestamp (mais recente primeiro)
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  console.log(`\n✅ Total de eventos coletados: ${allEvents.length}`)
  return allEvents
}

// ========================================
// Output Handlers
// ========================================

/**
 * Salva eventos em arquivo JSON
 */
async function saveToJSON(events: PipelineEvent[]): Promise<void> {
  const outputPath = path.join(__dirname, '../observability-events.json')
  await fs.writeFile(outputPath, JSON.stringify(events, null, 2), 'utf-8')
  console.log(`\n📄 Eventos salvos em: ${outputPath}`)
}

/**
 * Exibe eventos no console
 */
function printToConsole(events: PipelineEvent[]): void {
  console.log('\n📊 Eventos do Pipeline:\n')
  console.log('='.repeat(80))

  events.forEach((event, index) => {
    const statusIcon =
      event.status === 'success'
        ? '✅'
        : event.status === 'failure'
        ? '❌'
        : event.status === 'warning'
        ? '⚠️'
        : '❓'

    console.log(`\n${index + 1}. ${statusIcon} ${event.type}`)
    console.log(`   Timestamp: ${new Date(event.timestamp).toLocaleString('pt-BR')}`)
    console.log(`   Status: ${event.status}`)
    console.log('   Metadata:')

    Object.entries(event.metadata).forEach(([key, value]) => {
      const formattedValue =
        typeof value === 'object' ? JSON.stringify(value, null, 2) : value
      console.log(`     - ${key}: ${formattedValue}`)
    })
  })

  console.log('\n' + '='.repeat(80))

  // Resumo
  const successCount = events.filter((e) => e.status === 'success').length
  const failureCount = events.filter((e) => e.status === 'failure').length
  const unknownCount = events.filter((e) => e.status === 'unknown').length

  console.log('\n📈 Resumo:')
  console.log(`   ✅ Sucessos: ${successCount}`)
  console.log(`   ❌ Falhas: ${failureCount}`)
  console.log(`   ❓ Desconhecidos: ${unknownCount}`)
}

/**
 * Envia eventos para Google Sheets
 * @todo Implementar integração com Google Sheets API
 */
async function pushToSheets(events: PipelineEvent[], sheetId: string): Promise<void> {
  console.log('\n🚧 Google Sheets integration not implemented yet')
  console.log(`   Sheet ID: ${sheetId}`)
  console.log('   Events to push:', events.length)
  
  // Placeholder: salvar JSON como fallback
  await saveToJSON(events)
  
  console.log('\n💡 Para implementar integração com Sheets:')
  console.log('   1. Instalar: pnpm add googleapis')
  console.log('   2. Configurar Service Account credentials')
  console.log('   3. Implementar GoogleSheetsService em utils/')
}

// ========================================
// CLI
// ========================================

async function main() {
  const args = process.argv.slice(2)
  const options: CollectorOptions = {
    output: 'console',
  }

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1] as 'json' | 'sheets' | 'console'
      i++
    } else if (args[i] === '--sheet-id' && args[i + 1]) {
      options.sheetId = args[i + 1]
      i++
    }
  }

  try {
    const events = await collectAllEvents()

    // Output conforme opção
    switch (options.output) {
      case 'json':
        await saveToJSON(events)
        break
      case 'sheets':
        if (!options.sheetId) {
          console.error('❌ Erro: --sheet-id é obrigatório para output "sheets"')
          process.exit(1)
        }
        await pushToSheets(events, options.sheetId)
        break
      case 'console':
      default:
        printToConsole(events)
        break
    }

    // Exit code baseado em falhas
    const hasFailures = events.some((e) => e.status === 'failure')
    process.exit(hasFailures ? 1 : 0)
  } catch (error) {
    console.error('❌ Erro fatal ao coletar eventos:', error)
    process.exit(1)
  }
}

main()
