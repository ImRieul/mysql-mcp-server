import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockServerClose = vi.fn().mockResolvedValue(undefined);
const mockServerConnect = vi.fn().mockResolvedValue(undefined);
const mockServerTool = vi.fn();
const mockConnectionClose = vi.fn().mockResolvedValue(undefined);

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  resolveConfig: vi.fn(() => ({
    mysql: { host: 'localhost', port: 3306, user: 'root', password: 'secret' },
    readonly: false,
    queryTimeout: 30000,
    ssl: false,
    maxRows: 100,
  })),
}));

vi.mock('../src/connection.js', () => ({
  createConnectionManager: vi.fn(() => ({
    getPool: vi.fn(() => ({})),
    close: mockConnectionClose,
  })),
}));

vi.mock('../src/query-runner.js', () => ({
  createQueryRunner: vi.fn(() => ({})),
}));

vi.mock('../src/server.js', () => ({
  createMcpServer: vi.fn(() => ({
    close: mockServerClose,
    connect: mockServerConnect,
    tool: mockServerTool,
  })),
}));

describe('index.ts shutdown', () => {
  type AsyncHandler = () => Promise<void>;
  let processHandlers: Record<string, AsyncHandler>;
  let stdinHandlers: Record<string, AsyncHandler>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    processHandlers = {};
    stdinHandlers = {};

    vi.spyOn(process, 'on').mockImplementation(((event: string, handler: AsyncHandler) => {
      processHandlers[event] = handler;
      return process;
    }) as typeof process.on);

    vi.spyOn(process.stdin, 'on').mockImplementation(((event: string, handler: AsyncHandler) => {
      stdinHandlers[event] = handler;
      return process.stdin;
    }) as typeof process.stdin.on);

    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    vi.resetModules();
    await import('../src/index.js');
    await vi.waitFor(() => {
      expect(mockServerConnect).toHaveBeenCalled();
    });
  });

  it('SIGINT 핸들러를 등록한다', () => {
    expect(processHandlers['SIGINT']).toBeDefined();
  });

  it('SIGTERM 핸들러를 등록한다', () => {
    expect(processHandlers['SIGTERM']).toBeDefined();
  });

  it('stdin end 핸들러를 등록한다', () => {
    expect(stdinHandlers['end']).toBeDefined();
  });

  it('SIGINT 시 server.close()와 connectionManager.close()를 호출한다', async () => {
    await processHandlers['SIGINT']();

    expect(mockServerClose).toHaveBeenCalled();
    expect(mockConnectionClose).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('SIGTERM 시 server.close()와 connectionManager.close()를 호출한다', async () => {
    await processHandlers['SIGTERM']();

    expect(mockServerClose).toHaveBeenCalled();
    expect(mockConnectionClose).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('stdin end 시 server.close()와 connectionManager.close()를 호출한다', async () => {
    await stdinHandlers['end']();

    expect(mockServerClose).toHaveBeenCalled();
    expect(mockConnectionClose).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
