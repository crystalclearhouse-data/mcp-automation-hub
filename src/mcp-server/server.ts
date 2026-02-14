import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';
import { toolHandlers } from './tools/index.js';

export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: env.MCP_SERVER_NAME,
        version: env.MCP_SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');
      return {
        tools: Object.values(toolHandlers).map((handler) => ({
          name: handler.name,
          description: handler.description,
          inputSchema: handler.inputSchema,
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Tool called: ${name}`, { args });

      const handler = toolHandlers[name];
      if (!handler) {
        logger.error(`Unknown tool: ${name}`);
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await handler.execute(args || {});
        logger.info(`Tool executed successfully: ${name}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, { error });
        throw error;
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started with stdio transport', {
      name: env.MCP_SERVER_NAME,
      version: env.MCP_SERVER_VERSION,
    });
  }
}
