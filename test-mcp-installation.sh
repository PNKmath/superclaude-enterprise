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

# 2. Check MCP config directory
echo -e "\n${YELLOW}2. Checking MCP configuration...${NC}"
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MCP_DIR="$HOME/.config/claude"
else
    MCP_DIR="$APPDATA/Claude"
fi

if [ -d "$MCP_DIR" ]; then
    echo -e "${GREEN}✓ MCP config directory exists: $MCP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  MCP config directory not found${NC}"
    echo "  Creating directory..."
    mkdir -p "$MCP_DIR"
fi

# 3. Check MCP config file
if [ -f "$MCP_DIR/mcp.json" ]; then
    echo -e "${GREEN}✓ MCP config file exists${NC}"
    
    # Check if superclaude-enterprise is configured
    if grep -q "superclaude-enterprise" "$MCP_DIR/mcp.json"; then
        echo -e "${GREEN}✓ SuperClaude Enterprise is configured${NC}"
        
        # Extract and verify path
        CONFIGURED_PATH=$(grep -A 2 "superclaude-enterprise" "$MCP_DIR/mcp.json" | grep "args" | sed 's/.*"\([^"]*\)".*/\1/')
        if [ -f "$CONFIGURED_PATH" ]; then
            echo -e "${GREEN}✓ Configured path is valid: $CONFIGURED_PATH${NC}"
        else
            echo -e "${RED}✗ Configured path is invalid: $CONFIGURED_PATH${NC}"
            echo "  Current directory: $(pwd)"
            echo "  Expected path: $(pwd)/dist/mcp-server/index.js"
        fi
    else
        echo -e "${YELLOW}⚠️  SuperClaude Enterprise not found in MCP config${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MCP config file not found${NC}"
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
if [ -f "$MCP_DIR/mcp.json" ] && grep -q "superclaude-enterprise" "$MCP_DIR/mcp.json"; then
    echo -e "${GREEN}✅ MCP server is installed and configured${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Code to load the MCP server"
    echo "2. In Claude Code, try: \"Use SuperClaude to analyze security\""
else
    echo -e "${YELLOW}⚠️  MCP server needs to be configured${NC}"
    echo ""
    echo "To complete setup, add to $MCP_DIR/mcp.json:"
    echo -e "${BLUE}{
  \"servers\": {
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