import { describe, it, expect, vi } from 'vitest';
import { registerAllTools } from '../../src/tools/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { QueryRunner } from '../../src/query-runner.js';

describe('registerAllTools', () => {
  function createMockServer() {
    return {
      tool: vi.fn(),
    } as unknown as McpServer;
  }

  it('6개의 tool을 등록한다', () => {
    const server = createMockServer();
    const runner = { query: vi.fn() } as unknown as QueryRunner;

    registerAllTools(server, runner, false, 100);

    expect(server.tool).toHaveBeenCalledTimes(6);
  });

  it('올바른 tool 이름으로 등록한다', () => {
    const server = createMockServer();
    const runner = { query: vi.fn() } as unknown as QueryRunner;

    registerAllTools(server, runner, false, 100);

    const toolNames = (server.tool as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0]);
    expect(toolNames).toContain('query');
    expect(toolNames).toContain('execute');
    expect(toolNames).toContain('list_databases');
    expect(toolNames).toContain('list_tables');
    expect(toolNames).toContain('describe_table');
    expect(toolNames).toContain('describe_all_tables');
  });
});
