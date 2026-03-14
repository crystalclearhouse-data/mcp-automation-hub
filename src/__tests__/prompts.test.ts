import { registerPrompts } from '../prompts/index';
import { createServer } from '../server';

const ALL_PROMPT_NAMES = [
  'roadmap-planning',
  'infra-module-baseline',
  'mcp-server-golden-path',
  'cicd-github-actions',
  'n8n-pipeline-ingestion',
  'audit-refactor',
  'onboarding-docs',
];

describe('registerPrompts', () => {
  it('registers ListPrompts and GetPrompt handlers without throwing', () => {
    const server = createServer();
    expect(() => registerPrompts(server)).not.toThrow();
  });
});

describe('prompt handlers via server', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer();
    registerPrompts(server);
  });

  it('lists all seven expected prompts', async () => {
    const handler = (server as any)._requestHandlers?.get('prompts/list');
    expect(handler).toBeDefined();
    const result = await handler({ method: 'prompts/list', params: {} });
    const names = result.prompts.map((p: { name: string }) => p.name);
    for (const name of ALL_PROMPT_NAMES) {
      expect(names).toContain(name);
    }
  });

  it.each(ALL_PROMPT_NAMES)(
    'returns non-empty messages for prompt "%s" with default args',
    async (promptName) => {
      const handler = (server as any)._requestHandlers?.get('prompts/get');
      expect(handler).toBeDefined();
      const result = await handler({
        method: 'prompts/get',
        params: { name: promptName, arguments: {} },
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text.length).toBeGreaterThan(0);
    }
  );

  it('uses provided focus_areas argument in roadmap-planning', async () => {
    const handler = (server as any)._requestHandlers?.get('prompts/get');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'roadmap-planning',
        arguments: { focus_areas: 'security,cost' },
      },
    });
    expect(result.messages[0].content.text).toContain('security,cost');
  });

  it('uses provided service_name argument in mcp-server-golden-path', async () => {
    const handler = (server as any)._requestHandlers?.get('prompts/get');
    expect(handler).toBeDefined();
    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'mcp-server-golden-path',
        arguments: { service_name: 'my-test-service' },
      },
    });
    expect(result.messages[0].content.text).toContain('my-test-service');
  });

  it('throws for unknown prompt name', async () => {
    const handler = (server as any)._requestHandlers?.get('prompts/get');
    expect(handler).toBeDefined();
    await expect(
      handler({
        method: 'prompts/get',
        params: { name: 'nonexistent-prompt', arguments: {} },
      })
    ).rejects.toThrow('Unknown prompt: nonexistent-prompt');
  });
});
