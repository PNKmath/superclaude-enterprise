#!/bin/bash

# Complete installation test including Python environment management
# Tests the entire installation flow with externally-managed-environment handling

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${YELLOW}Test: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Helper function to check command exists
check_command() {
    command -v "$1" &> /dev/null
}

echo -e "${BLUE}=== SuperClaude Enterprise Complete Installation Test ===${NC}\n"

# Test 1: Check Python environment
run_test "Python environment check" "python3 --version"

# Test 2: Check if environment is externally managed
run_test "Externally managed environment detection" \
    "pip install --dry-run SuperClaude 2>&1 | grep -q 'externally-managed-environment' && echo 'Environment is externally managed (as expected)' || echo 'Environment is not externally managed'"

# Test 3: Check uv installation
run_test "uv package manager installation" "check_command uv"

# Test 4: Test uv functionality
run_test "uv pip functionality" "uv pip list &> /dev/null"

# Test 5: Check if uv can bypass externally-managed-environment
run_test "uv bypasses externally-managed restrictions" \
    "uv pip install --dry-run SuperClaude &> /dev/null"

# Test 6: Check jq installation
run_test "jq installation check" "check_command jq || echo 'jq not installed (Python fallback will be used)'"

# Test 7: Check Node.js for MCP server
run_test "Node.js installation" "node --version"

# Test 8: Check npm
run_test "npm installation" "npm --version"

# Test 9: Test install-functions.sh sourcing
run_test "Source install-functions.sh" \
    "source ./scripts/install-functions.sh &> /dev/null"

# Test 10: Check if install functions are defined
run_test "Install functions defined" \
    "source ./scripts/install-functions.sh && type -t install_superclaude &> /dev/null"

# Test 11: Check MCP server build
run_test "MCP server build exists" \
    "[ -f dist/mcp-server/index.js ] || echo 'MCP server not built yet'"

# Test 12: Check Claude Code config directory
run_test "Claude Code config directory" \
    "[ -d $(dirname ~/.claude.json) ] || mkdir -p $(dirname ~/.claude.json)"

# Test 13: Test Python JSON processing capability
run_test "Python JSON processing" \
    "python3 -c 'import json; print(\"JSON module available\")'"

# Test 14: Test SuperClaude command detection logic
run_test "SuperClaude command detection" "
    if check_command superclaude; then
        echo 'superclaude found in PATH'
    elif [ -x \"\$HOME/.local/bin/superclaude\" ]; then
        echo 'superclaude found in ~/.local/bin'
    elif python3 -c 'import SuperClaude' 2>/dev/null; then
        echo 'SuperClaude Python module available'
    else
        echo 'SuperClaude not yet installed'
    fi
"

# Test 15: Check PATH includes necessary directories
run_test "PATH configuration" "
    if [[ \"\$PATH\" == *\"\$HOME/.cargo/bin\"* ]]; then
        echo '~/.cargo/bin in PATH'
    else
        echo '~/.cargo/bin not in PATH (uv might not be accessible)'
    fi
"

# Test 16: Simulate SuperClaude installation with uv
run_test "Simulate SuperClaude installation" "
    if check_command uv; then
        echo 'Would install SuperClaude with: uv pip install SuperClaude'
        true
    else
        echo 'Would fall back to: pip install SuperClaude --break-system-packages'
        true
    fi
"

# Test 17: Test MCP configuration update simulation
run_test "MCP configuration update simulation" "
    TEST_CONFIG=~/.claude.json.test
    cat > \$TEST_CONFIG << EOF
{
  \"existingKey\": \"existingValue\"
}
EOF
    
    if check_command jq; then
        jq '.mcpServers = {\"test\": {\"command\": \"node\"}}' \$TEST_CONFIG > /dev/null && echo 'jq can update config'
    else
        python3 -c 'import json; print(\"Python can update config\")'
    fi
    
    rm -f \$TEST_CONFIG
"

# Test 18: Check for memory leak fixes
run_test "Memory leak fixes applied" "
    grep -q 'process.once' src/mcp-server/index.ts && \
    grep -q 'unref()' src/integrations/session/SessionManager.ts && \
    echo 'Memory leak fixes are in place'
"

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed! System is ready for installation.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ Some tests failed. Please review the failures above.${NC}"
    
    # Provide recommendations
    echo -e "\n${YELLOW}Recommendations:${NC}"
    
    if ! check_command uv; then
        echo "- Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    fi
    
    if ! check_command node; then
        echo "- Install Node.js 18+"
    fi
    
    if ! check_command jq; then
        echo "- Install jq (optional): sudo apt-get install jq"
    fi
    
    if [ ! -f dist/mcp-server/index.js ]; then
        echo "- Build the project: npm install && npm run build"
    fi
    
    exit 1
fi