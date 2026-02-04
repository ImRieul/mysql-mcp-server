import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';
import { resolveDatabase } from './resolve-database.js';
import { quoteStringValue } from './sql-escape.js';
import { formatColumn } from './format-column.js';

export const describeAllTablesToolName = 'describe_all_tables';

export const describeAllTablesToolConfig = {
  title: 'Describe All Tables',
  description:
    'Show the schema of all tables at once. Much more efficient than calling describe_table for each table individually.',
  inputSchema: {
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
  },
};

export function createDescribeAllTablesHandler(runner: QueryRunner) {
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

        const sql = `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${quoteStringValue(db)} ORDER BY TABLE_NAME, ORDINAL_POSITION`;
        const [rows] = await query(sql);
        const typedRows = rows as Record<string, unknown>[];

        if (typedRows.length === 0) {
          return { content: [{ type: 'text' as const, text: '(no tables)' }] };
        }

        const tableMap = new Map<string, string[]>();
        for (const r of typedRows) {
          const tableName = String(r.TABLE_NAME);
          const line = formatColumn({
            name: String(r.COLUMN_NAME),
            type: String(r.COLUMN_TYPE),
            nullable: r.IS_NULLABLE === 'YES',
            key: String(r.COLUMN_KEY ?? ''),
            defaultValue: r.COLUMN_DEFAULT,
            extra: String(r.EXTRA ?? ''),
            comment: String(r.COLUMN_COMMENT ?? ''),
          });
          if (!tableMap.has(tableName)) {
            tableMap.set(tableName, []);
          }
          tableMap.get(tableName)!.push(line);
        }

        const parts = Array.from(tableMap.entries()).map(([table, lines]) => `${table}:\n${lines.join('\n')}`);

        return {
          content: [{ type: 'text' as const, text: parts.join('\n\n') }],
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
