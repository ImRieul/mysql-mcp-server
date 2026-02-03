import type { Pool } from 'mysql2/promise';

export interface QueryRunner {
  query(sql: string): Promise<[unknown, unknown]>;
}

export class QueryTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Query timeout after ${timeoutMs}ms`);
    this.name = 'QueryTimeoutError';
  }
}

export interface QueryRunnerOptions {
  readonly: boolean;
  queryTimeout: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) return promise;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new QueryTimeoutError(timeoutMs)), timeoutMs)),
  ]);
}

export function createQueryRunner(pool: Pool, options: QueryRunnerOptions): QueryRunner {
  const { readonly, queryTimeout } = options;

  return {
    async query(sql: string): Promise<[unknown, unknown]> {
      if (!readonly) {
        return withTimeout(pool.query(sql) as Promise<[unknown, unknown]>, queryTimeout);
      }

      const conn = await pool.getConnection();
      try {
        await conn.query('SET SESSION TRANSACTION READ ONLY');
        await conn.beginTransaction();
        const result = await withTimeout(conn.query(sql) as Promise<[unknown, unknown]>, queryTimeout);
        await conn.rollback();
        return result;
      } catch (error) {
        try {
          await conn.rollback();
        } catch {
          // rollback 실패 무시
        }
        throw error;
      } finally {
        conn.release();
      }
    },
  };
}
