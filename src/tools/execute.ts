import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const executeToolName = 'execute';

export const executeToolConfig = {
  title: 'Execute',
  description: 'Execute a data modification SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, etc.).',
  inputSchema: {
    sql: z
      .string()
      .describe('The SQL statement to execute. SELECT statements are not allowed here; use the "query" tool instead.'),
  },
};

export function createExecuteHandler(runner: QueryRunner, isReadonly: boolean) {
  return async ({ sql }: { sql: string }) => {
    if (isReadonly) {
      return {
        isError: true as const,
        content: [
          {
            type: 'text' as const,
            text: 'Error: Server is in read-only mode. Data modification is not allowed.',
          },
        ],
      };
    }

    const normalized = sql.trim().toUpperCase();
    if (normalized.startsWith('SELECT') || normalized.startsWith('WITH')) {
      return {
        isError: true as const,
        content: [
          {
            type: 'text' as const,
            text: 'Error: Use the "query" tool for SELECT statements.',
          },
        ],
      };
    }

    try {
      const [result] = await runner.query(sql);
      const r = result as unknown as Record<string, unknown>;
      return {
        content: [
          { type: 'text' as const, text: `affectedRows: ${r.affectedRows}, changedRows: ${r.changedRows ?? 0}` },
        ],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
