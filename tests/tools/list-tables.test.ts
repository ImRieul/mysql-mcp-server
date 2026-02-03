import { describe, it, expect, vi } from 'vitest';
import { createListTablesHandler } from '../../src/tools/list-tables.js';
import type { QueryRunner } from '../../src/query-runner.js';

describe('list_tables tool handler', () => {
  it('database를 지정하면 해당 DB의 테이블을 조회한다', async () => {
    const rows = [{ Tables_in_mydb: 'users' }, { Tables_in_mydb: 'orders' }];
    const pool = {
      query: vi.fn().mockResolvedValue([rows]),
    } as unknown as QueryRunner;
    const handler = createListTablesHandler(pool);

    const result = await handler({ database: 'mydb' });

    expect(pool.query).toHaveBeenCalledWith('SHOW TABLES FROM `mydb`');
    expect(result.content[0].text).toBe('["users","orders"]');
  });

  it('database를 지정하지 않으면 현재 DB의 테이블을 조회한다', async () => {
    const rows = [{ Tables_in_current: 'users' }];
    const pool = {
      query: vi.fn().mockResolvedValue([rows]),
    } as unknown as QueryRunner;
    const handler = createListTablesHandler(pool);

    const result = await handler({});

    expect(pool.query).toHaveBeenCalledWith('SHOW TABLES');
    expect(result.content[0].text).toBe('["users"]');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('Unknown database')),
    } as unknown as QueryRunner;
    const handler = createListTablesHandler(pool);

    const result = await handler({ database: 'nonexistent' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown database');
  });
});
