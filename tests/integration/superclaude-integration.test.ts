import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { ExtensionManager } from '../../src/extensions/core/ExtensionManager';
import { loadConfig } from '../../src/utils/config';
import * as path from 'path';
import * as fs from 'fs';

describe('SuperClaude Integration', () => {
  let manager: ExtensionManager;
  let config: any;

  beforeAll(async () => {
    config = await loadConfig();
    manager = new ExtensionManager(config);
  });

  describe('Hook Integration', () => {
    it('should process pre-command hook', async () => {
      const command = '/sc:analyze --security';
      const context = {
        personas: ['security', 'performance'],
        environment: 'production'
      };

      const result = await manager.processCommand(command, context);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should handle backend selection', async () => {
      const context = {
        targetFiles: Array(20).fill('file.js'), // Many files
        estimatedSize: '500KB'
      };

      const backend = await manager.selectBackend(context);
      
      expect(backend).toBeDefined();
      expect(['claude', 'gemini']).toContain(backend.backend);
      expect(backend.reason).toBeDefined();
    });

    it('should process post-command learning', async () => {
      const result = {
        success: true,
        personas: ['security'],
        resolutionTime: 45,
        conflicts: []
      };

      const context = {
        command: '/sc:test',
        environment: 'test'
      };

      await manager.learn({ result, context });
      
      // Verify learning was processed (check logs or metrics)
      const insights = await manager.getInsights();
      expect(insights).toBeDefined();
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should resolve conflicts in SuperClaude context', async () => {
      const testCases: Array<{
        command: string;
        personas: string[];
        expectedPersonas?: string[];
        expectedMinPersonas?: number;
        expectedWinner?: string;
        expectedStrategy?: string;
        context?: any;
      }> = [
        {
          command: '/sc:deploy --production',
          personas: ['security', 'devops', 'qa'],
          // Test that at least some personas are selected
          expectedMinPersonas: 1,
          context: { environment: 'production' }
        },
        {
          command: '/sc:refactor --aggressive',
          personas: ['refactorer', 'qa', 'backend'],
          expectedStrategy: 'negotiation' // Similar priorities
        },
        {
          command: '/sc:analyze --skip-validation',
          personas: ['security', 'analyzer'],
          expectedStrategy: 'veto_override' // Security veto
        }
      ];

      for (const testCase of testCases) {
        const result = await manager.processCommand(
          testCase.command,
          { 
            personas: testCase.personas,
            ...(testCase.context || {})
          }
        );

        expect(result).toBeDefined();
        expect(result.personas).toBeDefined();
        
        if (testCase.expectedPersonas) {
          // Check that result contains expected personas
          const resultPersonaNames = result.personas.map((p: any) => p.name);
          testCase.expectedPersonas.forEach((expectedPersona: string) => {
            expect(resultPersonaNames).toContain(expectedPersona);
          });
        }
        
        if (testCase.expectedMinPersonas) {
          // Check minimum number of personas
          expect(result.personas.length).toBeGreaterThanOrEqual(testCase.expectedMinPersonas);
        }
        
        if (testCase.expectedWinner) {
          // Check if expected winner is in the resolved personas
          const winners = result.personas.map((p: any) => p.name);
          expect(winners).toContain(testCase.expectedWinner);
        }
        
        if (testCase.expectedStrategy) {
          expect(result.strategy).toBe(testCase.expectedStrategy);
        }
      }
    });
  });

  describe('Gemini Integration', () => {
    it('should route large contexts to Gemini', async () => {
      const largeContext = {
        targetFiles: Array(50).fill('large-file.js'),
        estimatedSize: '2MB'
      };

      const decision = await manager.selectBackend(largeContext);
      
      // Check if Gemini is available
      const geminiAvailable = await manager.geminiAdapter?.isAvailable();
      
      if (geminiAvailable) {
        expect(decision.backend).toBe('gemini');
        expect(decision.reason).toContain('large');
        expect(decision.estimatedCost).toBeLessThan(1); // Should be cheap
      } else {
        expect(decision.backend).toBe('claude');
        expect(decision.reason).toContain('not available');
      }
    });

    it('should keep small contexts on Claude', async () => {
      const smallContext = {
        targetFiles: ['single-file.js'],
        estimatedSize: '10KB'
      };

      const decision = await manager.selectBackend(smallContext);
      
      expect(decision.backend).toBe('claude');
      // Reason might vary based on Gemini availability
      expect(decision.reason).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete command flow', async () => {
      // Simulate a complete SuperClaude command flow
      const workflow = async () => {
        // Step 1: Pre-command processing
        const command = '/sc:implement auth-system --secure --performant';
        const context = {
          personas: ['security', 'backend', 'performance'],
          targetFiles: ['src/auth/login.js', 'src/auth/jwt.js'],
          environment: 'development'
        };

        // Step 2: Conflict resolution
        const processed = await manager.processCommand(command, context);
        expect(processed.success).toBe(true);
        expect(processed.personas).toBeDefined();
        expect(processed.resolutionTime).toBeLessThan(100); // < 100ms

        // Step 3: Backend selection
        const backend = await manager.selectBackend(context);
        expect(backend.backend).toBeDefined();

        // Step 4: Execute (simulated)
        const executionResult = {
          success: true,
          output: 'Auth system implemented',
          metrics: {
            tokensUsed: 5000,
            executionTime: 2500
          }
        };

        // Step 5: Post-command learning
        await manager.learn({
          command,
          context,
          result: executionResult,
          backend: backend.backend
        });

        // Step 6: Get insights
        const insights = await manager.getInsights();
        expect(insights.topPersonas).toContain('security');
        expect(insights.productivityScore).toBeGreaterThan(0);
      };

      await expect(workflow()).resolves.not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should respect SuperClaude configuration', async () => {
      const testConfig = {
        ...config,
        conflict_resolver: {
          enabled: false,
          default_strategy: 'priority_based',
          negotiation_timeout: '100ms'
        }
      };

      const testManager = new ExtensionManager(testConfig as any);
      const result = await testManager.processCommand('/sc:test', {
        personas: ['security', 'performance']
      });
      
      // When conflict resolution is disabled, it should still work but might not resolve conflicts
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle missing SuperClaude gracefully', async () => {
      // Temporarily rename SuperClaude directory
      const superClaudePath = path.join(process.cwd(), 'SuperClaude');
      const tempPath = path.join(process.cwd(), 'SuperClaude-temp');
      
      if (fs.existsSync(superClaudePath)) {
        fs.renameSync(superClaudePath, tempPath);
      }

      try {
        const testManager = new ExtensionManager(config);
        // Now it should NOT throw, but log a warning instead
        await expect(testManager.initialize()).resolves.toBeUndefined();
        
        // Verify it initialized successfully in standalone mode
        expect(testManager).toBeDefined();
      } finally {
        // Restore directory
        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, superClaudePath);
        }
      }
    });
  });
});