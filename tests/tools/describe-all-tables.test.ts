import { describe, it, expect, vi } from 'vitest';
import { createDescribeAllTablesHandler } from '../../src/tools/describe-all-tables.js';
import type { QueryRunner } from '../../src/query-runner.js';

describe('describe_all_tables tool handler', () => {
  it('모든 테이블의 스키마를 한 번에 반환한다', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ Tables_in_mydb: 'users' }, { Tables_in_mydb: 'orders' }]])
        .mockResolvedValueOnce([
          [
            { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
            { Field: 'name', Type: 'varchar(255)', Null: 'YES', Key: '', Default: null, Extra: '' },
          ],
        ])
        .mockResolvedValueOnce([
          [
            { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
            { Field: 'user_id', Type: 'int', Null: 'NO', Key: 'MUL', Default: null, Extra: '' },
            { Field: 'total', Type: 'decimal(10,2)', Null: 'YES', Key: '', Default: null, Extra: '' },
          ],
        ]),
    } as unknown as QueryRunner;
    const handler = createDescribeAllTablesHandler(pool);

    const result = await handler({});

    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith('SHOW TABLES');
    expect(pool.query).toHaveBeenCalledWith('DESCRIBE `users`');
    expect(pool.query).toHaveBeenCalledWith('DESCRIBE `orders`');

    const text = result.content[0].text;
    expect(text).toContain('users:');
    expect(text).toContain('id int NOT NULL PK auto_increment');
    expect(text).toContain('name varchar(255)');
    expect(text).toContain('orders:');
    expect(text).toContain('user_id int NOT NULL INDEX');
    expect(text).toContain('total decimal(10,2)');
  });

  it('database를 지정하면 해당 DB의 테이블을 조회한다', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ Tables_in_other: 'products' }]])
        .mockResolvedValueOnce([[{ Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null, Extra: '' }]]),
    } as unknown as QueryRunner;
    const handler = createDescribeAllTablesHandler(pool);

    await handler({ database: 'other' });

    expect(pool.query).toHaveBeenCalledWith('SHOW TABLES FROM `other`');
    expect(pool.query).toHaveBeenCalledWith('DESCRIBE `other`.`products`');
  });

  it('테이블이 없으면 빈 결과를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockResolvedValueOnce([[]]),
    } as unknown as QueryRunner;
    const handler = createDescribeAllTablesHandler(pool);

    const result = await handler({});

    expect(result.content[0].text).toBe('(no tables)');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('Access denied')),
    } as unknown as QueryRunner;
    const handler = createDescribeAllTablesHandler(pool);

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });
});
