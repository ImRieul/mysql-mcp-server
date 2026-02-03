import { z } from 'zod';
import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const describeTableToolName = 'describe_table';

export const describeTableToolConfig = {
  title: 'Describe Table',
  description: 'Show the schema/structure of a table, including column names, types, and constraints.',
  inputSchema: {
    table: z.string().describe('Table name to describe.'),
    database: z.string().optional().describe('Database name. Uses the current database if omitted.'),
  },
};

export function createDescribeTableHandler(runner: QueryRunner) {
  return async ({ table, database }: { table: string; database?: string }) => {
    try {
      const fullName = database ? `\`${database}\`.\`${table}\`` : `\`${table}\``;
      const [rows] = await runner.query(`DESCRIBE ${fullName}`);
      const columns = (rows as Record<string, unknown>[]).map(
        (r) =>
          `${r.Field} ${r.Type}${r.Null === 'NO' ? ' NOT NULL' : ''}${r.Key === 'PRI' ? ' PK' : r.Key === 'UNI' ? ' UNIQUE' : r.Key === 'MUL' ? ' INDEX' : ''}${r.Default != null ? ` DEFAULT ${r.Default}` : ''}${r.Extra ? ` ${r.Extra}` : ''}`,
      );
      return {
        content: [{ type: 'text' as const, text: `${table}:\n${columns.join('\n')}` }],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
