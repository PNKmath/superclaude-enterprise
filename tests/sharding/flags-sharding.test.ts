import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentSharder } from '../../src/utils/document-sharder';

describe('Flags Document Sharding', () => {
  const testRoot = path.join(process.cwd(), 'test-docs');
  const flagsRoot = path.join(testRoot, 'flags');
  let sharder: DocumentSharder;

  beforeEach(async () => {
    sharder = new DocumentSharder(testRoot);
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('FLAGS.md sharding', () => {
    it('should shard FLAGS.md by flag categories', async () => {
      const mockFlagsContent = `# FLAGS.md

## Planning & Analysis Flags

### --think
Multi-file analysis (~4K tokens)
Auto-activates: Sequential MCP

### --think-hard  
Deep architectural analysis (~10K tokens)
Auto-activates: Sequential + Context7

## Compression & Efficiency Flags

### --uc / --ultracompressed
30-50% token reduction
Auto-activates: Context usage >75%

### --answer-only
Direct response without automation`;

      const result = await sharder.shardFlags(mockFlagsContent);
      
      expect(result.shards).toHaveLength(4);
      expect(result.categories).toContain('planning-analysis');
      expect(result.categories).toContain('compression-efficiency');
    });

    it('should preserve flag metadata and relationships', async () => {
      const flagContent = `### --think
Category: Planning & Analysis
Token-Usage: ~4K
Auto-Activates: Sequential MCP
Related-Flags: [--think-hard, --ultrathink]
Precedence: 3`;

      const result = await sharder.shardFlags(flagContent);
      const metadata = result.shards[0].metadata;
      
      expect(metadata.category).toBe('Planning & Analysis');
      expect(metadata.tokenUsage).toBe('~4K');
      expect(metadata.autoActivates).toContain('Sequential MCP');
      expect(metadata.relatedFlags).toEqual(['--think-hard', '--ultrathink']);
      expect(metadata.precedence).toBe(3);
    });

    it.skip('should organize flags by category directories', async () => {
      const flags: FlagInfo[] = [
        { name: '--think', category: 'planning-analysis' },
        { name: '--uc', category: 'compression-efficiency' },
        { name: '--seq', category: 'mcp-control' },
        { name: '--wave-mode', category: 'orchestration' }
      ];

      await sharder.createFlagStructure(flags);
      
      const planningDir = await fs.readdir(path.join(flagsRoot, 'planning-analysis'));
      const compressionDir = await fs.readdir(path.join(flagsRoot, 'compression-efficiency'));
      const mcpDir = await fs.readdir(path.join(flagsRoot, 'mcp-control'));
      const orchestrationDir = await fs.readdir(path.join(flagsRoot, 'orchestration'));
      
      expect(planningDir).toContain('think.md');
      expect(compressionDir).toContain('uc.md');
      expect(mcpDir).toContain('seq.md');
      expect(orchestrationDir).toContain('wave-mode.md');
    });

    it('should handle flag aliases correctly', async () => {
      const flagWithAlias = `### --uc / --ultracompressed
Category: Compression
Primary: --uc
Alias: --ultracompressed`;

      const result = await sharder.shardFlags(flagWithAlias);
      const metadata = result.shards[0].metadata;
      
      expect(metadata.primary).toBe('--uc');
      expect(metadata.aliases).toContain('--ultracompressed');
      
      // Alias should map to primary
      const aliasMappings = await sharder.generateFlagAliasMappings(result.shards);
      expect(aliasMappings['--ultracompressed']).toBe('--uc');
    });

    it('should track auto-activation patterns', async () => {
      const flagWithAutoActivation = `### --think
Auto-Activation-Conditions:
  - Import chains >5 files
  - Cross-module calls >10 references  
  - Complex debugging scenarios
Auto-Enables: [--seq, --persona-analyzer]`;

      const result = await sharder.shardFlags(flagWithAutoActivation);
      const autoActivation = result.shards[0].metadata.autoActivation;
      
      expect(autoActivation.conditions).toHaveLength(3);
      expect(autoActivation.enables).toEqual(['--seq', '--persona-analyzer']);
    });

    it('should maintain flag precedence hierarchy', async () => {
      const flags = [
        { name: '--safe-mode', precedence: 1 },
        { name: '--ultrathink', precedence: 2 },
        { name: '--think-hard', precedence: 3 },
        { name: '--think', precedence: 4 }
      ];

      const hierarchy = await sharder.buildFlagPrecedenceHierarchy(flags);
      
      expect(hierarchy[0].name).toBe('--safe-mode');
      expect(hierarchy[hierarchy.length - 1].name).toBe('--think');
    });

    it('should group mutually exclusive flags', async () => {
      const exclusiveGroups = [
        {
          name: 'thinking-depth',
          flags: ['--think', '--think-hard', '--ultrathink'],
          exclusive: true
        },
        {
          name: 'mcp-control', 
          flags: ['--all-mcp', '--no-mcp'],
          exclusive: true
        }
      ];

      const validation = await sharder.validateFlagCombinations(
        ['--think', '--think-hard'], 
        exclusiveGroups
      );
      
      expect(validation.valid).toBe(false);
      expect(validation.conflicts).toContain('thinking-depth');
    });

    it('should generate flag category index', async () => {
      const categories = {
        'planning-analysis': ['--think', '--think-hard', '--ultrathink'],
        'compression-efficiency': ['--uc', '--answer-only'],
        'mcp-control': ['--seq', '--c7', '--magic', '--no-mcp']
      };

      const index = await sharder.generateFlagCategoryIndex(categories);
      
      expect(index['planning-analysis']).toHaveLength(3);
      expect(index['mcp-control']).toHaveLength(4);
      expect(index).toHaveProperty('compression-efficiency');
    });

    it('should track flag dependencies and conflicts', async () => {
      const flagDependencies = {
        '--wave-mode': {
          requires: [],
          conflicts: ['--single-wave'],
          suggests: ['--wave-strategy', '--wave-validation']
        },
        '--delegate': {
          requires: [],
          conflicts: [],
          suggests: ['--concurrency', '--aggregate-results']
        }
      };

      const validation = await sharder.validateFlagDependencies(
        ['--wave-mode', '--single-wave'],
        flagDependencies
      );
      
      expect(validation.valid).toBe(false);
      expect(validation.conflicts).toContain('--wave-mode conflicts with --single-wave');
    });

    it('should handle complex flag interaction patterns', async () => {
      const interactionPatterns = `### --wave-mode
Interactions:
  - Enhances: [--think, --analyze, --improve]
  - Requires: complexity >= 0.7
  - Conflicts: [--single-wave, --no-waves]
  - Auto-enables: [--seq, --progressive-enhancement]`;

      const result = await sharder.shardFlags(interactionPatterns);
      const interactions = result.shards[0].metadata.interactions;
      
      expect(interactions.enhances).toContain('--think');
      expect(interactions.requires).toBe('complexity >= 0.7');
      expect(interactions.conflicts).toContain('--single-wave');
      expect(interactions.autoEnables).toContain('--seq');
    });

    it('should calculate flag combination effects', async () => {
      const flagCombinations = [
        {
          flags: ['--think', '--seq', '--c7'],
          effect: 'Deep analysis with documentation lookup',
          tokenMultiplier: 1.5
        },
        {
          flags: ['--uc', '--safe-mode'],
          effect: 'Maximum compression with safety checks',
          tokenMultiplier: 0.6
        }
      ];

      const effect = await sharder.calculateCombinationEffect(
        ['--think', '--seq', '--c7'],
        flagCombinations
      );
      
      expect(effect.description).toContain('Deep analysis');
      expect(effect.tokenMultiplier).toBe(1.5);
    });

    it('should maintain flag usage statistics metadata', async () => {
      const flagWithStats = `### --think
Usage-Frequency: high
Common-Combinations: [--seq, --c7]
Success-Rate: 92%
Average-Token-Usage: 3800`;

      const result = await sharder.shardFlags(flagWithStats);
      const stats = result.shards[0].metadata.usageStats;
      
      expect(stats.frequency).toBe('high');
      expect(stats.commonCombinations).toEqual(['--seq', '--c7']);
      expect(stats.successRate).toBe(92);
      expect(stats.averageTokenUsage).toBe(3800);
    });
  });
});