const HINTS: [RegExp, string][] = [
  [/Table '.*' doesn't exist/i, 'Hint: use list_tables to check available tables.'],
  [/Unknown column/i, 'Hint: use describe_table to check column names.'],
  [/Unknown database/i, 'Hint: use list_databases to check available databases.'],
  [/Access denied/i, 'Hint: check database user permissions.'],
  [/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i, 'Hint: check MYSQL_HOST and MYSQL_PORT settings.'],
  [/ER_PARSE_ERROR/i, 'Hint: check SQL syntax.'],
  [/Query timeout/i, 'Hint: increase MYSQL_QUERY_TIMEOUT or optimize the query.'],
];

export function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const hint = HINTS.find(([pattern]) => pattern.test(message));
  return hint ? `Error: ${message}\n${hint[1]}` : `Error: ${message}`;
}
