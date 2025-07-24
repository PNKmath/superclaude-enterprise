import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentSharder } from '../../src/utils/document-sharder';

describe('Commands Document Sharding', () => {
  const testRoot = path.join(process.cwd(), 'test-docs');
  const commandsRoot = path.join(testRoot, 'commands');
  let sharder: DocumentSharder;

  beforeEach(async () => {
    sharder = new DocumentSharder(testRoot);
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  describe('COMMANDS.md sharding', () => {
    it('should shard COMMANDS.md into individual command files', async () => {
      const mockCommandsContent = `# COMMANDS.md

## /analyze
Analyzes code and provides insights
Category: Analysis
Wave-enabled: true

## /build  
Builds project with framework detection
Category: Development
Wave-enabled: true

## /help
Shows help information
Category: System
Wave-enabled: false`;

      const result = await sharder.shardCommands(mockCommandsContent);
      
      expect(result.shards).toHaveLength(3);
      expect(result.shards[0].path).toBe('commands/analysis/analyze.md');
      expect(result.shards[1].path).toBe('commands/development/build.md');
      expect(result.shards[2].path).toBe('commands/system/help.md');
    });

    it('should preserve command metadata during sharding', async () => {
      const mockCommandsContent = `## /implement
Category: Development
Purpose: Feature implementation
Wave-enabled: true
Performance-profile: standard
Auto-Persona: Frontend, Backend`;

      const result = await sharder.shardCommands(mockCommandsContent);
      const shard = result.shards[0];
      
      expect(shard.metadata.category).toBe('Development');
      expect(shard.metadata.purpose).toBe('Feature implementation');
      expect(shard.metadata.waveEnabled).toBe(true);
      expect(shard.metadata.performanceProfile).toBe('standard');
      expect(shard.metadata.autoPersona).toEqual(['Frontend', 'Backend']);
    });

    it('should organize commands by category directories', async () => {
      const commands = [
        { name: '/analyze', category: 'Analysis' },
        { name: '/troubleshoot', category: 'Analysis' },
        { name: '/build', category: 'Development' },
        { name: '/test', category: 'Testing' }
      ];

      await sharder.createCommandStructure(commands);
      
      const analysisDir = await fs.readdir(path.join(commandsRoot, 'analysis'));
      const developmentDir = await fs.readdir(path.join(commandsRoot, 'development'));
      const testingDir = await fs.readdir(path.join(commandsRoot, 'testing'));
      
      expect(analysisDir).toContain('analyze.md');
      expect(analysisDir).toContain('troubleshoot.md');
      expect(developmentDir).toContain('build.md');
      expect(testingDir).toContain('test.md');
    });

    it('should generate command index file', async () => {
      const commands = [
        { name: '/analyze', category: 'Analysis', path: 'analysis/analyze.md' },
        { name: '/build', category: 'Development', path: 'development/build.md' }
      ];

      const index = await sharder.generateCommandIndex(commands);
      
      expect(index).toHaveProperty('Analysis');
      expect(index.Analysis).toContain('analyze');
      expect(index).toHaveProperty('Development');
      expect(index.Development).toContain('build');
    });

    it('should handle complex command content with examples', async () => {
      const complexCommand = `## /improve
Category: Quality
Purpose: Code improvement
Wave-enabled: true

### Description
Improves code quality with evidence-based enhancements

### Arguments
- target: File or directory to improve
- flags: Additional options

### Examples
\`\`\`bash
/improve src/api --perf
/improve @components --quality
\`\`\`

### Auto-Activations
- Performance issues → --persona-performance
- Security concerns → --persona-security`;

      const result = await sharder.shardCommands(complexCommand);
      const shard = result.shards[0];
      
      expect(shard.content).toContain('### Description');
      expect(shard.content).toContain('### Arguments');
      expect(shard.content).toContain('### Examples');
      expect(shard.content).toContain('### Auto-Activations');
    });

    it('should validate command naming conventions', async () => {
      const invalidCommands = [
        'analyze', // missing /
        '//build', // double /
        '/build test', // space in name
        '/BUILD' // uppercase
      ];

      for (const cmd of invalidCommands) {
        await expect(sharder.validateCommandName(cmd)).rejects.toThrow();
      }

      const validCommands = ['/analyze', '/build', '/test-run', '/implement_feature'];
      for (const cmd of validCommands) {
        await expect(sharder.validateCommandName(cmd)).resolves.toBe(true);
      }
    });

    it('should track command relationships and dependencies', async () => {
      const commands = [
        { name: '/analyze', relatedCommands: ['/improve', '/troubleshoot'] },
        { name: '/build', relatedCommands: ['/test', '/deploy'] }
      ];

      const relationships = await sharder.mapCommandRelationships(commands);
      
      expect(relationships['/analyze']).toContain('/improve');
      expect(relationships['/analyze']).toContain('/troubleshoot');
      expect(relationships['/build']).toContain('/test');
      expect(relationships['/build']).toContain('/deploy');
    });

    it('should maintain command execution order metadata', async () => {
      const commandWithOrder = `## /task
Category: Planning
Execution-Order: 1
Prerequisites: ['/analyze', '/estimate']
Next-Commands: ['/implement', '/test']`;

      const result = await sharder.shardCommands(commandWithOrder);
      const metadata = result.shards[0].metadata;
      
      expect(metadata.executionOrder).toBe(1);
      expect(metadata.prerequisites).toEqual(['/analyze', '/estimate']);
      expect(metadata.nextCommands).toEqual(['/implement', '/test']);
    });

    it('should handle wave-enabled command grouping', async () => {
      const commands = [
        { name: '/analyze', waveEnabled: true },
        { name: '/build', waveEnabled: true },
        { name: '/help', waveEnabled: false },
        { name: '/improve', waveEnabled: true }
      ];

      const waveGroups = await sharder.groupByWaveStatus(commands);
      
      expect(waveGroups.waveEnabled).toHaveLength(3);
      expect(waveGroups.waveEnabled.map(c => c.name)).toContain('/analyze');
      expect(waveGroups.waveEnabled.map(c => c.name)).toContain('/build');
      expect(waveGroups.waveEnabled.map(c => c.name)).toContain('/improve');
      expect(waveGroups.standard).toHaveLength(1);
      expect(waveGroups.standard[0].name).toBe('/help');
    });

    it('should generate category-based navigation structure', async () => {
      const categories = {
        'Analysis': ['/analyze', '/troubleshoot', '/explain'],
        'Development': ['/build', '/implement', '/design'],
        'Quality': ['/improve', '/cleanup', '/test']
      };

      const navigation = await sharder.generateCategoryNavigation(categories);
      
      expect(navigation).toHaveProperty('categories');
      expect(navigation.categories).toHaveLength(3);
      expect(navigation.categories[0].name).toBe('Analysis');
      expect(navigation.categories[0].commands).toHaveLength(3);
    });

    it('should calculate shard sizes and ensure they are reasonable', async () => {
      const largeCommand = `## /analyze
Category: Analysis
${Array(100).fill('Long description line that contains many tokens').join('\n')}`;

      const result = await sharder.shardCommands(largeCommand);
      const shard = result.shards[0];
      
      expect(shard.tokenCount).toBeLessThan(2000); // Each shard should be under 2000 tokens
      expect(shard.size).toBeDefined();
      expect(shard.size).toBeGreaterThan(0);
    });

    it('should handle command aliases and shortcuts', async () => {
      const commandWithAliases = `## /analyze
Aliases: ['/a', '/analysis', '/scan']
Category: Analysis`;

      const result = await sharder.shardCommands(commandWithAliases);
      const metadata = result.shards[0].metadata;
      
      expect(metadata.aliases).toEqual(['/a', '/analysis', '/scan']);
      
      // Should create alias mappings
      const aliasMappings = await sharder.generateAliasMappings(result.shards);
      expect(aliasMappings['/a']).toBe('/analyze');
      expect(aliasMappings['/analysis']).toBe('/analyze');
      expect(aliasMappings['/scan']).toBe('/analyze');
    });
  });
});