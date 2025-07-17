#!/bin/bash

# SuperClaude Enterprise Extension Installer
# This script installs the enterprise extension for SuperClaude v3

set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source the installation functions
if [ -f "$SCRIPT_DIR/scripts/install-functions.sh" ]; then
    source "$SCRIPT_DIR/scripts/install-functions.sh"
else
    echo "Error: Installation functions not found at $SCRIPT_DIR/scripts/install-functions.sh"
    exit 1
fi

# Change to script directory
cd "$SCRIPT_DIR"

# Run the main installation
run_installation

# Exit with the installation result
exit $?