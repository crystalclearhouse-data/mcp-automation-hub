describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses default port 3000 when MCP_SERVER_PORT is unset', async () => {
    delete process.env.MCP_SERVER_PORT;
    delete process.env.PORT;
    const { config } = await import('../config');
    expect(config.port).toBe(3000);
  });

  it('reads MCP_SERVER_PORT from env', async () => {
    process.env.MCP_SERVER_PORT = '8080';
    const { config } = await import('../config');
    expect(config.port).toBe(8080);
  });

  it('defaults log level to info', async () => {
    delete process.env.MCP_LOG_LEVEL;
    const { config } = await import('../config');
    expect(config.logLevel).toBe('info');
  });

  it('defaults nodeEnv to development', async () => {
    delete process.env.NODE_ENV;
    const { config } = await import('../config');
    expect(config.nodeEnv).toBe('development');
  });
});
