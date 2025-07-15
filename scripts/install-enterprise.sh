#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         SuperClaude Enterprise Extension Installer         ║"
echo "║                     Version 1.0.0                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Installation directory
INSTALL_DIR="$HOME/.claude/enterprise"
SUPERCLAUDE_DIR="./SuperClaude"
CURRENT_DIR=$(pwd)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

version_ge() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Step 1: Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! check_command node; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    node_version=$(node -v | cut -d'v' -f2)
    if ! version_ge "$node_version" "18.0.0"; then
        log_error "Node.js 18+ required. Current version: $node_version"
        exit 1
    fi
    log_success "Node.js $node_version ✓"
    
    # Check Git
    if ! check_command git; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    log_success "Git ✓"
    
    # Check Python (for SuperClaude)
    if ! check_command python3; then
        log_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    log_success "Python 3 ✓"
    
    # Check npm
    if ! check_command npm; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    log_success "npm ✓"
    
    # Check Claude CLI
    if ! check_command claude; then
        log_warning "Claude CLI not found. Make sure Claude Code is installed and in PATH."
        echo "Visit https://claude.ai/code for installation instructions."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Claude CLI ✓"
    fi
}

# Step 2: Clone or update SuperClaude
setup_superclaude() {
    log_info "Setting up SuperClaude..."
    
    if [ -d "$SUPERCLAUDE_DIR" ]; then
        log_info "SuperClaude directory exists. Updating..."
        cd "$SUPERCLAUDE_DIR"
        git pull origin main || log_warning "Could not update SuperClaude"
        cd "$CURRENT_DIR"
    else
        log_info "Cloning SuperClaude..."
        git clone https://github.com/NomenAK/SuperClaude.git "$SUPERCLAUDE_DIR"
    fi
    
    # Install SuperClaude
    cd "$SUPERCLAUDE_DIR"
    if [ -f "SuperClaude.py" ]; then
        log_info "Installing SuperClaude..."
        python3 SuperClaude.py install --quick || {
            log_error "SuperClaude installation failed"
            exit 1
        }
    else
        log_error "SuperClaude.py not found!"
        exit 1
    fi
    cd "$CURRENT_DIR"
    
    log_success "SuperClaude installed ✓"
}

# Step 3: Install Enterprise Extensions
install_extensions() {
    log_info "Installing Enterprise Extensions..."
    
    # Install npm dependencies
    log_info "Installing npm dependencies..."
    npm install || {
        log_error "npm install failed"
        exit 1
    }
    
    # Build TypeScript
    log_info "Building TypeScript..."
    npm run build || {
        log_error "TypeScript build failed"
        exit 1
    }
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    
    # Copy built files
    log_info "Copying files to $INSTALL_DIR..."
    cp -r dist/* "$INSTALL_DIR/"
    cp -r config "$INSTALL_DIR/"
    cp package.json "$INSTALL_DIR/"
    
    log_success "Extensions installed ✓"
}

# Step 4: Configure integrations
configure_integrations() {
    log_info "Configuring integrations..."
    
    # Check for Gemini CLI
    if check_command gemini; then
        log_success "Gemini CLI detected ✓"
        log_info "Configuring Gemini integration..."
        node scripts/setup-gemini.js || log_warning "Gemini setup encountered issues"
    else
        log_warning "Gemini CLI not found. Gemini integration will be disabled."
        log_info "You can install Gemini CLI later from: https://github.com/google/generative-ai-python"
    fi
    
    # Setup Git hooks
    log_info "Installing Git hooks..."
    if [ -d ".git" ]; then
        node scripts/install-hooks.js || log_warning "Git hooks installation failed"
    else
        log_warning "Not in a git repository. Skipping git hooks."
    fi
    
    # Initialize configuration
    log_info "Initializing configuration..."
    if [ ! -f "$HOME/.claude/enterprise/config/config.yaml" ]; then
        mkdir -p "$HOME/.claude/enterprise/config"
        cp config/default.yaml "$HOME/.claude/enterprise/config/config.yaml"
    fi
    
    log_success "Integrations configured ✓"
}

# Step 5: Create CLI symlink
setup_cli() {
    log_info "Setting up CLI..."
    
    # Create bin directory if not exists
    mkdir -p "$HOME/.local/bin"
    
    # Create executable script
    cat > "$HOME/.local/bin/sc-enterprise" << 'EOF'
#!/bin/bash
node "$HOME/.claude/enterprise/index.js" "$@"
EOF
    
    chmod +x "$HOME/.local/bin/sc-enterprise"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        log_warning "~/.local/bin is not in your PATH"
        echo "Add the following line to your shell configuration file (.bashrc, .zshrc, etc.):"
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
    
    log_success "CLI setup complete ✓"
}

# Step 6: Run health check
run_health_check() {
    log_info "Running health check..."
    
    node scripts/health-check.js || log_warning "Health check reported issues"
}

# Step 7: Show next steps
show_next_steps() {
    echo
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}       SuperClaude Enterprise Installation Complete!        ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo
    echo "🚀 Quick Start:"
    echo "   1. Add ~/.local/bin to your PATH (if not already done)"
    echo "   2. Restart your terminal or run: source ~/.bashrc"
    echo "   3. Test installation: sc-enterprise status"
    echo
    echo "📚 Basic Usage:"
    echo "   • Run SuperClaude command: sc-enterprise run '/sc:analyze file.js'"
    echo "   • Test conflict resolution: sc-enterprise test-conflict -p security,performance"
    echo "   • Quick security scan: sc-enterprise quick security-scan"
    echo "   • View insights: sc-enterprise insights"
    echo
    echo "⚙️  Configuration:"
    echo "   • View config: sc-enterprise config --show"
    echo "   • Edit config: sc-enterprise config --edit"
    echo
    echo "📖 Documentation: $CURRENT_DIR/docs/"
    echo "🐛 Issues: https://github.com/your-org/superclaude-enterprise/issues"
    echo
}

# Main installation flow
main() {
    echo "Starting SuperClaude Enterprise installation..."
    echo
    
    check_prerequisites
    echo
    
    setup_superclaude
    echo
    
    install_extensions
    echo
    
    configure_integrations
    echo
    
    setup_cli
    echo
    
    run_health_check
    echo
    
    show_next_steps
}

# Run main installation
main "$@"