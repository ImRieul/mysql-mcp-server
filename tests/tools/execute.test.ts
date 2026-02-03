import { describe, it, expect, vi } from 'vitest';
import { createExecuteHandler } from '../../src/tools/execute.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryResult: unknown = { affectedRows: 1 }): QueryRunner {
  return {
    query: vi.fn().mockResolvedValue([queryResult]),
  } as unknown as QueryRunner;
}

describe('execute tool handler', () => {
  describe('readonly=false', () => {
    it('INSERT를 실행한다', async () => {
      const pool = createMockRunner({ affectedRows: 1, changedRows: 0 });
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")' });

      expect(result.isError).toBeUndefined();
      expect(pool.query).toHaveBeenCalled();
      expect(result.content[0].text).toBe('affectedRows: 1, changedRows: 0');
    });

    it('UPDATE를 실행한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'UPDATE users SET name = "test" WHERE id = 1' });

      expect(result.isError).toBeUndefined();
    });

    it('DELETE를 실행한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'DELETE FROM users WHERE id = 1' });

      expect(result.isError).toBeUndefined();
    });

    it('CREATE TABLE을 실행한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'CREATE TABLE test (id INT PRIMARY KEY)' });

      expect(result.isError).toBeUndefined();
    });

    it('SELECT는 거부하고 query 도구 사용을 안내한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'SELECT * FROM users' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('query');
    });

    it('DB 에러 시 에러 메시지를 반환한다', async () => {
      const pool = {
        query: vi.fn().mockRejectedValue(new Error('Duplicate entry')),
      } as unknown as QueryRunner;
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users (id) VALUES (1)' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Duplicate entry');
    });
  });

  describe('readonly=true', () => {
    it('INSERT를 차단한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, true);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only');
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('UPDATE를 차단한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, true);

      const result = await handler({ sql: 'UPDATE users SET name = "test"' });

      expect(result.isError).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('DELETE를 차단한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, true);

      const result = await handler({ sql: 'DELETE FROM users WHERE id = 1' });

      expect(result.isError).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('DDL도 차단한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, true);

      const result = await handler({ sql: 'DROP TABLE users' });

      expect(result.isError).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
