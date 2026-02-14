# Contributing to MCP Automation Hub

Thank you for your interest in contributing to the MCP Automation Hub! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mcp-automation-hub.git
   cd mcp-automation-hub
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Write clear, concise code
- Follow the existing code style
- Add comments where necessary
- Update documentation as needed

### 2. Test Your Changes

```bash
# Type checking
pnpm run type-check

# Run tests
pnpm run test

# Linting
pnpm run lint

# Format code
pnpm run format
```

### 3. Build the Project

```bash
pnpm run build
```

### 4. Commit Your Changes

We follow conventional commit messages:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```bash
git commit -m "feat: add GitHub API integration"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Project Structure

```
mcp-automation-hub/
├── src/
│   ├── mcp-server/        # MCP server implementation
│   ├── n8n-nodes/         # Custom n8n nodes
│   ├── api/               # API wrappers
│   └── utils/             # Utility functions
├── scripts/               # Build and utility scripts
├── .github/workflows/     # CI/CD workflows
└── tests/                 # Test files
```

## Adding New Features

### Adding a New MCP Tool

1. Create a new tool handler file in `src/mcp-server/tools/`:
   ```typescript
   import { ToolHandler } from './index.js';
   import { logger } from '../../utils/logger.js';

   export const myToolHandlers: Record<string, ToolHandler> = {
     my_tool: {
       name: 'my_tool',
       description: 'Description of my tool',
       inputSchema: {
         type: 'object',
         properties: {
           param: { type: 'string', description: 'Parameter description' },
         },
         required: ['param'],
       },
       execute: async (args) => {
         logger.info('Executing my tool', args);
         // Implementation
         return {
           content: [{ type: 'text', text: 'Result' }],
         };
       },
     },
   };
   ```

2. Register in `src/mcp-server/tools/registry.ts`:
   ```typescript
   import { myToolHandlers } from './my-tool.js';
   
   export const toolHandlers: Record<string, ToolHandler> = {
     ...existingHandlers,
     ...myToolHandlers,
   };
   ```

3. Add tests for your tool

### Adding a New API Wrapper

1. Create client in `src/api/your-service/client.ts`:
   ```typescript
   import { logger } from '../../utils/logger.js';
   
   class YourServiceClient {
     async method(params: any) {
       logger.debug('Calling your service', params);
       // Implementation
       return result;
     }
   }
   
   export const yourServiceClient = new YourServiceClient();
   ```

2. Add environment variables to `src/utils/env.ts`
3. Update `.env.example` with new variables
4. Create tool handlers that use your client

### Adding a New n8n Node

1. Create node in `src/n8n-nodes/YourNode.node.ts`:
   ```typescript
   import { INodeType, INodeTypeDescription } from 'n8n-workflow';
   
   export class YourNode implements INodeType {
     description: INodeTypeDescription = {
       displayName: 'Your Node',
       name: 'yourNode',
       group: ['transform'],
       version: 1,
       description: 'Description',
       defaults: { name: 'Your Node' },
       inputs: ['main'],
       outputs: ['main'],
       properties: [
         // Define properties
       ],
     };
     
     async execute(this: IExecuteFunctions) {
       // Implementation
     }
   }
   ```

2. Build and test the node

## Testing Guidelines

### Unit Tests

- Test individual functions and classes
- Use Vitest for testing
- Aim for >80% code coverage
- Mock external dependencies

Example test:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from './my-module.js';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Tests

- Test interactions between components
- Use real or mocked APIs
- Verify end-to-end workflows

## Documentation

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for architectural changes
- Add JSDoc comments to public APIs
- Update QUICKSTART.md if setup changes

## Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check formatting
pnpm run format -- --check

# Fix formatting
pnpm run format

# Lint
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### TypeScript Guidelines

- Use strict type checking
- Avoid `any` type when possible
- Use interfaces for public APIs
- Use type aliases for complex types
- Document complex type definitions

### Naming Conventions

- **Files**: kebab-case (`my-module.ts`)
- **Classes**: PascalCase (`MyClass`)
- **Functions**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Interfaces**: PascalCase with `I` prefix optional (`UserData` or `IUserData`)

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass locally
- [ ] Code is formatted
- [ ] Linting passes
- [ ] Documentation is updated
- [ ] No console.log statements (use logger)
- [ ] Commit messages follow convention

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guide
```

## Review Process

1. Automated checks run on PR
2. Maintainer reviews code
3. Feedback addressed
4. PR merged when approved

## Getting Help

- Check existing issues and PRs
- Read documentation (README, ARCHITECTURE, QUICKSTART)
- Ask questions in issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in our release notes and contributor list.

Thank you for contributing! 🎉
