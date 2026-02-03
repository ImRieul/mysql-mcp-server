import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import type { MySQLConfig } from './config.js';

export interface ConnectionManager {
  getPool(): Pool;
  close(): Promise<void>;
}

export interface ConnectionOptions {
  ssl?: boolean;
}

export function createConnectionManager(config: MySQLConfig, options?: ConnectionOptions): ConnectionManager {
  const poolOptions: mysql.PoolOptions = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: 5,
    waitForConnections: true,
  };

  if (options?.ssl) {
    poolOptions.ssl = { rejectUnauthorized: true };
  }

  const pool = mysql.createPool(poolOptions);

  return {
    getPool() {
      return pool;
    },
    async close() {
      await pool.end();
    },
  };
}
