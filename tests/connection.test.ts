import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MySQLConfig } from '../src/config.js';

const mockPool = {
  end: vi.fn().mockResolvedValue(undefined),
};

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn(() => mockPool),
  },
  createPool: vi.fn(() => mockPool),
}));

import mysql from 'mysql2/promise';
import { createConnectionManager } from '../src/connection.js';

describe('createConnectionManager', () => {
  const config: MySQLConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'secret',
    database: 'testdb',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mysql2.createPool을 올바른 설정으로 호출한다', () => {
    createConnectionManager(config);

    expect(mysql.createPool).toHaveBeenCalledWith({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
      database: 'testdb',
      connectionLimit: 5,
      waitForConnections: true,
    });
  });

  it('getPool()이 풀 인스턴스를 반환한다', () => {
    const manager = createConnectionManager(config);
    const pool = manager.getPool();
    expect(pool).toBeDefined();
  });

  it('close()가 pool.end()를 호출한다', async () => {
    const manager = createConnectionManager(config);
    const pool = manager.getPool();
    await manager.close();
    expect(pool.end).toHaveBeenCalled();
  });

  it('database가 없는 설정도 처리한다', () => {
    const configWithoutDb: MySQLConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
    };
    createConnectionManager(configWithoutDb);

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        database: undefined,
      }),
    );
  });

  it('ssl=true이면 ssl 옵션을 전달한다', () => {
    createConnectionManager(config, { ssl: true });

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: true },
      }),
    );
  });

  it('ssl=false이면 ssl 옵션을 전달하지 않는다', () => {
    createConnectionManager(config, { ssl: false });

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.not.objectContaining({
        ssl: expect.anything(),
      }),
    );
  });
});
