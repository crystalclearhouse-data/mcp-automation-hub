#!/usr/bin/env node

/**
 * MCP Automation Hub - Main Entry Point
 * 
 * This is the primary entry point for the MCP (Model Context Protocol) server.
 * It initializes the server, registers tools, resources, and prompts, and
 * handles the main server lifecycle.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createServer } from './server.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

/**
 * Main server initialization
 */
async function main() {
  try {
    logger.info('Starting MCP Automation Hub...');

    // Create MCP server instance
    const server = new Server(
      {
        name: 'mcp-automation-hub',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Register all tools
    registerTools(server);
    logger.info('Tools registered successfully');

    // Register all resources
    registerResources(server);
    logger.info('Resources registered successfully');

    // Register all prompts
    registerPrompts(server);
    logger.info('Prompts registered successfully');

    // Create transport layer (stdio for CLI integration)
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info(`MCP Automation Hub is running on port ${config.port}`);
    logger.info('Press Ctrl+C to stop the server');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
main();
