import { describe, it, expect, vi } from 'vitest';
import { createListDatabasesHandler } from '../../src/tools/list-databases.js';
import type { QueryRunner } from '../../src/query-runner.js';

describe('list_databases tool handler', () => {
  it('SHOW DATABASES를 실행하고 결과를 반환한다', async () => {
    const rows = [{ Database: 'information_schema' }, { Database: 'mydb' }];
    const pool = {
      query: vi.fn().mockResolvedValue([rows]),
    } as unknown as QueryRunner;
    const handler = createListDatabasesHandler(pool);

    const result = await handler();

    expect(pool.query).toHaveBeenCalledWith('SHOW DATABASES');
    expect(result.content[0].text).toBe('["information_schema","mydb"]');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('Access denied')),
    } as unknown as QueryRunner;
    const handler = createListDatabasesHandler(pool);

    const result = await handler();

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });
});
