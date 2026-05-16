import { Database as SqlDatabase } from 'sql.js';

export interface DatabaseStatus {
  connected: boolean;
  path: string;
  migrations: number[];
  tables: {
    users: number;
    projects: number;
    chat_history: number;
    builds: number;
  };
}

export function buildDatabaseStatus(
  db: SqlDatabase,
  dbPath: string
): DatabaseStatus {
  const count = (table: string): number => {
    try {
      const result = db.exec(`SELECT COUNT(*) AS c FROM ${table}`);
      return Number(result[0]?.values[0]?.[0] ?? 0);
    } catch {
      return 0;
    }
  };

  const migrationsResult = db.exec(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  const migrations =
    migrationsResult[0]?.values.map((row) => Number(row[0])) ?? [];

  return {
    connected: true,
    path: dbPath,
    migrations,
    tables: {
      users: count('users'),
      projects: count('projects'),
      chat_history: count('chat_history'),
      builds: count('builds')
    }
  };
}
