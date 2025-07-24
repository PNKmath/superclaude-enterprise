import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentSharder } from '../../src/utils/document-sharder';

describe('Document Sharding System', () => {
  const testRoot = path.join(process.cwd(), 'test-docs');
  let sharder: DocumentSharder;

  beforeEach(async () => {
    sharder = new DocumentSharder(testRoot);
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  describe('General sharding functionality', () => {
    it('should initialize with proper directory structure', async () => {
      await sharder.initialize();
      
      const dirs = await fs.readdir(testRoot);
      expect(dirs).toContain('commands');
      expect(dirs).toContain('flags');
      expect(dirs).toContain('personas');
      expect(dirs).toContain('modes');
      expect(dirs).toContain('orchestrator');
      expect(dirs).toContain('principles');
      expect(dirs).toContain('rules');
      expect(dirs).toContain('mcp');
    });

    it('should count tokens accurately', () => {
      const text = 'This is a sample text for token counting.';
      const tokenCount = sharder.countTokens(text);
      
      // Rough estimate: ~1.3 tokens per word
      expect(tokenCount).toBeGreaterThan(8);
      expect(tokenCount).toBeLessThan(15);
    });

    it('should validate shard size limits', async () => {
      const largeShard = {
        content: Array(3000).fill('word').join(' '), // ~4000 tokens
        path: 'test/large.md'
      };

      await expect(sharder.validateShardSize(largeShard, 2000)).rejects.toThrow();
      await expect(sharder.validateShardSize(largeShard, 5000)).resolves.toBe(true);
    });

    it('should generate document registry after sharding', async () => {
      const documents = {
        commands: { analyze: 'commands/analysis/analyze.md' },
        flags: { think: 'flags/planning/think.md' },
        personas: { architect: 'personas/architect.md' }
      };

      const registry = await sharder.generateRegistry(documents);
      
      expect(registry.version).toBeDefined();
      expect(registry.lastUpdated).toBeDefined();
      expect(registry.documents.commands).toHaveProperty('analyze');
      expect(registry.documents.flags).toHaveProperty('think');
      expect(registry.documents.personas).toHaveProperty('architect');
    });

    it('should handle cross-document references', async () => {
      const documentWithRefs = `# Architect Persona
Related Commands: [/analyze, /design, /estimate]
Related Flags: [--think-hard, --ultrathink]
Related Personas: [frontend, backend]`;

      const refs = await sharder.extractCrossReferences(documentWithRefs);
      
      expect(refs.commands).toEqual(['/analyze', '/design', '/estimate']);
      expect(refs.flags).toEqual(['--think-hard', '--ultrathink']);
      expect(refs.personas).toEqual(['frontend', 'backend']);
    });

    it('should maintain document integrity after sharding', async () => {
      const originalContent = `# Test Document
## Section 1
Content for section 1
## Section 2  
Content for section 2`;

      const shards = await sharder.shardBySection(originalContent);
      const reconstructed = await sharder.reconstructDocument(shards);
      
      expect(reconstructed.trim()).toBe(originalContent.trim());
    });

    it('should track shard metadata', async () => {
      const shard = await sharder.createShard({
        content: 'Test content',
        path: 'test/shard.md',
        originalDocument: 'COMMANDS.md',
        section: 'analyze'
      });

      expect(shard.metadata.originalDocument).toBe('COMMANDS.md');
      expect(shard.metadata.section).toBe('analyze');
      expect(shard.metadata.createdAt).toBeDefined();
      expect(shard.metadata.tokenCount).toBeGreaterThan(0);
    });

    it('should optimize shard loading based on usage patterns', async () => {
      const usageData = {
        '/analyze': { frequency: 100, lastUsed: new Date() },
        '/build': { frequency: 80, lastUsed: new Date() },
        '/help': { frequency: 10, lastUsed: new Date(Date.now() - 86400000) }
      };

      const loadOrder = await sharder.optimizeLoadOrder(usageData);
      
      expect(loadOrder[0]).toBe('/analyze');
      expect(loadOrder[1]).toBe('/build');
      expect(loadOrder[2]).toBe('/help');
    });

    it('should handle document updates and re-sharding', async () => {
      const originalShard = {
        path: 'commands/analysis/analyze.md',
        content: 'Original content',
        metadata: { version: 1 }
      };

      const updatedContent = 'Updated content with new features';
      const updatedShard = await sharder.updateShard(originalShard, updatedContent);
      
      expect(updatedShard.content).toBe(updatedContent);
      expect(updatedShard.metadata.version).toBe(2);
      expect(updatedShard.metadata.updatedAt).toBeDefined();
    });

    it('should create dependency graph for efficient loading', async () => {
      const dependencies = {
        '/analyze': ['/explain', '--think'],
        '/build': ['/test', '--validate'],
        '--think': ['--seq']
      };

      const graph = await sharder.createDependencyGraph(dependencies);
      const loadSequence = await sharder.resolveLoadSequence('/analyze', graph);
      
      expect(loadSequence).toContain('--seq');
      expect(loadSequence).toContain('--think');
      expect(loadSequence).toContain('/explain');
      expect(loadSequence.indexOf('--seq')).toBeLessThan(loadSequence.indexOf('--think'));
    });

    it('should implement efficient shard caching', async () => {
      const cache = await sharder.initializeCache();
      
      const shard = { path: 'test.md', content: 'Test content' };
      await cache.set('test.md', shard);
      
      const cached = await cache.get('test.md');
      expect(cached).toEqual(shard);
      
      // Test cache eviction
      await cache.evict('test.md');
      const evicted = await cache.get('test.md');
      expect(evicted).toBeNull();
    });

    it('should generate shard statistics report', async () => {
      const shards = [
        { path: 'a.md', tokenCount: 100, size: 500 },
        { path: 'b.md', tokenCount: 200, size: 1000 },
        { path: 'c.md', tokenCount: 150, size: 750 }
      ];

      const stats = await sharder.generateStatistics(shards);
      
      expect(stats.totalShards).toBe(3);
      expect(stats.totalTokens).toBe(450);
      expect(stats.totalSize).toBe(2250);
      expect(stats.averageTokensPerShard).toBe(150);
      expect(stats.largestShard).toBe('b.md');
    });

    it('should validate complete sharding result', async () => {
      const shardingResult = {
        shards: [
          { path: 'commands/analyze.md', content: '...', valid: true },
          { path: 'flags/think.md', content: '...', valid: true }
        ],
        registry: { version: '1.0.0', documents: {} },
        statistics: { totalShards: 2 }
      };

      const validation = await sharder.validateShardingResult(shardingResult);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Document type specific sharding', () => {
    it('should shard PERSONAS.md into individual persona files', async () => {
      const personasContent = `# PERSONAS.md

## architect
Identity: Systems architecture specialist
Priority: Maintainability > scalability > performance

## frontend
Identity: UX specialist, accessibility advocate`;

      const result = await sharder.shardPersonas(personasContent);
      
      expect(result.shards).toHaveLength(2);
      expect(result.shards[0].path).toBe('personas/architect.md');
      expect(result.shards[1].path).toBe('personas/frontend.md');
    });

    it('should shard MODES.md by operational modes', async () => {
      const modesContent = `# MODES.md

## Task Management Mode
Core principles and workflow

## Introspection Mode  
Meta-cognitive analysis`;

      const result = await sharder.shardModes(modesContent);
      
      expect(result.shards).toHaveLength(2);
      expect(result.shards[0].path).toBe('modes/task-management.md');
      expect(result.shards[1].path).toBe('modes/introspection.md');
    });

    it('should shard ORCHESTRATOR.md into functional components', async () => {
      const orchestratorContent = `# ORCHESTRATOR.md

## Detection Engine
Pattern recognition and analysis

## Routing Intelligence
Dynamic decision trees

## Quality Gates
Validation framework`;

      const result = await sharder.shardOrchestrator(orchestratorContent);
      
      expect(result.shards).toHaveLength(3);
      expect(result.shards[0].path).toBe('orchestrator/detection-engine.md');
      expect(result.shards[1].path).toBe('orchestrator/routing-intelligence.md');
      expect(result.shards[2].path).toBe('orchestrator/quality-gates.md');
    });
  });
});