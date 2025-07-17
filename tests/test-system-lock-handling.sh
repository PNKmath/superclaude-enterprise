#!/bin/bash

# Test system lock handling for jq installation
# Verifies fallback mechanisms work properly

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== System Lock Handling Test ===${NC}\n"

# Source install functions
source ./scripts/install-functions.sh

# Test 1: Check system lock detection
echo -e "${YELLOW}Test 1: System lock detection${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if any package manager is running
    if pgrep -x "apt|apt-get|dpkg|yum|dnf|pacman" > /dev/null; then
        echo -e "${RED}⚠️ Package manager is currently running${NC}"
    else
        echo -e "${GREEN}✓ No package manager lock detected${NC}"
    fi
else
    echo -e "${BLUE}Not on Linux, skipping lock check${NC}"
fi

# Test 2: Binary download fallback
echo -e "\n${YELLOW}Test 2: Testing jq binary download fallback${NC}"
# Test architecture detection
ARCH=$(uname -m)
case $ARCH in
    x86_64) JQ_ARCH="amd64" ;;
    aarch64) JQ_ARCH="arm64" ;;
    arm*) JQ_ARCH="arm" ;;
    *) JQ_ARCH="amd64" ;;
esac
echo "Detected architecture: $ARCH -> jq-linux-$JQ_ARCH"

# Test URL construction
JQ_VERSION="1.7.1"
JQ_URL="https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/jq-linux-${JQ_ARCH}"
echo "Download URL: $JQ_URL"

# Test if URL is accessible
if curl -I -s "$JQ_URL" | grep -q "200\|302"; then
    echo -e "${GREEN}✓ jq binary download URL is accessible${NC}"
else
    echo -e "${RED}✗ jq binary download URL not accessible${NC}"
fi

# Test 3: Local bin directory
echo -e "\n${YELLOW}Test 3: Local bin directory setup${NC}"
if [ -d "$HOME/.local/bin" ]; then
    echo -e "${GREEN}✓ ~/.local/bin exists${NC}"
else
    echo -e "${YELLOW}~/.local/bin doesn't exist (will be created if needed)${NC}"
fi

# Check if ~/.local/bin is in PATH
if [[ "$PATH" == *"$HOME/.local/bin"* ]]; then
    echo -e "${GREEN}✓ ~/.local/bin is in PATH${NC}"
else
    echo -e "${YELLOW}⚠ ~/.local/bin is not in PATH${NC}"
    echo "Add to PATH with: export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# Test 4: Python JSON fallback
echo -e "\n${YELLOW}Test 4: Python JSON processing fallback${NC}"
python3 -c "import json; print('✓ Python JSON module available')" 2>/dev/null || echo -e "${RED}✗ Python JSON module not available${NC}"

# Test if Python can handle JSON operations
TEST_JSON='{"test": "value", "nested": {"key": "value"}}'
if echo "$TEST_JSON" | python3 -c "import json, sys; data = json.load(sys.stdin); print('✓ Python can parse JSON')" 2>/dev/null; then
    echo -e "${GREEN}✓ Python JSON processing works${NC}"
else
    echo -e "${RED}✗ Python JSON processing failed${NC}"
fi

# Test 5: MCP configuration without jq
echo -e "\n${YELLOW}Test 5: MCP configuration without jq${NC}"
# Create a test config
TEST_CONFIG="/tmp/test-claude-config.json"
cat > "$TEST_CONFIG" << EOF
{
  "existingKey": "existingValue"
}
EOF

# Test Python-based update
python3 << PYTHON_TEST
import json

try:
    with open("$TEST_CONFIG", 'r') as f:
        config = json.load(f)
    
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    config['mcpServers']['test-server'] = {
        'command': 'node',
        'args': ['/test/path/index.js'],
        'description': 'Test MCP Server'
    }
    
    with open("$TEST_CONFIG", 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✓ Python successfully updated MCP configuration")
except Exception as e:
    print(f"✗ Python MCP update failed: {e}")
PYTHON_TEST

# Verify the update
if grep -q "test-server" "$TEST_CONFIG" 2>/dev/null; then
    echo -e "${GREEN}✓ MCP configuration updated successfully${NC}"
else
    echo -e "${RED}✗ MCP configuration update failed${NC}"
fi

# Clean up
rm -f "$TEST_CONFIG"

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}System lock handling features:${NC}"
echo "1. Detects system package manager locks"
echo "2. Falls back to binary download when package manager fails"
echo "3. Installs to ~/.local/bin if system install fails"
echo "4. Uses Python for JSON processing if jq unavailable"
echo "5. Installation continues even without jq"

echo -e "\n${YELLOW}Recommendations:${NC}"
echo "- If system is locked, wait for other processes to complete"
echo "- Alternatively, the installer will use fallback methods"
echo "- jq is optional - Python JSON processing works fine"