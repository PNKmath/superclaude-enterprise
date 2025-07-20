/**
 * Integration test for Gemini strategy system
 */

import { describe, it, expect } from 'vitest';
import { GeminiStrategySelector } from '../GeminiStrategySelector.js';
import { GeminiExtractionTemplates } from '../GeminiExtractionTemplates.js';

describe('Gemini Strategy Integration', () => {
  it('should select template mode and generate extraction prompt', () => {
    const selector = new GeminiStrategySelector();
    
    const context = {
      command: '/sc:analyze --security',
      targetFiles: ['auth.js', 'session.js'],
      personas: ['security', 'analyzer']
    };
    
    // Select strategy
    const strategy = selector.selectStrategy(context.command, context);
    expect(strategy.mode).toBe('template');
    expect(strategy.confidence).toBeGreaterThan(0.8);
    
    // Generate extraction prompt
    const prompt = GeminiExtractionTemplates.generateExtractionPrompt(
      context.command,
      context
    );
    
    // Verify prompt contains key elements
    expect(prompt).toContain('Security Analysis Report');
    expect(prompt).toContain('CWE ID');
    expect(prompt).toContain('CVSS Score');
    expect(prompt).toContain('auth.js');
    expect(prompt).toContain('session.js');
  });

  it('should select adaptive mode for complex tasks', () => {
    const selector = new GeminiStrategySelector();
    
    const context = {
      command: '/sc:analyze strange performance degradation across system',
      targetFiles: Array(15).fill('module.js'),
      personas: ['performance', 'analyzer', 'architect'],
      flags: { detailed: true }
    };
    
    const strategy = selector.selectStrategy(context.command, context);
    expect(strategy.mode).toBe('adaptive');
    expect(strategy.adaptive?.contextLevel).toBe('detailed');
    expect(strategy.adaptive?.validationEnabled).toBe(true);
  });

  it('should validate extraction output', () => {
    const mockOutput = `
## Security Analysis Report
### Critical Findings:
1. **SQL Injection Vulnerability**
   - CWE ID: CWE-89
   - CVSS Score: 9.8
   - Location: auth.js:45
   - Affected Code: \`query = "SELECT * FROM users WHERE id=" + userId\`
   - Exploitation: Direct SQL injection possible
   - Mitigation: Use parameterized queries
    `;
    
    const validation = GeminiExtractionTemplates.validateExtraction(
      mockOutput,
      '/sc:analyze --security'
    );
    
    expect(validation.valid).toBe(false); // Some fields might be missing
    expect(validation.coverage).toBeGreaterThan(0.5);
  });

  it('should handle hybrid mode correctly', () => {
    const selector = new GeminiStrategySelector();
    
    const context = {
      command: '/sc:implement new feature following existing patterns',
      targetFiles: ['existing-pattern.js'],
      personas: ['backend', 'architect'],
      flags: { preserveApi: true }
    };
    
    const strategy = selector.selectStrategy(context.command, context);
    
    // Debug info
    console.log('Command:', context.command);
    console.log('Strategy mode:', strategy.mode);
    console.log('Has template:', !!strategy.template);
    console.log('Has adaptive:', !!strategy.adaptive);
    
    expect(strategy.mode).toBe('hybrid');
    if (strategy.mode === 'hybrid') {
      expect(strategy.template).toBeDefined();
      expect(strategy.adaptive).toBeDefined();
      expect(strategy.adaptive?.preservationRules).toContain('preserve_api_compatibility');
    }
  });

  it('should respect mode overrides', () => {
    const selector = new GeminiStrategySelector();
    
    // Force template mode on complex task
    const templateContext = {
      command: '/sc:analyze',
      targetFiles: Array(20).fill('file.js'),
      flags: { useTemplate: true }
    };
    
    let strategy = selector.selectStrategy(templateContext.command, templateContext);
    expect(strategy.mode).toBe('template');
    
    // Force adaptive mode on simple task
    const adaptiveContext = {
      command: '/sc:analyze',
      targetFiles: ['single.js'],
      flags: { useAdaptive: true }
    };
    
    strategy = selector.selectStrategy(adaptiveContext.command, adaptiveContext);
    expect(strategy.mode).toBe('adaptive');
  });
});