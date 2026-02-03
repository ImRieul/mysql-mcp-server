import { describe, it, expect, vi } from 'vitest';
import { createQueryHandler } from '../../src/tools/query.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryResult: unknown = []): QueryRunner {
  return {
    query: vi.fn().mockResolvedValue([queryResult]),
  } as unknown as QueryRunner;
}

describe('query tool handler', () => {
  it('SELECT 쿼리를 실행하고 결과를 반환한다', async () => {
    const rows = [{ id: 1, name: 'test' }];
    const pool = createMockRunner(rows);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'SELECT * FROM users' });

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users LIMIT 100');
    expect(result.content[0].text).toBe(JSON.stringify({ columns: ['id', 'name'], rows: [[1, 'test']] }));
  });

  it('이미 LIMIT이 있으면 추가하지 않는다', async () => {
    const rows = [{ id: 1 }];
    const pool = createMockRunner(rows);
    const handler = createQueryHandler(pool, 100);

    await handler({ sql: 'SELECT * FROM users LIMIT 10' });

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users LIMIT 10');
  });

  it('LIMIT이 대소문자 혼합이어도 감지한다', async () => {
    const pool = createMockRunner([{ id: 1 }]);
    const handler = createQueryHandler(pool, 100);

    await handler({ sql: 'SELECT * FROM users limit 5' });

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users limit 5');
  });

  it('SHOW 쿼리에는 LIMIT을 추가하지 않는다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    await handler({ sql: 'SHOW TABLES' });

    expect(pool.query).toHaveBeenCalledWith('SHOW TABLES');
  });

  it('DESCRIBE 쿼리에는 LIMIT을 추가하지 않는다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    await handler({ sql: 'DESCRIBE users' });

    expect(pool.query).toHaveBeenCalledWith('DESCRIBE users');
  });

  it('SHOW 쿼리를 허용한다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'SHOW TABLES' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe('(empty)');
  });

  it('DESCRIBE 쿼리를 허용한다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'DESCRIBE users' });
    expect(result.isError).toBeUndefined();
  });

  it('EXPLAIN 쿼리를 허용한다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'EXPLAIN SELECT * FROM users' });
    expect(result.isError).toBeUndefined();
  });

  it('WITH (CTE) 쿼리를 허용한다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'WITH cte AS (SELECT 1) SELECT * FROM cte' });
    expect(result.isError).toBeUndefined();
  });

  it('대소문자를 구분하지 않는다', async () => {
    const pool = createMockRunner([]);
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'select * from users' });
    expect(result.isError).toBeUndefined();
  });

  it('INSERT 쿼리를 차단한다', async () => {
    const pool = createMockRunner();
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'INSERT INTO users VALUES (1, "test")' });

    expect(result.isError).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('UPDATE 쿼리를 차단한다', async () => {
    const pool = createMockRunner();
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'UPDATE users SET name = "test"' });
    expect(result.isError).toBe(true);
  });

  it('DELETE 쿼리를 차단한다', async () => {
    const pool = createMockRunner();
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'DELETE FROM users' });
    expect(result.isError).toBe(true);
  });

  it('DROP 쿼리를 차단한다', async () => {
    const pool = createMockRunner();
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'DROP TABLE users' });
    expect(result.isError).toBe(true);
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('Connection refused')),
    } as unknown as QueryRunner;
    const handler = createQueryHandler(pool, 100);

    const result = await handler({ sql: 'SELECT * FROM users' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection refused');
  });
});
