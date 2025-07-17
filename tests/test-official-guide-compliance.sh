#!/bin/bash

# Test compliance with official SuperClaude installation guide
# Verifies that our implementation follows the official recommendations

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== SuperClaude Official Guide Compliance Test ===${NC}\n"

# Test results
COMPLIANT=0
NON_COMPLIANT=0

check_compliance() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    echo -e "\n${YELLOW}Checking: $test_name${NC}"
    echo -e "Expected: $expected"
    echo -e "Actual: $actual"
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ COMPLIANT${NC}"
        COMPLIANT=$((COMPLIANT + 1))
    else
        echo -e "${RED}❌ NON-COMPLIANT${NC}"
        NON_COMPLIANT=$((NON_COMPLIANT + 1))
    fi
}

# Source the installation functions
source ./scripts/install-functions.sh

# Test 1: uv installation URL
echo -e "${YELLOW}1. Testing uv installation URL compliance...${NC}"
UV_URL=$(grep -o 'https://astral.sh/uv/install.sh' ./scripts/install-functions.sh | head -1)
check_compliance "uv installation URL" "https://astral.sh/uv/install.sh" "$UV_URL"

# Test 2: Virtual environment creation with uv
echo -e "\n${YELLOW}2. Testing virtual environment creation...${NC}"
VENV_CMD=$(grep -o 'uv venv' ./scripts/install-functions.sh | head -1)
check_compliance "Virtual environment command" "uv venv" "$VENV_CMD"

# Test 3: Python version requirement
echo -e "\n${YELLOW}3. Testing Python version requirement...${NC}"
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
if [ $MAJOR -eq 3 ] && [ $MINOR -ge 8 ]; then
    echo -e "Python version: ${GREEN}$PYTHON_VERSION (✓ meets 3.8+ requirement)${NC}"
    COMPLIANT=$((COMPLIANT + 1))
else
    echo -e "Python version: ${RED}$PYTHON_VERSION (requires 3.8+)${NC}"
    NON_COMPLIANT=$((NON_COMPLIANT + 1))
fi

# Test 4: Installation command format
echo -e "\n${YELLOW}4. Testing installation command format...${NC}"
INSTALL_CMD=$(grep -E 'uv pip install SuperClaude' ./scripts/install-functions.sh | head -1 | xargs)
check_compliance "Installation command" "uv pip install SuperClaude" "$INSTALL_CMD"

# Test 5: Installer execution format
echo -e "\n${YELLOW}5. Testing installer execution format...${NC}"
# Check for both direct command and module execution
if grep -q 'python3 -m SuperClaude' ./scripts/install-functions.sh; then
    echo -e "Installer command: ${GREEN}python3 -m SuperClaude (found)${NC}"
    COMPLIANT=$((COMPLIANT + 1))
else
    echo -e "Installer command: ${RED}python3 -m SuperClaude (not found)${NC}"
    NON_COMPLIANT=$((NON_COMPLIANT + 1))
fi

# Test 6: Installation profiles support
echo -e "\n${YELLOW}6. Testing installation profiles support...${NC}"
echo "Checking for profile options:"
grep -q -- '--interactive' ./scripts/install-functions.sh && echo "✓ --interactive supported"
grep -q -- '--minimal' ./scripts/install-functions.sh && echo "✓ --minimal supported"
grep -q -- '--profile developer' ./scripts/install-functions.sh && echo "✓ --profile developer supported"

# Test 7: Virtual environment recommendation
echo -e "\n${YELLOW}7. Testing virtual environment recommendation...${NC}"
if grep -q "SuperClaude recommends using a virtual environment" ./scripts/install-functions.sh; then
    echo -e "${GREEN}✅ Virtual environment recommendation present${NC}"
    COMPLIANT=$((COMPLIANT + 1))
else
    echo -e "${RED}❌ Missing virtual environment recommendation${NC}"
    NON_COMPLIANT=$((NON_COMPLIANT + 1))
fi

# Test 8: Check for proper venv activation
echo -e "\n${YELLOW}8. Testing venv activation...${NC}"
ACTIVATE_CMD=$(grep -o 'source .venv/bin/activate' ./scripts/install-functions.sh | head -1)
check_compliance "Venv activation" "source .venv/bin/activate" "$ACTIVATE_CMD"

# Summary
echo -e "\n${BLUE}=== Compliance Summary ===${NC}"
echo -e "Compliant checks: ${GREEN}$COMPLIANT${NC}"
echo -e "Non-compliant checks: ${RED}$NON_COMPLIANT${NC}"

if [ $NON_COMPLIANT -eq 0 ]; then
    echo -e "\n${GREEN}✅ Fully compliant with official SuperClaude installation guide!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️ Some non-compliance issues found. Please review above.${NC}"
    exit 1
fi