import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

function findProjectRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    const workspaceFile = path.join(current, 'pnpm-workspace.yaml');
    const gitFolder = path.join(current, '.git');

    if (fs.existsSync(workspaceFile) || fs.existsSync(gitFolder)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }

    current = parent;
  }
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = findProjectRoot(moduleDir);

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadEnv({ path: path.join(projectRoot, envFile) });

const EnvSchema = z.object({
  PORT: z.string().optional(),
  SQLITE_DB_PATH: z.string().optional(),
  USE_UNIFIED_BACKEND: z.string().optional()
});

const parsed = EnvSchema.parse(process.env);

function toAbsolute(candidate: string): string {
  if (path.isAbsolute(candidate)) return candidate;
  return path.join(projectRoot, candidate);
}

function resolveSqlitePath(customPath?: string): string {
  if (customPath) {
    return toAbsolute(customPath);
  }

  const preferred = toAbsolute('bancoDados/monitordespesas/monitordespesas.db');
  const legacy = toAbsolute('bancodeDados/monitordespesas/monitordespesas.db');

  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(legacy)) return legacy;

  const preferredDir = path.dirname(preferred);
  if (fs.existsSync(preferredDir)) return preferred;

  const legacyDir = path.dirname(legacy);
  if (fs.existsSync(legacyDir)) return legacy;

  return preferred;
}

export const env = {
  port: parsed.PORT ? Number(parsed.PORT) : 3333,
  sqliteDbPath: resolveSqlitePath(parsed.SQLITE_DB_PATH),
  useUnifiedBackend: (parsed.USE_UNIFIED_BACKEND ?? 'true').toLowerCase() === 'true'
};

if (Number.isNaN(env.port)) {
  throw new Error('PORT env var precisa ser um número.');
}
