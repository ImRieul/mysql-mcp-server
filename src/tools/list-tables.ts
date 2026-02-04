import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';
import { resolveDatabase } from './resolve-database.js';
import { quoteStringValue } from './sql-escape.js';

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
      return await runner.withConnection(async (query) => {
        const db = await resolveDatabase(query, database);
        if (!db) {
          return {
            isError: true as const,
            content: [
              {
                type: 'text' as const,
                text: 'Error: No database selected. Specify a database name or set MYSQL_DATABASE.',
              },
            ],
          };
        }

        const sql = `SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${quoteStringValue(db)} ORDER BY TABLE_NAME`;
        const [rows] = await query(sql);
        const lines = (rows as Record<string, string>[]).map((r) => {
          const comment = r.TABLE_COMMENT;
          return comment ? `${r.TABLE_NAME} -- ${comment}` : r.TABLE_NAME;
        });
        return {
          content: [{ type: 'text' as const, text: lines.join('\n') }],
        };
      });
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
