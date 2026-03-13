import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseArgs, resolveConfig } from './config.js';
import { createConnectionManager } from './connection.js';
import { createQueryRunner } from './query-runner.js';
import { createMcpServer } from './server.js';
import { createRequire } from 'module';

const HELP_TEXT = `Usage: mysql-mcp-server [options] [mysql://user:pass@host:port/db]

MySQL MCP Server - Model Context Protocol server for MySQL database operations

Options:
  --readonly       Enable read-only mode (blocks execute and add_comment)
  --help, -h       Show this help message
  --version        Show version number

Environment variables:
  MYSQL_HOST            MySQL host (required if no connection string)
  MYSQL_PORT            MySQL port (default: 3306)
  MYSQL_USER            MySQL user (required if no connection string)
  MYSQL_PASSWORD        MySQL password (required if no connection string)
  MYSQL_DATABASE        Default database
  MYSQL_READONLY        Read-only mode (true/false)
  MYSQL_MAX_ROWS        Max rows for SELECT queries (default: 100)
  MYSQL_QUERY_TIMEOUT   Query timeout in ms (default: 30000, 0 to disable)
  MYSQL_SSL             Enable SSL (true/false)

Examples:
  mysql-mcp-server mysql://root:pass@localhost:3306/mydb
  mysql-mcp-server --readonly
  MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=pass mysql-mcp-server`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (args.version) {
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json') as { version: string };
    console.log(pkg.version);
    process.exit(0);
  }

  const config = resolveConfig(process.argv.slice(2));
  const connectionManager = createConnectionManager(config.mysql, { ssl: config.ssl });
  const runner = createQueryRunner(connectionManager.getPool(), {
    readonly: config.readonly,
    queryTimeout: config.queryTimeout,
  });

  const server = createMcpServer(runner, config.readonly, config.maxRows);
  const transport = new StdioServerTransport();

  const shutdown = async () => {
    await server.close();
    await connectionManager.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.stdin.on('end', shutdown);

  console.error('MySQL MCP Server starting...');
  console.error(`Readonly mode: ${config.readonly}`);
  console.error(`Query timeout: ${config.queryTimeout}ms`);
  console.error(`SSL: ${config.ssl}`);

  await server.connect(transport);
  console.error('MySQL MCP Server connected via stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
