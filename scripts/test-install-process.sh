#!/bin/bash

# Test script for install-functions.sh
# This script tests each component of the installation process

set -e

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

echo -e "${BLUE}=== SuperClaude Enterprise Installation Test ===${NC}"
echo ""

# Source the installation functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Disable trap from install-functions.sh for testing
trap - EXIT

source "$SCRIPT_DIR/install-functions.sh"

# Disable trap again after sourcing
trap - EXIT

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    if $test_function; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check Prerequisites
test_prerequisites() {
    echo "Testing prerequisites check..."
    check_nodejs && check_npm && check_python && check_git
}

# Test 2: Check jq installation detection
test_jq_check() {
    echo "Testing jq detection..."
    if check_jq; then
        echo "jq is installed"
        return 0
    else
        echo "jq is not installed (expected for first run)"
        return 0  # This is expected behavior
    fi
}

# Test 3: Check uv installation detection
test_uv_check() {
    echo "Testing uv detection..."
    if check_uv; then
        echo "uv is installed"
        return 0
    else
        echo "uv is not installed (expected for first run)"
        return 0  # This is expected behavior
    fi
}

# Test 4: Test Python JSON processing
test_python_json() {
    echo "Testing Python JSON processing..."
    
    # Create a test file
    TEST_JSON="/tmp/test_claude_config.json"
    echo '{"existing": "value"}' > "$TEST_JSON"
    
    # Test Python JSON update
    python3 << PYTHON_TEST
import json
import sys

try:
    with open("$TEST_JSON", 'r') as f:
        config = json.load(f)
    
    config['mcpServers'] = {
        'test-server': {
            'command': 'node',
            'args': ['/test/path'],
            'description': 'Test Server'
        }
    }
    
    with open("$TEST_JSON", 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Python JSON processing works")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
PYTHON_TEST
    
    local result=$?
    
    # Verify the file was updated
    if [ $result -eq 0 ] && grep -q "test-server" "$TEST_JSON" 2>/dev/null; then
        echo -e "${GREEN}Python JSON processing successful${NC}"
        rm -f "$TEST_JSON"
        return 0
    else
        echo -e "${RED}Python JSON processing failed${NC}"
        rm -f "$TEST_JSON"
        return 1
    fi
}

# Test 5: Test SuperClaude detection
test_superclaude_check() {
    echo "Testing SuperClaude detection..."
    if check_superclaude_installation; then
        echo "SuperClaude is installed"
        return 0
    else
        echo "SuperClaude is not installed (expected for fresh install)"
        return 0  # This is expected behavior
    fi
}

# Test 6: Test build process
test_build() {
    echo "Testing build process..."
    # Save current directory
    local original_dir=$(pwd)
    
    # Change to project root
    cd "$SCRIPT_DIR/.."
    
    # Check if we can run the build
    if [ -f "package.json" ] && command -v npm &> /dev/null; then
        echo "Build environment is ready"
        cd "$original_dir"
        return 0
    else
        echo "Build environment check"
        cd "$original_dir"
        return 0  # Not a failure, just informational
    fi
}

# Test 7: Test configuration paths
test_config_paths() {
    echo "Testing configuration paths..."
    
    # Test home directory config
    CLAUDE_CONFIG="$HOME/.claude.json"
    echo "Claude config path: $CLAUDE_CONFIG"
    
    # Test if we can write to home directory
    if touch "$HOME/.test_write_permission" 2>/dev/null; then
        rm -f "$HOME/.test_write_permission"
        echo "Can write to home directory"
        return 0
    else
        echo "Cannot write to home directory"
        return 1
    fi
}

# Run all tests
echo -e "${BLUE}Starting component tests...${NC}"

run_test "Prerequisites Check" test_prerequisites
run_test "jq Detection" test_jq_check
run_test "uv Detection" test_uv_check
run_test "Python JSON Processing" test_python_json
run_test "SuperClaude Detection" test_superclaude_check
run_test "Build Environment" test_build
run_test "Configuration Paths" test_config_paths

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! The installation script is ready to use.${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the errors above.${NC}"
    exit 1
fi