import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { DocumentSharder } from '../../src/utils/document-sharder';

describe('Bootstrap Content Validation', () => {
  const BOOTSTRAP_PATH = path.join(__dirname, '../../src/docs/bootstrap/CLAUDE.md');
  const REGISTRY_PATH = path.join(__dirname, '../../src/docs/bootstrap/registry.json');
  const FALLBACK_CONFIG_PATH = path.join(__dirname, '../../src/docs/bootstrap/fallback-config.json');
  const MAX_TOKENS = 500;
  const sharder = new DocumentSharder('');
  
  describe('Bootstrap file existence', () => {
    it('should have a bootstrap CLAUDE.md file', async () => {
      const exists = await fs.access(BOOTSTRAP_PATH).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have a registry.json file', async () => {
      const exists = existsSync(REGISTRY_PATH);
      expect(exists).toBe(true);
    });

    it('should have a fallback configuration file', async () => {
      const exists = existsSync(FALLBACK_CONFIG_PATH);
      expect(exists).toBe(true);
    });
  });

  describe('Token Count Validation', () => {
    it('should contain less than 500 tokens', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      const tokenCount = sharder.countTokens(content);
      
      expect(tokenCount).toBeLessThan(MAX_TOKENS);
      expect(tokenCount).toBeGreaterThan(0); // Should have some content
    });

    it('should have efficient content without verbose explanations', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      const lines = content.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      
      // Bootstrap should be concise
      expect(longLines.length).toBeLessThan(5);
    });
  });

  describe('Essential Bootstrap Elements', () => {
    let bootstrapContent: string;

    beforeEach(async () => {
      bootstrapContent = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
    });

    it('should contain registry reference with correct path', async () => {
      expect(bootstrapContent).toContain('registry.json');
      expect(bootstrapContent).toMatch(/\.\/src\/docs\/bootstrap\/registry\.json/);
    });

    it('should contain document loader reference', async () => {
      expect(bootstrapContent.toLowerCase()).toMatch(/document.*loader|loader.*system/i);
    });

    it('should contain lazy loading instructions', async () => {
      expect(bootstrapContent).toMatch(/lazy[\s-]*load|on[\s-]*demand|dynamic[\s-]*load/i);
    });

    it('should contain session management reference', async () => {
      expect(bootstrapContent).toMatch(/session|context[\s-]*window|token[\s-]*limit|30[\s-]*minute/i);
    });

    it('should reference MCP server architecture', async () => {
      expect(bootstrapContent).toMatch(/mcp|model[\s-]*context[\s-]*protocol/i);
      expect(bootstrapContent).toMatch(/server/i);
    });

    it('should contain initialization instructions', async () => {
      expect(bootstrapContent).toMatch(/init|bootstrap|start|load/i);
    });

    it('should reference the sharding system', async () => {
      expect(bootstrapContent).toMatch(/shard|chunk|split|segment/i);
    });

    it('should NOT contain non-essential documentation', async () => {
      // Should not contain full command documentation
      expect(bootstrapContent).not.toMatch(/## Available Commands|## Command List/i);
      // Should not contain full persona descriptions
      expect(bootstrapContent).not.toMatch(/## Persona Details|## All Personas/i);
      // Should not contain detailed examples
      expect(bootstrapContent).not.toMatch(/### Example Usage|## Examples/i);
      // Should not contain verbose flag documentation
      expect(bootstrapContent).not.toMatch(/## All Flags|## Flag Reference/i);
    });
  });

  describe('Bootstrap Structure', () => {
    let bootstrapContent: string;

    beforeEach(async () => {
      bootstrapContent = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
    });

    it('should have proper markdown structure', async () => {
      // Should have a main heading
      expect(bootstrapContent).toMatch(/^# /m);
      // Should have sections
      expect(bootstrapContent).toMatch(/^## /m);
    });

    it('should not have excessive code blocks', async () => {
      const codeBlockCount = (bootstrapContent.match(/```/g) || []).length;
      // Allow max 2 code blocks (1 opening + 1 closing = 2 backticks)
      expect(codeBlockCount).toBeLessThanOrEqual(2);
    });

    it('should have a clear initialization flow', async () => {
      // Should mention the flow: bootstrap -> registry -> load documents
      expect(bootstrapContent).toMatch(/bootstrap.*registry/is);
      expect(bootstrapContent).toMatch(/registry.*load/is);
    });
  });

  describe('Registry File Validation', () => {
    it('should have a valid registry structure', async () => {
      const registryContent = await fs.readFile(REGISTRY_PATH, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry).toHaveProperty('version');
      expect(registry).toHaveProperty('lastUpdated');
      expect(registry).toHaveProperty('documents');
      expect(registry).toHaveProperty('metadata');
      
      // Check document categories
      expect(registry.documents).toHaveProperty('commands');
      expect(registry.documents).toHaveProperty('flags');
      expect(registry.documents).toHaveProperty('personas');
      expect(registry.documents).toHaveProperty('modes');
      expect(registry.documents).toHaveProperty('orchestrator');
      expect(registry.documents).toHaveProperty('principles');
      expect(registry.documents).toHaveProperty('rules');
      expect(registry.documents).toHaveProperty('mcp');
    });
  });

  describe('Fallback Configuration Validation', () => {
    it('should have valid fallback configuration', async () => {
      const configContent = await fs.readFile(FALLBACK_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      
      expect(config).toHaveProperty('essentialDocuments');
      expect(config.essentialDocuments).toBeInstanceOf(Array);
      expect(config.essentialDocuments.length).toBeGreaterThan(0);
      
      // Should define priority documents
      expect(config.essentialDocuments).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/bootstrap|commands|flags|orchestrator/i)
        ])
      );
    });
  });

  describe('Bootstrap Completeness', () => {
    it('should be sufficient for system initialization', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      
      // Check for all critical elements needed for bootstrapping
      const requiredElements = [
        'registry',           // Registry reference
        'load',              // Loading mechanism
        'document',          // Document system
        'shard',             // Sharding reference
        'session',           // Session management
        'mcp',               // MCP server
        'bootstrap',         // Self-reference
        'superclaude'        // System name
      ];
      
      const contentLower = content.toLowerCase();
      for (const element of requiredElements) {
        expect(contentLower).toContain(element);
      }
    });

    it('should provide clear entry point for system', async () => {
      const content = await fs.readFile(BOOTSTRAP_PATH, 'utf-8');
      
      // Should clearly indicate this is the bootstrap/entry point
      expect(content).toMatch(/bootstrap|entry|start|initial/i);
      
      // Should reference next steps
      expect(content).toMatch(/registry.*load|load.*document|initialize.*system/i);
    });
  });
});