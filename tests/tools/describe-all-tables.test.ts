import { describe, it, expect, vi } from 'vitest';
import { createDescribeAllTablesHandler } from '../../src/tools/describe-all-tables.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryMock: ReturnType<typeof vi.fn>): QueryRunner {
  return {
    query: queryMock,
    withConnection: (fn) => fn(queryMock),
  } as unknown as QueryRunner;
}

describe('describe_all_tables tool handler', () => {
  it('모든 테이블의 스키마를 한 번에 반환한다', async () => {
    const columnRows = [
      {
        TABLE_NAME: 'orders',
        COLUMN_NAME: 'id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'PRI',
        COLUMN_DEFAULT: null,
        EXTRA: 'auto_increment',
        COLUMN_COMMENT: '',
      },
      {
        TABLE_NAME: 'orders',
        COLUMN_NAME: 'user_id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'MUL',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '주문자',
      },
      {
        TABLE_NAME: 'orders',
        COLUMN_NAME: 'total',
        COLUMN_TYPE: 'decimal(10,2)',
        IS_NULLABLE: 'YES',
        COLUMN_KEY: '',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '',
      },
      {
        TABLE_NAME: 'users',
        COLUMN_NAME: 'id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'PRI',
        COLUMN_DEFAULT: null,
        EXTRA: 'auto_increment',
        COLUMN_COMMENT: '사용자 ID',
      },
      {
        TABLE_NAME: 'users',
        COLUMN_NAME: 'name',
        COLUMN_TYPE: 'varchar(255)',
        IS_NULLABLE: 'YES',
        COLUMN_KEY: '',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '이름',
      },
    ];
    const query = vi
      .fn()
      .mockResolvedValueOnce([[{ db: 'mydb' }]])
      .mockResolvedValueOnce([columnRows]);
    const handler = createDescribeAllTablesHandler(createMockRunner(query));

    const result = await handler({});

    expect(query).toHaveBeenCalledTimes(2);
    const text = result.content[0].text;
    expect(text).toContain('orders:');
    expect(text).toContain('id int NOT NULL PK auto_increment');
    expect(text).toContain('user_id int NOT NULL INDEX -- 주문자');
    expect(text).toContain('total decimal(10,2)');
    expect(text).toContain('users:');
    expect(text).toContain('id int NOT NULL PK auto_increment -- 사용자 ID');
    expect(text).toContain('name varchar(255) -- 이름');
  });

  it('database를 지정하면 SELECT DATABASE()를 호출하지 않는다', async () => {
    const columnRows = [
      {
        TABLE_NAME: 'products',
        COLUMN_NAME: 'id',
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_KEY: 'PRI',
        COLUMN_DEFAULT: null,
        EXTRA: '',
        COLUMN_COMMENT: '',
      },
    ];
    const query = vi.fn().mockResolvedValue([columnRows]);
    const handler = createDescribeAllTablesHandler(createMockRunner(query));

    await handler({ database: 'other' });

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("TABLE_SCHEMA = 'other'"));
  });

  it('테이블이 없으면 빈 결과를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[]]);
    const handler = createDescribeAllTablesHandler(createMockRunner(query));

    const result = await handler({ database: 'empty_db' });

    expect(result.content[0].text).toBe('(no tables)');
  });

  it('database 미지정 + DATABASE() NULL이면 에러를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[{ db: null }]]);
    const handler = createDescribeAllTablesHandler(createMockRunner(query));

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No database selected');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const query = vi.fn().mockRejectedValue(new Error('Access denied'));
    const handler = createDescribeAllTablesHandler(createMockRunner(query));

    const result = await handler({ database: 'mydb' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });
});
