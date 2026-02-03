export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

export interface AppConfig {
  mysql: MySQLConfig;
  readonly: boolean;
  maxRows: number;
  queryTimeout: number;
  ssl: boolean;
}

export function parseConnectionString(connStr: string): MySQLConfig {
  let url: URL;
  try {
    url = new URL(connStr);
  } catch {
    throw new Error(`Invalid connection string: ${connStr}`);
  }

  if (url.protocol !== 'mysql:') {
    throw new Error(`Expected mysql:// protocol, got ${url.protocol}`);
  }

  const database = url.pathname.slice(1) || undefined;

  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

export function parseEnvConfig(env: Record<string, string | undefined>): MySQLConfig {
  const host = env.MYSQL_HOST;
  const user = env.MYSQL_USER;
  const password = env.MYSQL_PASSWORD;

  if (!host) throw new Error('Missing required environment variable: MYSQL_HOST');
  if (!user) throw new Error('Missing required environment variable: MYSQL_USER');
  if (!password) throw new Error('Missing required environment variable: MYSQL_PASSWORD');

  return {
    host,
    port: env.MYSQL_PORT ? parseInt(env.MYSQL_PORT, 10) : 3306,
    user,
    password,
    database: env.MYSQL_DATABASE || undefined,
  };
}

export function parseArgs(argv: string[]): { connectionString?: string; readonly: boolean } {
  let connectionString: string | undefined;
  let readonly = false;

  for (const arg of argv) {
    if (arg === '--readonly') {
      readonly = true;
    } else if (arg.startsWith('mysql://')) {
      connectionString = arg;
    }
  }

  return { connectionString, readonly };
}

export function resolveConfig(argv: string[], env: Record<string, string | undefined> = process.env): AppConfig {
  const args = parseArgs(argv);

  const mysql = args.connectionString ? parseConnectionString(args.connectionString) : parseEnvConfig(env);

  const readonly = args.readonly || env.MYSQL_READONLY === 'true';
  const maxRows = env.MYSQL_MAX_ROWS ? parseInt(env.MYSQL_MAX_ROWS, 10) : 100;
  const queryTimeout = env.MYSQL_QUERY_TIMEOUT !== undefined ? parseInt(env.MYSQL_QUERY_TIMEOUT, 10) : 30000;
  const ssl = env.MYSQL_SSL === 'true';

  return { mysql, readonly, maxRows, queryTimeout, ssl };
}
