#!/bin/bash
# MCP Server Wrapper with Auto-Restart
# This ensures the MCP server stays running even after Claude Code restarts

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_SERVER="$PROJECT_ROOT/dist/mcp-server/index.js"
LOG_FILE="$PROJECT_ROOT/mcp-server.log"
MAX_RESTARTS=5
RESTART_COUNT=0
RESTART_DELAY=2

# Ensure the project is built
if [ ! -f "$MCP_SERVER" ]; then
    echo "Building project..." >&2
    cd "$PROJECT_ROOT"
    npm run build
fi

# Function to start the server
start_server() {
    echo "[$(date)] Starting MCP server (attempt $((RESTART_COUNT + 1))/$MAX_RESTARTS)..." >&2
    
    # Start the server
    exec node "$MCP_SERVER" 2>>"$LOG_FILE"
}

# Trap signals to ensure clean shutdown
trap 'echo "[$(date)] Received signal, shutting down..." >&2; exit 0' SIGINT SIGTERM

# Main loop with restart logic
while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    start_server
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date)] MCP server exited normally" >&2
        exit 0
    else
        RESTART_COUNT=$((RESTART_COUNT + 1))
        echo "[$(date)] MCP server crashed with exit code $EXIT_CODE" >&2
        
        if [ $RESTART_COUNT -lt $MAX_RESTARTS ]; then
            echo "[$(date)] Restarting in $RESTART_DELAY seconds..." >&2
            sleep $RESTART_DELAY
            # Exponential backoff
            RESTART_DELAY=$((RESTART_DELAY * 2))
        fi
    fi
done

echo "[$(date)] Max restart attempts reached. Exiting." >&2
exit 1