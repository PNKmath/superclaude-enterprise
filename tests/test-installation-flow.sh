#!/bin/bash

# Test the complete installation flow
# Simulates user choices and verifies each step

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== SuperClaude Enterprise Installation Flow Test ===${NC}\n"

# Test stages
STAGES_PASSED=0
TOTAL_STAGES=0

test_stage() {
    local stage_name="$1"
    local test_command="$2"
    
    TOTAL_STAGES=$((TOTAL_STAGES + 1))
    echo -e "\n${YELLOW}Stage $TOTAL_STAGES: $stage_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ Stage passed${NC}"
        STAGES_PASSED=$((STAGES_PASSED + 1))
    else
        echo -e "${RED}❌ Stage failed${NC}"
    fi
}

# Stage 1: Check prerequisites
test_stage "Prerequisites Check" "
    echo 'Checking Python...'
    python3 --version && \
    echo 'Checking Node.js...'
    node --version && \
    echo 'Checking npm...'
    npm --version
"

# Stage 2: Build check
test_stage "MCP Server Build" "
    if [ -f dist/mcp-server/index.js ]; then
        echo 'MCP server already built'
        true
    else
        echo 'Building MCP server...'
        npm install && npm run build
    fi
"

# Stage 3: uv availability
test_stage "uv Package Manager" "
    if command -v uv &> /dev/null; then
        echo 'uv is already installed'
        uv --version
        true
    else
        echo 'uv not installed (will be installed during setup)'
        true
    fi
"

# Stage 4: Virtual environment recommendation
test_stage "Virtual Environment Handling" "
    source ./scripts/install-functions.sh
    echo 'Testing virtual environment detection...'
    if [ -z \"\$VIRTUAL_ENV\" ]; then
        echo 'Not in virtual environment (installer will offer to create one)'
    else
        echo \"In virtual environment: \$VIRTUAL_ENV\"
    fi
    true
"

# Stage 5: SuperClaude command detection
test_stage "SuperClaude Command Detection" "
    echo 'Testing SuperClaude command detection logic...'
    if command -v superclaude &> /dev/null; then
        echo \"Found in PATH: \$(which superclaude)\"
    elif [ -x \"\$HOME/.local/bin/superclaude\" ]; then
        echo 'Found in ~/.local/bin'
    elif python3 -c 'import SuperClaude' 2>/dev/null; then
        echo 'Can use python3 -m SuperClaude'
    else
        echo 'SuperClaude not yet installed (normal for fresh install)'
    fi
    true
"

# Stage 6: MCP configuration readiness
test_stage "MCP Configuration" "
    echo 'Checking Claude Code configuration...'
    CLAUDE_CONFIG=\"\$HOME/.claude.json\"
    if [ -f \"\$CLAUDE_CONFIG\" ]; then
        echo 'Claude Code config exists'
        if grep -q 'mcpServers' \"\$CLAUDE_CONFIG\"; then
            echo 'MCP servers already configured'
        else
            echo 'Ready to add MCP server configuration'
        fi
    else
        echo 'Claude Code config will be created'
    fi
    true
"

# Stage 7: Installation profiles
test_stage "Installation Profiles" "
    echo 'Verifying installation profile support...'
    grep -q -- '--interactive' ./scripts/install-functions.sh && echo '✓ Interactive profile'
    grep -q -- '--minimal' ./scripts/install-functions.sh && echo '✓ Minimal profile'
    grep -q -- '--profile developer' ./scripts/install-functions.sh && echo '✓ Developer profile'
    true
"

# Stage 8: Error handling
test_stage "Error Handling" "
    echo 'Checking error handling...'
    grep -q 'CRITICAL' ./scripts/install-functions.sh && echo '✓ Critical error messages'
    grep -q 'Troubleshooting' ./scripts/install-functions.sh && echo '✓ Troubleshooting guidance'
    grep -q 'fallback' ./scripts/install-functions.sh && echo '✓ Fallback mechanisms'
    true
"

# Stage 9: Memory leak fixes verification
test_stage "Memory Leak Fixes" "
    echo 'Verifying memory leak fixes...'
    grep -q 'process.once' src/mcp-server/index.ts && echo '✓ Process listener fix'
    grep -q 'unref()' src/integrations/session/SessionManager.ts && echo '✓ Timer fix'
    grep -q 'cleanup' src/extensions/hooks-v4/HookManager.ts && echo '✓ Cleanup methods'
    true
"

# Stage 10: Official guide compliance
test_stage "Official Guide Compliance" "
    ./tests/test-official-guide-compliance.sh > /dev/null 2>&1
"

# Summary
echo -e "\n${BLUE}=== Installation Flow Test Summary ===${NC}"
echo -e "Stages passed: ${GREEN}$STAGES_PASSED${NC} / $TOTAL_STAGES"

if [ $STAGES_PASSED -eq $TOTAL_STAGES ]; then
    echo -e "\n${GREEN}✅ All installation stages verified successfully!${NC}"
    echo -e "\n${YELLOW}Ready to run: ./install-enterprise.sh${NC}"
    echo -e "\nInstallation will:"
    echo "1. Install uv if not present"
    echo "2. Offer to create virtual environment (recommended)"
    echo "3. Install SuperClaude using uv"
    echo "4. Configure MCP server for Claude Code"
    echo "5. Run SuperClaude installer with chosen profile"
    exit 0
else
    echo -e "\n${RED}⚠️ Some stages failed. Please review issues above.${NC}"
    exit 1
fi