import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Creates and returns a configured MCP Server instance.
 */
export function createServer(): Server {
  return new Server(
    {
      name: 'mcp-automation-hub',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );
}
