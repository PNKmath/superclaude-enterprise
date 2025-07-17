#!/bin/bash

# Test MCP configuration setup
# This tests both jq and Python fallback methods

set -e

# Colors
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m'

echo -e "${BLUE}=== Testing MCP Configuration Setup ===${NC}"

# Test configuration file
TEST_CONFIG="/tmp/test_claude.json"
INSTALL_PATH="/home/test/SuperClaude-Enterprise"

# Test 1: Create new config with jq
echo -e "\n${YELLOW}Test 1: Creating new config with jq${NC}"
if command -v jq &> /dev/null; then
    echo '{}' | jq --arg path "$INSTALL_PATH" '.mcpServers = {} | .mcpServers["superclaude-enterprise"] = {
        "command": "node",
        "args": [$path + "/dist/mcp-server/index.js"],
        "description": "SuperClaude Enterprise MCP Server"
    }' > "$TEST_CONFIG"
    
    if [ -f "$TEST_CONFIG" ] && grep -q "superclaude-enterprise" "$TEST_CONFIG"; then
        echo -e "${GREEN}✓ Config created successfully with jq${NC}"
        cat "$TEST_CONFIG"
    else
        echo -e "${RED}✗ Failed to create config with jq${NC}"
    fi
else
    echo -e "${YELLOW}jq not available, skipping${NC}"
fi

# Test 2: Update existing config with Python
echo -e "\n${YELLOW}Test 2: Updating existing config with Python${NC}"
echo '{"existingKey": "existingValue"}' > "$TEST_CONFIG"

python3 << PYTHON_SCRIPT
import json

config_path = "$TEST_CONFIG"
install_path = "$INSTALL_PATH"

try:
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    config['mcpServers']['superclaude-enterprise'] = {
        'command': 'node',
        'args': [install_path + '/dist/mcp-server/index.js'],
        'description': 'SuperClaude Enterprise MCP Server'
    }
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✓ Config updated successfully with Python")
except Exception as e:
    print(f"✗ Error: {e}")
PYTHON_SCRIPT

if [ -f "$TEST_CONFIG" ]; then
    echo -e "${BLUE}Final config:${NC}"
    cat "$TEST_CONFIG"
fi

# Test 3: Verify configuration
echo -e "\n${YELLOW}Test 3: Verifying configuration${NC}"
if [ -f "$TEST_CONFIG" ] && grep -q "superclaude-enterprise" "$TEST_CONFIG" 2>/dev/null; then
    echo -e "${GREEN}✓ Configuration verified successfully${NC}"
else
    echo -e "${RED}✗ Configuration verification failed${NC}"
fi

# Cleanup
rm -f "$TEST_CONFIG"
echo -e "\n${GREEN}MCP configuration tests completed${NC}"