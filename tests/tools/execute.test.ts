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

  describe('dryRun', () => {
    it('dryRun=true면 EXPLAIN으로 검증만 한다', async () => {
      // EXPLAIN 결과 mock
      const explainResult = [{ id: 1, select_type: 'INSERT', table: 'users' }];
      const pool = createMockRunner(explainResult);
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")', dryRun: true });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('[dry-run]');
      expect(result.content[0].text).toContain('EXPLAIN');
      // EXPLAIN 쿼리가 호출됨
      expect(pool.query).toHaveBeenCalledWith('EXPLAIN INSERT INTO users (name) VALUES ("test")');
    });

    it('DDL(CREATE)은 dryRun=true에서 SQL 미리보기를 반환한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'CREATE TABLE test (id INT PRIMARY KEY)', dryRun: true });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('[dry-run]');
      expect(result.content[0].text).toContain('DDL cannot be validated via EXPLAIN');
      expect(result.content[0].text).toContain('CREATE TABLE test (id INT PRIMARY KEY)');
      // EXPLAIN 호출하지 않음
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('DDL(DROP)은 dryRun=true에서 SQL 미리보기를 반환한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'DROP TABLE test', dryRun: true });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('[dry-run]');
      expect(result.content[0].text).toContain('DROP TABLE test');
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('DDL(TRUNCATE)은 dryRun=true에서 SQL 미리보기를 반환한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'TRUNCATE TABLE test', dryRun: true });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('[dry-run]');
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('dryRun=true에서 EXPLAIN 실패 시 에러를 반환한다', async () => {
      const pool = {
        query: vi.fn().mockRejectedValue(new Error('ER_PARSE_ERROR')),
      } as unknown as QueryRunner;
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INVALID SQL', dryRun: true });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[dry-run]');
      expect(result.content[0].text).toContain('Validation failed');
    });

    it('dryRun=false면 실제로 실행한다', async () => {
      const pool = createMockRunner({ affectedRows: 1, changedRows: 0 });
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")', dryRun: false });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe('affectedRows: 1, changedRows: 0');
    });

    it('dryRun 미지정이면 실제로 실행한다', async () => {
      const pool = createMockRunner({ affectedRows: 1, changedRows: 0 });
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe('affectedRows: 1, changedRows: 0');
    });

    it('readonly 모드에서는 dryRun이어도 차단한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, true);

      const result = await handler({ sql: 'INSERT INTO users (name) VALUES ("test")', dryRun: true });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only');
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('입력 검증', () => {
    it('제어문자가 포함된 SQL을 거부한다', async () => {
      const pool = createMockRunner();
      const handler = createExecuteHandler(pool, false);

      const result = await handler({ sql: 'INSERT INTO users\x00 VALUES (1)' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('control characters');
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
