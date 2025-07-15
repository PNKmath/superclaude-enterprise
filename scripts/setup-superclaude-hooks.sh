#!/bin/bash

# SuperClaude Enterprise Extension - Hook Setup Script
# This script sets up the integration hooks for SuperClaude

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPERCLAUDE_DIR="${SUPERCLAUDE_DIR:-$PROJECT_ROOT/SuperClaude}"

echo "🎯 Setting up SuperClaude Enterprise hooks..."

# Check if SuperClaude is available
if [ ! -d "$SUPERCLAUDE_DIR" ]; then
    echo "❌ SuperClaude directory not found at: $SUPERCLAUDE_DIR"
    echo "   Please run install-enterprise.sh first or set SUPERCLAUDE_DIR environment variable"
    exit 1
fi

# Create hooks directory in SuperClaude if it doesn't exist
HOOKS_DIR="$SUPERCLAUDE_DIR/hooks"
mkdir -p "$HOOKS_DIR"

# Create pre-command hook
cat > "$HOOKS_DIR/pre-command.js" << 'EOF'
// SuperClaude Enterprise Pre-Command Hook
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function preCommandHook(command, context) {
  try {
    // Check if enterprise extension is enabled
    const enterprisePath = path.join(__dirname, '../../..', 'dist/index.js');
    
    // Forward command to enterprise extension for conflict resolution
    const result = execSync(`node ${enterprisePath} resolve "${command}" --json`, {
      encoding: 'utf8',
      env: { ...process.env, SUPERCLAUDE_CONTEXT: JSON.stringify(context) }
    });
    
    const resolution = JSON.parse(result);
    
    // Modify command based on resolution
    if (resolution.modifiedCommand) {
      return {
        command: resolution.modifiedCommand,
        metadata: resolution.metadata
      };
    }
    
    return { command, metadata: {} };
  } catch (error) {
    console.error('Enterprise hook error:', error);
    return { command, metadata: {} };
  }
};
EOF

# Create post-command hook
cat > "$HOOKS_DIR/post-command.js" << 'EOF'
// SuperClaude Enterprise Post-Command Hook
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function postCommandHook(result, context) {
  try {
    // Send results to learning engine
    const enterprisePath = path.join(__dirname, '../../..', 'dist/index.js');
    
    execSync(`node ${enterprisePath} learn --json`, {
      input: JSON.stringify({ result, context }),
      encoding: 'utf8'
    });
    
    return result;
  } catch (error) {
    console.error('Enterprise post-hook error:', error);
    return result;
  }
};
EOF

# Create backend selection hook
cat > "$HOOKS_DIR/backend-select.js" << 'EOF'
// SuperClaude Enterprise Backend Selection Hook
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function backendSelectHook(context) {
  try {
    const enterprisePath = path.join(__dirname, '../../..', 'dist/index.js');
    
    const result = execSync(`node ${enterprisePath} select-backend --json`, {
      input: JSON.stringify(context),
      encoding: 'utf8'
    });
    
    const selection = JSON.parse(result);
    
    if (selection.backend === 'gemini') {
      return {
        backend: 'gemini-cli',
        reason: selection.reason
      };
    }
    
    return { backend: 'claude' };
  } catch (error) {
    console.error('Backend selection error:', error);
    return { backend: 'claude' };
  }
};
EOF

# Update SuperClaude configuration to use hooks
if [ -f "$SUPERCLAUDE_DIR/config.json" ]; then
    echo "📝 Updating SuperClaude configuration..."
    # Backup existing config
    cp "$SUPERCLAUDE_DIR/config.json" "$SUPERCLAUDE_DIR/config.json.backup"
    
    # Add hook configuration using node
    node -e "
    const fs = require('fs');
    const configPath = '$SUPERCLAUDE_DIR/config.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Add hooks configuration
    config.hooks = config.hooks || {};
    config.hooks.preCommand = './hooks/pre-command.js';
    config.hooks.postCommand = './hooks/post-command.js';
    config.hooks.backendSelect = './hooks/backend-select.js';
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ SuperClaude configuration updated');
    "
else
    echo "⚠️  SuperClaude config.json not found, creating new one..."
    cat > "$SUPERCLAUDE_DIR/config.json" << EOF
{
  "version": "3.0.0",
  "hooks": {
    "preCommand": "./hooks/pre-command.js",
    "postCommand": "./hooks/post-command.js",
    "backendSelect": "./hooks/backend-select.js"
  }
}
EOF
fi

echo "✅ SuperClaude hooks installed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart SuperClaude to load the new hooks"
echo "2. Test with: superclaude-enterprise test integration"
echo ""