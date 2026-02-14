# 🚀 MCP Automation Hub: Mac-Native Setup Guide

This guide leverages the full potential of your **Apple M1 Silicon** and built-in macOS tools to create a lightning-fast, highly automated MCP environment.

## 🛠 Mac-Native Prerequisites
- **Homebrew**: For package management
- **Xcode Command Line Tools**: `xcode-select --install`
- **Node.js 20+**: `brew install node`
- **pnpm**: `brew install pnpm` (Faster and more memory-efficient than npm)
- **Docker Desktop**: Optimized for Apple Silicon
- **Claude Desktop**: The primary interface for MCP

## ⚡️ Apple Silicon Optimizations (8GB RAM)
We optimize for limited memory by using:
1. **pnpm** for shared dependencies
2. **LaunchAgents** for background services instead of constant Docker containers
3. **RAM-conscious Docker settings**: Limit to 2GB in Docker Desktop settings

## 🍎 Apple Tools Integration

### 1. Apple Shortcuts for MCP
We provide pre-built shortcuts to:
- **\"Start MCP Server\"**: Boots up the local TS server and checks connections.
- **\"Deploy to n8n\"**: Syncs local nodes to your n8n instance.
- **\"Health Check\"**: Pings all 15 services and reports status via System Notification.

### 2. LaunchAgents for Persistence
Keep your MCP server running in the background without a terminal window:
`~/Library/LaunchAgents/com.mcp.automation.plist`

### 3. Automator Folder ActionsAdd Mac-native setup documentation with Apple tools integration
Automatically trigger builds when you save changes in `src/`.

## 📂 Project Setup
1. **Clone & Install**:
   ```bash
   git clone https://github.com/crystalclearhouse-data/mcp-automation-hub
   cd mcp-automation-hub
   pnpm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env` and fill in your secrets.

## 🤖 Claude Desktop Integration
Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  \"mcpServers\": {
    \"automation-hub\": {
      \"command\": \"node\",
      \"args\": [\"/Users/YOUR_USER/mcp-automation-hub/dist/mcp-server/index.js\"]
    }
  }
}
```

## 🧪 Testing
Run the Mac-native test suite:
`pnpm test:mac`

---
*Created with ❤️ for Apple Silicon Users*
