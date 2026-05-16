import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

let db: Database.Database | null = null;

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || 'sqlite://./database.sqlite';
  const dbPath = url.replace(/^sqlite:\/\//, '');

  return path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(process.cwd(), dbPath);
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return db;
}

export async function setupDatabase(): Promise<void> {
  const resolvedPath = resolveDbPath();
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log(`Database ready: ${resolvedPath}`);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
