import { describe, it, expect, vi } from 'vitest';
import { createMcpServer } from '../src/server.js';
import type { QueryRunner } from '../src/query-runner.js';

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      tool: vi.fn(),
    })),
  };
});

describe('createMcpServer', () => {
  it('McpServer 인스턴스를 반환한다', () => {
    const runner = { query: vi.fn() } as unknown as QueryRunner;
    const server = createMcpServer(runner, false, 100);

    expect(server).toBeDefined();
    expect(server.tool).toBeDefined();
  });

  it('6개의 tool을 등록한다', () => {
    const runner = { query: vi.fn() } as unknown as QueryRunner;
    const server = createMcpServer(runner, false, 100);

    expect(server.tool).toHaveBeenCalledTimes(6);
  });
});
