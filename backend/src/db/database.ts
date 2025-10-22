import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

export function openReadOnlyDatabase(databasePath: string): Database {
  const resolvedPath = path.resolve(process.cwd(), databasePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new DatabaseUnavailableError(`SQLite database not found at ${resolvedPath}`);
  }

  return new Database(resolvedPath, { readonly: true, fileMustExist: true });
}
