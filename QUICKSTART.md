# Quick Start Guide

This guide will help you get the MCP Automation Hub up and running quickly.

## Prerequisites

Ensure you have the following installed:
- Node.js 20+
- pnpm 8.15.0+
- Docker and Docker Compose (for containerized services)

## Quick Setup

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API credentials
# At minimum, configure:
# - SUPABASE_URL and SUPABASE_ANON_KEY (for Supabase)
# - STRIPE_SECRET_KEY (for Stripe)
# - Twitter, Facebook, LinkedIn credentials (for social media)
```

### 3. Build the Project

```bash
pnpm run build
```

### 4. Start the MCP Server

For development with hot reload:
```bash
pnpm run dev
```

For production:
```bash
pnpm start
```

The server will start with stdio transport and wait for MCP protocol messages on stdin.

## Using with Docker Compose

Start all services (PostgreSQL, n8n, Redis):

```bash
pnpm run docker:up
```

Access n8n at: http://localhost:5678

## Example MCP Tool Usage

The MCP server provides tools that can be called via the Model Context Protocol. Here are some examples:

### Stripe Tools

Create a customer:
```json
{
  "name": "stripe_create_customer",
  "arguments": {
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

### Supabase Tools

Query data:
```json
{
  "name": "supabase_query",
  "arguments": {
    "table": "users",
    "limit": 10
  }
}
```

### Social Media Tools

Post to Twitter:
```json
{
  "name": "twitter_post",
  "arguments": {
    "text": "Hello from MCP Automation Hub!"
  }
}
```

### n8n Tools

Trigger a workflow:
```json
{
  "name": "n8n_trigger_workflow",
  "arguments": {
    "workflowId": "your-workflow-id",
    "data": {
      "key": "value"
    }
  }
}
```

## Using Custom n8n Nodes

After building the project and installing n8n nodes:

```bash
pnpm run build
pnpm run n8n:install
```

1. Navigate to n8n at http://localhost:5678
2. Create a new workflow
3. Look for "MCP Trigger" and "MCP Action" nodes in the node panel
4. Add them to your workflow
5. Configure the nodes with your desired actions

## Development Workflow

1. Make changes to TypeScript files
2. Run type checking: `pnpm run type-check`
3. Run tests: `pnpm run test`
4. Run linting: `pnpm run lint`
5. Build: `pnpm run build`

Or use hot reload mode:
```bash
pnpm run dev
```

## API Key Rotation

The system automatically monitors API key expiration:

- Keys are checked every 24 hours
- Notifications are sent 7 days before expiration
- Default rotation interval is 90 days

Configure in `.env`:
```bash
API_KEY_ROTATION_ENABLED=true
API_KEY_ROTATION_INTERVAL_DAYS=90
API_KEY_ROTATION_NOTIFICATION_DAYS=7
```

## Troubleshooting

### MCP Server won't start
- Check that all required environment variables are set
- Verify Node.js version is 20+
- Check logs in `logs/` directory

### Docker services won't start
- Ensure Docker is running
- Check port availability (5432, 5678, 6379)
- Review Docker logs: `pnpm run docker:logs`

### Build errors
- Clean node_modules: `rm -rf node_modules && pnpm install`
- Clear build output: `rm -rf dist && pnpm run build`

## Next Steps

1. Configure your API credentials in `.env`
2. Explore the MCP tools in the codebase
3. Create custom n8n workflows
4. Extend the server with new tools
5. Deploy to production

For more detailed information, see the main [README.md](README.md).
