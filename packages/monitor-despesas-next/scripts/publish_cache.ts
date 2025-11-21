#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

type CacheManifestEntry = {
  path?: string;
  hash: string;
  size: number;
  lastModified?: string;
};

type CacheManifest = Record<string, CacheManifestEntry>;

type TransactionsManifestEntry = {
  path: string;
  hash: string;
  size: number;
  compressed?: boolean;
  lastModified?: string;
};

type TransactionsManifest = {
  generatedAt: string;
  version: string;
  totalFiles: number;
  files: Record<string, TransactionsManifestEntry>;
};

type ValidationOptions = {
  skipHashCheck: boolean;
};

type CliOptions = ValidationOptions & {
  sourceDir: string;
  targetDir?: string;
  dryRun: boolean;
  skipTransactions: boolean;
  force: boolean;
};

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_OPTIONS: CliOptions = {
  sourceDir: path.resolve(PACKAGE_ROOT, 'public/cache'),
  dryRun: false,
  skipTransactions: false,
  force: false,
  skipHashCheck: false,
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await assertDirectory(options.sourceDir, 'Cache source directory');

  console.log(`→ Validating caches manifest in ${options.sourceDir}`);
  if (options.skipHashCheck) {
    console.log('   (hash verification disabled via --skip-hash-check)');
  }
  const cacheChecks = await validateCacheManifest(options.sourceDir, options);
  console.log(`   ✓ ${cacheChecks} cache entries validated`);

  let transactionChecks = 0;
  if (!options.skipTransactions) {
    console.log('→ Validating transactions manifest');
    transactionChecks = await validateTransactionsManifest(options.sourceDir, options);
    console.log(`   ✓ ${transactionChecks} transaction entries validated`);
  } else {
    console.log('→ Skipping transactions manifest validation');
  }

  if (options.dryRun) {
    console.log('✔ Dry run completed — no files copied');
    return;
  }

  if (!options.targetDir) {
    throw new Error('Target directory is required unless --dry-run is set');
  }

  const targetDir = path.resolve(process.cwd(), options.targetDir);
  await publishArtifacts(options.sourceDir, targetDir, options.force);

  console.log('✔ Cache directory published successfully');
  console.log(`   - cache entries: ${cacheChecks}`);
  if (!options.skipTransactions) {
    console.log(`   - transaction entries: ${transactionChecks}`);
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--':
        continue;
      case '--source':
      case '-s':
        options.sourceDir = path.resolve(process.cwd(), pickNextValue(argv, ++i, arg));
        break;
      case '--target':
      case '-t':
        options.targetDir = pickNextValue(argv, ++i, arg);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--skip-transactions':
        options.skipTransactions = true;
        break;
      case '--skip-hash':
      case '--skip-hash-check':
        options.skipHashCheck = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option ${arg}`);
        }
    }
  }

  return options;
}

function printUsage() {
  console.log(`Usage: publish_cache [options]\n\n` +
    `Options:\n` +
    `  --source, -s <dir>          Source cache directory (default: public/cache)\n` +
    `  --target, -t <dir>          Target directory to receive the caches\n` +
    `  --dry-run                   Validate manifests without copying files\n` +
    `  --skip-transactions         Skip validation for transactions manifest\n` +
    `  --skip-hash-check           Do not recompute hashes (existence check only)\n` +
    `  --force, -f                 Remove target directory if it already exists\n` +
    `  --help, -h                  Show this help message\n`);
}

function pickNextValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

async function validateCacheManifest(sourceDir: string, opts: ValidationOptions): Promise<number> {
  const manifestPath = path.join(sourceDir, 'caches-manifest.json');
  const manifest = await readJson<CacheManifest>(manifestPath);
  const entries = Object.entries(manifest);
  if (!entries.length) {
    throw new Error('caches-manifest.json does not contain any entries');
  }

  for (const [cacheName, entry] of entries) {
    if (!entry.hash || typeof entry.hash !== 'string') {
      throw new Error(`Cache entry ${cacheName} is missing hash information`);
    }
    const resolvedPath = resolveManifestPath(sourceDir, entry.path, cacheName);
    await assertFile(resolvedPath, `Missing cache file for ${cacheName}`);
    if (!opts.skipHashCheck) {
      const fileHash = await computeSha256(resolvedPath);
      if (fileHash !== entry.hash) {
        throw new Error(`Hash mismatch for ${cacheName}\n  expected: ${entry.hash}\n  received: ${fileHash}`);
      }
    }
    if (typeof entry.size === 'number') {
      const stat = await fs.stat(resolvedPath);
      if (stat.size !== entry.size) {
        throw new Error(`Size mismatch for ${cacheName}\n  expected: ${entry.size}\n  received: ${stat.size}`);
      }
    }
    await ensureCompressedVariant(resolvedPath, cacheName);
  }

  return entries.length;
}

async function validateTransactionsManifest(sourceDir: string, opts: ValidationOptions): Promise<number> {
  const manifestPath = path.join(sourceDir, 'transactions', 'transactions-manifest.json');
  const manifest = await readJson<TransactionsManifest>(manifestPath);
  const files = Object.entries(manifest.files || {});
  if (files.length !== manifest.totalFiles) {
    throw new Error(`transactions-manifest totalFiles mismatch (expected ${manifest.totalFiles}, found ${files.length})`);
  }

  await runWithConcurrency(files, 50, async ([key, entry]) => {
    const resolvedPath = resolveManifestPath(sourceDir, entry.path, path.join('transactions', key));
    await assertFile(resolvedPath, `Missing transaction file for ${key}`);
    if (!opts.skipHashCheck) {
      const fileHash = await computeSha256(resolvedPath);
      if (fileHash !== entry.hash) {
        throw new Error(`Hash mismatch for ${key}`);
      }
    }
    if (entry.compressed) {
      await assertFile(`${resolvedPath}.gz`, `Missing compressed variant (.gz) for ${key}`);
    }
  });

  return files.length;
}

async function publishArtifacts(sourceDir: string, targetDir: string, force: boolean) {
  await assertDirectory(sourceDir, 'Source directory');
  await ensureNotNested(sourceDir, targetDir);

  const targetExists = await pathExists(targetDir);
  if (targetExists) {
    if (!force) {
      const entries = await fs.readdir(targetDir);
      if (entries.length > 0) {
        throw new Error(`Target directory ${targetDir} already exists — use --force to overwrite`);
      }
    }
    await fs.rm(targetDir, { recursive: true, force: true });
  }

  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function ensureCompressedVariant(filePath: string, cacheName: string) {
  const gzPath = `${filePath}.gz`;
  const hasGzip = await pathExists(gzPath);
  if (!hasGzip) {
    throw new Error(`Missing gzip variant for ${cacheName}`);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

function resolveManifestPath(sourceDir: string, manifestPath: string | undefined, fallback: string): string {
  const raw = manifestPath ?? fallback;
  const trimmed = raw.replace(/^[/\\]+/, '');
  const withoutCache = trimmed.startsWith('cache/')
    ? trimmed.slice('cache/'.length)
    : trimmed.startsWith('cache\\')
      ? trimmed.slice('cache\\'.length)
      : trimmed;
  const normalized = withoutCache.replace(/\\/g, '/');
  const safePath = path.normalize(normalized).replace(/^\.\//, '');
  const resolved = path.resolve(sourceDir, safePath);
  ensureInsideDirectory(sourceDir, resolved);
  return resolved;
}

async function assertDirectory(dirPath: string, label: string) {
  const stat = await fs.stat(dirPath).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`${label} not found: ${dirPath}`);
  }
}

async function assertFile(filePath: string, message: string) {
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`${message} (${filePath})`);
  }
}

function ensureInsideDirectory(baseDir: string, targetPath: string) {
  const relative = path.relative(baseDir, targetPath);
  const isOutside =
    relative === ''
      ? false
      : relative.startsWith('..') || relative.startsWith(`..${path.sep}`);
  if (isOutside) {
    throw new Error(`Resolved path escapes source directory: ${targetPath}`);
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureNotNested(sourceDir: string, targetDir: string) {
  const relative = path.relative(sourceDir, targetDir);
  if (!relative.startsWith('..')) {
    throw new Error('Target directory must not be nested inside the source directory');
  }
}

async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk: any) => hash.update(chunk));
    stream.on('error', (error: any) => reject(error));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function runWithConcurrency<T>(items: T[], limit: number, iterator: (item: T) => Promise<void>) {
  let index = 0;
  const worker = async () => {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) {
        return;
      }
      await iterator(items[currentIndex]);
    }
  };

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

main().catch((error) => {
  console.error('\n✖ Cache publication failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
