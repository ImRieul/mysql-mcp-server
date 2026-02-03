import { describe, it, expect, vi } from 'vitest';
import { createDescribeTableHandler } from '../../src/tools/describe-table.js';
import type { QueryRunner } from '../../src/query-runner.js';

describe('describe_table tool handler', () => {
  it('테이블 스키마를 조회한다', async () => {
    const rows = [
      { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'name', Type: 'varchar(255)', Null: 'YES', Key: '', Default: null, Extra: '' },
    ];
    const pool = {
      query: vi.fn().mockResolvedValue([rows]),
    } as unknown as QueryRunner;
    const handler = createDescribeTableHandler(pool);

    const result = await handler({ table: 'users' });

    expect(pool.query).toHaveBeenCalledWith('DESCRIBE `users`');
    expect(result.content[0].text).toBe('users:\nid int NOT NULL PK auto_increment\nname varchar(255)');
  });

  it('database를 지정하면 해당 DB의 테이블을 조회한다', async () => {
    const rows = [{ Field: 'id', Type: 'int' }];
    const pool = {
      query: vi.fn().mockResolvedValue([rows]),
    } as unknown as QueryRunner;
    const handler = createDescribeTableHandler(pool);

    await handler({ table: 'users', database: 'mydb' });

    expect(pool.query).toHaveBeenCalledWith('DESCRIBE `mydb`.`users`');
  });

  it('DB 에러 시 에러 메시지를 반환한다', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error("Table doesn't exist")),
    } as unknown as QueryRunner;
    const handler = createDescribeTableHandler(pool);

    const result = await handler({ table: 'nonexistent' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Table doesn't exist");
  });
});
