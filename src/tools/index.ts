import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { QueryRunner } from '../query-runner.js';
import { queryToolName, queryToolConfig, createQueryHandler } from './query.js';
import { executeToolName, executeToolConfig, createExecuteHandler } from './execute.js';
import { listDatabasesToolName, listDatabasesToolConfig, createListDatabasesHandler } from './list-databases.js';
import { listTablesToolName, listTablesToolConfig, createListTablesHandler } from './list-tables.js';
import { describeTableToolName, describeTableToolConfig, createDescribeTableHandler } from './describe-table.js';
import {
  describeAllTablesToolName,
  describeAllTablesToolConfig,
  createDescribeAllTablesHandler,
} from './describe-all-tables.js';
import { addCommentToolName, addCommentToolConfig, createAddCommentHandler } from './add-comment.js';

export function registerAllTools(server: McpServer, runner: QueryRunner, readonly: boolean, maxRows: number): void {
  server.tool(
    queryToolName,
    queryToolConfig.description,
    queryToolConfig.inputSchema,
    createQueryHandler(runner, maxRows),
  );
  server.tool(
    executeToolName,
    executeToolConfig.description,
    executeToolConfig.inputSchema,
    createExecuteHandler(runner, readonly),
  );
  server.tool(listDatabasesToolName, listDatabasesToolConfig.description, createListDatabasesHandler(runner));
  server.tool(
    listTablesToolName,
    listTablesToolConfig.description,
    listTablesToolConfig.inputSchema,
    createListTablesHandler(runner),
  );
  server.tool(
    describeTableToolName,
    describeTableToolConfig.description,
    describeTableToolConfig.inputSchema,
    createDescribeTableHandler(runner),
  );
  server.tool(
    describeAllTablesToolName,
    describeAllTablesToolConfig.description,
    describeAllTablesToolConfig.inputSchema,
    createDescribeAllTablesHandler(runner),
  );
  server.tool(
    addCommentToolName,
    addCommentToolConfig.description,
    addCommentToolConfig.inputSchema,
    createAddCommentHandler(runner, readonly),
  );
}
