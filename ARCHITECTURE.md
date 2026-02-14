# MCP Automation Hub - Architecture

## Overview

The MCP Automation Hub is a TypeScript-based server implementing the Model Context Protocol (MCP) with stdio transport. It provides a comprehensive automation framework integrating various APIs and services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server (stdio)                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Tool Handler │  │   Logging    │  │     Env      │        │
│  │   Registry   │  │   (Winston)  │  │  Management  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ Stripe API   │      │ Supabase API │     │ Social Media │
│   Wrapper    │      │   Wrapper    │     │   Wrappers   │
│              │      │              │     │              │
│ - Customers  │      │ - Query      │     │ - Twitter    │
│ - Payments   │      │ - Insert     │     │ - Facebook   │
│ - Intents    │      │ - Update     │     │ - LinkedIn   │
└──────────────┘      │ - Sync       │     └──────────────┘
                      └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  n8n API     │
                      │   Client     │
                      │              │
                      │ - Trigger    │
                      │ - Executions │
                      │ - Workflows  │
                      └──────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────┐                            ┌──────────────┐
│   n8n Node   │                            │   n8n Node   │
│  MCP Trigger │                            │  MCP Action  │
│              │                            │              │
│ - Events     │                            │ - Execute    │
│ - Filters    │                            │ - Tools      │
└──────────────┘                            └──────────────┘
```

## Docker Services

```
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Compose Stack                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │     n8n      │  │    Redis     │        │
│  │  (Database)  │  │  (Workflow)  │  │   (Cache)    │        │
│  │              │  │              │  │              │        │
│  │  Port: 5432  │  │  Port: 5678  │  │  Port: 6379  │        │
│  │              │  │              │  │              │        │
│  │  CPU: 0.5    │  │  CPU: 1.0    │  │  CPU: 0.25   │        │
│  │  RAM: 512MB  │  │  RAM: 1GB    │  │  RAM: 256MB  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### MCP Server Core
- **Technology**: TypeScript, Node.js 20+
- **Transport**: stdio (Standard Input/Output)
- **Protocol**: Model Context Protocol (MCP)
- **Features**:
  - Tool registration and execution
  - Request/response handling
  - Error handling and logging

### Tool Handlers
Each tool handler provides specific functionality:

1. **Stripe Tools**: Payment processing, customer management
2. **Supabase Tools**: Database operations, data sync
3. **Social Media Tools**: Multi-platform posting
4. **n8n Tools**: Workflow orchestration

### API Wrappers
Abstraction layer for external APIs:
- **Rate limiting**: Handled by underlying SDKs
- **Error handling**: Centralized logging
- **Authentication**: Environment-based credentials

### n8n Custom Nodes
- **MCPTrigger**: Listens for MCP events
- **MCPAction**: Executes MCP tools from workflows

### Utilities
- **Logger**: Winston-based structured logging
- **Environment**: Zod-based validation
- **API Key Rotation**: Automatic key expiration monitoring

## Data Flow

### MCP Tool Execution Flow

```
1. Client sends MCP request via stdin
   ↓
2. MCP Server receives and validates request
   ↓
3. Server looks up tool handler in registry
   ↓
4. Tool handler validates input arguments
   ↓
5. API wrapper executes external API call
   ↓
6. Result is formatted and logged
   ↓
7. Response sent back via stdout
```

### n8n Workflow Integration

```
1. n8n workflow triggers (webhook, schedule, etc.)
   ↓
2. MCP Trigger node receives event
   ↓
3. Node processes event based on filters
   ↓
4. Workflow executes subsequent nodes
   ↓
5. MCP Action node calls MCP tools
   ↓
6. Results flow to next workflow steps
```

## Security Considerations

1. **API Keys**: Stored in environment variables, never in code
2. **Rotation**: Automatic monitoring and notifications
3. **Logging**: Sensitive data excluded from logs
4. **Transport**: stdio provides process isolation
5. **Validation**: Input validation using Zod schemas

## Scalability

### Resource Optimization (M1 8GB)
- PostgreSQL: Limited to 512MB RAM
- n8n: Limited to 1GB RAM
- Redis: Limited to 256MB RAM
- Total: ~1.8GB for Docker services

### Horizontal Scaling
- MCP Server: Multiple instances via process manager
- n8n: Database-backed for multi-instance support
- Redis: Can be used for distributed caching

## Monitoring

### Logging Levels
- **error**: Critical failures
- **warn**: Potential issues
- **info**: Normal operations
- **debug**: Detailed diagnostics

### Log Files
- `logs/error.log`: Error-level logs
- `logs/combined.log`: All logs
- Rotation: 10MB per file, 5 files max

## Deployment

### Development
```bash
pnpm run dev  # Hot reload with tsx
```

### Production
```bash
pnpm run build  # Compile TypeScript
pnpm start      # Run compiled code
```

### Docker
```bash
pnpm run docker:up    # Start services
pnpm run docker:down  # Stop services
```

## Extension Points

### Adding New Tools
1. Create tool handler in `src/mcp-server/tools/`
2. Implement ToolHandler interface
3. Register in `tools/registry.ts`

### Adding New APIs
1. Create API client in `src/api/`
2. Implement wrapper methods
3. Add corresponding tool handlers

### Adding n8n Nodes
1. Create node in `src/n8n-nodes/`
2. Implement INodeType interface
3. Build and install via script

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI/CD** (`.github/workflows/ci.yml`)
   - Lint code
   - Type check
   - Run tests
   - Build project
   - Validate Docker Compose

2. **Code Quality** (`.github/workflows/code-quality.yml`)
   - Run linter
   - Check formatting
   - Type checking

## Performance

### Optimization Strategies
1. **Lazy Loading**: API clients initialized on first use
2. **Connection Pooling**: Database connections reused
3. **Caching**: Redis for frequently accessed data
4. **Async Operations**: Non-blocking I/O throughout

### Benchmarks
- MCP tool call latency: <100ms (excluding external APIs)
- Tool registration: <10ms
- Memory footprint: ~50MB (base process)

## Future Enhancements

1. **Additional Integrations**: More API wrappers
2. **Advanced Sync**: Bidirectional data sync
3. **Real-time Events**: WebSocket support
4. **Metrics**: Prometheus/Grafana integration
5. **Testing**: Increased coverage, E2E tests
6. **Documentation**: OpenAPI specs for APIs
