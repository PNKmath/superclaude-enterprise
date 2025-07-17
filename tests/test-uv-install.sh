#!/bin/bash

# Test uv installation capabilities for SuperClaude
# This script tests different uv installation methods

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Testing uv Installation Methods ===${NC}\n"

# Test 1: Check uv version
echo -e "${YELLOW}1. Checking uv version:${NC}"
uv --version

# Test 2: Check Python environment
echo -e "\n${YELLOW}2. Checking Python environment:${NC}"
uv python find

# Test 3: Test dry-run installation
echo -e "\n${YELLOW}3. Testing dry-run installation:${NC}"
if uv pip install --dry-run SuperClaude 2>&1; then
    echo -e "${GREEN}✓ Dry-run successful${NC}"
else
    echo -e "${RED}✗ Dry-run failed${NC}"
fi

# Test 4: List current packages
echo -e "\n${YELLOW}4. Current packages via uv:${NC}"
uv pip list | head -10

# Test 5: Check if SuperClaude exists in PyPI
echo -e "\n${YELLOW}5. Checking if SuperClaude exists in PyPI:${NC}"
if curl -s https://pypi.org/pypi/SuperClaude/json | grep -q "SuperClaude"; then
    echo -e "${GREEN}✓ SuperClaude found in PyPI${NC}"
else
    echo -e "${RED}✗ SuperClaude not found in PyPI${NC}"
fi

# Test 6: Check uv pip install path
echo -e "\n${YELLOW}6. Checking uv installation paths:${NC}"
echo "Python executable: $(uv python find)"
echo "Site packages would be installed to:"
python3 -c "import site; print(site.getsitepackages())"

# Test 7: Alternative installation methods
echo -e "\n${YELLOW}7. Alternative installation methods available:${NC}"
echo "- uv pip install SuperClaude"
echo "- pip install SuperClaude --break-system-packages"
echo "- pipx install SuperClaude"
echo "- Create virtual environment: python3 -m venv .venv"

# Test 8: Check for virtual environment
echo -e "\n${YELLOW}8. Virtual environment check:${NC}"
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}✓ Currently in virtual environment: $VIRTUAL_ENV${NC}"
else
    echo -e "${YELLOW}Not in a virtual environment${NC}"
    echo "To create one: python3 -m venv .venv && source .venv/bin/activate"
fi

# Summary
echo -e "\n${BLUE}=== Installation Recommendations ===${NC}"
echo -e "${YELLOW}For externally-managed Python environments:${NC}"
echo "1. Use uv (recommended): uv pip install SuperClaude"
echo "2. Use pipx for isolation: pipx install SuperClaude"
echo "3. Create venv: python3 -m venv .venv && source .venv/bin/activate && pip install SuperClaude"
echo "4. Force install (not recommended): pip install SuperClaude --break-system-packages"