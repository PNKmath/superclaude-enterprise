#!/bin/bash

# Test uv PATH handling and automatic setup
# Verifies that uv PATH issues are properly resolved

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== uv PATH Handling Test ===${NC}\n"

# Test 1: Check current PATH
echo -e "${YELLOW}Test 1: Current PATH Check${NC}"
echo "Current PATH:"
echo "$PATH" | tr ':' '\n' | grep -E "(cargo|\.local)" || echo "No cargo/local paths in PATH"

# Test 2: Check if uv is installed
echo -e "\n${YELLOW}Test 2: uv Installation Check${NC}"
if [ -f "$HOME/.cargo/bin/uv" ]; then
    echo -e "${GREEN}✓ uv binary exists at: $HOME/.cargo/bin/uv${NC}"
    echo "Version: $($HOME/.cargo/bin/uv --version 2>/dev/null || echo 'Unable to get version')"
else
    echo -e "${YELLOW}uv not installed at ~/.cargo/bin/uv${NC}"
fi

# Check if uv is in PATH
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✓ uv is available in PATH${NC}"
    which uv
else
    echo -e "${YELLOW}⚠ uv is not in PATH${NC}"
fi

# Test 3: Shell configuration check
echo -e "\n${YELLOW}Test 3: Shell Configuration Check${NC}"
SHELL_NAME=$(basename "$SHELL")
echo "Current shell: $SHELL_NAME"

case "$SHELL_NAME" in
    bash)
        echo "Checking .bashrc and .profile..."
        if [ -f "$HOME/.bashrc" ]; then
            if grep -q ".cargo/bin" "$HOME/.bashrc"; then
                echo -e "${GREEN}✓ .bashrc contains cargo/bin PATH${NC}"
            else
                echo -e "${YELLOW}⚠ .bashrc missing cargo/bin PATH${NC}"
            fi
        fi
        if [ -f "$HOME/.profile" ]; then
            if grep -q ".cargo/bin" "$HOME/.profile"; then
                echo -e "${GREEN}✓ .profile contains cargo/bin PATH${NC}"
            else
                echo -e "${YELLOW}⚠ .profile missing cargo/bin PATH${NC}"
            fi
        fi
        ;;
    zsh)
        echo "Checking .zshrc..."
        if [ -f "$HOME/.zshrc" ]; then
            if grep -q ".cargo/bin" "$HOME/.zshrc"; then
                echo -e "${GREEN}✓ .zshrc contains cargo/bin PATH${NC}"
            else
                echo -e "${YELLOW}⚠ .zshrc missing cargo/bin PATH${NC}"
            fi
        fi
        ;;
    fish)
        echo "Checking fish config..."
        if [ -f "$HOME/.config/fish/config.fish" ]; then
            if grep -q ".cargo/bin" "$HOME/.config/fish/config.fish"; then
                echo -e "${GREEN}✓ fish config contains cargo/bin PATH${NC}"
            else
                echo -e "${YELLOW}⚠ fish config missing cargo/bin PATH${NC}"
            fi
        fi
        ;;
esac

# Test 4: Test PATH setup function
echo -e "\n${YELLOW}Test 4: Testing PATH Setup Function${NC}"
# Source the install functions
source ./scripts/install-functions.sh

# Temporarily rename uv if it's in PATH to test the setup
UV_IN_PATH=false
if command -v uv &> /dev/null; then
    UV_IN_PATH=true
    echo "uv is already in PATH, testing setup function anyway..."
fi

# Call setup_uv_path
setup_uv_path

# Verify PATH was updated
if [[ "$PATH" == *"$HOME/.cargo/bin"* ]]; then
    echo -e "${GREEN}✓ PATH contains ~/.cargo/bin${NC}"
else
    echo -e "${RED}✗ PATH does not contain ~/.cargo/bin${NC}"
fi

# Test 5: Direct path execution
echo -e "\n${YELLOW}Test 5: Direct Path Execution${NC}"
if [ -x "$HOME/.cargo/bin/uv" ]; then
    echo "Testing direct execution..."
    if $HOME/.cargo/bin/uv --version &> /dev/null; then
        echo -e "${GREEN}✓ Direct execution works${NC}"
    else
        echo -e "${RED}✗ Direct execution failed${NC}"
    fi
else
    echo -e "${YELLOW}uv binary not found for direct execution test${NC}"
fi

# Test 6: Virtual environment handling
echo -e "\n${YELLOW}Test 6: Virtual Environment Handling${NC}"
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}✓ Currently in virtual environment: $VIRTUAL_ENV${NC}"
    echo "uv will use normal pip install"
else
    echo -e "${YELLOW}Not in virtual environment${NC}"
    echo "uv will use --system flag"
fi

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
if command -v uv &> /dev/null || [ -x "$HOME/.cargo/bin/uv" ]; then
    echo -e "${GREEN}✓ uv is available${NC}"
    if command -v uv &> /dev/null; then
        echo -e "${GREEN}✓ uv is in PATH${NC}"
    else
        echo -e "${YELLOW}⚠ uv exists but not in PATH${NC}"
        echo -e "${BLUE}Solutions:${NC}"
        echo "1. Run: export PATH=\"\$HOME/.cargo/bin:\$PATH\""
        echo "2. Restart your terminal"
        echo "3. The installer will use full path automatically"
    fi
else
    echo -e "${YELLOW}uv not installed${NC}"
    echo "Run install-enterprise.sh to install uv"
fi

echo -e "\n${YELLOW}PATH handling improvements:${NC}"
echo "1. Automatic PATH setup for current session"
echo "2. Shell configuration file updates"
echo "3. Full path fallback when not in PATH"
echo "4. Detection of existing uv installation"