import { registerTools } from '../tools/index';
import { createServer } from '../server';

describe('registerTools', () => {
  it('registers ListTools and CallTool handlers without throwing', () => {
    const server = createServer();
    expect(() => registerTools(server)).not.toThrow();
  });
});

describe('tool handlers via server', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer();
    registerTools(server);
  });

  it('lists the three expected tools', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/list');
    expect(handler).toBeDefined();
    const result = await handler({ method: 'tools/list', params: {} });
    expect(result.tools).toHaveLength(3);
    const names = result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('health_check');
    expect(names).toContain('list_patterns');
    expect(names).toContain('get_pattern');
  });

  it('returns healthy status for health_check tool', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/call');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'tools/call',
      params: { name: 'health_check', arguments: {} },
    });
    const body = JSON.parse(result.content[0].text);
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('returns pattern list for list_patterns tool', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/call');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'tools/call',
      params: { name: 'list_patterns', arguments: {} },
    });
    const body = JSON.parse(result.content[0].text);
    expect(Array.isArray(body.patterns)).toBe(true);
    expect(body.patterns.length).toBeGreaterThan(0);
  });

  it('returns guidance text for get_pattern tool', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/call');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'tools/call',
      params: { name: 'get_pattern', arguments: { name: 'audit-refactor' } },
    });
    expect(result.content[0].text).toContain('audit-refactor');
  });

  it('throws for unknown tool name', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/call');
    expect(handler).toBeDefined();
    await expect(
      handler({
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      })
    ).rejects.toThrow('Unknown tool: nonexistent_tool');
  });

  it('throws when get_pattern is called without a name argument', async () => {
    const handler = (server as any)._requestHandlers?.get('tools/call');
    expect(handler).toBeDefined();
    await expect(
      handler({
        method: 'tools/call',
        params: { name: 'get_pattern', arguments: {} },
      })
    ).rejects.toThrow('Pattern name is required');
  });
});
