import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedCommandParser } from '../utils/enhanced-command-parser.js';
import { GeminiStrategySelector } from '../integrations/gemini-cli/GeminiStrategySelector.js';
import { HybridModeDetector } from '../integrations/gemini-cli/HybridModeDetector.js';
import { SessionManager } from '../integrations/session/SessionManager.js';

describe('Full SuperClaude Integration Tests', () => {
  const parser = new EnhancedCommandParser();
  const selector = new GeminiStrategySelector();
  const hybridDetector = new HybridModeDetector();
  const sessionManager = SessionManager.getInstance();

  beforeEach(() => {
    SessionManager.resetInstance();
  });

  describe('Enhanced NLP', () => {
    it('Korean Security Analysis with Full Context', () => {
      const input = "SuperClaude를 사용해서 auth.js의 보안 취약점을 검사해줘";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.target).toBe('auth.js');
      expect(result.detectedIntent).toContain('security');
      expect(result.detectedIntent).toContain('vulnerability');
      expect(result.suggestedPersonas).toContain('security');
    });

    it('Complex Performance Analysis', () => {
      const input = "analyze strange memory leak in production environment";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.suggestedPersonas).toContain('analyzer');
      expect(result.suggestedPersonas).toContain('performance');
    });

    it('Repository Pattern Implementation', () => {
      const input = "implement user service following repository pattern";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('implement');
      expect(result.suggestedPersonas).toContain('backend');
      expect(result.suggestedPersonas).toContain('architect');
    });

    it('Full Command Building', () => {
      const input = "SuperClaude를 사용해서 auth.js의 보안 취약점을 검사해줘";
      const result = parser.parse(input);
      const fullCommand = parser.buildFullCommand(result);
      
      expect(fullCommand).toMatch(/^\/sc:analyze/);
      expect(fullCommand).toContain('--security');
      expect(fullCommand).toContain('--vulnerability');
      expect(fullCommand).toContain('auth.js');
    });
  });

  describe('Hybrid Mode Detection', () => {
    it('Detects pattern-based implementation', () => {
      const command = "implement user service following repository pattern";
      const context = {
        personas: ['backend', 'architect']
      };
      
      const result = hybridDetector.shouldUseHybrid(command, context);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.shouldUseHybrid).toBe(true);
    });

    it('Adaptive mode for complex tasks', () => {
      const command = "analyze comprehensive system architecture";
      const context = {
        personas: ['analyzer', 'architect']
      };
      
      const result = hybridDetector.shouldUseHybrid(command, context);
      expect(result.score).toBeLessThan(0.5);
      expect(result.shouldUseHybrid).toBe(false);
    });
  });

  describe('Session Continuity', () => {
    it('Maintains context across commands', async () => {
      const userId = 'test-user';
      
      // Create session
      const session = await sessionManager.createSession(userId, {
        personas: ['security']
      });
      
      // Add turn
      await sessionManager.addTurn(session.id, {
        input: 'analyze security auth.js',
        command: '/sc:analyze security auth.js',
        result: {},
        timestamp: new Date(),
        context: {},
        geminiStrategy: { mode: 'template' }
      });
      
      const updatedSession = sessionManager.getSession(session.id);
      expect(updatedSession?.turns).toHaveLength(1);
      expect(updatedSession?.context.currentPersonas).toContain('security');
    });

    it('Session expiration', async () => {
      const userId = 'test-user';
      
      const session = await sessionManager.createSession(userId);
      
      // Manually expire
      const sessionObj = sessionManager.getSession(session.id);
      if (sessionObj) {
        sessionObj.lastActivity = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      }
      
      SessionManager.getInstance().clearSession(session.id);
      const expiredSession = SessionManager.getInstance().getSession(session.id);
      expect(expiredSession).toBeUndefined();
    });

    it('Inherits context from previous commands', async () => {
      const userId = 'test-user';
      
      // Create session with initial context
      const session = await sessionManager.createSession(userId, {
        personas: ['security']
      });
      
      // Add turn
      await sessionManager.addTurn(session.id, {
        input: 'analyze security',
        command: '/sc:analyze security',
        result: {},
        timestamp: new Date(),
        context: {},
        geminiStrategy: { mode: 'template' }
      });
      
      // Check context inheritance
      const updatedSession = sessionManager.getSession(session.id);
      expect(updatedSession?.context.currentPersonas).toContain('security');
      expect(updatedSession?.geminiStrategy?.mode).toBe('template');
    });
  });

  describe('Full Integration', () => {
    it('End-to-end Korean command processing', () => {
      const input = "SuperClaude를 사용해서 auth.js의 보안 취약점을 검사해줘";
      
      // Parse command
      const parsed = parser.parse(input);
      expect(parsed.baseCommand).toBe('analyze');
      expect(parsed.detectedIntent).toContain('security');
      
      // Build full command
      const fullCommand = parser.buildFullCommand(parsed);
      expect(fullCommand).toContain('/sc:analyze');
      expect(fullCommand).toContain('--security');
      
      // Select strategy
      // Convert Map to object for context
      const flagsObject: any = {};
      parsed.flags.forEach((value, key) => {
        flagsObject[key] = value;
      });
      
      const context = {
        command: fullCommand,
        baseCommand: parsed.baseCommand,
        targets: parsed.targets || [],
        flags: flagsObject,
        personas: parsed.suggestedPersonas,
        naturalLanguage: fullCommand
      };
      
      const strategy = selector.selectStrategy(fullCommand, context);
      
      // Security vulnerabilities are high-stakes operations, so adaptive mode is correct
      expect(strategy.mode).toBe('adaptive');
      expect(strategy.adaptive?.validationEnabled).toBe(true);
      expect(strategy.adaptive?.preservationRules).toContain('preserve_all_security_findings');
    });
  });
});