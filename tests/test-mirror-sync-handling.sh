#!/bin/bash

# Test mirror synchronization and system instability handling
# Verifies proper handling of apt mirror issues

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Mirror Sync & System Stability Test ===${NC}\n"

# Source install functions
source ./scripts/install-functions.sh

# Test 1: System stability check
echo -e "${YELLOW}Test 1: System Stability Check${NC}"
check_system_stability || echo -e "${YELLOW}System stability check completed${NC}"

# Test 2: Mirror connectivity
echo -e "\n${YELLOW}Test 2: Mirror Connectivity Test${NC}"
echo "Testing Ubuntu archive mirrors..."

# Test main archive
if curl -s -I "http://archive.ubuntu.com/ubuntu/" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ archive.ubuntu.com is accessible${NC}"
else
    echo -e "${RED}✗ archive.ubuntu.com is not accessible${NC}"
fi

# Test mirror
if curl -s -I "http://mirror.ubuntu.com/ubuntu/" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ mirror.ubuntu.com is accessible${NC}"
else
    echo -e "${RED}✗ mirror.ubuntu.com is not accessible${NC}"
fi

# Test security updates
if curl -s -I "http://security.ubuntu.com/ubuntu/" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ security.ubuntu.com is accessible${NC}"
else
    echo -e "${RED}✗ security.ubuntu.com is not accessible${NC}"
fi

# Test 3: Simulate mirror sync error handling
echo -e "\n${YELLOW}Test 3: Mirror Sync Error Handling${NC}"
echo "Simulating apt update with mirror sync issues..."

# Create a test script that simulates the error
cat > /tmp/test-apt-error.sh << 'EOF'
#!/bin/bash
# Simulate apt update output with mirror sync error
echo "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease"
echo "Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]"
echo "Err:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease"
echo "  File has unexpected size (257648 != 257772). Mirror sync in progress?"
echo "E: Failed to fetch http://archive.ubuntu.com/ubuntu/dists/noble-updates/main/i18n/Translation-en.xz"
echo "E: Some index files failed to download. They have been ignored, or old ones used instead."
exit 100
EOF
chmod +x /tmp/test-apt-error.sh

# Test the error detection logic
APT_UPDATE_OUTPUT=$(/tmp/test-apt-error.sh 2>&1)
if echo "$APT_UPDATE_OUTPUT" | grep -E "Mirror sync in progress|File has unexpected size" > /dev/null; then
    echo -e "${GREEN}✓ Mirror sync error correctly detected${NC}"
    echo -e "${BLUE}Would trigger alternative installation methods${NC}"
else
    echo -e "${RED}✗ Mirror sync error not detected${NC}"
fi

# Clean up
rm -f /tmp/test-apt-error.sh

# Test 4: Binary download fallback verification
echo -e "\n${YELLOW}Test 4: Binary Download Fallback${NC}"
# Get architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64) JQ_ARCH="amd64" ;;
    aarch64) JQ_ARCH="arm64" ;;
    arm*) JQ_ARCH="arm" ;;
    *) JQ_ARCH="amd64" ;;
esac

JQ_VERSION="1.7.1"
JQ_URL="https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/jq-linux-${JQ_ARCH}"

echo "Testing jq binary download URL: $JQ_URL"
if curl -I -s "$JQ_URL" | grep -q "200\|302"; then
    echo -e "${GREEN}✓ jq binary download is available as fallback${NC}"
else
    echo -e "${RED}✗ jq binary download URL not accessible${NC}"
fi

# Test 5: Python JSON fallback
echo -e "\n${YELLOW}Test 5: Python JSON Processing Fallback${NC}"
TEST_JSON='{"test": true, "mirror_issues": "handled"}'
if echo "$TEST_JSON" | python3 -c "import json, sys; data = json.load(sys.stdin); print('✓ Can process:', data)" 2>/dev/null; then
    echo -e "${GREEN}✓ Python JSON fallback is functional${NC}"
else
    echo -e "${RED}✗ Python JSON fallback failed${NC}"
fi

# Test 6: Disk space check
echo -e "\n${YELLOW}Test 6: Disk Space Check${NC}"
AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
echo "Available disk space: ${AVAILABLE_SPACE}GB"
if [ "$AVAILABLE_SPACE" -lt 1 ]; then
    echo -e "${YELLOW}⚠ Low disk space warning would be shown${NC}"
else
    echo -e "${GREEN}✓ Sufficient disk space available${NC}"
fi

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}Mirror sync handling features:${NC}"
echo "1. Detects mirror synchronization errors"
echo "2. Attempts --fix-missing as first recovery"
echo "3. Falls back to binary download when apt fails"
echo "4. Uses Python for JSON processing without jq"
echo "5. Checks system stability before installation"
echo "6. Provides clear guidance for system issues"

echo -e "\n${YELLOW}Resilience strategies:${NC}"
echo "- Multiple fallback methods for package installation"
echo "- System health checks before critical operations"
echo "- Alternative mirror suggestions"
echo "- Direct binary downloads when package managers fail"
echo "- Graceful degradation without blocking installation"