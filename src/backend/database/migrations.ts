import { Database as SqlDatabase } from 'sql.js';
import { MIGRATIONS, SCHEMA_STATEMENTS } from './schema';

function tableColumns(db: SqlDatabase, table: string): string[] {
  const info = db.exec(`PRAGMA table_info(${table})`);
  if (!info[0]?.values) {
    return [];
  }
  return info[0].values.map((row) => String(row[1]));
}

/** Migra users antigos (email + password_hash) para o schema do Prompt 4 */
function migrateLegacyUsers(db: SqlDatabase): void {
  const columns = tableColumns(db, 'users');
  if (!columns.length || columns.includes('username')) {
    return;
  }

  if (!columns.includes('password_hash')) {
    return;
  }

  db.run('ALTER TABLE users RENAME TO users_legacy');
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    INSERT INTO users (id, username, email, password, role, created_at)
    SELECT id, email, email, password_hash, 'user', created_at
    FROM users_legacy;
  `);
  db.run('DROP TABLE users_legacy');
}

/** Remove tabelas do schema anterior (apps / search_logs) se existirem */
function dropDeprecatedTables(db: SqlDatabase): void {
  for (const table of ['search_logs', 'apps']) {
    const cols = tableColumns(db, table);
    if (cols.length) {
      db.run(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}

export function runMigrations(db: SqlDatabase): void {
  for (const sql of SCHEMA_STATEMENTS) {
    try {
      db.run(sql);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Migration failed: ${msg}`);
    }
  }

  try {
    migrateLegacyUsers(db);
    dropDeprecatedTables(db);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Legacy migration failed: ${msg}`);
  }

  for (const migration of MIGRATIONS) {
    const exists = db.prepare(
      'SELECT 1 FROM schema_migrations WHERE version = ?'
    );
    exists.bind([migration.version]);
    const alreadyApplied = exists.step();
    exists.free();

    if (!alreadyApplied) {
      db.run(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
    }
  }
}
