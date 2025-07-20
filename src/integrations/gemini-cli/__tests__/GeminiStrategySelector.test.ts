/**
 * Test cases for Gemini Strategy Selection System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiStrategySelector } from '../GeminiStrategySelector.js';

describe('GeminiStrategySelector', () => {
  let selector: GeminiStrategySelector;

  beforeEach(() => {
    selector = new GeminiStrategySelector();
  });

  describe('Template Mode Selection', () => {
    it('should select template mode for standard analyze command', () => {
      const context = {
        command: '/sc:analyze',
        targetFiles: ['auth.js'],
        personas: ['analyzer']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('template');
      expect(strategy.confidence).toBeGreaterThanOrEqual(0.8);
      expect(strategy.template).toBeDefined();
      expect(strategy.template?.type).toBe('analyze');
    });

    it('should select template mode for security analysis', () => {
      const context = {
        command: '/sc:analyze --security',
        targetFiles: ['user-service.js'],
        personas: ['security']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('template');
      expect(strategy.template?.requiredFields).toContain('vulnerability_type');
      expect(strategy.template?.requiredFields).toContain('cwe_id');
    });

    it('should select template mode for performance analysis', () => {
      const context = {
        command: '/sc:analyze --performance',
        targetFiles: ['api-handler.js'],
        personas: ['performance']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('template');
      expect(strategy.template?.requiredFields).toContain('bottleneck_type');
      expect(strategy.template?.requiredFields).toContain('measured_time');
    });

    it('should select template mode for implementation tasks', () => {
      const context = {
        command: '/sc:implement user authentication',
        targetFiles: [],
        personas: ['backend']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('template');
      expect(strategy.template?.type).toBe('implement');
      expect(strategy.template?.requiredFields).toContain('requirements_understood');
    });
  });

  describe('Adaptive Mode Selection', () => {
    it('should select adaptive mode for complex debugging', () => {
      const context = {
        command: '/sc:analyze strange performance issue',
        targetFiles: ['app.js', 'db.js', 'cache.js', 'api.js', 'worker.js'],
        personas: ['analyzer', 'performance', 'architect'],
        flags: { detailed: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('adaptive');
      expect(strategy.adaptive?.contextLevel).toBe('detailed');
      expect(strategy.adaptive?.validationEnabled).toBe(true);
    });

    it('should select adaptive mode for exploratory analysis', () => {
      const context = {
        command: '/sc:analyze why is this happening',
        targetFiles: ['complex-module.js'],
        personas: ['analyzer'],
        flags: { exploratory: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('adaptive');
      expect(strategy.adaptive?.preservationRules.length).toBeGreaterThan(0);
    });

    it('should select adaptive mode for high-stakes security work', () => {
      const context = {
        command: '/sc:analyze potential security breach',
        targetFiles: ['auth.js', 'session.js'],
        personas: ['security', 'architect'],
        flags: { production: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('adaptive');
      expect(strategy.adaptive?.contextLevel).toBe('detailed');
      expect(strategy.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Hybrid Mode Selection', () => {
    it('should select hybrid mode for pattern-based implementation', () => {
      const context = {
        command: '/sc:implement new API endpoint following existing patterns',
        targetFiles: ['api/users.js', 'api/products.js'],
        personas: ['backend', 'architect']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('hybrid');
      expect(strategy.template).toBeDefined();
      expect(strategy.adaptive).toBeDefined();
      expect(strategy.adaptive?.contextLevel).toBe('medium');
    });

    it('should select hybrid mode for guided refactoring', () => {
      const context = {
        command: '/sc:improve legacy code with modern patterns',
        targetFiles: ['legacy-module.js'],
        personas: ['refactorer', 'architect'],
        flags: { preserveApi: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('hybrid');
      expect(strategy.template?.type).toBe('improve');
      expect(strategy.adaptive?.preservationRules).toContain('preserve_api_compatibility');
    });
  });

  describe('Complexity Assessment', () => {
    it('should assess low complexity correctly', () => {
      const context = {
        command: '/sc:analyze',
        targetFiles: ['single-file.js'],
        personas: ['analyzer']
      };

      const complexity = selector.assessComplexity(context);

      expect(complexity).toBeLessThan(0.3);
    });

    it('should assess high complexity correctly', () => {
      const context = {
        command: '/sc:analyze complex system interactions',
        targetFiles: Array(15).fill('file.js'),
        personas: ['analyzer', 'architect', 'security', 'performance'],
        flags: { detailed: true, comprehensive: true }
      };

      const complexity = selector.assessComplexity(context);

      expect(complexity).toBeGreaterThan(0.7);
    });
  });

  describe('Common Settings Extraction', () => {
    it('should extract personas correctly', () => {
      const context = {
        command: '/sc:analyze',
        personas: ['security', 'performance']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.common.personas).toEqual(['security', 'performance']);
    });

    it('should generate constraints from flags', () => {
      const context = {
        command: '/sc:analyze',
        flags: {
          maxLength: 1000,
          format: 'json',
          language: 'korean'
        }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.common.constraints).toContain('Maximum output length: 1000');
      expect(strategy.common.constraints).toContain('Output format: json');
      expect(strategy.common.constraints).toContain('Language: korean');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for well-defined templates', () => {
      const context = {
        command: '/sc:analyze --security',
        targetFiles: ['auth.js'],
        personas: ['security']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.confidence).toBeGreaterThan(0.85);
    });

    it('should have lower confidence for ambiguous commands', () => {
      const context = {
        command: '/sc:do something with this code',
        targetFiles: ['mystery.js']
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.confidence).toBeLessThan(0.7);
    });
  });

  describe('Mode Override', () => {
    it('should respect explicit template mode flag', () => {
      const context = {
        command: '/sc:analyze',
        targetFiles: Array(20).fill('file.js'), // Would normally trigger adaptive
        flags: { useTemplate: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('template');
    });

    it('should respect explicit adaptive mode flag', () => {
      const context = {
        command: '/sc:analyze',
        targetFiles: ['single.js'], // Would normally use template
        flags: { useAdaptive: true }
      };

      const strategy = selector.selectStrategy(context.command, context);

      expect(strategy.mode).toBe('adaptive');
    });
  });
});