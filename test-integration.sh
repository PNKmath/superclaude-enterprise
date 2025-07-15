#!/bin/bash

# SuperClaude Enterprise Integration Test Script
# Tests the minimal integration approach

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 SuperClaude Enterprise Integration Test${NC}"
echo "=========================================="

# Check if TypeScript is installed
if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}Installing tsx for TypeScript execution...${NC}"
    npm install -g tsx
fi

# Build the project
echo -e "\n${YELLOW}Building project...${NC}"
npm run build

# Run the integration tests
echo -e "\n${YELLOW}Running integration tests...${NC}"

# Test 1: MCP Integration
echo -e "\n${BLUE}1. Testing MCP Integration...${NC}"
tsx test-mcp-integration.ts

# Test 2: Minimal Integration
echo -e "\n${BLUE}2. Testing Minimal Integration...${NC}"
tsx test-minimal-integration.ts

# Test 3: Natural Language Processing
echo -e "\n${BLUE}3. Testing Natural Language Processing...${NC}"
tsx test-natural-language.ts

# Test 4: CLI Integration
echo -e "\n${BLUE}4. Testing CLI Integration...${NC}"
node dist/index.js test-conflict -p security,performance -c '/sc:analyze'

echo -e "\n${GREEN}✅ All integration tests completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Test in Claude Code with: /sc: 보안 검사해줘"
echo "2. Run: node dist/index.js run '/sc:analyze security' --dry-run"
echo "3. Check logs for bridge communication"