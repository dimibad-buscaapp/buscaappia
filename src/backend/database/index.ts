import initSqlJs, { Database as SqlDatabase, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { runMigrations } from './migrations';
import { buildDatabaseStatus, DatabaseStatus } from './status';

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
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

  get(...params: SqlValue[]): Record<string, unknown> | undefined {
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

  run(...params: SqlValue[]): StmtResult {
    this.db.run(this.sql, params);
    const row = this.db.exec(
      'SELECT last_insert_rowid() AS id, changes() AS changes'
    )[0];
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

  exec(sql: string): void {
    this.db.run(sql);
  }

  pragma(statement: string): void {
    this.db.run(`PRAGMA ${statement}`);
  }

  getRaw(): SqlDatabase {
    return this.db;
  }

  persist(): void {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }
}

let client: DbClient | null = null;
let resolvedDbPath = '';
let databaseReady = false;

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || 'sqlite://./database.sqlite';
  const dbPath = url.replace(/^sqlite:\/\//, '');

  return path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(process.cwd(), dbPath);
}

/** Compatível com o Prompt 4: getDatabase() */
export function getDatabase(): DbClient {
  return getDb();
}

export function getDb(): DbClient {
  if (!client) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return client;
}

export function getDbPath(): string {
  return resolvedDbPath;
}

export async function setupDatabase(): Promise<DbClient> {
  resolvedDbPath = resolveDbPath();
  const dir = path.dirname(resolvedDbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  const db = fs.existsSync(resolvedDbPath)
    ? new SQL.Database(fs.readFileSync(resolvedDbPath))
    : new SQL.Database();

  client = new DbClient(db, resolvedDbPath);
  client.pragma('journal_mode = WAL');

  try {
    runMigrations(db);
  } catch (error) {
    client = null;
    databaseReady = false;
    throw error;
  }

  client.persist();
  databaseReady = true;

  console.log('✅ Database setup complete');
  console.log(`   Path: ${resolvedDbPath}`);

  return client;
}

export function persistDatabase(): void {
  client?.persist();
}

export function closeDatabase(): void {
  if (client) {
    client.persist();
    client = null;
  }
  databaseReady = false;
}

export type { DatabaseStatus };

export function isDatabaseReady(): boolean {
  return databaseReady && client !== null;
}

export function getDatabaseStatus(): DatabaseStatus {
  if (!client || !databaseReady) {
    throw new Error('Database not initialized');
  }
  return buildDatabaseStatus(client.getRaw(), resolvedDbPath);
}
