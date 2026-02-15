# Contributing to MCP Automation Hub

Thank you for your interest in contributing to the MCP Automation Hub! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Standards](#code-standards)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** v18 or higher
- **pnpm** package manager (`npm install -g pnpm`)
- **Git** for version control
- **macOS** (for LaunchAgent features; Linux/Windows support coming soon)
- **n8n** instance (local or remote) for testing deployments

### First-Time Setup

1. **Fork the repository**
   
   Click the "Fork" button at the top right of this repository.

2. **Clone your fork**
   
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-automation-hub.git
   cd mcp-automation-hub
   ```

3. **Add upstream remote**
   
   ```bash
   git remote add upstream https://github.com/crystalclearhouse-data/mcp-automation-hub.git
   ```

4. **Install dependencies**
   
   ```bash
   pnpm install
   ```

5. **Set up environment**
   
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Run setup script** (macOS only)
   
   ```bash
   chmod +x scripts/setup-mac.sh
   ./scripts/setup-mac.sh
   ```

## Development Setup

### Running Locally

Start the MCP server in development mode:

```bash
pnpm dev
```

This will:
- Start the server with hot-reload
- Watch for file changes
- Enable debug logging

### Testing Health

Verify the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status": "healthy"}
```

## Project Structure

```
mcp-automation-hub/
├── src/                  # Source code
│   ├── index.ts         # Main entry point
│   ├── server.ts        # MCP server implementation
│   ├── tools/           # MCP tool definitions
│   ├── resources/       # MCP resource handlers
│   └── prompts/         # MCP prompt templates
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── scripts/             # Utility scripts
├── examples/            # Usage examples
├── docs/               # Documentation
├── .github/            # GitHub Actions workflows
├── SKILL.md            # Agent Skills documentation
├── Shortcuts.md        # macOS Shortcuts guide
└── SETUP.md            # Environment setup guide
```

## Making Changes

### Branching Strategy

We use a simple branching model:

- `main` - Stable production code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Creating a Feature Branch

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

### Commit Message Guidelines

Follow conventional commits format:

```
type(scope): brief description

Detailed explanation if needed

Closes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(tools): add new MCP tool for n8n workflow execution
fix(server): resolve health check timeout issue
docs(readme): update installation instructions
```

## Testing

### Running Tests

Run all tests:
```bash
pnpm test
```

Run specific test suite:
```bash
pnpm test:unit
pnpm test:integration
```

Run tests in watch mode:
```bash
pnpm test:watch
```

### Writing Tests

- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Follow the naming convention: `*.test.ts`
- Aim for >80% code coverage

**Example test:**

```typescript
import { describe, it, expect } from 'vitest';
import { healthCheck } from '../src/server';

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const result = await healthCheck();
    expect(result.status).toBe('healthy');
  });
});
```

### Manual Testing

Before submitting:

1. **Test health check**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test n8n deployment**
   ```bash
   pnpm deploy:n8n
   ```

3. **Check logs**
   ```bash
   tail -f /tmp/mcp-automation.out.log
   ```

4. **Test macOS Shortcuts** (if applicable)
   - Run each shortcut manually
   - Verify notifications appear
   - Check command execution

## Submitting Changes

### Pull Request Process

1. **Update from upstream**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Push to your fork**
   ```bash
   git push origin your-branch
   ```

3. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

### Pull Request Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #[issue number]
```

### Review Process

- All PRs require at least one approval
- CI/CD checks must pass
- Code must follow style guidelines
- Tests must maintain >80% coverage

## Code Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Follow ESLint rules

### Formatting

We use Prettier for consistent formatting:

```bash
pnpm format        # Format all files
pnpm format:check  # Check formatting
```

### Linting

Run ESLint before committing:

```bash
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues
```

### File Organization

- One component per file
- Clear, descriptive file names
- Export from index files
- Group related functionality

### Documentation

- Add JSDoc comments for public functions
- Update README.md for user-facing changes
- Update SKILL.md for Agent Skills changes
- Add examples for new features

**Example:**

```typescript
/**
 * Deploys custom nodes to n8n instance
 * @param nodeDir - Directory containing node files
 * @param apiUrl - n8n API URL
 * @returns Promise resolving to deployment status
 * @throws Error if deployment fails
 */
export async function deployNodes(
  nodeDir: string,
  apiUrl: string
): Promise<DeploymentResult> {
  // Implementation
}
```

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Respect different viewpoints

### Getting Help

- Check existing [issues](https://github.com/crystalclearhouse-data/mcp-automation-hub/issues)
- Read [SKILL.md](SKILL.md) for technical details
- Review [examples/](examples/) for usage patterns
- Ask questions in issue comments

### Reporting Issues

When reporting bugs:

1. **Search existing issues** first
2. **Use the issue template**
3. **Include:**
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information
   - Logs (if applicable)

### Feature Requests

When requesting features:

1. **Check if already requested**
2. **Explain the use case**
3. **Describe desired behavior**
4. **Consider implementation details**

## Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [n8n Documentation](https://docs.n8n.io)
- [Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! 🚀
