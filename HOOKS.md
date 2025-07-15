# Claude Code Hooks - Quick Reference

> For full documentation, see [docs/HOOKS.md](docs/HOOKS.md)

## Quick Start

### 1. View Active Hooks
```bash
superclaude-enterprise hooks
```

### 2. Default Configuration

The project includes pre-configured hooks in `.claude/settings.json`:

- **Security**: Blocks dangerous commands (rm -rf, sensitive files)
- **Auto-formatting**: Python (black, ruff) and TypeScript (prettier, eslint)
- **Conflict Resolution**: Checks architect/performance personas on file edits
- **Testing**: Runs tests on test file changes
- **Notifications**: Logs all Claude notifications

### 3. Hook Types

| Type | When | Purpose | Can Block? |
|------|------|---------|------------|
| PreToolUse | Before tool execution | Validation, blocking | Yes (exit 2) |
| PostToolUse | After tool execution | Formatting, testing | No |
| Notification | On notifications | Logging, alerts | No |
| Stop | Before stopping | Completion checks | Yes (exit 2) |

### 4. Environment Variables

- `$CLAUDE_FILE_PATHS` - Affected files (space-separated)
- `$CLAUDE_TOOL_NAME` - Tool being used
- `$CLAUDE_TOOL_INPUT` - Tool input
- `$SUPERCLAUDE_PERSONAS` - Active personas

### 5. Example: Python Auto-format

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

### 6. Example: Block Dangerous Commands

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

### 7. Configuration Files

1. `.claude/settings.json` - Project hooks (committed)
2. `.claude/settings.local.json` - Personal hooks (git-ignored)
3. `~/.claude/settings.json` - Global user hooks

### 8. Enterprise Integration

Check persona vetoes:
```bash
superclaude-enterprise check-veto security --command "rm -rf /"
```

Check conflicts:
```bash
superclaude-enterprise conflict-check --files "api.ts" --personas "architect,performance"
```

### 9. Hook Examples

See `.claude/hooks/` for examples:
- `python-project.json` - Python development hooks
- `typescript-project.json` - TypeScript/JavaScript hooks
- `security-focused.json` - Security enforcement
- `team-collaboration.json` - Team workflow hooks

### 10. Tips

- Use `run_in_background: true` for slow operations
- Exit code 2 blocks PreToolUse and forces continuation on Stop
- Keep hooks fast (<3s) or run in background
- Test hooks with `claude --debug`