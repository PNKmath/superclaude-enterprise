/**
 * Test for SuperClaude flag filtering in Gemini integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegratedGeminiAdapter } from '../IntegratedGeminiAdapter.js';
import { CommandContext } from '../types.js';

// Mock execAsync
vi.mock('util', () => ({
  promisify: vi.fn(() => vi.fn(() => Promise.resolve({ stdout: 'mocked output', stderr: '' })))
}));

// Mock fs operations
vi.mock('fs/promises', () => ({
  default: {
    mkdtemp: vi.fn(() => Promise.resolve('/tmp/test')),
    writeFile: vi.fn(() => Promise.resolve()),
    rm: vi.fn(() => Promise.resolve())
  }
}));

describe('IntegratedGeminiAdapter Flag Filtering', () => {
  let adapter: IntegratedGeminiAdapter;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;

    adapter = new IntegratedGeminiAdapter(mockLogger, {
      enabled: true,
      autoRouting: true,
      costThreshold: 1000,
      quotaManagement: {
        dailyLimit: 10000,
        rateLimit: '100/minute'
      },
      strategy: {
        autoSelectMode: false,
        defaultMode: 'adaptive',
        validationThreshold: 0.8,
        maxRetries: 2
      }
    });
  });

  it('should filter SuperClaude-specific flags when building Gemini command', async () => {
    const context: CommandContext = {
      command: '/sc:analyze',
      targetFiles: ['test.ts'],
      flags: {
        // SuperClaude-specific flags that should be filtered
        uc: true,
        think: true,
        'think-hard': true,
        validate: true,
        'safe-mode': true,
        c7: true,
        seq: true,
        delegate: true,
        'wave-mode': true,
        'persona-backend': true,
        introspect: true,
        
        // Regular flags that should pass through
        verbose: true,
        json: true,
        output: 'report.md'
      },
      personas: ['backend', 'analyzer']
    };

    // Spy on buildGeminiCommand method
    const buildCommandSpy = vi.spyOn(adapter as any, 'buildGeminiCommand');
    
    try {
      await adapter.executeWithGemini('/sc:analyze test.ts', context);
    } catch (error) {
      // Expected to fail due to mocking, but we can check the spy
    }

    // Check that buildGeminiCommand was called
    expect(buildCommandSpy).toHaveBeenCalled();
    
    // Get the generated command
    const generatedCommand = buildCommandSpy.mock.results[0]?.value;
    
    // SuperClaude flags should NOT be in the command
    expect(generatedCommand).not.toContain('--uc');
    expect(generatedCommand).not.toContain('--think');
    expect(generatedCommand).not.toContain('--think-hard');
    expect(generatedCommand).not.toContain('--validate');
    expect(generatedCommand).not.toContain('--safe-mode');
    expect(generatedCommand).not.toContain('--c7');
    expect(generatedCommand).not.toContain('--seq');
    expect(generatedCommand).not.toContain('--delegate');
    expect(generatedCommand).not.toContain('--wave-mode');
    expect(generatedCommand).not.toContain('--persona-backend');
    expect(generatedCommand).not.toContain('--introspect');
    
    // Regular flags SHOULD be in the command
    expect(generatedCommand).toContain('--json');
    expect(generatedCommand).toContain('--output="report.md"');
    
    // Check that debug logging was called for filtered flags
    const debugCalls = mockLogger.debug.mock.calls;
    expect(debugCalls.some((call: any[]) => call[0].includes('--uc'))).toBe(true);
    expect(debugCalls.some((call: any[]) => call[0].includes('--think'))).toBe(true);
  });

  it('should filter --uc flag as it is handled by AI compression', async () => {
    const context: CommandContext = {
      command: '/sc:analyze',
      targetFiles: ['test.ts'],
      flags: {
        uc: true
      },
      personas: []
    };

    // Spy on buildGeminiCommand method
    const buildCommandSpy = vi.spyOn(adapter as any, 'buildGeminiCommand');
    
    try {
      await adapter.executeWithGemini('/sc:analyze test.ts', context);
    } catch (error) {
      // Expected to fail due to mocking
    }

    // Check that --uc flag is filtered out
    const generatedCommand = buildCommandSpy.mock.results[0]?.value;
    expect(generatedCommand).not.toContain('--uc');
    
    // Check that debug logging was called for filtered flag
    const debugCalls = mockLogger.debug.mock.calls;
    expect(debugCalls.some((call: any[]) => call[0].includes('--uc'))).toBe(true);
  });

  it('should handle all SuperClaude flag categories', async () => {
    const flagCategories = {
      compression: ['uc', 'ultracompressed', 'answer-only'],
      planning: ['plan', 'think', 'think-hard', 'ultrathink'],
      safety: ['validate', 'safe-mode'],
      mcp: ['c7', 'seq', 'magic', 'play', 'all-mcp', 'no-mcp'],
      orchestration: ['delegate', 'wave-mode', 'loop'],
      personas: ['persona-architect', 'persona-frontend', 'persona-backend'],
      other: ['introspect', 'hybrid-mode']
    };

    const context: CommandContext = {
      command: '/sc:analyze',
      targetFiles: ['test.ts'],
      flags: {},
      personas: []
    };

    // Add all flags
    Object.values(flagCategories).flat().forEach(flag => {
      context.flags![flag] = true;
    });

    const buildCommandSpy = vi.spyOn(adapter as any, 'buildGeminiCommand');
    
    try {
      await adapter.executeWithGemini('/sc:analyze test.ts', context);
    } catch (error) {
      // Expected to fail due to mocking
    }

    const generatedCommand = buildCommandSpy.mock.results[0]?.value;
    
    // None of the SuperClaude flags should be in the command
    Object.values(flagCategories).flat().forEach(flag => {
      expect(generatedCommand).not.toContain(`--${flag}`);
    });
  });
});