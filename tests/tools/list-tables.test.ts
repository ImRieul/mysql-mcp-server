import { describe, it, expect, vi } from 'vitest';
import { createListTablesHandler } from '../../src/tools/list-tables.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryMock: ReturnType<typeof vi.fn>): QueryRunner {
  return {
    query: queryMock,
    withConnection: (fn) => fn(queryMock),
  } as unknown as QueryRunner;
}

describe('list_tables tool handler', () => {
  it('database를 지정하면 해당 DB의 테이블을 조회한다', async () => {
    const rows = [
      { TABLE_NAME: 'orders', TABLE_COMMENT: '주문 테이블' },
      { TABLE_NAME: 'users', TABLE_COMMENT: '사용자 테이블' },
    ];
    const query = vi.fn().mockResolvedValue([rows]);
    const handler = createListTablesHandler(createMockRunner(query));

    const result = await handler({ database: 'mydb' });

    expect(query).toHaveBeenCalledWith(
      "SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'mydb' ORDER BY TABLE_NAME",
    );
    expect(result.content[0].text).toBe('orders -- 주문 테이블\nusers -- 사용자 테이블');
  });

  it('database 미지정 시 SELECT DATABASE()로 현재 DB를 조회한다', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([[{ db: 'current_db' }]])
      .mockResolvedValueOnce([[{ TABLE_NAME: 'users', TABLE_COMMENT: '' }]]);
    const handler = createListTablesHandler(createMockRunner(query));

    const result = await handler({});

    expect(query).toHaveBeenCalledWith('SELECT DATABASE() AS db');
    expect(query).toHaveBeenCalledWith(
      "SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'current_db' ORDER BY TABLE_NAME",
    );
    expect(result.content[0].text).toBe('users');
  });

  it('주석이 없는 테이블은 테이블명만 출력한다', async () => {
    const rows = [
      { TABLE_NAME: 'users', TABLE_COMMENT: '' },
      { TABLE_NAME: 'orders', TABLE_COMMENT: '주문' },
    ];
    const query = vi.fn().mockResolvedValue([rows]);
    const handler = createListTablesHandler(createMockRunner(query));

    const result = await handler({ database: 'mydb' });

    expect(result.content[0].text).toBe('users\norders -- 주문');
  });

  it('database 미지정 + DATABASE() NULL이면 에러를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[{ db: null }]]);
    const handler = createListTablesHandler(createMockRunner(query));

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No database selected');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const query = vi.fn().mockRejectedValue(new Error('Unknown database'));
    const handler = createListTablesHandler(createMockRunner(query));

    const result = await handler({ database: 'nonexistent' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown database');
  });
});
