import { registerResources } from '../resources/index';
import { createServer } from '../server';

describe('registerResources', () => {
  it('registers ListResources and ReadResource handlers without throwing', () => {
    const server = createServer();
    expect(() => registerResources(server)).not.toThrow();
  });
});

describe('resource handlers via server', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer();
    registerResources(server);
  });

  it('lists the two expected resources', async () => {
    const handler = (server as any)._requestHandlers?.get('resources/list');
    expect(handler).toBeDefined();
    const result = await handler({ method: 'resources/list', params: {} });
    expect(result.resources).toHaveLength(2);
    const uris = result.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain('automation-hub://status');
    expect(uris).toContain('automation-hub://patterns');
  });

  it('returns operational status for automation-hub://status', async () => {
    const handler = (server as any)._requestHandlers?.get('resources/read');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'resources/read',
      params: { uri: 'automation-hub://status' },
    });
    const body = JSON.parse(result.contents[0].text);
    expect(body.status).toBe('operational');
    expect(body.version).toBe('1.0.0');
    expect(body.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('returns pattern catalogue for automation-hub://patterns', async () => {
    const handler = (server as any)._requestHandlers?.get('resources/read');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'resources/read',
      params: { uri: 'automation-hub://patterns' },
    });
    const body = JSON.parse(result.contents[0].text);
    expect(Array.isArray(body.patterns)).toBe(true);
    expect(body.patterns.length).toBeGreaterThan(0);
  });

  it('throws for unknown resource URI', async () => {
    const handler = (server as any)._requestHandlers?.get('resources/read');
    expect(handler).toBeDefined();
    await expect(
      handler({
        method: 'resources/read',
        params: { uri: 'automation-hub://unknown' },
      })
    ).rejects.toThrow('Resource not found: automation-hub://unknown');
  });
});
