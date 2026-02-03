import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolveConfig } from './config.js';
import { createConnectionManager } from './connection.js';
import { createQueryRunner } from './query-runner.js';
import { createMcpServer } from './server.js';

async function main(): Promise<void> {
  const config = resolveConfig(process.argv.slice(2));
  const connectionManager = createConnectionManager(config.mysql, { ssl: config.ssl });
  const runner = createQueryRunner(connectionManager.getPool(), {
    readonly: config.readonly,
    queryTimeout: config.queryTimeout,
  });

  const server = createMcpServer(runner, config.readonly, config.maxRows);
  const transport = new StdioServerTransport();

  process.on('SIGINT', async () => {
    await server.close();
    await connectionManager.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    await connectionManager.close();
    process.exit(0);
  });

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
