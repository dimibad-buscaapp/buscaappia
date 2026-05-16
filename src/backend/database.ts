import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

interface StmtResult {
  lastInsertRowid: number;
  changes: number;
}

class Statement {
  constructor(
    private db: SqlDatabase,
    private sql: string
  ) {}

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject() as Record<string, unknown>;
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  run(...params: unknown[]): StmtResult {
    this.db.run(this.sql, params as initSqlJs.BindParams);
    const row = this.db.exec('SELECT last_insert_rowid() AS id, changes() AS changes')[0];
    return {
      lastInsertRowid: Number(row?.values[0]?.[0] ?? 0),
      changes: Number(row?.values[0]?.[1] ?? 0)
    };
  }
}

class DbClient {
  constructor(
    private db: SqlDatabase,
    private dbPath: string
  ) {}

  prepare(sql: string): Statement {
    return new Statement(this.db, sql);
  }

  persist(): void {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }
}

let client: DbClient | null = null;

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || 'sqlite://./database.sqlite';
  const dbPath = url.replace(/^sqlite:\/\//, '');

  return path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(process.cwd(), dbPath);
}

export function getDb(): DbClient {
  if (!client) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return client;
}

export async function setupDatabase(): Promise<void> {
  const resolvedPath = resolveDbPath();
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  const db = fs.existsSync(resolvedPath)
    ? new SQL.Database(fs.readFileSync(resolvedPath))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  client = new DbClient(db, resolvedPath);
  client.persist();

  console.log(`Database ready: ${resolvedPath}`);
}

export function persistDatabase(): void {
  client?.persist();
}

export function closeDatabase(): void {
  if (client) {
    client.persist();
    client = null;
  }
}
