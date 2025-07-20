/**
 * Test for SuperClaude flag filtering in Gemini integration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { IntegratedGeminiAdapter } from '../IntegratedGeminiAdapter.js';
import { Logger } from 'pino';
import { CommandContext } from '../types.js';

// Mock execAsync
jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn().mockResolvedValue({ stdout: 'mocked output', stderr: '' }))
}));

// Mock fs operations
jest.mock('fs/promises', () => ({
  default: {
    mkdtemp: jest.fn().mockResolvedValue('/tmp/test'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('IntegratedGeminiAdapter Flag Filtering', () => {
  let adapter: IntegratedGeminiAdapter;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    adapter = new IntegratedGeminiAdapter(mockLogger, {
      costEstimation: {
        enabled: true,
        models: {
          claude: { pricePerToken: 0.01, maxTokens: 100000 },
          gemini: { pricePerToken: 0.001, maxTokens: 50000 }
        }
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
    const buildCommandSpy = jest.spyOn(adapter as any, 'buildGeminiCommand');
    
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
    expect(debugCalls.some(call => call[0].includes('--uc'))).toBe(true);
    expect(debugCalls.some(call => call[0].includes('--think'))).toBe(true);
  });

  it('should add compression instructions to prompt when --uc flag is present', async () => {
    const context: CommandContext = {
      command: '/sc:analyze',
      targetFiles: ['test.ts'],
      flags: {
        uc: true
      },
      personas: []
    };

    // Spy on buildAdaptivePrompt method
    const buildPromptSpy = jest.spyOn(adapter as any, 'buildAdaptivePrompt');
    
    try {
      await adapter.executeWithGemini('/sc:analyze test.ts', context);
    } catch (error) {
      // Expected to fail due to mocking
    }

    // Check that prompt includes compression instructions
    const promptLines = buildPromptSpy.mock.results[0]?.value;
    expect(promptLines).toContain('## Output Format: ULTRA-COMPRESSED');
    expect(promptLines).toContain('- Target 30-50% token reduction');
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

    const buildCommandSpy = jest.spyOn(adapter as any, 'buildGeminiCommand');
    
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