---
name: mcp-automation-hub
description: Control and monitor MCP (Model Context Protocol) server operations, n8n workflow deployments, and service health checks. Use when managing MCP servers, deploying n8n nodes, checking service health, viewing logs, or working with MCP automation infrastructure.
---

# MCP Automation Hub

## Overview

This Skill provides CLI and automation tools for managing your MCP (Model Context Protocol) server, n8n workflow integration, and service monitoring.

## Quick Start

### Health Check

Verify all MCP services are running:

```bash
curl http://localhost:3000/health
```

Expected response: `{"status": "healthy"}` with 200 status code.

### Deploy to n8n

Sync local custom nodes to your n8n instance:

```bash
cd ~/mcp-automation-hub && pnpm deploy:n8n
```

### View Logs

Check recent MCP server activity:

```bash
tail -n 50 /tmp/mcp-automation.out.log
```

For error logs:

```bash
tail -n 50 /tmp/mcp-automation.err.log
```

## Service Management

### Start MCP Server

```bash
launchctl load ~/Library/LaunchAgents/com.mcp.automation.plist
```

### Stop MCP Server

```bash
launchctl unload ~/Library/LaunchAgents/com.mcp.automation.plist
```

### Restart MCP Server

```bash
launchctl unload ~/Library/LaunchAgents/com.mcp.automation.plist
launchctl load ~/Library/LaunchAgents/com.mcp.automation.plist
```

### Check Service Status

```bash
launchctl list | grep com.mcp.automation
```

## Configuration

### Environment Setup

Configuration file: `.env.example`

Copy and customize:

```bash
cp .env.example .env
```

Key variables:
- `MCP_PORT`: Server port (default: 3000)
- `N8N_API_URL`: n8n instance URL
- `N8N_API_KEY`: n8n API authentication key

## macOS Shortcuts Integration

For details on Apple Shortcuts automation, see [Shortcuts.md](Shortcuts.md).

Key shortcuts:
1. **MCP Health Check** - Quick service verification
2. **Deploy to n8n** - One-click deployment
3. **MCP Logs** - Instant log viewing

## Scripts

Utility scripts are in the `scripts/` directory:

- `scripts/setup-mac.sh` - Initial Mac environment setup
- Additional automation scripts as needed

## Troubleshooting

### Service Won't Start

1. Check if port 3000 is available:
   ```bash
   lsof -i :3000
   ```

2. Verify plist file exists:
   ```bash
   ls -la ~/Library/LaunchAgents/com.mcp.automation.plist
   ```

3. Check error logs:
   ```bash
   cat /tmp/mcp-automation.err.log
   ```

### n8n Deployment Fails

1. Verify n8n is running and accessible
2. Check N8N_API_KEY in `.env`
3. Ensure dependencies are installed:
   ```bash
   pnpm install
   ```

### Health Check Returns Error

1. Confirm server is running:
   ```bash
   launchctl list | grep com.mcp.automation
   ```

2. Test with verbose output:
   ```bash
   curl -v http://localhost:3000/health
   ```

3. If server is down, restart it using the commands in Service Management section

## Common Workflows

### Deploy Changes to n8n

Copy this workflow and check off steps as you complete them:

```
Deployment Progress:
- [ ] Step 1: Make changes to n8n nodes
- [ ] Step 2: Test locally if possible
- [ ] Step 3: Run deployment command
- [ ] Step 4: Verify deployment in n8n UI
- [ ] Step 5: Test workflows using deployed nodes
```

**Step 1**: Edit custom node files in your project

**Step 2**: If you have a local n8n instance, test there first

**Step 3**: Deploy using:
```bash
cd ~/mcp-automation-hub && pnpm deploy:n8n
```

**Step 4**: Open n8n and confirm nodes appear in the node palette

**Step 5**: Create or run a workflow that uses your custom nodes

### Monitor Service Health

1. Run health check:
   ```bash
   curl http://localhost:3000/health
   ```

2. If status is not 200:
   - Check logs for errors
   - Restart service
   - Verify configuration

3. Set up periodic monitoring (optional):
   ```bash
   # Add to crontab for hourly checks
   0 * * * * curl -s http://localhost:3000/health || osascript -e 'display notification "MCP Server is down!" with title "MCP Alert"'
   ```

## Project Structure

```
mcp-automation-hub/
├── SKILL.md              # This file
├── Shortcuts.md          # Apple Shortcuts guide
├── SETUP.md             # Mac environment setup
├── README.md            # Project overview
├── scripts/             # Utility scripts
├── mcp-config.json      # MCP server config
├── package.json         # Dependencies and scripts
└── .env.example         # Configuration template
```

## Dependencies

Required packages (auto-installed via `pnpm install`):

- Node.js (v18+)
- pnpm (package manager)
- n8n (workflow automation)

Optional:
- curl (for API testing)
- jq (for JSON parsing)

## Best Practices

1. **Always check health before deployments**
   ```bash
   curl http://localhost:3000/health && pnpm deploy:n8n
   ```

2. **Keep logs clean** - Rotate logs periodically:
   ```bash
   > /tmp/mcp-automation.out.log
   > /tmp/mcp-automation.err.log
   ```

3. **Use environment variables** - Never hardcode credentials

4. **Test locally first** - Verify changes before deploying to production n8n

5. **Monitor regularly** - Set up automated health checks or use the Shortcuts

## Additional Resources

For advanced MCP configuration, see the official MCP documentation.

For n8n custom node development, refer to n8n's developer documentation.
