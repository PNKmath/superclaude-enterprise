#!/bin/bash

# MCP Server Installation Test Script

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 SuperClaude Enterprise MCP Server Installation Test${NC}"
echo "===================================================="

# 1. Check if build exists
echo -e "\n${YELLOW}1. Checking build files...${NC}"
if [ -f "dist/mcp-server/index.js" ]; then
    echo -e "${GREEN}✓ MCP server build found${NC}"
else
    echo -e "${RED}✗ MCP server build not found${NC}"
    echo "  Run 'npm run build' first"
    exit 1
fi

# 2. Check Claude Code configuration
echo -e "\n${YELLOW}2. Checking Claude Code configuration...${NC}"
CLAUDE_CONFIG="$HOME/.claude.json"
PROJECT_CONFIG=".claude/settings.local.json"

# Check global configuration
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${GREEN}✓ Global Claude config exists: $CLAUDE_CONFIG${NC}"
    
    # Check if superclaude-enterprise is configured
    if command -v jq &> /dev/null; then
        if jq -e '.mcpServers["superclaude-enterprise"]' "$CLAUDE_CONFIG" &> /dev/null; then
            echo -e "${GREEN}✓ SuperClaude Enterprise is configured globally${NC}"
            
            # Extract and verify path
            CONFIGURED_PATH=$(jq -r '.mcpServers["superclaude-enterprise"].args[0]' "$CLAUDE_CONFIG")
            if [ -f "$CONFIGURED_PATH" ]; then
                echo -e "${GREEN}✓ Configured path is valid: $CONFIGURED_PATH${NC}"
            else
                echo -e "${RED}✗ Configured path is invalid: $CONFIGURED_PATH${NC}"
                echo "  Current directory: $(pwd)"
                echo "  Expected path: $(pwd)/dist/mcp-server/index.js"
            fi
        else
            echo -e "${YELLOW}⚠️  SuperClaude Enterprise not found in global config${NC}"
        fi
    else
        # Fallback without jq
        if grep -q "superclaude-enterprise" "$CLAUDE_CONFIG"; then
            echo -e "${GREEN}✓ SuperClaude Enterprise appears to be configured${NC}"
        else
            echo -e "${YELLOW}⚠️  SuperClaude Enterprise not found in global config${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Global Claude config not found${NC}"
fi

# Check project configuration
if [ -f "$PROJECT_CONFIG" ]; then
    echo -e "${GREEN}✓ Project-specific config exists: $PROJECT_CONFIG${NC}"
else
    echo -e "${BLUE}ℹ️  No project-specific config (optional)${NC}"
fi

# 4. Test MCP server startup
echo -e "\n${YELLOW}3. Testing MCP server startup...${NC}"
echo "Testing if server can start (5 second timeout)..."

# Create a test input for the MCP server
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}' | timeout 5 node dist/mcp-server/index.js > /tmp/mcp-test.log 2>&1

if [ $? -eq 124 ]; then
    # Timeout is expected - server runs indefinitely
    echo -e "${GREEN}✓ MCP server starts successfully${NC}"
else
    # Non-timeout exit might indicate an error
    echo -e "${YELLOW}⚠️  MCP server exited unexpectedly${NC}"
    echo "  Check /tmp/mcp-test.log for details"
fi

# 5. Provide setup instructions
echo -e "\n${BLUE}📋 Setup Summary:${NC}"
echo "===================="

INSTALL_PATH=$(pwd)
if [ -f "$CLAUDE_CONFIG" ] && command -v jq &> /dev/null && jq -e '.mcpServers["superclaude-enterprise"]' "$CLAUDE_CONFIG" &> /dev/null; then
    echo -e "${GREEN}✅ MCP server is installed and configured${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Code to load the MCP server"
    echo "2. In Claude Code, try: \"Use SuperClaude to analyze security\""
elif [ -f "$PROJECT_CONFIG" ] && grep -q "superclaude-enterprise" "$PROJECT_CONFIG" 2>/dev/null; then
    echo -e "${GREEN}✅ MCP server is configured locally for this project${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Code to load the MCP server"
    echo "2. In Claude Code, try: \"Use SuperClaude to analyze security\""
else
    echo -e "${YELLOW}⚠️  MCP server needs to be configured${NC}"
    echo ""
    echo "To complete setup, add to ~/.claude.json:"
    echo -e "${BLUE}{
  \"mcpServers\": {
    \"superclaude-enterprise\": {
      \"command\": \"node\",
      \"args\": [\"$INSTALL_PATH/dist/mcp-server/index.js\"],
      \"description\": \"SuperClaude Enterprise MCP Server\"
    }
  }
}${NC}"
fi

echo ""
echo -e "${YELLOW}For more information, see README.md${NC}"