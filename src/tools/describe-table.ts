import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';
import { resolveDatabase } from './resolve-database.js';
import { quoteStringValue } from './sql-escape.js';
import { formatColumn } from './format-column.js';

export const describeTableToolName = 'describe_table';

export const describeTableToolConfig = {
  title: 'Describe Table',
  description: 'Show the schema/structure of a table, including column names, types, constraints, and comments.',
  inputSchema: {
    table: z.string().describe('Table name to describe.'),
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
  },
};

export function createDescribeTableHandler(runner: QueryRunner) {
  return async ({ table, database }: { table: string; database?: string }) => {
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

        const sql = `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${quoteStringValue(db)} AND TABLE_NAME = ${quoteStringValue(table)} ORDER BY ORDINAL_POSITION`;
        const [rows] = await query(sql);
        const typedRows = rows as Record<string, unknown>[];

        if (typedRows.length === 0) {
          return {
            isError: true as const,
            content: [
              {
                type: 'text' as const,
                text: `Error: Table '${table}' doesn't exist in database '${db}'.\nHint: use list_tables to check available tables.`,
              },
            ],
          };
        }

        const columns = typedRows.map((r) =>
          formatColumn({
            name: String(r.COLUMN_NAME),
            type: String(r.COLUMN_TYPE),
            nullable: r.IS_NULLABLE === 'YES',
            key: String(r.COLUMN_KEY ?? ''),
            defaultValue: r.COLUMN_DEFAULT,
            extra: String(r.EXTRA ?? ''),
            comment: String(r.COLUMN_COMMENT ?? ''),
          }),
        );
        return {
          content: [{ type: 'text' as const, text: `${table}:\n${columns.join('\n')}` }],
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
