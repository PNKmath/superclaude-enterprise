import { describe, it, expect } from '@jest/globals';
import { GeminiStrategySelector } from '../GeminiStrategySelector.js';

describe('Simple Test', () => {
  it('should create selector', () => {
    const selector = new GeminiStrategySelector();
    expect(selector).toBeDefined();
  });

  it('should select template mode for simple analyze', () => {
    const selector = new GeminiStrategySelector();
    const strategy = selector.selectStrategy('/sc:analyze', {
      command: '/sc:analyze',
      targetFiles: ['test.js']
    });
    
    expect(strategy.mode).toBe('template');
  });
});