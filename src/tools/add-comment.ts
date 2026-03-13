import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';
import { resolveDatabase } from './resolve-database.js';
import { quoteStringValue, escapeStringValue } from './sql-escape.js';
import { validateIdentifier } from './validate-input.js';

export const addCommentToolName = 'add_comment';

export const addCommentToolConfig = {
  title: 'Add Comment',
  description:
    'Safely add a comment to a table or column. This tool only modifies comments — it cannot alter table structure, column types, or data. ' +
    'Set dryRun=true to preview the generated SQL without executing it. ' +
    'Use describe_table first to verify column names. Not available in read-only mode.',
  inputSchema: {
    table: z.string().describe('Table name.'),
    column: z.string().optional().describe('Column name. If omitted, sets a table-level comment.'),
    comment: z.string().describe('Comment text to set.'),
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
    dryRun: z
      .boolean()
      .optional()
      .describe('If true, returns the generated SQL without executing it. Defaults to false.'),
  },
};

export function createAddCommentHandler(runner: QueryRunner, isReadonly: boolean) {
  return async ({
    table,
    column,
    comment,
    database,
    dryRun,
  }: {
    table: string;
    column?: string;
    comment: string;
    database?: string;
    dryRun?: boolean;
  }) => {
    if (isReadonly) {
      return {
        isError: true as const,
        content: [
          {
            type: 'text' as const,
            text: 'Error: Server is in read-only mode. Modifying comments is not allowed.',
          },
        ],
      };
    }

    const tableValidation = validateIdentifier(table, 'Table');
    if (!tableValidation.valid) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: tableValidation.message! }],
      };
    }

    if (column) {
      const columnValidation = validateIdentifier(column, 'Column');
      if (!columnValidation.valid) {
        return {
          isError: true as const,
          content: [{ type: 'text' as const, text: columnValidation.message! }],
        };
      }
    }

    if (database) {
      const dbValidation = validateIdentifier(database, 'Database');
      if (!dbValidation.valid) {
        return {
          isError: true as const,
          content: [{ type: 'text' as const, text: dbValidation.message! }],
        };
      }
    }

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

        const fullName = `\`${db}\`.\`${table}\``;
        const escapedComment = escapeStringValue(comment);

        if (!column) {
          const sql = `ALTER TABLE ${fullName} COMMENT = '${escapedComment}'`;
          if (dryRun) {
            return {
              content: [{ type: 'text' as const, text: `[dry-run] SQL preview:\n${sql}` }],
            };
          }
          await query(sql);
          return {
            content: [{ type: 'text' as const, text: `Table comment updated: ${table}` }],
          };
        }

        const colSql = `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${quoteStringValue(db)} AND TABLE_NAME = ${quoteStringValue(table)} AND COLUMN_NAME = ${quoteStringValue(column)}`;
        const [rows] = await query(colSql);
        const colInfo = (rows as Record<string, unknown>[])[0];

        if (!colInfo) {
          return {
            isError: true as const,
            content: [
              {
                type: 'text' as const,
                text: `Error: Column '${column}' doesn't exist in table '${table}'.\nHint: use describe_table to check available columns.`,
              },
            ],
          };
        }

        let modifySql = `ALTER TABLE ${fullName} MODIFY COLUMN \`${column}\` ${colInfo.COLUMN_TYPE}`;
        if (colInfo.IS_NULLABLE === 'NO') modifySql += ' NOT NULL';
        if (colInfo.COLUMN_DEFAULT != null)
          modifySql += ` DEFAULT '${escapeStringValue(String(colInfo.COLUMN_DEFAULT))}'`;
        if (colInfo.EXTRA) modifySql += ` ${colInfo.EXTRA}`;
        modifySql += ` COMMENT '${escapedComment}'`;

        if (dryRun) {
          return {
            content: [{ type: 'text' as const, text: `[dry-run] SQL preview:\n${modifySql}` }],
          };
        }

        await query(modifySql);
        return {
          content: [{ type: 'text' as const, text: `Column comment updated: ${table}.${column}` }],
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
