# MCP Automation Hub

Central MCP (Model Context Protocol) automation hub with CLI/SDK integration for n8n workflows, API orchestration, and tight service bindings.

## Features

- **MCP Server with stdio transport**: Core server implementing Model Context Protocol
- **Custom n8n nodes**: Workflow triggers and actions for n8n automation
- **API Wrappers**: 
  - Stripe payment processing
  - Social media integrations (Twitter, Facebook, LinkedIn)
  - Supabase database sync
- **API Key Rotation**: Automatic key rotation with expiration monitoring
- **Docker Compose**: Containerized environment with PostgreSQL, n8n, and Redis
- **Hot Reload**: Development mode with automatic reloading
- **CI/CD**: GitHub Actions workflows for automated testing and deployment
- **M1 Optimized**: Resource-constrained configuration for Apple Silicon (8GB RAM)

## Prerequisites

- Node.js 20+
- pnpm 8.15.0+
- Docker and Docker Compose (optional)

## Installation

```bash
# Clone the repository
git clone https://github.com/crystalclearhouse-data/mcp-automation-hub.git
cd mcp-automation-hub

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
```

## Project Structure

```
mcp-automation-hub/
├── src/
│   ├── mcp-server/          # MCP server implementation
│   │   ├── index.ts         # Server entry point
│   │   ├── server.ts        # Core server logic
│   │   └── tools/           # MCP tool handlers
│   │       ├── stripe.ts    # Stripe API tools
│   │       ├── supabase.ts  # Supabase tools
│   │       ├── social-media.ts  # Social media tools
│   │       └── n8n.ts       # n8n workflow tools
│   ├── n8n-nodes/           # Custom n8n nodes
│   │   ├── MCPTrigger.node.ts
│   │   └── MCPAction.node.ts
│   ├── api/                 # API client wrappers
│   │   ├── stripe/          # Stripe integration
│   │   ├── social/          # Social media integrations
│   │   ├── supabase/        # Supabase integration
│   │   └── n8n/             # n8n API client
│   └── utils/               # Utilities
│       ├── logger.ts        # Winston logging
│       ├── env.ts           # Environment validation
│       └── api-key-rotation.ts  # Key rotation
├── scripts/                 # Utility scripts
├── .github/workflows/       # GitHub Actions CI/CD
├── docker-compose.yml       # Docker services
└── package.json

```

## Usage

### Development Mode

Start the MCP server with hot reload:

```bash
pnpm run dev
```

### Production Mode

Build and start the server:

```bash
pnpm run build
pnpm start
```

### Docker Compose

Start all services (PostgreSQL, n8n, Redis):

```bash
pnpm run docker:up
```

View logs:

```bash
pnpm run docker:logs
```

Stop services:

```bash
pnpm run docker:down
```

## MCP Tools

The server provides the following tools via the Model Context Protocol:

### Stripe Tools
- `stripe_create_customer` - Create a new Stripe customer
- `stripe_list_customers` - List Stripe customers
- `stripe_create_payment_intent` - Create a payment intent

### Supabase Tools
- `supabase_query` - Query data from Supabase
- `supabase_insert` - Insert data into Supabase
- `supabase_update` - Update data in Supabase
- `supabase_sync` - Sync data between Supabase and external services

### Social Media Tools
- `twitter_post` - Post a tweet to Twitter
- `facebook_post` - Post to Facebook
- `linkedin_post` - Post to LinkedIn

### n8n Tools
- `n8n_trigger_workflow` - Trigger an n8n workflow
- `n8n_get_execution` - Get workflow execution status
- `n8n_list_workflows` - List all workflows

## n8n Custom Nodes

The project includes custom n8n nodes:

1. **MCP Trigger** - Trigger workflows from MCP events
2. **MCP Action** - Execute MCP tools from n8n workflows

To install custom nodes:

```bash
pnpm run build
pnpm run n8n:install
```

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `TWITTER_BEARER_TOKEN` - Twitter API bearer token
- `N8N_HOST` - n8n server host
- `API_KEY_ROTATION_ENABLED` - Enable API key rotation

## API Key Rotation

The system includes automatic API key rotation monitoring:

- Default rotation interval: 90 days
- Notification before expiration: 7 days
- Automatic expiration checks every 24 hours

Configure in `.env`:
```bash
API_KEY_ROTATION_ENABLED=true
API_KEY_ROTATION_INTERVAL_DAYS=90
API_KEY_ROTATION_NOTIFICATION_DAYS=7
```

## Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint errors
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run tests
- `pnpm run type-check` - Type check without building

## Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

## CI/CD

GitHub Actions workflows:

- **CI/CD** (`.github/workflows/ci.yml`) - Lint, test, build, and Docker validation
- **Code Quality** (`.github/workflows/code-quality.yml`) - Code quality checks on PRs

## Resource Optimization

The Docker Compose configuration is optimized for M1 Macs with 8GB RAM:

- PostgreSQL: 0.5 CPU, 512MB RAM
- n8n: 1.0 CPU, 1GB RAM
- Redis: 0.25 CPU, 256MB RAM

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
