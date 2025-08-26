#!/bin/sh
# Setup Git hooks to use the versioned hooks/ directory

set -e

HOOKS_DIR="hooks"

echo "🔧 Setting up Git hooks..."

# Ensure hooks dir exists
if [ ! -d "$HOOKS_DIR" ]; then
  echo "❌ Hooks directory '$HOOKS_DIR' not found!"
  exit 1
fi

# Configure Git to use this directory
git config core.hooksPath "$HOOKS_DIR"

# Ensure all scripts in hooks/ are executable
chmod +x $HOOKS_DIR/* || true

echo "✅ Git hooks are now set up."
echo "   Hooks are being loaded from: $HOOKS_DIR"
