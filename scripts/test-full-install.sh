#!/bin/bash

# Full installation process test (dry-run)
# This simulates the complete installation flow

set -e

# Colors
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m'

echo -e "${BLUE}=== Full Installation Process Test (Dry Run) ===${NC}"
echo -e "${YELLOW}This test simulates the installation without making actual changes${NC}\n"

# Source functions (disable trap)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
trap - EXIT
source "$SCRIPT_DIR/install-functions.sh"
trap - EXIT

# Test flow
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if check_prerequisites; then
    echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
else
    echo -e "${RED}✗ Prerequisites check failed${NC}"
fi

echo -e "\n${BLUE}Step 2: NPM dependencies...${NC}"
if [ -f "$SCRIPT_DIR/../package.json" ]; then
    echo -e "${GREEN}✓ package.json found${NC}"
    echo "Would run: npm install"
else
    echo -e "${YELLOW}⚠ package.json not found in expected location${NC}"
fi

echo -e "\n${BLUE}Step 3: Build project...${NC}"
if [ -f "$SCRIPT_DIR/../package.json" ]; then
    echo -e "${GREEN}✓ Build configuration found${NC}"
    echo "Would run: npm run build"
else
    echo -e "${YELLOW}⚠ Build configuration not found${NC}"
fi

echo -e "\n${BLUE}Step 4: SuperClaude installation check...${NC}"
if check_superclaude_installation; then
    echo -e "${GREEN}✓ SuperClaude already installed${NC}"
else
    echo -e "${YELLOW}Would install SuperClaude from PyPI:${NC}"
    echo "  1. uv pip install SuperClaude (or pip install SuperClaude)"
    echo "  2. python3 -m SuperClaude install"
fi

echo -e "\n${BLUE}Step 5: MCP configuration...${NC}"
CLAUDE_CONFIG="$HOME/.claude.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${GREEN}✓ Claude configuration exists${NC}"
    if grep -q "mcpServers" "$CLAUDE_CONFIG" 2>/dev/null; then
        echo "  - Has mcpServers section"
    fi
    if grep -q "superclaude-enterprise" "$CLAUDE_CONFIG" 2>/dev/null; then
        echo "  - SuperClaude Enterprise already configured"
    else
        echo "  - Would add SuperClaude Enterprise to mcpServers"
    fi
else
    echo -e "${YELLOW}Would create new Claude configuration at $CLAUDE_CONFIG${NC}"
fi

echo -e "\n${BLUE}Step 6: Summary${NC}"
echo "Installation would:"
echo "  - Install npm dependencies"
echo "  - Build the project"
echo "  - Install SuperClaude (if not present)"
echo "  - Configure MCP server in Claude Code"
echo "  - Create project-specific configuration"

echo -e "\n${GREEN}Dry run completed successfully!${NC}"
echo -e "${YELLOW}To run the actual installation: ./install-enterprise.sh${NC}"