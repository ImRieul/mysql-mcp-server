import { describe, it, expect, vi } from 'vitest';
import { createDescribeTableHandler } from '../../src/tools/describe-table.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryMock: ReturnType<typeof vi.fn>): QueryRunner {
  return {
    query: queryMock,
    withConnection: (fn) => fn(queryMock),
  } as unknown as QueryRunner;
}

describe('describe_table tool handler', () => {
  it('테이블 스키마를 조회한다', async () => {
    const rows = [
      {
        COLUMN_NAME: 'id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'PRI',
        COLUMN_DEFAULT: null,
        EXTRA: 'auto_increment',
        COLUMN_COMMENT: '사용자 ID',
      },
      {
        COLUMN_NAME: 'name',
        COLUMN_TYPE: 'varchar(255)',
        IS_NULLABLE: 'YES',
        COLUMN_KEY: '',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '',
      },
    ];
    const query = vi
      .fn()
      .mockResolvedValueOnce([[{ db: 'testdb' }]])
      .mockResolvedValueOnce([rows]);
    const handler = createDescribeTableHandler(createMockRunner(query));

    const result = await handler({ table: 'users' });

    expect(query).toHaveBeenCalledWith('SELECT DATABASE() AS db');
    expect(result.content[0].text).toBe('users:\nid int NOT NULL PK auto_increment -- 사용자 ID\nname varchar(255)');
  });

  it('database를 지정하면 해당 DB의 테이블을 조회한다', async () => {
    const rows = [
      {
        COLUMN_NAME: 'id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'PRI',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '',
      },
    ];
    const query = vi.fn().mockResolvedValue([rows]);
    const handler = createDescribeTableHandler(createMockRunner(query));

    await handler({ table: 'users', database: 'mydb' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining("TABLE_SCHEMA = 'mydb' AND TABLE_NAME = 'users'"));
  });

  it('테이블이 존재하지 않으면 에러 메시지를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[]]);
    const handler = createDescribeTableHandler(createMockRunner(query));

    const result = await handler({ table: 'nonexistent', database: 'mydb' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("doesn't exist");
  });

  it('database 미지정 + DATABASE() NULL이면 에러를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[{ db: null }]]);
    const handler = createDescribeTableHandler(createMockRunner(query));

    const result = await handler({ table: 'users' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No database selected');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const query = vi.fn().mockRejectedValue(new Error("Table doesn't exist"));
    const handler = createDescribeTableHandler(createMockRunner(query));

    const result = await handler({ table: 'nonexistent', database: 'mydb' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Table doesn't exist");
  });
});
