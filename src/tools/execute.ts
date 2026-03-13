import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';
import { validateSql } from './validate-input.js';

export const executeToolName = 'execute';

export const executeToolConfig = {
  title: 'Execute',
  description:
    'Execute a data modification SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, etc.). ' +
    'Set dryRun=true to validate without executing — uses EXPLAIN for DML, or previews the SQL for DDL. ' +
    'Always confirm destructive operations (DROP, TRUNCATE, DELETE without WHERE) with the user before executing. ' +
    'Not available in read-only mode.',
  inputSchema: {
    sql: z
      .string()
      .describe('The SQL statement to execute. SELECT statements are not allowed here; use the "query" tool instead.'),
    dryRun: z
      .boolean()
      .optional()
      .describe('If true, validates the statement via EXPLAIN without executing it. Defaults to false.'),
  },
};

export function createExecuteHandler(runner: QueryRunner, isReadonly: boolean) {
  return async ({ sql, dryRun }: { sql: string; dryRun?: boolean }) => {
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

    const validation = validateSql(sql);
    if (!validation.valid) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: validation.message! }],
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

    if (dryRun) {
      const DDL_PREFIXES = ['CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME'];
      const isDdl = DDL_PREFIXES.some((p) => normalized.startsWith(p));

      if (isDdl) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `[dry-run] SQL preview (DDL cannot be validated via EXPLAIN):\n${sql}`,
            },
          ],
        };
      }

      try {
        const [rows] = await runner.query(`EXPLAIN ${sql}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `[dry-run] Statement validated via EXPLAIN:\n${JSON.stringify(rows, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true as const,
          content: [{ type: 'text' as const, text: `[dry-run] Validation failed: ${formatError(error)}` }],
        };
      }
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
