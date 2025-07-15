# Claude Code Hooks Integration Guide

## Overview

SuperClaude Enterprise includes full support for Claude Code hooks, providing deterministic automation alongside AI-powered development. Hooks allow you to ensure critical tasks always execute at specific points in the development lifecycle.

## Hook Types

### 1. PreToolUse
**When**: Before Claude uses a tool (edit_file, bash, etc.)
**Purpose**: Input validation, dangerous command blocking, pre-conditions
**Control**: Can block tool execution with exit code 2

```json
{
  "PreToolUse": [{
    "matcher": {
      "tool_name": "bash",
      "query": "rm -rf"
    },
    "command": "echo 'BLOCKED: Dangerous command' >&2 && exit 2"
  }]
}
```

### 2. PostToolUse
**When**: After successful tool execution
**Purpose**: Auto-formatting, testing, logging, validation
**Control**: Runs after the fact, can't block

```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["*.py"]
    },
    "command": "black $CLAUDE_FILE_PATHS && pytest",
    "run_in_background": true
  }]
}
```

### 3. Notification
**When**: Claude sends notifications
**Purpose**: Custom alerts, logging, integrations
**Control**: Informational only

```json
{
  "Notification": [{
    "command": "notify-send 'Claude' '$CLAUDE_NOTIFICATION'"
  }]
}
```

### 4. Stop
**When**: Claude completes a response
**Purpose**: Completion validation, forced continuation
**Control**: Exit code 2 forces Claude to continue

```json
{
  "Stop": [{
    "command": "npm test || (echo 'Tests must pass' >&2 && exit 2)"
  }]
}
```

## Environment Variables

Hooks receive context through environment variables:

- `$CLAUDE_FILE_PATHS` - Space-separated list of affected files
- `$CLAUDE_TOOL_NAME` - Name of the tool being used
- `$CLAUDE_TOOL_INPUT` - Tool input (JSON string)
- `$CLAUDE_TOOL_RESPONSE` - Tool output (JSON string)
- `$CLAUDE_NOTIFICATION` - Notification message
- `$SUPERCLAUDE_PERSONAS` - Active personas (Enterprise specific)
- `$SUPERCLAUDE_COMMAND` - Current command (Enterprise specific)

## Configuration

### Configuration Files (Priority Order)

1. **User Global**: `~/.claude/settings.json`
2. **Project**: `.claude/settings.json`
3. **Local Project**: `.claude/settings.local.json` (git-ignored)

### Hook Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool_name": "edit_file",
          "file_paths": ["*.ts", "src/**/*.ts"],
          "query": "optional text to match"
        },
        "command": "prettier --check $CLAUDE_FILE_PATHS",
        "run_in_background": false,
        "timeout": 30000
      }
    ]
  }
}
```

## Enterprise Integration

### Persona-Based Hooks

Integrate with SuperClaude Enterprise's persona system:

```json
{
  "PreToolUse": [{
    "matcher": {
      "tool_name": "bash",
      "query": "--skip-validation"
    },
    "command": "superclaude-enterprise check-veto security --command \"$CLAUDE_TOOL_INPUT\""
  }]
}
```

### Conflict Resolution Hooks

Automatically check for persona conflicts:

```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["src/**/*.ts"]
    },
    "command": "superclaude-enterprise conflict-check --files \"$CLAUDE_FILE_PATHS\" --personas architect,performance"
  }]
}
```

## Common Patterns

### Auto-Formatting

**Python**:
```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["*.py"]
    },
    "command": "black $CLAUDE_FILE_PATHS && ruff check --fix $CLAUDE_FILE_PATHS"
  }]
}
```

**TypeScript/JavaScript**:
```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["*.ts", "*.tsx", "*.js", "*.jsx"]
    },
    "command": "prettier --write $CLAUDE_FILE_PATHS && eslint --fix $CLAUDE_FILE_PATHS"
  }]
}
```

### Security Enforcement

```json
{
  "PreToolUse": [
    {
      "matcher": {
        "tool_name": "edit_file",
        "file_paths": [".env", "*.key", "*.pem", "secrets/*"]
      },
      "command": "echo 'BLOCKED: Cannot modify sensitive files' >&2 && exit 2"
    },
    {
      "matcher": {
        "tool_name": "bash",
        "query": "curl"
      },
      "command": "echo \"Reviewing: $CLAUDE_TOOL_INPUT\" && read -p 'Allow? (y/n) ' -n 1 -r && [[ $REPLY =~ ^[Yy]$ ]]"
    }
  ]
}
```

### Auto-Testing

```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["*.test.ts", "*.spec.ts"]
    },
    "command": "npm test -- --findRelatedTests $CLAUDE_FILE_PATHS",
    "run_in_background": true
  }]
}
```

### Git Integration

```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file"
    },
    "command": "git add $CLAUDE_FILE_PATHS"
  }],
  "Stop": [{
    "command": "git diff --staged && echo 'Changes staged for commit'"
  }]
}
```

## Advanced Features

### Exit Codes

- **0**: Success, continue normally
- **1**: Failure, log but continue
- **2**: Special control:
  - PreToolUse: Block tool execution
  - Stop: Force continuation

### JSON Control

Return JSON for fine-grained control:

```bash
#!/bin/bash
# PreToolUse hook
if [[ "$CLAUDE_TOOL_INPUT" =~ dangerous ]]; then
  echo '{"decision": "block", "reason": "Dangerous operation detected"}'
  exit 2
fi
echo '{"decision": "approve"}'
```

### Background Execution

For long-running tasks:

```json
{
  "PostToolUse": [{
    "matcher": {
      "tool_name": "edit_file",
      "file_paths": ["src/**/*"]
    },
    "command": "npm run build",
    "run_in_background": true
  }]
}
```

## CLI Commands

### View Active Hooks
```bash
superclaude-enterprise hooks
```

### Test Veto Conditions
```bash
superclaude-enterprise check-veto security --command "rm -rf /"
```

### Check Conflicts
```bash
superclaude-enterprise conflict-check --files "api.ts db.ts" --personas "architect,performance"
```

## Example Configurations

### Development Environment

`.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool_name": "edit_file",
          "file_paths": ["*.ts", "*.tsx"]
        },
        "command": "prettier --write $CLAUDE_FILE_PATHS && eslint --fix $CLAUDE_FILE_PATHS"
      }
    ],
    "PreToolUse": [
      {
        "matcher": {
          "tool_name": "bash",
          "query": "npm publish"
        },
        "command": "echo 'Use npm publish --dry-run first' >&2 && exit 2"
      }
    ]
  }
}
```

### Production Environment

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool_name": "edit_file",
          "file_paths": ["*.sql", "migrations/*"]
        },
        "command": "echo 'Database changes require approval' >&2 && exit 2"
      }
    ],
    "PostToolUse": [
      {
        "matcher": {
          "tool_name": "bash"
        },
        "command": "echo \"$(date): $CLAUDE_TOOL_INPUT\" >> audit.log"
      }
    ]
  }
}
```

## Best Practices

1. **Start Simple**: Begin with formatting hooks, then add complexity
2. **Use Background**: Run tests and builds in background to avoid blocking
3. **Log Don't Block**: For monitoring, log instead of blocking
4. **Team Coordination**: Share project hooks, keep personal preferences local
5. **Performance**: Keep hooks fast (<3s) or use background execution
6. **Error Handling**: Always handle missing tools gracefully

```bash
# Good hook script
#!/bin/bash
command -v black >/dev/null 2>&1 || {
  echo "Black not installed, skipping format"
  exit 0
}
black $CLAUDE_FILE_PATHS || exit 1
```

## Troubleshooting

### Hooks Not Running

1. Check configuration files exist
2. Verify matcher conditions
3. Use `--debug` flag: `claude --debug`
4. Check file permissions on hook scripts

### Performance Issues

1. Use `run_in_background: true` for slow operations
2. Implement caching in hook scripts
3. Limit file pattern matching scope
4. Set appropriate timeouts

### Debugging

Enable debug logging:
```bash
export CLAUDE_DEBUG=1
claude
```

View hook execution:
```bash
superclaude-enterprise hooks
```

## Integration with SuperClaude

Hooks integrate seamlessly with SuperClaude's persona system:

1. **Veto Checks**: Security persona can veto dangerous operations
2. **Conflict Resolution**: Automatic persona conflict checking
3. **Learning Integration**: Hook results feed into learning engine
4. **Execution Levels**: Hooks respect execution level settings

This creates a powerful combination of AI assistance with deterministic safeguards.