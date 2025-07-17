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

# Check jq installation
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ jq $(jq --version)${NC}"
    return 0
}

# Install jq
install_jq() {
    echo -e "\n${YELLOW}Installing jq (JSON processor)...${NC}"
    
    # Check if system package manager is locked
    check_system_lock() {
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Check for apt/dpkg lock
            if command -v apt-get &> /dev/null; then
                if sudo lsof /var/lib/dpkg/lock-frontend 2>/dev/null || \
                   sudo lsof /var/lib/apt/lists/lock 2>/dev/null || \
                   sudo lsof /var/cache/apt/archives/lock 2>/dev/null; then
                    echo -e "${RED}❌ System package manager is locked${NC}"
                    echo -e "${YELLOW}Another process is using apt/dpkg. Please wait or try:${NC}"
                    echo "  sudo killall apt apt-get dpkg"
                    echo "  Or wait for the other process to complete"
                    return 1
                fi
            fi
        fi
        return 0
    }
    
    # Try to install jq with various methods
    install_jq_binary() {
        echo -e "${YELLOW}Attempting to install jq from binary release...${NC}"
        
        # Detect architecture
        ARCH=$(uname -m)
        case $ARCH in
            x86_64) JQ_ARCH="amd64" ;;
            aarch64) JQ_ARCH="arm64" ;;
            arm*) JQ_ARCH="arm" ;;
            *) JQ_ARCH="amd64" ;;
        esac
        
        # Download jq binary directly
        JQ_VERSION="1.7.1"
        JQ_URL="https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/jq-linux-${JQ_ARCH}"
        
        echo -e "${BLUE}Downloading jq from: $JQ_URL${NC}"
        if curl -L -o /tmp/jq "$JQ_URL" 2>/dev/null || wget -O /tmp/jq "$JQ_URL" 2>/dev/null; then
            chmod +x /tmp/jq
            # Try to move to system location, fall back to user location
            if sudo mv /tmp/jq /usr/local/bin/jq 2>/dev/null; then
                echo -e "${GREEN}✓ jq installed to /usr/local/bin/jq${NC}"
                return 0
            elif mkdir -p "$HOME/.local/bin" && mv /tmp/jq "$HOME/.local/bin/jq"; then
                echo -e "${GREEN}✓ jq installed to ~/.local/bin/jq${NC}"
                echo -e "${YELLOW}Make sure ~/.local/bin is in your PATH${NC}"
                export PATH="$HOME/.local/bin:$PATH"
                return 0
            fi
        fi
        
        return 1
    }
    
    # First check if system is locked
    if ! check_system_lock; then
        echo -e "${YELLOW}Trying alternative installation method...${NC}"
        if install_jq_binary; then
            return 0
        fi
    fi
    
    # Try system package manager
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            echo -e "${YELLOW}Installing jq using apt...${NC}"
            if sudo apt-get update && sudo apt-get install -y jq 2>/dev/null; then
                echo -e "${GREEN}✓ jq installed successfully${NC}"
                return 0
            else
                echo -e "${YELLOW}apt install failed, trying binary installation...${NC}"
                if install_jq_binary; then
                    return 0
                fi
            fi
        elif command -v yum &> /dev/null; then
            # RHEL/CentOS
            echo -e "${YELLOW}Installing jq using yum...${NC}"
            if sudo yum install -y jq 2>/dev/null; then
                echo -e "${GREEN}✓ jq installed successfully${NC}"
                return 0
            fi
        elif command -v pacman &> /dev/null; then
            # Arch Linux
            echo -e "${YELLOW}Installing jq using pacman...${NC}"
            if sudo pacman -S --noconfirm jq 2>/dev/null; then
                echo -e "${GREEN}✓ jq installed successfully${NC}"
                return 0
            fi
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo -e "${YELLOW}Installing jq using Homebrew...${NC}"
            if brew install jq 2>/dev/null; then
                echo -e "${GREEN}✓ jq installed successfully${NC}"
                return 0
            fi
        fi
    fi
    
    # If all methods failed
    echo -e "${RED}❌ Could not install jq automatically${NC}"
    echo -e "${YELLOW}But don't worry! We'll use Python for JSON processing instead.${NC}"
    echo -e "${BLUE}jq is optional - the installation will continue without it.${NC}"
    return 1
}

# Check all prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    local all_ok=true
    
    check_nodejs || all_ok=false
    check_npm || all_ok=false
    check_python || all_ok=false
    check_git || all_ok=false
    
    # Check for uv (optional but recommended)
    if ! check_uv; then
        echo -n "Would you like to install uv package manager? (recommended) (y/n): "
        read -r uv_response
        if [[ "$uv_response" =~ ^[Yy]$ ]]; then
            install_uv
        else
            echo -e "${YELLOW}Proceeding without uv (will use pip instead)${NC}"
        fi
    fi
    
    # Check for jq (needed for JSON processing)
    if ! check_jq; then
        echo -n "Would you like to install jq? (needed for automatic MCP configuration) (y/n): "
        read -r jq_response
        if [[ "$jq_response" =~ ^[Yy]$ ]]; then
            install_jq
        else
            echo -e "${YELLOW}Proceeding without jq (will use Python for JSON processing)${NC}"
        fi
    fi
    
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

# Note: Virtual environment functions removed - SuperClaude uses system Python

# Check uv package manager installation
check_uv() {
    if ! command -v uv &> /dev/null; then
        echo -e "${YELLOW}⚠️  uv package manager not found${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ uv $(uv --version 2>/dev/null | cut -d' ' -f2)${NC}"
    return 0
}

# Install uv package manager
install_uv() {
    echo -e "\n${YELLOW}Installing uv package manager...${NC}"
    echo -e "${BLUE}uv is a fast Python package manager recommended for SuperClaude${NC}"
    echo -e "${BLUE}It provides better caching and performance than pip${NC}"
    
    # Install uv using the official installer (same as SuperClaude guide)
    if curl -Ls https://astral.sh/uv/install.sh | sh; then
        echo -e "${GREEN}✓ uv installed successfully${NC}"
        
        # Add uv to PATH for current session
        export PATH="$HOME/.cargo/bin:$PATH"
        
        # Verify installation
        if command -v uv &> /dev/null; then
            echo -e "${GREEN}✓ uv is now available in PATH${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  uv installed but not in PATH. Please restart your terminal or run:${NC}"
            echo -e "${BLUE}export PATH=\"\$HOME/.cargo/bin:\$PATH\"${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to install uv${NC}"
        echo -e "${YELLOW}You can install it manually from: https://github.com/astral-sh/uv${NC}"
        return 1
    fi
}

# Check SuperClaude installation
check_superclaude_installation() {
    echo -e "\n${YELLOW}Checking for SuperClaude installation...${NC}"
    
    # Check if SuperClaude is installed as a Python package
    if python3 -c "import SuperClaude" 2>/dev/null; then
        echo -e "${GREEN}✓ SuperClaude is already installed${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}⚠️  SuperClaude not found${NC}"
    return 1
}

# Install SuperClaude
install_superclaude() {
    echo -e "\n${YELLOW}Installing SuperClaude...${NC}"
    echo -e "${BLUE}This will install SuperClaude from PyPI${NC}"
    
    # Check if we're in a virtual environment
    if [ -z "$VIRTUAL_ENV" ]; then
        echo -e "\n${YELLOW}You are not in a virtual environment.${NC}"
        echo -e "${BLUE}SuperClaude recommends using a virtual environment.${NC}"
        echo -e "\nWould you like to:"
        echo "1. Create and use a virtual environment (recommended)"
        echo "2. Install system-wide (requires --system flag)"
        echo "3. Skip installation"
        echo -n "Enter your choice (1-3) [1]: "
        read -r venv_choice
        
        case "${venv_choice:-1}" in
            1)
                echo -e "\n${YELLOW}Creating virtual environment...${NC}"
                if command -v uv &> /dev/null; then
                    # Use uv to create venv (faster)
                    if uv venv; then
                        echo -e "${GREEN}✓ Virtual environment created with uv${NC}"
                        echo -e "${YELLOW}Activating virtual environment...${NC}"
                        source .venv/bin/activate
                        echo -e "${GREEN}✓ Virtual environment activated${NC}"
                    else
                        echo -e "${RED}❌ Failed to create virtual environment with uv${NC}"
                        return 1
                    fi
                else
                    # Fallback to standard venv
                    if python3 -m venv .venv; then
                        echo -e "${GREEN}✓ Virtual environment created${NC}"
                        echo -e "${YELLOW}Activating virtual environment...${NC}"
                        source .venv/bin/activate
                        echo -e "${GREEN}✓ Virtual environment activated${NC}"
                    else
                        echo -e "${RED}❌ Failed to create virtual environment${NC}"
                        return 1
                    fi
                fi
                ;;
            2)
                echo -e "\n${YELLOW}Proceeding with system-wide installation...${NC}"
                ;;
            3)
                echo -e "${RED}❌ CRITICAL: SuperClaude installation skipped!${NC}"
                echo -e "${RED}   The MCP server cannot function without SuperClaude.${NC}"
                echo -e "${RED}   Please run the installer again and install SuperClaude.${NC}"
                return 1
                ;;
            *)
                echo -e "${YELLOW}Invalid choice. Using default (create virtual environment)...${NC}"
                # Recursively call to handle option 1
                install_superclaude
                return $?
                ;;
        esac
    else
        echo -e "${GREEN}✓ Already in virtual environment: $VIRTUAL_ENV${NC}"
    fi
    
    # Check if uv is available, install if not
    if ! command -v uv &> /dev/null; then
        echo -e "${YELLOW}uv not found. Installing uv first...${NC}"
        if ! install_uv; then
            echo -e "${RED}❌ Failed to install uv. Falling back to pip...${NC}"
        else
            # Update PATH for current session
            export PATH="$HOME/.cargo/bin:$PATH"
        fi
    fi
    
    # Try uv first (handles externally-managed-environment)
    if command -v uv &> /dev/null; then
        echo -e "${YELLOW}Installing SuperClaude using uv...${NC}"
        # Check if we're in a virtual environment
        if [ -n "$VIRTUAL_ENV" ]; then
            # In venv, install normally
            UV_INSTALL_CMD="uv pip install SuperClaude"
        else
            # Not in venv, use --system flag
            UV_INSTALL_CMD="uv pip install --system SuperClaude"
        fi
        
        echo -e "${BLUE}Running: $UV_INSTALL_CMD${NC}"
        if $UV_INSTALL_CMD; then
            echo -e "${GREEN}✓ SuperClaude package installed successfully${NC}"
            
            # Get the installation path
            SUPERCLAUDE_LOCATION=$(uv pip show SuperClaude 2>/dev/null | grep Location | cut -d' ' -f2)
            if [ -n "$SUPERCLAUDE_LOCATION" ]; then
                echo -e "${BLUE}SuperClaude installed at: $SUPERCLAUDE_LOCATION${NC}"
                
                # Find the actual superclaude executable
                SUPERCLAUDE_BIN=""
                for dir in "$SUPERCLAUDE_LOCATION/../Scripts" "$SUPERCLAUDE_LOCATION/../bin" "$HOME/.local/bin"; do
                    if [ -f "$dir/superclaude" ]; then
                        SUPERCLAUDE_BIN="$dir/superclaude"
                        break
                    fi
                done
                
                if [ -n "$SUPERCLAUDE_BIN" ]; then
                    echo -e "${GREEN}✓ SuperClaude executable found at: $SUPERCLAUDE_BIN${NC}"
                    export SUPERCLAUDE_COMMAND="$SUPERCLAUDE_BIN"
                else
                    echo -e "${YELLOW}⚠ SuperClaude executable not found in standard locations${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ Failed to install SuperClaude with uv${NC}"
            echo -e "${YELLOW}Trying alternative methods...${NC}"
            
            # Try with --break-system-packages as last resort
            if pip install SuperClaude --break-system-packages 2>/dev/null; then
                echo -e "${GREEN}✓ SuperClaude installed with pip (break-system-packages)${NC}"
            else
                echo -e "${RED}❌ Failed to install SuperClaude${NC}"
                return 1
            fi
        fi
    else
        # Fallback to pip with appropriate flags
        echo -e "${YELLOW}Installing SuperClaude using pip...${NC}"
        
        # Check if environment is externally managed
        if pip install --dry-run SuperClaude 2>&1 | grep -q "externally-managed-environment"; then
            echo -e "${YELLOW}Detected externally-managed Python environment${NC}"
            echo -e "${YELLOW}Using --break-system-packages flag...${NC}"
            
            if pip install SuperClaude --break-system-packages; then
                echo -e "${GREEN}✓ SuperClaude package installed successfully${NC}"
            else
                echo -e "${RED}❌ Failed to install SuperClaude${NC}"
                echo -e "${YELLOW}Please consider using a virtual environment or pipx${NC}"
                return 1
            fi
        else
            if pip install SuperClaude; then
                echo -e "${GREEN}✓ SuperClaude package installed successfully${NC}"
            else
                echo -e "${RED}❌ Failed to install SuperClaude${NC}"
                return 1
            fi
        fi
    fi
    
    # Find the correct way to run SuperClaude
    SUPERCLAUDE_CMD=""
    
    # First, check if we have the executable path from uv installation
    if [ -n "$SUPERCLAUDE_COMMAND" ] && [ -x "$SUPERCLAUDE_COMMAND" ]; then
        SUPERCLAUDE_CMD="$SUPERCLAUDE_COMMAND"
    # Check if superclaude is in PATH
    elif command -v superclaude &> /dev/null; then
        SUPERCLAUDE_CMD="superclaude"
    # Try common installation locations
    elif [ -x "$HOME/.local/bin/superclaude" ]; then
        SUPERCLAUDE_CMD="$HOME/.local/bin/superclaude"
    # Try Python module execution
    elif python3 -c "import SuperClaude" 2>/dev/null; then
        SUPERCLAUDE_CMD="python3 -m SuperClaude"
    else
        echo -e "${RED}❌ Cannot find SuperClaude executable${NC}"
        echo -e "${YELLOW}Please ensure SuperClaude is properly installed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Using SuperClaude command: $SUPERCLAUDE_CMD${NC}"
    
    # Run SuperClaude installer
    echo -e "\n${YELLOW}Running SuperClaude configuration...${NC}"
    echo -e "${BLUE}Choose your installation profile:${NC}"
    echo "1. Quick setup (recommended)"
    echo "2. Interactive selection"
    echo "3. Minimal install"
    echo "4. Developer setup"
    echo -n "Enter your choice (1-4) [1]: "
    read -r install_choice
    
    # Default to quick setup if no choice or invalid choice
    case "$install_choice" in
        2)
            echo -e "${YELLOW}Running interactive installation...${NC}"
            if $SUPERCLAUDE_CMD install --interactive; then
                echo -e "${GREEN}✓ SuperClaude configuration completed${NC}"
            else
                echo -e "${RED}❌ SuperClaude configuration failed${NC}"
                return 1
            fi
            ;;
        3)
            echo -e "${YELLOW}Running minimal installation...${NC}"
            if $SUPERCLAUDE_CMD install --minimal; then
                echo -e "${GREEN}✓ SuperClaude configuration completed${NC}"
            else
                echo -e "${RED}❌ SuperClaude configuration failed${NC}"
                return 1
            fi
            ;;
        4)
            echo -e "${YELLOW}Running developer installation...${NC}"
            if $SUPERCLAUDE_CMD install --profile developer; then
                echo -e "${GREEN}✓ SuperClaude configuration completed${NC}"
            else
                echo -e "${RED}❌ SuperClaude configuration failed${NC}"
                return 1
            fi
            ;;
        *)
            echo -e "${YELLOW}Running quick setup...${NC}"
            if $SUPERCLAUDE_CMD install; then
                echo -e "${GREEN}✓ SuperClaude configuration completed${NC}"
            else
                echo -e "${RED}❌ SuperClaude configuration failed${NC}"
                return 1
            fi
            ;;
    esac
    
    # Store the command for MCP configuration
    export SUPERCLAUDE_COMMAND="$SUPERCLAUDE_CMD"
    
    # Verify SuperClaude installation
    if ! python3 -c "import SuperClaude" 2>/dev/null; then
        echo -e "\n${RED}❌ CRITICAL ERROR: SuperClaude installation verification failed!${NC}"
        echo -e "${RED}   SuperClaude module is not accessible.${NC}"
        echo -e "${RED}   This is a fatal error that will prevent the MCP server from working.${NC}"
        echo -e "${YELLOW}   Troubleshooting steps:${NC}"
        echo -e "   1. Check Python installation: python3 --version"
        echo -e "   2. Check pip installation: pip --version"
        echo -e "   3. Try manual installation: pip install SuperClaude"
        echo -e "   4. Check for error messages above"
        return 1
    fi
    
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
            # Use Python as fallback for JSON processing
            echo -e "${YELLOW}Using Python for JSON processing...${NC}"
            
            # Create Python script to update JSON
            python3 << PYTHON_SCRIPT
import json
import sys

config_path = "$CLAUDE_CONFIG"
install_path = "$INSTALL_PATH"

try:
    # Read existing config
    with open(config_path, 'r') as f:
        config = json.load(f)
except:
    config = {}

# Ensure mcpServers exists
if 'mcpServers' not in config:
    config['mcpServers'] = {}

# Add or update superclaude-enterprise
config['mcpServers']['superclaude-enterprise'] = {
    'command': 'node',
    'args': [install_path + '/dist/mcp-server/index.js'],
    'description': 'SuperClaude Enterprise MCP Server'
}

# Write updated config
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✓ Updated Claude configuration with MCP server")
PYTHON_SCRIPT
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Successfully updated configuration using Python${NC}"
            else
                echo -e "${RED}❌ CRITICAL ERROR: Failed to update MCP configuration!${NC}"
                echo -e "${RED}   The MCP server will not be available in Claude Code.${NC}"
                echo -e "${YELLOW}   Manual configuration required:${NC}"
                echo -e "${BLUE}   Add this to your ~/.claude.json:${NC}"
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
        fi
    else
        # Create new configuration
        echo -e "${BLUE}Creating new Claude configuration${NC}"
        
        # Try to use Python to create properly formatted JSON
        if command -v python3 &> /dev/null; then
            python3 << PYTHON_SCRIPT
import json

config_path = "$CLAUDE_CONFIG"
install_path = "$INSTALL_PATH"

config = {
    'mcpServers': {
        'superclaude-enterprise': {
            'command': 'node',
            'args': [install_path + '/dist/mcp-server/index.js'],
            'description': 'SuperClaude Enterprise MCP Server'
        }
    }
}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✓ Created Claude configuration with MCP server")
PYTHON_SCRIPT
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Successfully created configuration${NC}"
            else
                # Fallback to cat if Python fails
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
        fi
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
    
    # Verify MCP configuration
    if [ -f "$CLAUDE_CONFIG" ]; then
        if grep -q "superclaude-enterprise" "$CLAUDE_CONFIG" 2>/dev/null; then
            echo -e "${GREEN}✓ MCP configuration completed and verified${NC}"
            return 0
        else
            echo -e "${RED}❌ WARNING: MCP configuration may have failed!${NC}"
            echo -e "${RED}   Could not find 'superclaude-enterprise' in configuration.${NC}"
            echo -e "${YELLOW}   Please verify your ~/.claude.json file contains the MCP server.${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ ERROR: Configuration file not created!${NC}"
        echo -e "${RED}   Expected file: $CLAUDE_CONFIG${NC}"
        return 1
    fi
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
    echo "3. SuperClaude is now available! You can use commands like:"
    echo "   - '프로젝트의 보안 취약점을 분석해줘'"
    echo "   - 'analyze the performance of this codebase'"
    echo "   - 'implement a new authentication system'"
    echo ""
    echo "4. The MCP server integration allows natural language commands"
    echo ""
    echo -e "${YELLOW}For more information, see README.md${NC}"
}

# Print failure message
print_failure() {
    echo -e "\n${RED}❌ ❌ ❌ INSTALLATION FAILED! ❌ ❌ ❌${NC}"
    echo -e "${RED}Critical components were not installed properly.${NC}"
    echo -e "\n${YELLOW}Common issues and solutions:${NC}"
    echo "1. Python version: Ensure Python 3.8+ is installed"
    echo "2. Permissions: You may need sudo for some operations"
    echo "3. Network: Check internet connection for package downloads"
    echo "4. Dependencies: Install missing dependencies manually"
    echo -e "\n${YELLOW}For help, please check:${NC}"
    echo "- Installation logs above for specific errors"
    echo "- README.md for detailed instructions"
    echo "- GitHub issues for known problems"
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
    
    # Skip virtual environment creation - use system Python for SuperClaude
    echo -e "\n${BLUE}Note: SuperClaude will be installed in your system Python environment${NC}"
    
    # SuperClaude installation is CRITICAL
    local superclaude_installed=false
    if ! check_superclaude_installation; then
        if install_superclaude; then
            superclaude_installed=true
        else
            echo -e "\n${RED}❌ CRITICAL FAILURE: SuperClaude installation failed!${NC}"
            echo -e "${RED}   The installation cannot continue without SuperClaude.${NC}"
            echo -e "${RED}   The MCP server will not function.${NC}"
            echo -e "\n${YELLOW}Please try the following:${NC}"
            echo -e "   1. Run: pip install SuperClaude"
            echo -e "   2. Or with uv: uv pip install SuperClaude"
            echo -e "   3. Then run this installer again"
            return 1
        fi
    else
        superclaude_installed=true
    fi
    
    # MCP configuration is also CRITICAL
    if [ "$superclaude_installed" = true ]; then
        if ! setup_mcp_config; then
            echo -e "\n${RED}❌ CRITICAL FAILURE: MCP configuration failed!${NC}"
            echo -e "${RED}   Claude Code will not be able to use the SuperClaude MCP server.${NC}"
            echo -e "${RED}   Natural language commands will not work.${NC}"
            echo -e "\n${YELLOW}Manual configuration required - see instructions above.${NC}"
            return 1
        fi
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

# Exit handler for critical failures
trap 'if [ $? -ne 0 ]; then print_failure; fi' EXIT