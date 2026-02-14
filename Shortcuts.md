# ⚡️ Apple Shortcuts for MCP Automation Hub

Leverage the power of macOS Shortcuts to control your MCP server and n8n workflows.

## 1. Shortcut: \"MCP Health Check\"
**Goal**: Verify all services are up.
**Actions**:
1. **Get Contents of URL**: `http://localhost:3000/health`
2. **If** (Status Code is 200)# ⚡️ Apple Shortcuts for MCP Automation Hub

Leverage the power of macOS Shortcuts to control your MCP server and n8n workflows.

## 1. Shortcut: "MCP Health Check"
**Goal**: Verify all services are up.
**Actions**:
1. **Get Contents of URL**: `http://localhost:3000/health`
2. **If** (Status Code is 200)
   - **Show Notification**: "✅ MCP Hub is healthy!"
3. **Otherwise**
   - **Show Notification**: "🚨 MCP Hub is DOWN!"
   - **Run Shell Script**: `launchctl load ~/Library/LaunchAgents/com.mcp.automation.plist`

## 2. Shortcut: "Deploy to n8n"
**Goal**: Sync local nodes to n8n instance.
**Actions**:
1. **Run Shell Script**: `cd ~/mcp-automation-hub && pnpm deploy:n8n`
2. **Show Notification**: "🚀 Nodes deployed to n8n!"


## 3. Shortcut: "MCP Logs"
**Goal**: Quickly view logs.
**Actions**:
1. **Run Shell Script**: `tail -n 50 /tmp/mcp-automation.out.log`
2. **Show Result**

---

### How to install:
Currently, macOS doesn't support importing shortcuts via CLI without user interaction. 
1. Open the **Shortcuts** app.
2. Create a new shortcut and add the actions listed above.
3. (Optional) Pin them to your **Menu Bar** for instant access.
   - **Show Notification**: \"✅ MCP Hub is healthy!\"
3. **Otherwise**
   - **Show Notification**: \"🚨 MCP Hub is DOWN!\"
   - **Run Shell Script**: `launchctl load ~/Library/LaunchAgents/com.mcp.automation.plist`

## 2. Shortcut: \"Deploy to n8n\"
**Goal**: Sync local nodes to n8n instance.
**Actions**:
1. **Run Shell Script**: `cd ~/mcp-automation-hub && pnpm deploy:n8n`
2. **Show Notification**: \"🚀 Nodes deployed to n8n!\"

## 3. Shortcut: \"MCP Logs\"
**Goal**: Quickly view logs.
**Actions**:
1. **Run Shell Script**: `tail -n 50 /tmp/mcp-automation.out.log`
2. **Show Result**

---

### How to install:
Currently, macOS doesn't support importing shortcuts via CLI without user interaction. 
1. Open the **Shortcuts** app.
2. Create a new shortcut and add the actions listed above.
3. (Optional) Pin them to your **Menu Bar** for instant access.
