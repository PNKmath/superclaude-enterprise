#!/bin/bash

# Test script for installation functions

# Source the functions
source "$(dirname "$0")/install-functions.sh"

# Test individual functions
echo -e "${BLUE}Testing installation functions...${NC}"

# Test 1: Check prerequisites
echo -e "\n${YELLOW}Test 1: Check prerequisites${NC}"
if check_prerequisites; then
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
else
    echo -e "${RED}✗ Prerequisites check failed${NC}"
fi

# Test 2: Check Node.js specifically
echo -e "\n${YELLOW}Test 2: Check Node.js${NC}"
if check_nodejs; then
    echo -e "${GREEN}✓ Node.js check passed${NC}"
else
    echo -e "${RED}✗ Node.js check failed${NC}"
fi

# Test 3: Check Python specifically
echo -e "\n${YELLOW}Test 3: Check Python${NC}"
if check_python; then
    echo -e "${GREEN}✓ Python check passed${NC}"
else
    echo -e "${RED}✗ Python check failed${NC}"
fi

# Test 4: Check SuperClaude installation detection
echo -e "\n${YELLOW}Test 4: Check SuperClaude detection${NC}"
if check_superclaude_installation; then
    echo -e "${GREEN}✓ SuperClaude detection passed${NC}"
else
    echo -e "${YELLOW}⚠️  SuperClaude not detected (expected)${NC}"
fi

echo -e "\n${GREEN}Test completed${NC}"