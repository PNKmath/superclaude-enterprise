import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { DocumentStructureManager } from '../../src/utils/document-structure-manager';

describe('Document Directory Structure', () => {
  const TEST_BASE_DIR = path.join(__dirname, '../../tmp/test-docs');
  let structureManager: DocumentStructureManager;

  beforeEach(async () => {
    // Clean up and create test directory
    if (existsSync(TEST_BASE_DIR)) {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    }
    await fs.mkdir(TEST_BASE_DIR, { recursive: true });
    structureManager = new DocumentStructureManager(TEST_BASE_DIR);
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_BASE_DIR)) {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    }
  });

  describe('Directory Creation', () => {
    it('should create the base docs directory structure', async () => {
      await structureManager.createStructure();

      // Check root directories
      const rootDirs = ['bootstrap', 'commands', 'flags', 'personas', 'modes', 
                       'orchestrator', 'principles', 'rules', 'mcp'];
      
      for (const dir of rootDirs) {
        const dirPath = path.join(TEST_BASE_DIR, dir);
        const exists = existsSync(dirPath);
        expect(exists).toBe(true);
      }
    });

    it('should create command subdirectories', async () => {
      await structureManager.createStructure();

      const commandSubdirs = ['analysis', 'development', 'quality', 'meta'];
      
      for (const subdir of commandSubdirs) {
        const dirPath = path.join(TEST_BASE_DIR, 'commands', subdir);
        const exists = existsSync(dirPath);
        expect(exists).toBe(true);
      }
    });

    it('should create flag subdirectories', async () => {
      await structureManager.createStructure();

      const flagSubdirs = ['planning', 'compression', 'mcp', 'scope', 'personas', 'iteration'];
      
      for (const subdir of flagSubdirs) {
        const dirPath = path.join(TEST_BASE_DIR, 'flags', subdir);
        const exists = existsSync(dirPath);
        expect(exists).toBe(true);
      }
    });

    it('should handle creation errors gracefully', async () => {
      // Make base directory read-only to force an error
      await fs.chmod(TEST_BASE_DIR, 0o444);
      
      await expect(structureManager.createStructure()).rejects.toThrow();
      
      // Restore permissions
      await fs.chmod(TEST_BASE_DIR, 0o755);
    });
  });

  describe('Structure Validation', () => {
    it('should validate a complete directory structure', async () => {
      await structureManager.createStructure();
      
      const isValid = await structureManager.validateStructure();
      expect(isValid).toBe(true);
    });

    it('should detect missing directories', async () => {
      // Create incomplete structure
      await fs.mkdir(path.join(TEST_BASE_DIR, 'bootstrap'), { recursive: true });
      await fs.mkdir(path.join(TEST_BASE_DIR, 'commands'), { recursive: true });
      // Missing other directories
      
      const isValid = await structureManager.validateStructure();
      expect(isValid).toBe(false);
    });

    it('should detect missing subdirectories', async () => {
      await structureManager.createStructure();
      
      // Remove a subdirectory
      await fs.rm(path.join(TEST_BASE_DIR, 'commands', 'analysis'), { recursive: true });
      
      const isValid = await structureManager.validateStructure();
      expect(isValid).toBe(false);
    });
  });

  describe('Path Resolution', () => {
    beforeEach(async () => {
      await structureManager.createStructure();
    });

    it('should resolve paths for bootstrap documents', () => {
      const claudePath = structureManager.getDocumentPath('bootstrap', undefined, 'CLAUDE.md');
      expect(claudePath).toBe(path.join(TEST_BASE_DIR, 'bootstrap', 'CLAUDE.md'));
      
      const registryPath = structureManager.getDocumentPath('bootstrap', undefined, 'registry.json');
      expect(registryPath).toBe(path.join(TEST_BASE_DIR, 'bootstrap', 'registry.json'));
    });

    it('should resolve paths for command documents', () => {
      const analyzePath = structureManager.getDocumentPath('commands', 'analysis', 'analyze.md');
      expect(analyzePath).toBe(path.join(TEST_BASE_DIR, 'commands', 'analysis', 'analyze.md'));
      
      const buildPath = structureManager.getDocumentPath('commands', 'development', 'build.md');
      expect(buildPath).toBe(path.join(TEST_BASE_DIR, 'commands', 'development', 'build.md'));
    });

    it('should resolve paths for flag documents', () => {
      const thinkPath = structureManager.getDocumentPath('flags', 'planning', 'think.md');
      expect(thinkPath).toBe(path.join(TEST_BASE_DIR, 'flags', 'planning', 'think.md'));
      
      const ucPath = structureManager.getDocumentPath('flags', 'compression', 'uc.md');
      expect(ucPath).toBe(path.join(TEST_BASE_DIR, 'flags', 'compression', 'uc.md'));
    });

    it('should resolve paths for persona documents', () => {
      const architectPath = structureManager.getDocumentPath('personas', undefined, 'architect.md');
      expect(architectPath).toBe(path.join(TEST_BASE_DIR, 'personas', 'architect.md'));
    });

    it('should throw error for invalid document type', () => {
      expect(() => {
        structureManager.getDocumentPath('invalid', undefined, 'test.md');
      }).toThrow('Invalid document type');
    });
  });

  describe('Directory Listing', () => {
    beforeEach(async () => {
      await structureManager.createStructure();
      
      // Create some test files
      await fs.writeFile(path.join(TEST_BASE_DIR, 'commands', 'analysis', 'analyze.md'), '# Analyze');
      await fs.writeFile(path.join(TEST_BASE_DIR, 'commands', 'analysis', 'troubleshoot.md'), '# Troubleshoot');
      await fs.writeFile(path.join(TEST_BASE_DIR, 'personas', 'architect.md'), '# Architect');
      await fs.writeFile(path.join(TEST_BASE_DIR, 'personas', 'frontend.md'), '# Frontend');
    });

    it('should list all files in a directory type', async () => {
      const personaFiles = await structureManager.getAllPaths('personas');
      expect(personaFiles).toContain(path.join(TEST_BASE_DIR, 'personas', 'architect.md'));
      expect(personaFiles).toContain(path.join(TEST_BASE_DIR, 'personas', 'frontend.md'));
      expect(personaFiles).toHaveLength(2);
    });

    it('should list files recursively for nested directories', async () => {
      const commandFiles = await structureManager.getAllPaths('commands');
      expect(commandFiles).toContain(path.join(TEST_BASE_DIR, 'commands', 'analysis', 'analyze.md'));
      expect(commandFiles).toContain(path.join(TEST_BASE_DIR, 'commands', 'analysis', 'troubleshoot.md'));
      expect(commandFiles).toHaveLength(2);
    });

    it('should return empty array for directory with no files', async () => {
      const modeFiles = await structureManager.getAllPaths('modes');
      expect(modeFiles).toEqual([]);
    });
  });

  describe('Permissions', () => {
    it('should create directories with correct permissions', async () => {
      await structureManager.createStructure();
      
      const stats = await fs.stat(path.join(TEST_BASE_DIR, 'bootstrap'));
      // Check if directory is readable and writable by owner
      expect(stats.mode & 0o700).toBe(0o700);
    });

    it('should handle permission errors gracefully', async () => {
      await structureManager.createStructure();
      
      // Make a directory read-only
      const commandsDir = path.join(TEST_BASE_DIR, 'commands');
      await fs.chmod(commandsDir, 0o444);
      
      // Try to create a file in read-only directory
      await expect(
        fs.writeFile(path.join(commandsDir, 'test.md'), 'test')
      ).rejects.toThrow();
      
      // Restore permissions
      await fs.chmod(commandsDir, 0o755);
    });
  });
});