import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const describeAllTablesToolName = 'describe_all_tables';

export const describeAllTablesToolConfig = {
  title: 'Describe All Tables',
  description:
    'Show the schema of all tables at once. Much more efficient than calling describe_table for each table individually.',
  inputSchema: {
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
  },
};

function formatColumn(r: Record<string, unknown>): string {
  return `${r.Field} ${r.Type}${r.Null === 'NO' ? ' NOT NULL' : ''}${r.Key === 'PRI' ? ' PK' : r.Key === 'UNI' ? ' UNIQUE' : r.Key === 'MUL' ? ' INDEX' : ''}${r.Default != null ? ` DEFAULT ${r.Default}` : ''}${r.Extra ? ` ${r.Extra}` : ''}`;
}

export function createDescribeAllTablesHandler(runner: QueryRunner) {
  return async ({ database }: { database?: string }) => {
    try {
      const listSql = database ? `SHOW TABLES FROM \`${database}\`` : 'SHOW TABLES';
      const [tableRows] = await runner.query(listSql);
      const tables = (tableRows as Record<string, string>[]).map((r) => Object.values(r)[0]);

      if (tables.length === 0) {
        return { content: [{ type: 'text' as const, text: '(no tables)' }] };
      }

      const parts: string[] = [];
      for (const table of tables) {
        const fullName = database ? `\`${database}\`.\`${table}\`` : `\`${table}\``;
        const [cols] = await runner.query(`DESCRIBE ${fullName}`);
        const lines = (cols as Record<string, unknown>[]).map(formatColumn);
        parts.push(`${table}:\n${lines.join('\n')}`);
      }

      return {
        content: [{ type: 'text' as const, text: parts.join('\n\n') }],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
