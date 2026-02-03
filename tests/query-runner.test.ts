import { describe, it, expect, vi } from 'vitest';
import { createQueryRunner, QueryTimeoutError } from '../src/query-runner.js';
import type { Pool, PoolConnection } from 'mysql2/promise';

function createMockConnection(): PoolConnection {
  return {
    query: vi.fn().mockResolvedValue([[]]),
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  } as unknown as PoolConnection;
}

function createMockPool(queryResult: unknown = []): Pool & { getConnection: ReturnType<typeof vi.fn> } {
  const conn = createMockConnection();
  return {
    query: vi.fn().mockResolvedValue([queryResult]),
    getConnection: vi.fn().mockResolvedValue(conn),
    _mockConnection: conn,
  } as unknown as Pool & { getConnection: ReturnType<typeof vi.fn> };
}

describe('createQueryRunner', () => {
  describe('일반 모드 (readonly=false)', () => {
    it('pool.query를 직접 호출한다', async () => {
      const pool = createMockPool([{ id: 1 }]);
      const runner = createQueryRunner(pool, { readonly: false, queryTimeout: 0 });

      const result = await runner.query('SELECT 1');

      expect(pool.query).toHaveBeenCalledWith('SELECT 1');
      expect(result).toEqual([[{ id: 1 }]]);
    });

    it('getConnection을 호출하지 않는다', async () => {
      const pool = createMockPool();
      const runner = createQueryRunner(pool, { readonly: false, queryTimeout: 0 });

      await runner.query('SELECT 1');

      expect(pool.getConnection).not.toHaveBeenCalled();
    });
  });

  describe('readonly 모드', () => {
    it('getConnection → SET READ ONLY → BEGIN → query → ROLLBACK → release 순서로 실행한다', async () => {
      const conn = createMockConnection();
      const pool = {
        query: vi.fn(),
        getConnection: vi.fn().mockResolvedValue(conn),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: true, queryTimeout: 0 });

      await runner.query('SELECT * FROM users');

      const callOrder: string[] = [];
      for (const call of (conn.query as ReturnType<typeof vi.fn>).mock.calls) {
        callOrder.push(call[0]);
      }

      expect(pool.getConnection).toHaveBeenCalled();
      expect(callOrder[0]).toBe('SET SESSION TRANSACTION READ ONLY');
      expect(conn.beginTransaction).toHaveBeenCalled();
      expect(callOrder[1]).toBe('SELECT * FROM users');
      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    it('쿼리 결과를 올바르게 반환한다', async () => {
      const conn = createMockConnection();
      (conn.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([]) // SET READ ONLY
        .mockResolvedValueOnce([[{ id: 1, name: 'test' }]]); // actual query
      const pool = {
        query: vi.fn(),
        getConnection: vi.fn().mockResolvedValue(conn),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: true, queryTimeout: 0 });

      const result = await runner.query('SELECT * FROM users');

      expect(result).toEqual([[{ id: 1, name: 'test' }]]);
    });

    it('쿼리 에러 시에도 connection을 release한다', async () => {
      const conn = createMockConnection();
      (conn.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([]) // SET READ ONLY
        .mockRejectedValueOnce(new Error('Query failed')); // actual query
      const pool = {
        query: vi.fn(),
        getConnection: vi.fn().mockResolvedValue(conn),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: true, queryTimeout: 0 });

      await expect(runner.query('SELECT * FROM users')).rejects.toThrow('Query failed');
      expect(conn.release).toHaveBeenCalled();
    });

    it('beginTransaction 에러 시에도 connection을 release한다', async () => {
      const conn = createMockConnection();
      (conn.beginTransaction as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Begin failed'));
      const pool = {
        query: vi.fn(),
        getConnection: vi.fn().mockResolvedValue(conn),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: true, queryTimeout: 0 });

      await expect(runner.query('SELECT 1')).rejects.toThrow('Begin failed');
      expect(conn.release).toHaveBeenCalled();
    });
  });

  describe('타임아웃', () => {
    it('타임아웃 시 QueryTimeoutError를 던진다', async () => {
      const pool = {
        query: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
        getConnection: vi.fn(),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: false, queryTimeout: 50 });

      await expect(runner.query('SELECT SLEEP(10)')).rejects.toThrow(QueryTimeoutError);
    });

    it('타임아웃 에러 메시지에 타임아웃 시간이 포함된다', async () => {
      const pool = {
        query: vi.fn().mockReturnValue(new Promise(() => {})),
        getConnection: vi.fn(),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: false, queryTimeout: 50 });

      await expect(runner.query('SELECT SLEEP(10)')).rejects.toThrow('50ms');
    });

    it('queryTimeout=0이면 타임아웃이 적용되지 않는다', async () => {
      const pool = createMockPool([{ result: 1 }]);
      const runner = createQueryRunner(pool, { readonly: false, queryTimeout: 0 });

      const result = await runner.query('SELECT 1');

      expect(result).toEqual([[{ result: 1 }]]);
    });

    it('readonly + 타임아웃 시에도 connection을 release한다', async () => {
      const conn = createMockConnection();
      (conn.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([]) // SET READ ONLY
        .mockReturnValueOnce(new Promise(() => {})); // never resolves (actual query)
      (conn.beginTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const pool = {
        query: vi.fn(),
        getConnection: vi.fn().mockResolvedValue(conn),
      } as unknown as Pool;
      const runner = createQueryRunner(pool, { readonly: true, queryTimeout: 50 });

      await expect(runner.query('SELECT SLEEP(10)')).rejects.toThrow(QueryTimeoutError);
      // release가 호출될 때까지 약간의 시간 필요
      await new Promise((r) => setTimeout(r, 10));
      expect(conn.release).toHaveBeenCalled();
    });
  });
});
