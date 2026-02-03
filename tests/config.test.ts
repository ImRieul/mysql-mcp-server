import { describe, it, expect } from 'vitest';
import { parseConnectionString, parseEnvConfig, parseArgs, resolveConfig } from '../src/config.js';

describe('parseConnectionString', () => {
  it('정상적인 connection string을 파싱한다', () => {
    const result = parseConnectionString('mysql://user:pass@localhost:3306/mydb');
    expect(result).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'user',
      password: 'pass',
      database: 'mydb',
    });
  });

  it('포트가 없으면 기본값 3306을 사용한다', () => {
    const result = parseConnectionString('mysql://user:pass@localhost/mydb');
    expect(result).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'user',
      password: 'pass',
      database: 'mydb',
    });
  });

  it('database가 없는 경우 undefined', () => {
    const result = parseConnectionString('mysql://user:pass@localhost:3306');
    expect(result).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'user',
      password: 'pass',
      database: undefined,
    });
  });

  it('특수문자가 포함된 비밀번호를 처리한다', () => {
    const result = parseConnectionString('mysql://user:p%40ss%3Aword@localhost:3306/mydb');
    expect(result).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'user',
      password: 'p@ss:word',
      database: 'mydb',
    });
  });

  it('잘못된 URL이면 에러를 던진다', () => {
    expect(() => parseConnectionString('not-a-url')).toThrow();
  });

  it('mysql:// 프로토콜이 아니면 에러를 던진다', () => {
    expect(() => parseConnectionString('postgres://user:pass@localhost/db')).toThrow('mysql:// protocol');
  });
});

describe('parseEnvConfig', () => {
  it('환경변수에서 올바르게 파싱한다', () => {
    const env = {
      MYSQL_HOST: '127.0.0.1',
      MYSQL_PORT: '3307',
      MYSQL_USER: 'admin',
      MYSQL_PASSWORD: 'secret',
      MYSQL_DATABASE: 'testdb',
    };
    const result = parseEnvConfig(env);
    expect(result).toEqual({
      host: '127.0.0.1',
      port: 3307,
      user: 'admin',
      password: 'secret',
      database: 'testdb',
    });
  });

  it('MYSQL_PORT가 없으면 기본값 3306', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = parseEnvConfig(env);
    expect(result.port).toBe(3306);
  });

  it('MYSQL_DATABASE가 없으면 undefined', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = parseEnvConfig(env);
    expect(result.database).toBeUndefined();
  });

  it('MYSQL_HOST가 없으면 에러', () => {
    const env = { MYSQL_USER: 'root', MYSQL_PASSWORD: 'pass' };
    expect(() => parseEnvConfig(env)).toThrow('MYSQL_HOST');
  });

  it('MYSQL_USER가 없으면 에러', () => {
    const env = { MYSQL_HOST: 'localhost', MYSQL_PASSWORD: 'pass' };
    expect(() => parseEnvConfig(env)).toThrow('MYSQL_USER');
  });

  it('MYSQL_PASSWORD가 없으면 에러', () => {
    const env = { MYSQL_HOST: 'localhost', MYSQL_USER: 'root' };
    expect(() => parseEnvConfig(env)).toThrow('MYSQL_PASSWORD');
  });
});

describe('parseArgs', () => {
  it('connection string 인자를 파싱한다', () => {
    const result = parseArgs(['mysql://user:pass@localhost/db']);
    expect(result.connectionString).toBe('mysql://user:pass@localhost/db');
    expect(result.readonly).toBe(false);
  });

  it('--readonly 플래그를 파싱한다', () => {
    const result = parseArgs(['--readonly']);
    expect(result.readonly).toBe(true);
    expect(result.connectionString).toBeUndefined();
  });

  it('connection string과 --readonly를 함께 파싱한다', () => {
    const result = parseArgs(['--readonly', 'mysql://user:pass@localhost/db']);
    expect(result.connectionString).toBe('mysql://user:pass@localhost/db');
    expect(result.readonly).toBe(true);
  });

  it('인자가 없으면 기본값', () => {
    const result = parseArgs([]);
    expect(result.connectionString).toBeUndefined();
    expect(result.readonly).toBe(false);
  });
});

describe('resolveConfig', () => {
  it('connection string이 환경변수보다 우선한다', () => {
    const env = {
      MYSQL_HOST: 'envhost',
      MYSQL_USER: 'envuser',
      MYSQL_PASSWORD: 'envpass',
    };
    const result = resolveConfig(['mysql://cliuser:clipass@clihost:3307/clidb'], env);
    expect(result.mysql.host).toBe('clihost');
    expect(result.mysql.user).toBe('cliuser');
  });

  it('connection string이 없으면 환경변수를 사용한다', () => {
    const env = {
      MYSQL_HOST: 'envhost',
      MYSQL_USER: 'envuser',
      MYSQL_PASSWORD: 'envpass',
      MYSQL_DATABASE: 'envdb',
    };
    const result = resolveConfig([], env);
    expect(result.mysql.host).toBe('envhost');
    expect(result.mysql.user).toBe('envuser');
  });

  it('--readonly 플래그가 반영된다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = resolveConfig(['--readonly'], env);
    expect(result.readonly).toBe(true);
  });

  it('MYSQL_READONLY=true 환경변수가 반영된다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
      MYSQL_READONLY: 'true',
    };
    const result = resolveConfig([], env);
    expect(result.readonly).toBe(true);
  });

  it('connection string도 환경변수도 없으면 에러', () => {
    expect(() => resolveConfig([], {})).toThrow();
  });

  it('maxRows 기본값은 100이다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = resolveConfig([], env);
    expect(result.maxRows).toBe(100);
  });

  it('MYSQL_MAX_ROWS 환경변수로 maxRows를 설정할 수 있다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
      MYSQL_MAX_ROWS: '500',
    };
    const result = resolveConfig([], env);
    expect(result.maxRows).toBe(500);
  });

  it('queryTimeout 기본값은 30000이다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = resolveConfig([], env);
    expect(result.queryTimeout).toBe(30000);
  });

  it('MYSQL_QUERY_TIMEOUT 환경변수로 queryTimeout을 설정할 수 있다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
      MYSQL_QUERY_TIMEOUT: '10000',
    };
    const result = resolveConfig([], env);
    expect(result.queryTimeout).toBe(10000);
  });

  it('MYSQL_QUERY_TIMEOUT=0이면 타임아웃이 비활성화된다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
      MYSQL_QUERY_TIMEOUT: '0',
    };
    const result = resolveConfig([], env);
    expect(result.queryTimeout).toBe(0);
  });

  it('ssl 기본값은 false이다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
    };
    const result = resolveConfig([], env);
    expect(result.ssl).toBe(false);
  });

  it('MYSQL_SSL=true 환경변수로 ssl을 활성화할 수 있다', () => {
    const env = {
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'pass',
      MYSQL_SSL: 'true',
    };
    const result = resolveConfig([], env);
    expect(result.ssl).toBe(true);
  });
});
