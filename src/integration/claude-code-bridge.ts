/**
 * Claude Code Bridge Module
 * Converts natural language commands to Claude Code compatible commands
 * Now uses enhanced context-preserving capabilities
 */

// Re-export the enhanced version as the default implementation
export * from './enhanced-claude-code-bridge.js';
export { ClaudeCodeBridge } from './enhanced-claude-code-bridge.js';