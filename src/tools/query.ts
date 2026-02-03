import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const queryToolName = 'query';

export const queryToolConfig = {
  title: 'Query',
  description: 'Execute a read-only SQL query (SELECT, SHOW, DESCRIBE, EXPLAIN).',
  inputSchema: {
    sql: z
      .string()
      .describe(
        'The SQL query to execute. Only SELECT, SHOW, DESCRIBE, EXPLAIN, and WITH (CTE) statements are allowed.',
      ),
  },
};

const ALLOWED_PREFIXES = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH'];
const LIMIT_PREFIXES = ['SELECT', 'WITH'];

function needsLimit(normalized: string): boolean {
  if (!LIMIT_PREFIXES.some((p) => normalized.startsWith(p))) return false;
  return !/\bLIMIT\b/i.test(normalized);
}

export function createQueryHandler(runner: QueryRunner, maxRows: number) {
  return async ({ sql }: { sql: string }) => {
    const normalized = sql.trim().toUpperCase();
    const isAllowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));

    if (!isAllowed) {
      return {
        isError: true as const,
        content: [
          {
            type: 'text' as const,
            text: 'Error: Only SELECT, SHOW, DESCRIBE, EXPLAIN queries are allowed. Use the "execute" tool for data modification.',
          },
        ],
      };
    }

    try {
      const finalSql = needsLimit(normalized) ? `${sql.trim()} LIMIT ${maxRows}` : sql;
      const [rows] = await runner.query(finalSql);
      const arr = rows as Record<string, unknown>[];
      if (arr.length === 0) {
        return { content: [{ type: 'text' as const, text: '(empty)' }] };
      }
      const cols = Object.keys(arr[0]);
      const data = arr.map((r) => cols.map((c) => r[c]));
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ columns: cols, rows: data }) }],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
