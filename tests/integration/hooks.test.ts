import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { HookManager, HookEvent, HookContext } from '../../src/extensions/hooks-v4/HookManager';
import { createLogger } from '../../src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Claude Code Hooks Integration', () => {
  let hookManager: HookManager;
  const testConfigDir = path.join(__dirname, '..', 'fixtures', '.claude');
  const testConfigPath = path.join(testConfigDir, 'settings.json');

  beforeAll(async () => {
    // Create test config directory
    await fs.mkdir(path.dirname(testConfigPath), { recursive: true });
  });

  beforeEach(async () => {
    // Ensure directory exists
    await fs.mkdir(testConfigDir, { recursive: true });
    
    const logger = createLogger('test-hooks');
    hookManager = new HookManager(logger);
    
    // Create test configuration
    const testConfig = {
      hooks: {
        PreToolUse: [
          {
            matcher: {
              tool_name: 'bash',
              query: 'dangerous'
            },
            command: 'echo "BLOCKED" >&2 && exit 2'
          },
          {
            matcher: {
              tool_name: 'edit_file',
              file_paths: ['*.secret']
            },
            command: 'echo "SENSITIVE" >&2 && exit 2'
          }
        ],
        PostToolUse: [
          {
            matcher: {
              tool_name: 'edit_file',
              file_paths: ['*.py']
            },
            command: 'echo "FORMATTED: $CLAUDE_FILE_PATHS"'
          },
          {
            matcher: {
              tool_name: 'edit_file',
              file_paths: ['*.test.ts']
            },
            command: 'echo "TESTING: $CLAUDE_FILE_PATHS"',
            run_in_background: true
          }
        ],
        Notification: [
          {
            command: 'echo "NOTIFIED: $CLAUDE_NOTIFICATION"'
          }
        ],
        Stop: [
          {
            command: 'test -f .stop-check || exit 2'
          }
        ]
      }
    };
    
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    // Override config path for testing
    (hookManager as any).configPath = testConfigPath;
    await hookManager.initialize();
  });

  afterEach(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true });
  });

  describe('Hook Loading', () => {
    it('should load hooks from configuration', async () => {
      const hooks = await hookManager.listHooks();
      
      // Hooks may be loaded from multiple sources, check minimum count
      expect(hooks.get(HookEvent.PRE_TOOL_USE)!.length).toBeGreaterThanOrEqual(2);
      expect(hooks.get(HookEvent.POST_TOOL_USE)!.length).toBeGreaterThanOrEqual(2);
      expect(hooks.get(HookEvent.NOTIFICATION)!.length).toBeGreaterThanOrEqual(1);
      expect(hooks.get(HookEvent.STOP)!.length).toBeGreaterThanOrEqual(1);
    });

    it('should report active hook count', async () => {
      const count = await hookManager.getActiveHooks();
      expect(count).toBeGreaterThanOrEqual(6); // At least 6 hooks
    });
  });

  describe('PreToolUse Hooks', () => {
    it('should block dangerous bash commands', async () => {
      const context: HookContext = {
        tool_name: 'bash',
        tool_input: 'rm -rf dangerous'
      };
      
      const result = await hookManager.shouldBlockTool(context);
      
      expect(result.block).toBe(true);
      expect(result.reason).toContain('BLOCKED');
    });

    it('should allow safe bash commands', async () => {
      const context: HookContext = {
        tool_name: 'bash',
        tool_input: 'ls -la'
      };
      
      const result = await hookManager.shouldBlockTool(context);
      
      expect(result.block).toBe(false);
    });

    it('should block sensitive file access', async () => {
      const context: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['config.secret', 'api.key']
      };
      
      const result = await hookManager.shouldBlockTool(context);
      
      expect(result.block).toBe(true);
      expect(result.reason).toContain('SENSITIVE');
    });
  });

  describe('PostToolUse Hooks', () => {
    it('should execute formatting hooks for Python files', async () => {
      const context: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['main.py', 'utils.py'],
        tool_response: { success: true }
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].exitCode).toBe(0);
      expect(results[0].stdout).toContain('FORMATTED: main.py utils.py');
    });

    it('should run background hooks without blocking', async () => {
      const context: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['hooks.test.ts'],
        tool_response: { success: true }
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].exitCode).toBe(0);
      expect(results[0].stdout).toBe('Hook started in background');
    });

    it('should pass environment variables correctly', async () => {
      const testHook = {
        matcher: { tool_name: 'test_tool' },
        command: 'echo "TOOL=$CLAUDE_TOOL_NAME FILES=$CLAUDE_FILE_PATHS"'
      };
      
      await hookManager.addHook(HookEvent.POST_TOOL_USE, testHook);
      
      const context: HookContext = {
        tool_name: 'test_tool',
        file_paths: ['a.txt', 'b.txt']
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      const addedResult = results.find(r => r.stdout.includes('TOOL=test_tool'));
      
      expect(addedResult).toBeDefined();
      expect(addedResult!.stdout).toContain('TOOL=test_tool');
      expect(addedResult!.stdout).toContain('FILES=a.txt b.txt');
    });
  });

  describe('Notification Hooks', () => {
    it('should execute notification hooks', async () => {
      const context: HookContext = {
        notification: 'Task completed successfully'
      };
      
      const results = await hookManager.executeHooks(HookEvent.NOTIFICATION, context);
      
      // May have duplicate hooks from multiple config sources
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].stdout).toContain('NOTIFIED: Task completed successfully');
    });
  });

  describe('Stop Hooks', () => {
    it('should force continuation when check fails', async () => {
      const context: HookContext = {
        command: 'test'
      };
      
      const result = await hookManager.shouldContinue(context);
      
      expect(result.continue).toBe(true);
      expect(result.reason).toContain('Continuation required');
    });

    it('should allow stopping when check passes', async () => {
      // Create the check file
      await fs.writeFile('.stop-check', '');
      
      const context: HookContext = {
        command: 'test'
      };
      
      const result = await hookManager.shouldContinue(context);
      
      expect(result.continue).toBe(false);
      
      // Clean up
      await fs.rm('.stop-check', { force: true });
    });
  });

  describe('Hook Matching', () => {
    it('should match glob patterns correctly', async () => {
      const testHook = {
        matcher: {
          tool_name: 'edit_file',
          file_paths: ['src/**/*.ts', '*.config.js']
        },
        command: 'echo "MATCHED"'
      };
      
      await hookManager.addHook(HookEvent.POST_TOOL_USE, testHook);
      
      // Should match
      const context1: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['src/components/Button.ts']
      };
      
      const results1 = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context1);
      expect(results1.some(r => r.stdout.includes('MATCHED'))).toBe(true);
      
      // Should also match
      const context2: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['webpack.config.js']
      };
      
      const results2 = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context2);
      expect(results2.some(r => r.stdout.includes('MATCHED'))).toBe(true);
      
      // Should not match
      const context3: HookContext = {
        tool_name: 'edit_file',
        file_paths: ['README.md']
      };
      
      const results3 = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context3);
      expect(results3.some(r => r.stdout.includes('MATCHED'))).toBe(false);
    });

    it('should match query strings in tool input', async () => {
      const context: HookContext = {
        tool_name: 'bash',
        tool_input: 'npm install dangerous-package'
      };
      
      const result = await hookManager.shouldBlockTool(context);
      
      expect(result.block).toBe(true);
    });
  });

  describe('Enterprise Integration', () => {
    it('should pass SuperClaude-specific environment variables', async () => {
      const testHook = {
        matcher: { tool_name: 'test' },
        command: 'echo "PERSONAS=$SUPERCLAUDE_PERSONAS CMD=$SUPERCLAUDE_COMMAND"'
      };
      
      await hookManager.addHook(HookEvent.POST_TOOL_USE, testHook);
      
      const context: HookContext = {
        tool_name: 'test',
        personas: ['security', 'architect'],
        command: '/sc:analyze'
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      const result = results.find(r => r.stdout.includes('PERSONAS='));
      
      expect(result).toBeDefined();
      expect(result!.stdout).toContain('PERSONAS=security,architect');
      expect(result!.stdout).toContain('CMD=/sc:analyze');
    });
  });

  describe('Error Handling', () => {
    it('should handle hook command failures gracefully', async () => {
      const testHook = {
        matcher: { tool_name: 'test' },
        command: 'exit 1'
      };
      
      await hookManager.addHook(HookEvent.POST_TOOL_USE, testHook);
      
      const context: HookContext = {
        tool_name: 'test'
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      const failedResult = results.find(r => r.exitCode === 1);
      
      expect(failedResult).toBeDefined();
      expect(failedResult!.exitCode).toBe(1);
    });

    it('should handle timeouts', async () => {
      const testHook = {
        matcher: { tool_name: 'test' },
        command: 'sleep 5',
        timeout: 100 // 100ms timeout
      };
      
      await hookManager.addHook(HookEvent.POST_TOOL_USE, testHook);
      
      const context: HookContext = {
        tool_name: 'test'
      };
      
      const results = await hookManager.executeHooks(HookEvent.POST_TOOL_USE, context);
      const timedOutResult = results.find(r => r.exitCode !== 0);
      
      expect(timedOutResult).toBeDefined();
      // Timeout may show as SIGTERM or command failed
      expect(timedOutResult!.stderr.length).toBeGreaterThan(0);
    });
  });
});