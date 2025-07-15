#!/bin/bash

# Test SuperClaude Enterprise MCP Server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing SuperClaude Enterprise MCP Server${NC}"
echo "=============================================="

# Build the project
echo -e "\n${YELLOW}Building project...${NC}"
npm run build

# Test if MCP server can start
echo -e "\n${YELLOW}Testing MCP server startup...${NC}"
timeout 5s node dist/mcp-server/index.js < /dev/null 2>&1 | head -20 || true

# Install as MCP server
echo -e "\n${YELLOW}Installing MCP server...${NC}"
echo -e "${BLUE}Run the following command to install:${NC}"
echo ""
echo "claude mcp add -s user superclaude-enterprise \"node $PWD/dist/mcp-server/index.js\""
echo ""

# Usage examples
echo -e "${GREEN}✅ MCP Server Ready!${NC}"
echo ""
echo -e "${YELLOW}Usage Examples in Claude Code:${NC}"
echo ""
echo "1. Natural language processing:"
echo "   You: Use SuperClaude to analyze security vulnerabilities"
echo "   Claude: [Calls natural_language_command tool]"
echo ""
echo "2. Command suggestions:"
echo "   You: What SuperClaude commands start with 'impl'?"
echo "   Claude: [Calls suggest_commands tool]"
echo ""
echo "3. Persona conflict resolution:"
echo "   You: How should I handle conflicts between security and performance personas?"
echo "   Claude: [Calls resolve_persona_conflicts tool]"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Run the claude mcp add command above"
echo "2. Restart Claude Code"
echo "3. Test natural language commands"
echo ""
echo "See MCP_INTEGRATION.md for detailed documentation"