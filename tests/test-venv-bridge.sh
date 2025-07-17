#!/bin/bash

# Test virtual environment SuperClaude bridge connection
# Verifies that MCP server can access SuperClaude in virtual environment

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Virtual Environment Bridge Test ===${NC}\n"

# Test 1: Check current environment
echo -e "${YELLOW}Test 1: Environment Check${NC}"
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}✓ In virtual environment: $VIRTUAL_ENV${NC}"
    PYTHON_CMD="$VIRTUAL_ENV/bin/python"
else
    echo -e "${YELLOW}Not in virtual environment${NC}"
    PYTHON_CMD="python3"
fi

# Test 2: Check SuperClaude installation
echo -e "\n${YELLOW}Test 2: SuperClaude Module Check${NC}"
if $PYTHON_CMD -c "import SuperClaude; print('SuperClaude module found')" 2>/dev/null; then
    echo -e "${GREEN}✓ SuperClaude module is accessible${NC}"
    
    # Get module location
    MODULE_LOCATION=$($PYTHON_CMD -c "import SuperClaude; import os; print(os.path.dirname(SuperClaude.__file__))" 2>/dev/null)
    echo "Module location: $MODULE_LOCATION"
else
    echo -e "${RED}✗ SuperClaude module not found${NC}"
fi

# Test 3: Test module execution
echo -e "\n${YELLOW}Test 3: Module Execution Test${NC}"
echo "Testing: $PYTHON_CMD -m SuperClaude --version"
if $PYTHON_CMD -m SuperClaude --version 2>&1 | grep -E "SuperClaude|version"; then
    echo -e "${GREEN}✓ Module execution works${NC}"
else
    echo -e "${YELLOW}Module execution may not support --version${NC}"
fi

# Test 4: Test bridge configuration
echo -e "\n${YELLOW}Test 4: Bridge Configuration Test${NC}"
cat > /tmp/test-bridge.js << 'EOF'
const { SuperClaudeBridge } = require('../dist/integration/superclaude-bridge.js');

const bridge = new SuperClaudeBridge();

// Listen for events
bridge.on('info', (msg) => console.log('[INFO]', msg));
bridge.on('error', (err) => console.log('[ERROR]', err));

// Test validation
bridge.validate().then(result => {
    console.log('Validation result:', result);
    process.exit(result ? 0 : 1);
}).catch(err => {
    console.error('Validation error:', err);
    process.exit(1);
});
EOF

if [ -f "dist/integration/superclaude-bridge.js" ]; then
    echo "Testing bridge validation..."
    node /tmp/test-bridge.js
else
    echo -e "${YELLOW}Bridge not built yet. Run: npm run build${NC}"
fi

rm -f /tmp/test-bridge.js

# Test 5: Environment variable propagation
echo -e "\n${YELLOW}Test 5: Environment Variable Check${NC}"
echo "VIRTUAL_ENV: ${VIRTUAL_ENV:-not set}"
echo "PATH includes venv: "
if [[ "$PATH" == *"$VIRTUAL_ENV"* ]]; then
    echo -e "${GREEN}✓ Virtual environment is in PATH${NC}"
else
    echo -e "${YELLOW}Virtual environment not in PATH${NC}"
fi

# Test 6: MCP server environment
echo -e "\n${YELLOW}Test 6: MCP Server Environment${NC}"
if [ -f "dist/mcp-server/index.js" ]; then
    echo "MCP server would inherit these environment variables:"
    echo "- VIRTUAL_ENV: $VIRTUAL_ENV"
    echo "- Python command: $PYTHON_CMD"
    
    # Check if MCP server process would have access
    NODE_ENV_TEST=$(node -e "console.log('VIRTUAL_ENV:', process.env.VIRTUAL_ENV || 'not set')")
    echo "Node.js sees: $NODE_ENV_TEST"
else
    echo -e "${YELLOW}MCP server not built yet${NC}"
fi

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}Virtual environment configuration:${NC}"
    echo "1. Python: $PYTHON_CMD"
    echo "2. SuperClaude should be accessible via: python -m SuperClaude"
    echo "3. MCP server will inherit VIRTUAL_ENV variable"
    echo "4. Bridge will use virtual environment Python"
else
    echo -e "${YELLOW}No virtual environment active${NC}"
    echo "1. Using system Python"
    echo "2. SuperClaude must be installed system-wide or with --user"
    echo "3. Bridge will use system Python"
fi

echo -e "\n${YELLOW}Key improvements implemented:${NC}"
echo "- ExtensionManager checks for Python module instead of directory"
echo "- SuperClaudeBridge uses python -m SuperClaude for execution"
echo "- Virtual environment Python is automatically detected and used"
echo "- Standalone mode supported when SuperClaude not found"