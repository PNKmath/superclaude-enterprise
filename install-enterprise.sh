#!/bin/bash

# SuperClaude Enterprise Extension Installer
# This script installs the enterprise extension for SuperClaude v3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SuperClaude Enterprise Extension Installer${NC}"
echo "================================================"

# Check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "   Please install Node.js 18 or higher from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
        echo "   Current version: $(node -v)"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ npm $(npm -v)${NC}"
    
    # Check git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git is not installed${NC}"
        echo "   Please install git from https://git-scm.com"
        exit 1
    fi
    echo -e "${GREEN}✓ git $(git --version | cut -d' ' -f3)${NC}"
}

# Clone SuperClaude if needed
setup_superclaude() {
    echo -e "\n${YELLOW}Setting up SuperClaude...${NC}"
    
    if [ -d "SuperClaude" ]; then
        echo -e "${GREEN}✓ SuperClaude directory exists${NC}"
        cd SuperClaude
        
        # Check if it's a git repository
        if [ -d ".git" ]; then
            echo "  Updating SuperClaude..."
            git pull origin main || true
        fi
        cd ..
    else
        echo "  Cloning SuperClaude v3..."
        git clone https://github.com/Shubhamsaboo/awesome-llm-apps.git SuperClaude-temp
        
        # Extract only SuperClaude v3 directory
        if [ -d "SuperClaude-temp/claude_extensions/SuperClaude" ]; then
            mv SuperClaude-temp/claude_extensions/SuperClaude ./SuperClaude
            rm -rf SuperClaude-temp
            echo -e "${GREEN}✓ SuperClaude v3 cloned successfully${NC}"
        else
            echo -e "${RED}❌ Could not find SuperClaude in repository${NC}"
            echo "   Please check the repository structure"
            rm -rf SuperClaude-temp
            exit 1
        fi
    fi
}

# Install dependencies
install_dependencies() {
    echo -e "\n${YELLOW}Installing dependencies...${NC}"
    
    # Install SuperClaude dependencies
    if [ -d "SuperClaude" ]; then
        echo "  Installing SuperClaude dependencies..."
        cd SuperClaude
        npm install --silent
        cd ..
    fi
    
    # Install Enterprise Extension dependencies
    echo "  Installing Enterprise Extension dependencies..."
    npm install --silent
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Build the extension
build_extension() {
    echo -e "\n${YELLOW}Building Enterprise Extension...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build completed${NC}"
}

# Setup configuration
setup_configuration() {
    echo -e "\n${YELLOW}Setting up configuration...${NC}"
    
    # Create config directory
    mkdir -p config
    
    # Copy default configuration if not exists
    if [ ! -f "config/enterprise.config.json" ]; then
        cp config/enterprise.config.default.json config/enterprise.config.json
        echo -e "${GREEN}✓ Configuration file created${NC}"
        echo "  Please edit config/enterprise.config.json to customize settings"
    else
        echo -e "${GREEN}✓ Configuration file already exists${NC}"
    fi
}

# Setup hooks
setup_hooks() {
    echo -e "\n${YELLOW}Setting up SuperClaude hooks...${NC}"
    
    if [ -f "scripts/setup-superclaude-hooks.sh" ]; then
        ./scripts/setup-superclaude-hooks.sh
    else
        echo -e "${YELLOW}⚠️  Hook setup script not found, skipping...${NC}"
    fi
}

# Create global command
setup_global_command() {
    echo -e "\n${YELLOW}Setting up global command...${NC}"
    
    # Create bin directory
    mkdir -p bin
    
    # Create executable
    cat > bin/superclaude-enterprise << 'EOF'
#!/usr/bin/env node
require('../dist/index.js');
EOF
    
    chmod +x bin/superclaude-enterprise
    
    # Link globally
    npm link
    
    echo -e "${GREEN}✓ Global command 'superclaude-enterprise' installed${NC}"
}

# Run tests
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    npm test
    echo -e "${GREEN}✓ All tests passed${NC}"
}

# Main installation flow
main() {
    echo -e "\n${BLUE}Starting installation...${NC}"
    
    check_prerequisites
    setup_superclaude
    install_dependencies
    build_extension
    setup_configuration
    setup_hooks
    setup_global_command
    run_tests
    
    echo -e "\n${GREEN}🎉 Installation completed successfully!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Edit config/enterprise.config.json to customize settings"
    echo "2. Run 'superclaude-enterprise test' to verify installation"
    echo "3. Use 'superclaude-enterprise --help' to see available commands"
    echo -e "\n${BLUE}Happy coding with SuperClaude Enterprise! 🚀${NC}"
}

# Run main installation
main "$@"