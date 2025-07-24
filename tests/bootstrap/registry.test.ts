import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import Ajv from 'ajv';

// Registry interface that we'll implement
export interface DocumentRegistry {
  version: string;
  lastUpdated: string;
  documents: {
    commands: {
      [category: string]: Array<{
        name: string;
        path: string;
        description: string;
        category: string;
      }>;
    };
    flags: {
      [category: string]: Array<{
        name: string;
        path: string;
        description: string;
        category: string;
        type: 'boolean' | 'string' | 'number';
      }>;
    };
    personas: Array<{
      name: string;
      path: string;
      description: string;
      autoActivationScore: number;
    }>;
    modes: Array<{
      name: string;
      path: string;
      description: string;
    }>;
    orchestrator: {
      [component: string]: {
        name: string;
        path: string;
        description: string;
      };
    };
    principles: {
      [category: string]: {
        name: string;
        path: string;
        description: string;
      };
    };
    rules: {
      [category: string]: {
        name: string;
        path: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
      };
    };
    mcp: {
      [server: string]: {
        name: string;
        path: string;
        description: string;
        capabilities: string[];
      };
    };
  };
  metadata: {
    totalDocuments: number;
    categories: {
      commands: string[];
      flags: string[];
      principles: string[];
      rules: string[];
    };
    indexedAt: string;
  };
}

// Registry manager class we'll implement
class DocumentRegistryManager {
  private registryPath: string;
  private schema: any;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // This will be implemented
    throw new Error('Not implemented');
  }

  async loadRegistry(): Promise<DocumentRegistry> {
    throw new Error('Not implemented');
  }

  async saveRegistry(registry: DocumentRegistry): Promise<void> {
    throw new Error('Not implemented');
  }

  async validateRegistry(registry: any): Promise<{ valid: boolean; errors?: any[] }> {
    throw new Error('Not implemented');
  }

  async addDocument(type: string, category: string, document: any): Promise<void> {
    throw new Error('Not implemented');
  }

  async removeDocument(type: string, category: string, name: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async findDocument(type: string, name: string): Promise<any | null> {
    throw new Error('Not implemented');
  }

  async updateMetadata(): Promise<void> {
    throw new Error('Not implemented');
  }

  generateEmptyRegistry(): DocumentRegistry {
    throw new Error('Not implemented');
  }
}

describe('Document Registry Schema Validation', () => {
  const TEST_REGISTRY_PATH = path.join(__dirname, '../../tmp/test-registry.json');
  let registryManager: DocumentRegistryManager;

  beforeEach(async () => {
    // Ensure test directory exists
    const dir = path.dirname(TEST_REGISTRY_PATH);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    registryManager = new DocumentRegistryManager(TEST_REGISTRY_PATH);
  });

  afterEach(async () => {
    // Clean up test files
    if (existsSync(TEST_REGISTRY_PATH)) {
      await fs.unlink(TEST_REGISTRY_PATH);
    }
  });

  describe('Registry Schema Structure', () => {
    it('should validate a complete valid registry', async () => {
      const validRegistry: DocumentRegistry = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        documents: {
          commands: {
            analysis: [{
              name: 'analyze',
              path: 'commands/analysis/analyze.md',
              description: 'Analyze code and systems',
              category: 'analysis'
            }]
          },
          flags: {
            planning: [{
              name: 'think',
              path: 'flags/planning/think.md',
              description: 'Enable deep thinking mode',
              category: 'planning',
              type: 'boolean'
            }]
          },
          personas: [{
            name: 'architect',
            path: 'personas/architect.md',
            description: 'System architecture specialist',
            autoActivationScore: 0.8
          }],
          modes: [{
            name: 'task-management',
            path: 'modes/task-management.md',
            description: 'Task management mode'
          }],
          orchestrator: {
            routing: {
              name: 'routing',
              path: 'orchestrator/routing.md',
              description: 'Request routing logic'
            }
          },
          principles: {
            core: {
              name: 'core',
              path: 'principles/core.md',
              description: 'Core development principles'
            }
          },
          rules: {
            operational: {
              name: 'operational',
              path: 'rules/operational.md',
              description: 'Operational rules',
              priority: 'high'
            }
          },
          mcp: {
            context7: {
              name: 'context7',
              path: 'mcp/context7.md',
              description: 'Context7 documentation server',
              capabilities: ['documentation', 'search']
            }
          }
        },
        metadata: {
          totalDocuments: 7,
          categories: {
            commands: ['analysis'],
            flags: ['planning'],
            principles: ['core'],
            rules: ['operational']
          },
          indexedAt: new Date().toISOString()
        }
      };

      const result = await registryManager.validateRegistry(validRegistry);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject registry with missing required fields', async () => {
      const invalidRegistry = {
        version: '1.0.0',
        // Missing lastUpdated
        documents: {
          commands: {}
          // Missing other required document types
        }
        // Missing metadata
      };

      const result = await registryManager.validateRegistry(invalidRegistry);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject registry with invalid version format', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.version = 'invalid-version';

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject registry with invalid date formats', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.lastUpdated = 'not-a-date';
      registry.metadata.indexedAt = 'also-not-a-date';

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Registry File Operations', () => {
    it('should create and save a new registry file', async () => {
      const registry = registryManager.generateEmptyRegistry();
      await registryManager.saveRegistry(registry);

      expect(existsSync(TEST_REGISTRY_PATH)).toBe(true);
      const content = await fs.readFile(TEST_REGISTRY_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe(registry.version);
    });

    it('should load an existing registry file', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.metadata.totalDocuments = 42;
      await registryManager.saveRegistry(registry);

      const loaded = await registryManager.loadRegistry();
      expect(loaded.metadata.totalDocuments).toBe(42);
    });

    it('should handle loading non-existent registry', async () => {
      await expect(registryManager.loadRegistry()).rejects.toThrow();
    });

    it('should handle loading invalid JSON', async () => {
      await fs.writeFile(TEST_REGISTRY_PATH, 'invalid json content');
      await expect(registryManager.loadRegistry()).rejects.toThrow();
    });
  });

  describe('Document Management', () => {
    beforeEach(async () => {
      const registry = registryManager.generateEmptyRegistry();
      await registryManager.saveRegistry(registry);
    });

    it('should add a command document', async () => {
      const command = {
        name: 'build',
        path: 'commands/development/build.md',
        description: 'Build the project',
        category: 'development'
      };

      await registryManager.addDocument('commands', 'development', command);
      
      const registry = await registryManager.loadRegistry();
      expect(registry.documents.commands.development).toBeDefined();
      expect(registry.documents.commands.development).toHaveLength(1);
      expect(registry.documents.commands.development[0].name).toBe('build');
    });

    it('should add a flag document', async () => {
      const flag = {
        name: 'verbose',
        path: 'flags/output/verbose.md',
        description: 'Enable verbose output',
        category: 'output',
        type: 'boolean' as const
      };

      await registryManager.addDocument('flags', 'output', flag);
      
      const registry = await registryManager.loadRegistry();
      expect(registry.documents.flags.output).toBeDefined();
      expect(registry.documents.flags.output[0].type).toBe('boolean');
    });

    it('should remove a document', async () => {
      // First add a document
      const command = {
        name: 'test',
        path: 'commands/quality/test.md',
        description: 'Run tests',
        category: 'quality'
      };
      await registryManager.addDocument('commands', 'quality', command);

      // Then remove it
      await registryManager.removeDocument('commands', 'quality', 'test');

      const registry = await registryManager.loadRegistry();
      const qualityCommands = registry.documents.commands.quality || [];
      expect(qualityCommands.find(c => c.name === 'test')).toBeUndefined();
    });

    it('should update metadata after document changes', async () => {
      const initialRegistry = await registryManager.loadRegistry();
      const initialCount = initialRegistry.metadata.totalDocuments;

      await registryManager.addDocument('personas', '', {
        name: 'frontend',
        path: 'personas/frontend.md',
        description: 'Frontend specialist',
        autoActivationScore: 0.7
      });

      await registryManager.updateMetadata();

      const updatedRegistry = await registryManager.loadRegistry();
      expect(updatedRegistry.metadata.totalDocuments).toBe(initialCount + 1);
      expect(new Date(updatedRegistry.metadata.indexedAt).getTime())
        .toBeGreaterThan(new Date(initialRegistry.metadata.indexedAt).getTime());
    });
  });

  describe('Document Search', () => {
    beforeEach(async () => {
      const registry = registryManager.generateEmptyRegistry();
      
      // Add some test documents
      registry.documents.commands.analysis = [{
        name: 'analyze',
        path: 'commands/analysis/analyze.md',
        description: 'Analyze code',
        category: 'analysis'
      }];
      
      registry.documents.flags.planning = [{
        name: 'think',
        path: 'flags/planning/think.md',
        description: 'Think deeply',
        category: 'planning',
        type: 'boolean'
      }];

      await registryManager.saveRegistry(registry);
    });

    it('should find a command by name', async () => {
      const doc = await registryManager.findDocument('commands', 'analyze');
      expect(doc).toBeDefined();
      expect(doc.path).toBe('commands/analysis/analyze.md');
    });

    it('should find a flag by name', async () => {
      const doc = await registryManager.findDocument('flags', 'think');
      expect(doc).toBeDefined();
      expect(doc.type).toBe('boolean');
    });

    it('should return null for non-existent document', async () => {
      const doc = await registryManager.findDocument('commands', 'nonexistent');
      expect(doc).toBeNull();
    });
  });

  describe('Schema Validation Rules', () => {
    it('should enforce valid priority values for rules', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.documents.rules.test = {
        name: 'test',
        path: 'rules/test.md',
        description: 'Test rule',
        priority: 'invalid' as any
      };

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
    });

    it('should enforce valid type values for flags', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.documents.flags.test = [{
        name: 'test',
        path: 'flags/test.md',
        description: 'Test flag',
        category: 'test',
        type: 'invalid' as any
      }];

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
    });

    it('should enforce autoActivationScore range for personas', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.documents.personas = [{
        name: 'test',
        path: 'personas/test.md',
        description: 'Test persona',
        autoActivationScore: 1.5 // Should be between 0 and 1
      }];

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
    });

    it('should enforce non-empty arrays for MCP capabilities', async () => {
      const registry = registryManager.generateEmptyRegistry();
      registry.documents.mcp.test = {
        name: 'test',
        path: 'mcp/test.md',
        description: 'Test MCP',
        capabilities: [] // Should have at least one capability
      };

      const result = await registryManager.validateRegistry(registry);
      expect(result.valid).toBe(false);
    });
  });
});