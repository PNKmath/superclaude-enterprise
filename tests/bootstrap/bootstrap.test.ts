import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Bootstrap Content Validation', () => {
  const BOOTSTRAP_PATH = path.join(__dirname, '../../src/docs/bootstrap/CLAUDE.md');
  const MAX_TOKENS = 500;
  
  // Simple token counter - approximates actual token count
  const countTokens = (text: string): number => {
    // Rough approximation: 1 token ≈ 4 characters or 0.75 words
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length / 0.75);
  };

  describe('Bootstrap file existence', () => {
    it('should have a bootstrap CLAUDE.md file', async () => {
      const exists = await fs.access(BOOTSTRAP_PATH).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Token Count Validation', () => {
    it('should contain less than 500 tokens', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      const tokenCount = countTokens(content);
      expect(tokenCount).toBeLessThan(MAX_TOKENS);
    });
  });

  describe('Essential Bootstrap Elements', () => {
    it('should contain registry reference', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      expect(content).toContain('registry.json');
    });

    it('should contain lazy loading instructions', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      expect(content.toLowerCase()).toContain('lazy');
      expect(content.toLowerCase()).toContain('load');
    });

    it('should contain initialization instructions', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      expect(content.toLowerCase()).toContain('initialize');
    });

    it('should NOT contain non-essential documentation', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      // Should not contain full command documentation
      expect(content).not.toContain('## Available Commands');
      // Should not contain full persona descriptions
      expect(content).not.toContain('## Persona Details');
      // Should not contain detailed examples
      expect(content).not.toContain('### Example Usage');
    });
  });

  describe('Bootstrap Structure', () => {
    it('should have proper markdown structure', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      // Should have a main heading
      expect(content).toMatch(/^# /m);
      // Should have sections
      expect(content).toMatch(/^## /m);
    });

    it('should reference the document loader', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      expect(content.toLowerCase()).toContain('documentloader');
    });
  });
});