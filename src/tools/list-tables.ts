import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const listTablesToolName = 'list_tables';

export const listTablesToolConfig = {
  title: 'List Tables',
  description: 'List all tables in the specified database (or the current database if not specified).',
  inputSchema: {
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
  },
};

export function createListTablesHandler(runner: QueryRunner) {
  return async ({ database }: { database?: string }) => {
    try {
      const sql = database ? `SHOW TABLES FROM \`${database}\`` : 'SHOW TABLES';
      const [rows] = await runner.query(sql);
      const tables = (rows as Record<string, string>[]).map((r) => Object.values(r)[0]);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(tables) }],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
