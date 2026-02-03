import type { QueryRunner } from '../query-runner.js';
import { formatError } from './error-hint.js';

export const listDatabasesToolName = 'list_databases';

export const listDatabasesToolConfig = {
  title: 'List Databases',
  description: 'List all databases on the MySQL server.',
};

export function createListDatabasesHandler(runner: QueryRunner) {
  return async () => {
    try {
      const [rows] = await runner.query('SHOW DATABASES');
      const databases = (rows as Record<string, string>[]).map((r) => Object.values(r)[0]);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(databases) }],
      };
    } catch (error) {
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: formatError(error) }],
      };
    }
  };
}
