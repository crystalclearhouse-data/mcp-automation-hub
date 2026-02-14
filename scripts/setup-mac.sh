#!/bin/bash

# 🚀 MCP Automation Hub: Mac-Native Setup Script
# Optimized for Apple Silicon (M1)

echo "🍎 Starting Mac-Native Setup..."

# 1. Install Homebrew if missing
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 2. Install dependencies
echo "🛠 Installing Node.js, pnpm, and Docker..."
brew install node pnpm
brew install --cask docker claude

# 3. Project initialization
echo "📂 Initializing project..."
pnpm install
pnpm build

# 4. Setup LaunchAgent for background service
echo "🤖 Setting up LaunchAgent..."
PLIST_NAME="com.mcp.automation.plist"
DEST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"

# Replace YOUR_USER with current user in plist
sed "s/YOUR_USER/$(whoami)/g" "$PLIST_NAME" > "$DEST_PATH"

launchctl unload "$DEST_PATH" 2>/dev/null
launchctl load "$DEST_PATH"

# 5. Apple Shortcuts Integration
echo "⚡️ Creating Apple Shortcuts (Instructions)..."
echo "To install MCP Shortcuts, run: pnpm shortcuts:install"

echo "✅ Setup Complete! Your MCP Hub is now running in the background."
echo "Check logs: tail -f /tmp/mcp-automation.out.log"
