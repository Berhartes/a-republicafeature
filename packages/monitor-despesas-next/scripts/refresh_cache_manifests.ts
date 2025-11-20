#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

type CacheManifestEntry = {
  path?: string
  hash: string
  size: number
  lastModified?: string
}

type CacheManifest = Record<string, CacheManifestEntry>

type TransactionsManifestEntry = CacheManifestEntry & {
  compressed?: boolean
  gzSize?: number
}

type TransactionsManifest = {
  generatedAt: string
  version?: string
  totalFiles: number
  files: Record<string, TransactionsManifestEntry>
}

type CliOptions = {
  sourceDir: string
  skipTransactions: boolean
}

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..')
const DEFAULT_OPTIONS: CliOptions = {
  sourceDir: path.resolve(PACKAGE_ROOT, 'public/cache'),
  skipTransactions: false,
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await assertDirectory(options.sourceDir, 'Cache directory')

  const cachesUpdated = await refreshCachesManifest(options.sourceDir)
  console.log(`✔ Atualizado caches-manifest.json (${cachesUpdated} entradas)`) 

  let transactionsUpdated = 0
  if (!options.skipTransactions) {
    transactionsUpdated = await refreshTransactionsManifest(options.sourceDir)
    console.log(`✔ Atualizado transactions-manifest.json (${transactionsUpdated} entradas)`)
  } else {
    console.log('→ Ignorando transactions-manifest.json (flag --skip-transactions)')
  }

  console.log('\nResumo:')
  console.log(`  • Caches principais: ${cachesUpdated}`)
  if (!options.skipTransactions) {
    console.log(`  • Transações paginadas: ${transactionsUpdated}`)
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case '--':
        continue
      case '--source':
      case '-s':
        options.sourceDir = path.resolve(process.cwd(), pickNextValue(argv, ++i, arg))
        break
      case '--skip-transactions':
        options.skipTransactions = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
      default:
        throw new Error(`Unknown option ${arg}`)
    }
  }

  return options
}

function pickNextValue(argv: string[], index: number, flag: string): string {
  const value = argv[index]
  if (!value) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

function printUsage() {
  console.log(`Usage: refresh_cache_manifests [options]\n\n` +
    `Options:\n` +
    `  --source, -s <dir>      Diretório base do cache (default: public/cache)\n` +
    `  --skip-transactions     Não recalcula transactions-manifest.json\n` +
    `  --help, -h              Exibe esta ajuda`)
}

async function refreshCachesManifest(sourceDir: string): Promise<number> {
  const manifestPath = path.join(sourceDir, 'caches-manifest.json')
  const manifest = await readJson<CacheManifest>(manifestPath)
  const entries = Object.entries(manifest)

  if (entries.length === 0) {
    console.warn('⚠ caches-manifest.json está vazio — nada a recalcular')
    return 0
  }

  const updated: CacheManifest = {}
  for (const [cacheName, entry] of entries) {
    const resolved = resolveManifestPath(sourceDir, entry.path, cacheName)
    const metadata = await buildCacheEntryMetadata(resolved, entry.path ?? `/cache/${cacheName}`)
    updated[cacheName] = {
      ...entry,
      ...metadata,
    }
  }

  await writeJson(manifestPath, updated)
  return entries.length
}

async function refreshTransactionsManifest(sourceDir: string): Promise<number> {
  const manifestPath = path.join(sourceDir, 'transactions', 'transactions-manifest.json')
  const manifest = await readJson<TransactionsManifest>(manifestPath)
  const entries = Object.entries(manifest.files || {})

  if (entries.length === 0) {
    console.warn('⚠ transactions-manifest.json está vazio — nada a recalcular')
    await writeJson(manifestPath, {
      ...manifest,
      generatedAt: new Date().toISOString(),
      totalFiles: 0,
      files: {},
    })
    return 0
  }

  const updatedFiles: Record<string, TransactionsManifestEntry> = {}

  await runWithConcurrency(entries, 40, async ([filename, entry]) => {
    const resolved = resolveManifestPath(sourceDir, entry.path, path.join('transactions', filename))
    const metadata = await buildTransactionsEntryMetadata(resolved, entry.path ?? path.join('transactions', filename))
    updatedFiles[filename] = {
      ...entry,
      ...metadata,
    }
  })

  await writeJson(manifestPath, {
    ...manifest,
    generatedAt: new Date().toISOString(),
    totalFiles: Object.keys(updatedFiles).length,
    files: updatedFiles,
  })

  return entries.length
}

async function buildCacheEntryMetadata(filePath: string, manifestPath: string): Promise<CacheManifestEntry> {
  const stat = await fs.stat(filePath)
  return {
    path: manifestPath,
    hash: await computeSha256(filePath),
    size: stat.size,
    lastModified: stat.mtime.toISOString(),
  }
}

async function buildTransactionsEntryMetadata(filePath: string, manifestPath: string): Promise<TransactionsManifestEntry> {
  const stat = await fs.stat(filePath)
  const gzPath = `${filePath}.gz`
  const hasGzip = await pathExists(gzPath)
  return {
    path: manifestPath,
    hash: await computeSha256(filePath),
    size: stat.size,
    lastModified: stat.mtime.toISOString(),
    compressed: hasGzip,
    gzSize: hasGzip ? (await fs.stat(gzPath)).size : undefined,
  }
}

async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk: any) => hash.update(chunk))
    stream.on('error', (error: any) => reject(error))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function assertDirectory(dirPath: string, label: string) {
  const stat = await fs.stat(dirPath).catch(() => null)
  if (!stat || !stat.isDirectory()) {
    throw new Error(`${label} não encontrado: ${dirPath}`)
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function resolveManifestPath(sourceDir: string, manifestPath: string | undefined, fallback: string): string {
  const candidate = manifestPath ?? fallback
  const sanitized = candidate.replace(/^[/\\]+/, '')
  const normalized = sanitized.startsWith('cache/') || sanitized.startsWith('cache\\')
    ? sanitized.slice('cache/'.length)
    : sanitized
  const safe = normalized.replace(/\\/g, '/')
  const resolved = path.resolve(sourceDir, safe)
  ensureInsideDirectory(sourceDir, resolved)
  return resolved
}

function ensureInsideDirectory(baseDir: string, targetPath: string) {
  const relative = path.relative(baseDir, targetPath)
  const isOutside =
    relative === ''
      ? false
      : relative.startsWith('..') || relative.startsWith(`..${path.sep}`)
  if (isOutside) {
    throw new Error(`Resolved path escapes source directory: ${targetPath}`)
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data) as T
}

async function writeJson(filePath: string, payload: any) {
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8')
}

async function runWithConcurrency<T>(items: T[], limit: number, iterator: (item: T) => Promise<void>) {
  let index = 0
  const worker = async () => {
    while (true) {
      const currentIndex = index
      index += 1
      if (currentIndex >= items.length) {
        return
      }
      await iterator(items[currentIndex])
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

main().catch(error => {
  console.error('\n✖ Falha ao regenerar os manifests de cache')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
