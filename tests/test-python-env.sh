#!/bin/bash

# Test script for Python environment management with uv
# Tests externally-managed-environment issues and solutions

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Python Environment Management Test ===${NC}\n"

# Test 1: Check Python version and environment
echo -e "${YELLOW}Test 1: Python Environment Check${NC}"
python3 --version
echo -n "Is environment externally managed? "
if python3 -c "import sys; sys.exit(0 if hasattr(sys, '_base_executable') else 1)" 2>/dev/null; then
    echo -e "${RED}Yes (externally managed)${NC}"
    EXTERNALLY_MANAGED=true
else
    echo -e "${GREEN}No${NC}"
    EXTERNALLY_MANAGED=false
fi

# Test 2: Check if pip install fails with externally-managed-environment
echo -e "\n${YELLOW}Test 2: Direct pip install test${NC}"
if pip install --dry-run SuperClaude 2>&1 | grep -q "externally-managed-environment"; then
    echo -e "${RED}✗ pip install blocked by externally-managed-environment${NC}"
    PIP_BLOCKED=true
else
    echo -e "${GREEN}✓ pip install not blocked${NC}"
    PIP_BLOCKED=false
fi

# Test 3: Check uv availability and functionality
echo -e "\n${YELLOW}Test 3: uv Package Manager Test${NC}"
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✓ uv is installed${NC}"
    uv --version
    
    # Test uv pip functionality
    echo -e "${BLUE}Testing uv pip list...${NC}"
    if uv pip list &> /dev/null; then
        echo -e "${GREEN}✓ uv pip is functional${NC}"
        UV_FUNCTIONAL=true
    else
        echo -e "${RED}✗ uv pip failed${NC}"
        UV_FUNCTIONAL=false
    fi
else
    echo -e "${RED}✗ uv is not installed${NC}"
    UV_FUNCTIONAL=false
fi

# Test 4: Check uv installation paths
echo -e "\n${YELLOW}Test 4: uv Installation Paths${NC}"
if [ "$UV_FUNCTIONAL" = true ]; then
    echo "Checking uv Python location..."
    UV_PYTHON=$(uv python find 2>/dev/null || echo "Not found")
    echo "uv Python: $UV_PYTHON"
    
    # Check if SuperClaude is installed via uv
    if uv pip show SuperClaude &> /dev/null; then
        echo -e "${GREEN}✓ SuperClaude is installed via uv${NC}"
        LOCATION=$(uv pip show SuperClaude | grep Location | cut -d' ' -f2)
        echo "Location: $LOCATION"
    else
        echo -e "${YELLOW}SuperClaude not installed via uv${NC}"
    fi
fi

# Test 5: PATH configuration
echo -e "\n${YELLOW}Test 5: PATH Configuration${NC}"
echo "Current PATH entries:"
echo "$PATH" | tr ':' '\n' | grep -E "(\.cargo|\.local|uv)" || echo "No uv-related paths found"

# Check if .cargo/bin is in PATH
if [[ "$PATH" == *"$HOME/.cargo/bin"* ]]; then
    echo -e "${GREEN}✓ ~/.cargo/bin is in PATH${NC}"
else
    echo -e "${YELLOW}⚠ ~/.cargo/bin is not in PATH${NC}"
fi

# Test 6: Virtual environment alternative
echo -e "\n${YELLOW}Test 6: Virtual Environment Test${NC}"
if [ -d ".venv" ]; then
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
    if [ -n "$VIRTUAL_ENV" ]; then
        echo -e "${GREEN}✓ Virtual environment is activated${NC}"
    else
        echo -e "${YELLOW}⚠ Virtual environment exists but not activated${NC}"
    fi
else
    echo -e "${YELLOW}No virtual environment found${NC}"
fi

# Test 7: Check MCP configuration
echo -e "\n${YELLOW}Test 7: MCP Configuration Check${NC}"
MCP_CONFIG="$HOME/.config/claude/config/mcp.json"
if [ -f "$MCP_CONFIG" ]; then
    echo -e "${GREEN}✓ MCP config exists${NC}"
    # Check if SuperClaude command is properly configured
    if grep -q "superclaude" "$MCP_CONFIG"; then
        echo -e "${GREEN}✓ SuperClaude command found in MCP config${NC}"
        SUPERCLAUDE_CMD=$(grep -o '"command":[^,]*' "$MCP_CONFIG" | grep superclaude | cut -d'"' -f4)
        echo "Command: $SUPERCLAUDE_CMD"
        
        # Test if command is executable
        if [ -x "$SUPERCLAUDE_CMD" ] || command -v "$SUPERCLAUDE_CMD" &> /dev/null; then
            echo -e "${GREEN}✓ SuperClaude command is executable${NC}"
        else
            echo -e "${RED}✗ SuperClaude command not found or not executable${NC}"
        fi
    else
        echo -e "${RED}✗ SuperClaude not configured in MCP${NC}"
    fi
else
    echo -e "${YELLOW}MCP config not found${NC}"
fi

# Summary and recommendations
echo -e "\n${BLUE}=== Summary ===${NC}"
if [ "$EXTERNALLY_MANAGED" = true ] && [ "$PIP_BLOCKED" = true ]; then
    echo -e "${RED}Python environment is externally managed and pip is blocked.${NC}"
    echo -e "${YELLOW}Recommendations:${NC}"
    echo "1. Use uv for package management (recommended)"
    echo "2. Create a virtual environment"
    echo "3. Use pipx for isolated installations"
    
    if [ "$UV_FUNCTIONAL" = false ]; then
        echo -e "\n${YELLOW}Action needed: Install uv package manager${NC}"
        echo "Run: curl -LsSf https://astral.sh/uv/install.sh | sh"
    fi
else
    echo -e "${GREEN}Python environment is properly configured.${NC}"
fi

# Test result
if [ "$UV_FUNCTIONAL" = true ] || [ "$EXTERNALLY_MANAGED" = false ]; then
    echo -e "\n${GREEN}✓ Environment ready for SuperClaude installation${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Environment needs configuration${NC}"
    exit 1
fi