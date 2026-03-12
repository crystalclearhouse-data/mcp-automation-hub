#!/bin/bash

# Install Apple Shortcuts for MCP Automation Hub
# Run: chmod +x scripts/install-shortcuts.sh && ./scripts/install-shortcuts.sh

set -e

echo ""
echo "=== MCP Automation Hub — Apple Shortcuts Installer ==="
echo ""

# Check for macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "⚠ This script is for macOS only."
  echo "  Apple Shortcuts are not available on $(uname)."
  exit 0
fi

SHORTCUTS_DIR="$HOME/Library/Shortcuts"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Project directory: $PROJECT_DIR"
echo ""

# Check if shortcuts directory exists
if [ ! -d "$SHORTCUTS_DIR" ]; then
  echo "✗ Apple Shortcuts directory not found: $SHORTCUTS_DIR"
  echo "  Make sure you have Apple Shortcuts installed (macOS 12+)"
  exit 1
fi

echo "Shortcuts directory: $SHORTCUTS_DIR"
echo ""

# Reference: Shortcuts.md documents these shortcuts
SHORTCUTS=(
  "MCP Health Check"
  "Deploy to n8n"
  "View MCP Logs"
)

echo "Shortcuts to install:"
for s in "${SHORTCUTS[@]}"; do
  echo "  - $s"
done
echo ""

echo "To install these shortcuts:"
echo "  1. Open the Shortcuts.md file for the shortcut definitions"
echo "  2. Open Apple Shortcuts app"
echo "  3. Create each shortcut manually using the instructions in Shortcuts.md"
echo "  4. Or import .shortcut files if they are provided in the shortcuts/ directory"
echo ""
echo "Manual installation path: File > Import in Apple Shortcuts"
echo ""
echo "See Shortcuts.md for detailed automation instructions."
echo ""
echo "Done."
