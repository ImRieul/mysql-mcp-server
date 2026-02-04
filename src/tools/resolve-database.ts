type QueryFn = (sql: string) => Promise<[unknown, unknown]>;

export async function resolveDatabase(query: QueryFn, database?: string): Promise<string | null> {
  if (database) return database;
  const [rows] = await query('SELECT DATABASE() AS db');
  const db = (rows as Record<string, unknown>[])[0]?.db;
  return typeof db === 'string' ? db : null;
}
