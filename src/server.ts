import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { QueryRunner } from './query-runner.js';
import { registerAllTools } from './tools/index.js';

export function createMcpServer(runner: QueryRunner, readonly: boolean, maxRows: number): McpServer {
  const server = new McpServer({
    name: '@imrieul/mysql-mcp-server',
    version: '0.1.0',
  });

  registerAllTools(server, runner, readonly, maxRows);

  return server;
}
