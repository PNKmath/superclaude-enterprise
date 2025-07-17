#!/bin/bash

# SuperClaude Enterprise Installation Functions
# Modular functions for installation script

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Print header
print_header() {
    echo -e "${BLUE}🚀 SuperClaude Enterprise Extension Installer${NC}"
    echo "================================================"
    echo -e "${YELLOW}Note: This installation requires user interaction${NC}"
    echo -e "${YELLOW}You will be asked to confirm SuperClaude installation steps${NC}"
    echo ""
}

# Check Node.js installation
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "   Please install Node.js 18 or higher from https://nodejs.org"
        return 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
        echo "   Current version: $(node -v)"
        return 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
    return 0
}

# Check npm installation
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ npm $(npm -v)${NC}"
    return 0
}

# Check Python installation
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed${NC}"
        echo "   Please install Python 3.8 or higher from https://python.org"
        return 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        echo -e "${RED}❌ Python version must be 3.8 or higher${NC}"
        echo "   Current version: $PYTHON_VERSION"
        return 1
    fi
    echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"
    return 0
}

# Check Git installation
check_git() {
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is not installed${NC}"
        echo "   Please install Git from https://git-scm.com"
        return 1
    fi
    echo -e "${GREEN}✓ Git $(git --version | cut -d' ' -f3)${NC}"
    return 0
}

# Check all prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    local all_ok=true
    
    check_nodejs || all_ok=false
    check_npm || all_ok=false
    check_python || all_ok=false
    check_git || all_ok=false
    
    if [ "$all_ok" = false ]; then
        return 1
    fi
    
    return 0
}

# Install npm dependencies
install_npm_dependencies() {
    echo -e "\n${YELLOW}Installing npm dependencies...${NC}"
    
    if npm install; then
        echo -e "${GREEN}✓ npm dependencies installed${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to install npm dependencies${NC}"
        return 1
    fi
}

# Build the project
build_project() {
    echo -e "\n${YELLOW}Building the project...${NC}"
    
    if npm run build; then
        echo -e "${GREEN}✓ Project built successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Create virtual environment
create_virtual_environment() {
    echo -e "\n${YELLOW}Creating Python virtual environment...${NC}"
    
    if python3 -m venv venv; then
        echo -e "${GREEN}✓ Virtual environment created${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        return 1
    fi
}

# Activate virtual environment
activate_virtual_environment() {
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        echo -e "${GREEN}✓ Virtual environment activated${NC}"
        return 0
    else
        echo -e "${RED}❌ Virtual environment not found${NC}"
        return 1
    fi
}

# Check SuperClaude installation
check_superclaude_installation() {
    echo -e "\n${YELLOW}Checking for SuperClaude installation...${NC}"
    
    # Use the check-paths.js helper
    if [ -f "scripts/check-paths.js" ] && [ -f "dist/utils/path-resolver.js" ]; then
        SUPERCLAUDE_PATH=$(node scripts/check-paths.js superclaude 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$SUPERCLAUDE_PATH" ]; then
            echo -e "${GREEN}✓ SuperClaude found at: $SUPERCLAUDE_PATH${NC}"
            return 0
        fi
    fi
    
    # Check in current directory
    if [ -d "SuperClaude" ]; then
        echo -e "${GREEN}✓ SuperClaude found in current directory${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}⚠️  SuperClaude not found${NC}"
    return 1
}

# Install SuperClaude
install_superclaude() {
    echo -e "\n${YELLOW}Installing SuperClaude...${NC}"
    echo -e "${BLUE}This will clone SuperClaude from GitHub and install it${NC}"
    echo -n "Do you want to proceed? (y/n): "
    read -r response
    
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping SuperClaude installation${NC}"
        return 1
    fi
    
    # Clone SuperClaude
    if [ -d "SuperClaude" ]; then
        echo -e "${YELLOW}SuperClaude directory already exists${NC}"
        echo -n "Remove and reinstall? (y/n): "
        read -r remove_response
        
        if [[ "$remove_response" =~ ^[Yy]$ ]]; then
            rm -rf SuperClaude
        else
            return 0
        fi
    fi
    
    echo -e "${YELLOW}Cloning SuperClaude from GitHub...${NC}"
    if git clone https://github.com/NomenAK/SuperClaude.git; then
        echo -e "${GREEN}✓ SuperClaude cloned successfully${NC}"
    else
        echo -e "${RED}❌ Failed to clone SuperClaude${NC}"
        return 1
    fi
    
    # Install SuperClaude in development mode
    cd SuperClaude
    echo -e "${YELLOW}Installing SuperClaude in development mode...${NC}"
    
    if pip install -e .; then
        echo -e "${GREEN}✓ SuperClaude installed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  SuperClaude package installation failed${NC}"
    fi
    
    # Run SuperClaude installer
    echo -e "\n${YELLOW}Running SuperClaude installer...${NC}"
    echo -e "${BLUE}Please follow the prompts to complete SuperClaude installation${NC}"
    
    if python3 installer.py --force; then
        echo -e "${GREEN}✓ SuperClaude installer completed${NC}"
    else
        echo -e "${YELLOW}⚠️  SuperClaude installer failed or was skipped${NC}"
    fi
    
    cd ..
    return 0
}

# Setup MCP configuration
setup_mcp_config() {
    echo -e "\n${YELLOW}Setting up MCP configuration...${NC}"
    
    # Claude Code uses ~/.claude.json for configuration
    CLAUDE_CONFIG="$HOME/.claude.json"
    INSTALL_PATH=$(pwd)
    
    echo -e "${BLUE}Configuring MCP server in Claude Code settings...${NC}"
    
    # Check if ~/.claude.json exists
    if [ -f "$CLAUDE_CONFIG" ]; then
        echo -e "${BLUE}Found existing Claude configuration${NC}"
        # Backup existing config
        cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup.$(date +%Y%m%d%H%M%S)"
        
        # Use jq to add/update MCP server configuration if available
        if command -v jq &> /dev/null; then
            # Add or update the mcpServers configuration
            jq --arg path "$INSTALL_PATH" '.mcpServers = (.mcpServers // {}) | .mcpServers["superclaude-enterprise"] = {
                "command": "node",
                "args": [$path + "/dist/mcp-server/index.js"],
                "description": "SuperClaude Enterprise MCP Server"
            }' "$CLAUDE_CONFIG" > "$CLAUDE_CONFIG.tmp" && mv "$CLAUDE_CONFIG.tmp" "$CLAUDE_CONFIG"
            echo -e "${GREEN}✓ Updated Claude configuration with MCP server${NC}"
        else
            echo -e "${YELLOW}⚠️  jq not found. Please manually add MCP server to $CLAUDE_CONFIG${NC}"
            echo -e "${BLUE}Add this to your ~/.claude.json:${NC}"
            cat << EOF
{
  "mcpServers": {
    "superclaude-enterprise": {
      "command": "node",
      "args": ["$INSTALL_PATH/dist/mcp-server/index.js"],
      "description": "SuperClaude Enterprise MCP Server"
    }
  }
}
EOF
        fi
    else
        # Create new configuration
        echo -e "${BLUE}Creating new Claude configuration${NC}"
        cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "superclaude-enterprise": {
      "command": "node",
      "args": ["$INSTALL_PATH/dist/mcp-server/index.js"],
      "description": "SuperClaude Enterprise MCP Server"
    }
  }
}
EOF
        echo -e "${GREEN}✓ Created Claude configuration with MCP server${NC}"
    fi
    
    # Also create project-specific configuration if in a project directory
    if [ -d ".claude" ] || mkdir -p ".claude" 2>/dev/null; then
        cat > ".claude/settings.local.json" << EOF
{
  "mcpServers": {
    "superclaude-enterprise": {
      "command": "node",
      "args": ["$INSTALL_PATH/dist/mcp-server/index.js"],
      "description": "SuperClaude Enterprise MCP Server"
    }
  }
}
EOF
        echo -e "${GREEN}✓ Created project-specific MCP configuration${NC}"
    fi
    
    echo -e "${GREEN}✓ MCP configuration completed${NC}"
    return 0
}

# Run tests
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    
    if npm test; then
        echo -e "${GREEN}✓ All tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        return 1
    fi
}

# Print completion message
print_completion() {
    echo -e "\n${GREEN}✅ Installation completed successfully!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Restart Claude Desktop to load the MCP server"
    echo "2. You should see 'superclaude-enterprise' in your MCP servers list"
    echo "3. Try natural language commands like:"
    echo "   - '프로젝트의 보안 취약점을 분석해줘'"
    echo "   - 'analyze the performance of this codebase'"
    echo "   - 'implement a new authentication system'"
    echo ""
    echo -e "${YELLOW}For more information, see README.md${NC}"
}

# Main installation function
run_installation() {
    print_header
    
    if ! check_prerequisites; then
        echo -e "\n${RED}Installation failed: Prerequisites not met${NC}"
        return 1
    fi
    
    if ! install_npm_dependencies; then
        echo -e "\n${RED}Installation failed: npm dependencies${NC}"
        return 1
    fi
    
    if ! build_project; then
        echo -e "\n${RED}Installation failed: Build error${NC}"
        return 1
    fi
    
    if ! create_virtual_environment; then
        echo -e "\n${RED}Installation failed: Virtual environment${NC}"
        return 1
    fi
    
    if ! activate_virtual_environment; then
        echo -e "\n${RED}Installation failed: Virtual environment activation${NC}"
        return 1
    fi
    
    if ! check_superclaude_installation; then
        install_superclaude
    fi
    
    if ! setup_mcp_config; then
        echo -e "\n${YELLOW}⚠️  MCP configuration failed${NC}"
    fi
    
    # Run tests (optional)
    echo -n -e "\n${YELLOW}Do you want to run tests? (y/n): ${NC}"
    read -r test_response
    if [[ "$test_response" =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    print_completion
    return 0
}