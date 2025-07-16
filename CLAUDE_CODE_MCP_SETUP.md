# SuperClaude Enterprise MCP Server Setup for Claude Code

## Prerequisites
- Node.js 18+ installed
- Claude Code Desktop installed

## Installation Steps

1. **Clone and Build the Project**
```bash
cd /path/to/SuperClaude-Enterprise
npm install
npm run build
```

2. **Copy mcp.json to Claude Code Config**
Copy the following configuration to your Claude Code MCP servers config:

```json
{
  "superclaude-enterprise": {
    "command": "node",
    "args": ["/absolute/path/to/SuperClaude-Enterprise/dist/mcp-server/index.js"],
    "env": {}
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual absolute path to your SuperClaude-Enterprise directory.

3. **Restart Claude Code**
After adding the configuration, restart Claude Code for the changes to take effect.

## Usage

Once installed, you can use the following MCP tools in Claude Code:

### 1. Natural Language Command
Convert natural language (Korean/English) to SuperClaude commands:
- "보안 취약점을 검사해줘" → `analyze` with security persona
- "implement user authentication" → `implement` with backend persona
- "API 성능을 개선해줘" → `improve` with performance persona

### 2. Suggest Commands
Get command suggestions based on partial input:
- "anal" → suggests "analyze"
- "보안" → suggests security-related commands

### 3. Resolve Persona Conflicts
Automatically resolve conflicts when multiple personas are needed.

## Troubleshooting

### If MCP server shows as "failed" in Claude Code:

1. **Check Node.js version**:
```bash
node --version  # Should be 18.0.0 or higher
```

2. **Verify build was successful**:
```bash
ls -la dist/mcp-server/index.js  # File should exist
```

3. **Test MCP server directly**:
```bash
node test-mcp-full.cjs  # Should show successful communication
```

4. **Check logs**:
```bash
cat mcp-server.log  # Check for any error messages
```

5. **Enable health check** (optional):
Set `ENABLE_HEALTH_CHECK=true` in environment variables if you want health monitoring.

## Fixed Issues
- ✅ ESM/CommonJS module compatibility
- ✅ Removed console.error from health check (was interfering with MCP protocol)
- ✅ Added proper .js extensions to all imports
- ✅ Fixed Zod schema serialization to proper JSON schemas
- ✅ Made health check optional to prevent protocol interference