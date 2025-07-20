/**
 * Simple test for IntegratedGeminiAdapter without complex mocking
 */

import { describe, it, expect } from 'vitest';
import { GeminiStrategySelector } from '../GeminiStrategySelector.js';
import { GeminiExtractionTemplates } from '../GeminiExtractionTemplates.js';
import { CommandContext } from '../types.js';

describe('IntegratedGeminiAdapter Components', () => {
  describe('Strategy Selection', () => {
    it('should select appropriate strategy for different commands', () => {
      const selector = new GeminiStrategySelector();
      
      // Template mode for simple commands
      const simpleContext: CommandContext = {
        command: '/sc:analyze',
        targetFiles: ['test.js']
      };
      const simpleStrategy = selector.selectStrategy(simpleContext.command, simpleContext);
      expect(simpleStrategy.mode).toBe('template');
      
      // Adaptive mode for complex commands
      const complexContext: CommandContext = {
        command: '/sc:analyze strange behavior',
        targetFiles: Array(20).fill('file.js'),
        personas: ['analyzer', 'architect', 'performance'],
        flags: { detailed: true }
      };
      const complexStrategy = selector.selectStrategy(complexContext.command, complexContext);
      expect(complexStrategy.mode).toBe('adaptive');
      
      // Hybrid mode for pattern-based work
      const hybridContext: CommandContext = {
        command: '/sc:implement new feature following existing patterns',
        targetFiles: ['pattern.js'],
        personas: ['backend', 'architect']
      };
      const hybridStrategy = selector.selectStrategy(hybridContext.command, hybridContext);
      expect(hybridStrategy.mode).toBe('hybrid');
    });
  });
  
  describe('Template Generation', () => {
    it('should generate proper extraction prompts', () => {
      const context: CommandContext = {
        command: '/sc:analyze --security',
        targetFiles: ['auth.js', 'session.js'],
        personas: ['security']
      };
      
      const prompt = GeminiExtractionTemplates.generateExtractionPrompt(
        context.command,
        context
      );
      
      expect(prompt).toContain('Security Analysis Report');
      expect(prompt).toContain('CWE ID');
      expect(prompt).toContain('auth.js');
      expect(prompt).toContain('session.js');
    });
  });
  
  describe('Complexity Assessment', () => {
    it('should correctly assess context complexity', () => {
      const selector = new GeminiStrategySelector();
      
      // Low complexity
      const simpleContext: CommandContext = {
        command: '/sc:analyze',
        targetFiles: ['single.js']
      };
      expect(selector.assessComplexity(simpleContext)).toBeLessThan(0.3);
      
      // High complexity
      const complexContext: CommandContext = {
        command: '/sc:analyze complex system',
        targetFiles: Array(20).fill('file.js'),
        personas: ['security', 'architect', 'performance'],
        flags: { detailed: true, comprehensive: true }
      };
      expect(selector.assessComplexity(complexContext)).toBeGreaterThan(0.7);
    });
  });
});