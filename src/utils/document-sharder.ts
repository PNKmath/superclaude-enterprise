import * as fs from 'fs/promises';
import * as path from 'path';

export interface ShardMetadata {
  originalDocument?: string;
  section?: string;
  category?: string;
  purpose?: string;
  waveEnabled?: boolean;
  performanceProfile?: string;
  autoPersona?: string[];
  aliases?: string[];
  primary?: string;
  tokenUsage?: string;
  autoActivates?: string[];
  relatedFlags?: string[];
  precedence?: number;
  autoActivation?: {
    conditions: string[];
    enables: string[];
  };
  executionOrder?: number;
  prerequisites?: string[];
  nextCommands?: string[];
  interactions?: {
    enhances?: string[];
    requires?: string;
    conflicts?: string[];
    autoEnables?: string[];
  };
  usageStats?: {
    frequency: string;
    commonCombinations: string[];
    successRate: number;
    averageTokenUsage: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  tokenCount?: number;
}

export interface Shard {
  path: string;
  content: string;
  metadata: ShardMetadata;
  tokenCount?: number;
  size?: number;
  valid?: boolean;
}

export interface ShardingResult {
  shards: Shard[];
  categories?: string[];
  registry?: any;
  statistics?: any;
}

export interface CommandInfo {
  name: string;
  category: string;
  path?: string;
  waveEnabled?: boolean;
  relatedCommands?: string[];
}

export interface FlagInfo {
  name: string;
  category: string;
  precedence?: number;
}

export interface ShardCache {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  evict(key: string): Promise<void>;
}

export class DocumentSharder {
  private rootPath: string;
  private cache: Map<string, any> = new Map();

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async initialize(): Promise<void> {
    const dirs = [
      'commands', 'flags', 'personas', 'modes',
      'orchestrator', 'principles', 'rules', 'mcp'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.rootPath, dir), { recursive: true });
    }
  }

  countTokens(text: string): number {
    // Rough approximation: ~1.3 tokens per word
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length * 1.3);
  }

  async validateShardSize(shard: { content: string }, maxTokens: number): Promise<boolean> {
    const tokenCount = this.countTokens(shard.content);
    if (tokenCount > maxTokens) {
      throw new Error(`Shard exceeds token limit: ${tokenCount} > ${maxTokens}`);
    }
    return true;
  }

  async generateRegistry(documents: any): Promise<any> {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      documents,
      metadata: {
        totalShards: Object.keys(documents).reduce((sum, key) => 
          sum + Object.keys(documents[key]).length, 0
        )
      }
    };
  }

  async extractCrossReferences(content: string): Promise<any> {
    const refs: any = {
      commands: [],
      flags: [],
      personas: []
    };

    // Extract command references from Related Commands line
    const commandLine = content.match(/Related Commands:\s*\[([^\]]+)\]/);
    if (commandLine) {
      refs.commands = commandLine[1].split(',').map(c => c.trim());
    }

    // Extract flag references from Related Flags line
    const flagLine = content.match(/Related Flags:\s*\[([^\]]+)\]/);
    if (flagLine) {
      refs.flags = flagLine[1].split(',').map(f => f.trim());
    }

    // Extract persona references
    const personaLine = content.match(/Related Personas:\s*\[([^\]]+)\]/);
    if (personaLine) {
      refs.personas = personaLine[1].split(',').map(p => p.trim());
    }

    return refs;
  }

  async shardBySection(content: string): Promise<Shard[]> {
    const shards: Shard[] = [];
    
    // Handle header separately
    const headerMatch = content.match(/^#\s+[^\n]+\n/);
    if (headerMatch) {
      shards.push({
        path: 'header.md',
        content: headerMatch[0].trim(),
        metadata: { section: 'header' }
      });
    }
    
    // Split by sections
    const sections = content.split(/^## /m).slice(1);
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const lines = section.split('\n');
      const title = lines[0].trim();
      const sectionContent = lines.slice(1).join('\n').trim();
      
      shards.push({
        path: `section-${title.toLowerCase().replace(/\s+/g, '-')}.md`,
        content: `## ${title}\n${sectionContent}`,
        metadata: { section: title }
      });
    }

    return shards;
  }

  async reconstructDocument(shards: Shard[]): Promise<string> {
    const header = shards.find(s => s.metadata.section === 'header');
    const sections = shards.filter(s => s.metadata.section !== 'header');
    
    let content = '';
    if (header) {
      content = header.content + '\n';
    }
    
    for (const section of sections) {
      content += section.content + '\n';
    }
    
    return content.trim();
  }

  async createShard(options: {
    content: string;
    path: string;
    originalDocument: string;
    section: string;
  }): Promise<Shard> {
    return {
      path: options.path,
      content: options.content,
      metadata: {
        originalDocument: options.originalDocument,
        section: options.section,
        createdAt: new Date(),
        tokenCount: this.countTokens(options.content)
      }
    };
  }

  async optimizeLoadOrder(usageData: any): Promise<string[]> {
    return Object.entries(usageData)
      .sort((a: any, b: any) => b[1].frequency - a[1].frequency)
      .map(([key]) => key);
  }

  async updateShard(originalShard: any, newContent: string): Promise<any> {
    return {
      ...originalShard,
      content: newContent,
      metadata: {
        ...originalShard.metadata,
        version: (originalShard.metadata.version || 1) + 1,
        updatedAt: new Date()
      }
    };
  }

  async createDependencyGraph(dependencies: any): Promise<any> {
    return dependencies;
  }

  async resolveLoadSequence(entry: string, graph: any): Promise<string[]> {
    const sequence: string[] = [];
    const visited = new Set<string>();

    function visit(node: string) {
      if (visited.has(node)) return;
      visited.add(node);
      
      if (graph[node]) {
        for (const dep of graph[node]) {
          visit(dep);
        }
      }
      
      sequence.push(node);
    }

    visit(entry);
    return sequence;
  }

  async initializeCache(): Promise<ShardCache> {
    const cache = this.cache;
    return {
      async set(key: string, value: any) {
        cache.set(key, value);
      },
      async get(key: string) {
        return cache.get(key) || null;
      },
      async evict(key: string) {
        cache.delete(key);
      }
    };
  }

  async generateStatistics(shards: any[]): Promise<any> {
    const totalTokens = shards.reduce((sum, s) => sum + (s.tokenCount || 0), 0);
    const totalSize = shards.reduce((sum, s) => sum + (s.size || 0), 0);
    const largestShard = shards.reduce((max, s) => 
      (s.tokenCount || 0) > (max.tokenCount || 0) ? s : max
    );

    return {
      totalShards: shards.length,
      totalTokens,
      totalSize,
      averageTokensPerShard: totalTokens / shards.length,
      largestShard: largestShard.path
    };
  }

  async validateShardingResult(result: ShardingResult): Promise<any> {
    const errors: string[] = [];
    
    if (!result.shards || result.shards.length === 0) {
      errors.push('No shards found');
    }
    
    for (const shard of result.shards || []) {
      if (!shard.path) errors.push('Shard missing path');
      if (!shard.content) errors.push('Shard missing content');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Command sharding methods
  async shardCommands(content: string): Promise<ShardingResult> {
    const shards: Shard[] = [];
    const categories = new Set<string>();
    
    // Split by command sections (## /command-name)
    const commandSections = content.split(/(?=^## \/)/m).filter(s => s.includes('##'));
    
    for (const section of commandSections) {
      const lines = section.split('\n');
      const commandLine = lines.find(l => l.startsWith('## /'));
      if (!commandLine) continue;
      
      const commandName = commandLine.replace('## ', '').trim();
      const metadata = this.parseCommandMetadata(section);
      const category = metadata.category || 'uncategorized';
      const categorySlug = category.toLowerCase().replace(/[&\s]+/g, '-');
      
      categories.add(categorySlug);
      
      shards.push({
        path: `commands/${categorySlug}/${commandName.slice(1)}.md`,
        content: section.trim(),
        metadata: {
          ...metadata,
          category
        },
        tokenCount: this.countTokens(section),
        size: section.length
      });
    }
    
    return {
      shards,
      categories: Array.from(categories)
    };
  }

  private parseCommandMetadata(content: string): ShardMetadata {
    const metadata: ShardMetadata = {};
    
    // Parse category
    const categoryMatch = content.match(/Category:\s*(.+)/i);
    if (categoryMatch) metadata.category = categoryMatch[1].trim();
    
    // Parse purpose
    const purposeMatch = content.match(/Purpose:\s*(.+)/i);
    if (purposeMatch) metadata.purpose = purposeMatch[1].trim();
    
    // Parse wave-enabled
    const waveMatch = content.match(/Wave-enabled:\s*(.+)/i);
    if (waveMatch) metadata.waveEnabled = waveMatch[1].toLowerCase() === 'true';
    
    // Parse performance profile
    const perfMatch = content.match(/Performance-profile:\s*(.+)/i);
    if (perfMatch) metadata.performanceProfile = perfMatch[1].trim();
    
    // Parse auto-persona
    const personaMatch = content.match(/Auto-Persona:\s*(.+)/i);
    if (personaMatch) {
      metadata.autoPersona = personaMatch[1].split(',').map(p => p.trim());
    }
    
    // Parse aliases
    const aliasMatch = content.match(/Aliases:\s*\[([^\]]+)\]/i);
    if (aliasMatch) {
      metadata.aliases = aliasMatch[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
    }
    
    // Parse execution order
    const orderMatch = content.match(/Execution-Order:\s*(\d+)/i);
    if (orderMatch) metadata.executionOrder = parseInt(orderMatch[1]);
    
    // Parse prerequisites
    const prereqMatch = content.match(/Prerequisites:\s*\[([^\]]+)\]/i);
    if (prereqMatch) {
      metadata.prerequisites = prereqMatch[1].split(',').map(p => p.trim().replace(/['"]/g, ''));
    }
    
    // Parse next commands
    const nextMatch = content.match(/Next-Commands:\s*\[([^\]]+)\]/i);
    if (nextMatch) {
      metadata.nextCommands = nextMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
    }
    
    return metadata;
  }

  async createCommandStructure(commands: CommandInfo[]): Promise<void> {
    const commandsRoot = path.join(this.rootPath, 'commands');
    
    for (const cmd of commands) {
      const categorySlug = cmd.category.toLowerCase().replace(/\s+/g, '-');
      const categoryPath = path.join(commandsRoot, categorySlug);
      await fs.mkdir(categoryPath, { recursive: true });
      
      const fileName = cmd.name.slice(1) + '.md';
      const filePath = path.join(categoryPath, fileName);
      await fs.writeFile(filePath, `# ${cmd.name}\n\nCategory: ${cmd.category}\n`);
    }
  }

  async generateCommandIndex(commands: any[]): Promise<any> {
    const index: any = {};
    
    for (const cmd of commands) {
      const category = cmd.category || 'uncategorized';
      if (!index[category]) {
        index[category] = [];
      }
      index[category].push(cmd.name.slice(1));
    }
    
    return index;
  }

  async validateCommandName(name: string): Promise<boolean> {
    if (!name.startsWith('/')) {
      throw new Error('Command must start with /');
    }
    if (name.startsWith('//')) {
      throw new Error('Command cannot start with //');
    }
    if (name.includes(' ')) {
      throw new Error('Command cannot contain spaces');
    }
    if (name !== name.toLowerCase()) {
      throw new Error('Command must be lowercase');
    }
    return true;
  }

  async mapCommandRelationships(commands: any[]): Promise<any> {
    const relationships: any = {};
    
    for (const cmd of commands) {
      if (cmd.relatedCommands) {
        relationships[cmd.name] = cmd.relatedCommands;
      }
    }
    
    return relationships;
  }

  async groupByWaveStatus(commands: any[]): Promise<any> {
    return {
      waveEnabled: commands.filter(c => c.waveEnabled),
      standard: commands.filter(c => !c.waveEnabled)
    };
  }

  async generateCategoryNavigation(categories: any): Promise<any> {
    return {
      categories: Object.entries(categories).map(([name, commands]) => ({
        name,
        commands: commands as string[]
      }))
    };
  }

  async generateAliasMappings(shards: Shard[]): Promise<any> {
    const mappings: any = {};
    
    for (const shard of shards) {
      if (shard.metadata.aliases) {
        const primaryCommand = shard.path.match(/\/([^/]+)\.md$/)?.[1];
        if (primaryCommand) {
          for (const alias of shard.metadata.aliases) {
            mappings[alias] = `/${primaryCommand}`;
          }
        }
      }
    }
    
    return mappings;
  }

  // Flag sharding methods
  async shardFlags(content: string): Promise<ShardingResult> {
    const shards: Shard[] = [];
    const categories = new Set<string>();
    let currentCategory = 'uncategorized';
    
    // Split content into lines to process category headers
    const lines = content.split('\n');
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for category header (## Category Name Flags)
      if (line.startsWith('## ') && line.includes('Flags')) {
        const categoryMatch = line.match(/## ([^F]+)\s*Flags/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1].trim();
        }
      }
      
      // Check for flag start
      if (line.startsWith('### --')) {
        // Process previous section if exists
        if (currentSection.trim()) {
          const shard = this.processFlagSection(currentSection, currentCategory);
          if (shard) {
            shards.push(shard);
            categories.add(shard.metadata.category.toLowerCase().replace(/[&\s]+/g, '-'));
          }
        }
        currentSection = line + '\n';
      } else if (currentSection) {
        currentSection += line + '\n';
      }
    }
    
    // Process last section
    if (currentSection.trim()) {
      const shard = this.processFlagSection(currentSection, currentCategory);
      if (shard) {
        shards.push(shard);
        categories.add(shard.metadata.category.toLowerCase().replace(/[&\s]+/g, '-'));
      }
    }
    
    return {
      shards,
      categories: Array.from(categories)
    };
  }

  private processFlagSection(section: string, defaultCategory: string): Shard | null {
    const lines = section.split('\n');
    const flagLine = lines.find(l => l.startsWith('### --'));
    if (!flagLine) return null;
    
    const flagParts = flagLine.replace('### ', '').split('/').map(p => p.trim());
    const primaryFlag = flagParts[0];
    const metadata = this.parseFlagMetadata(section);
    
    // Use metadata category if available, otherwise use default
    const category = metadata.category || defaultCategory;
    const categorySlug = category.toLowerCase().replace(/[&\s]+/g, '-');
    
    // Set primary and aliases
    metadata.primary = primaryFlag;
    if (flagParts.length > 1) {
      metadata.aliases = flagParts.slice(1);
    }
    
    return {
      path: `flags/${categorySlug}/${primaryFlag.slice(2)}.md`,
      content: section.trim(),
      metadata: {
        ...metadata,
        category
      },
      tokenCount: this.countTokens(section),
      size: section.length
    };
  }

  private parseFlagMetadata(content: string): ShardMetadata {
    const metadata: ShardMetadata = {};
    
    // Parse category
    const categoryMatch = content.match(/Category:\s*(.+)/i);
    if (categoryMatch) metadata.category = categoryMatch[1].trim();
    
    // Parse token usage
    const tokenMatch = content.match(/Token-Usage:\s*(.+)/i);
    if (tokenMatch) metadata.tokenUsage = tokenMatch[1].trim();
    
    // Parse auto-activates
    const autoMatch = content.match(/Auto-Activates?:\s*(.+)/i);
    if (autoMatch) {
      metadata.autoActivates = autoMatch[1].split(',').map(a => a.trim());
    }
    
    // Parse related flags
    const relatedMatch = content.match(/Related-Flags:\s*\[([^\]]+)\]/i);
    if (relatedMatch) {
      metadata.relatedFlags = relatedMatch[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
    }
    
    // Parse precedence
    const precedenceMatch = content.match(/Precedence:\s*(\d+)/i);
    if (precedenceMatch) metadata.precedence = parseInt(precedenceMatch[1]);
    
    // Parse auto-activation conditions
    const conditionsMatch = content.match(/Auto-Activation-Conditions:\s*\n((?:\s*-[^\n]+\n)+)/);
    if (conditionsMatch) {
      const conditions = conditionsMatch[1].split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.replace(/^\s*-\s*/, '').trim());
      
      const enablesMatch = content.match(/Auto-Enables:\s*\[([^\]]+)\]/);
      const enables = enablesMatch ? 
        enablesMatch[1].split(',').map(e => e.trim().replace(/['"]/g, '')) : [];
      
      metadata.autoActivation = { conditions, enables };
    }
    
    // Parse interactions
    const interactionsMatch = content.match(/Interactions:\s*\n((?:\s*-[^\n]+\n)+)/);
    if (interactionsMatch) {
      const interactions: any = {};
      
      const enhancesMatch = content.match(/Enhances:\s*\[([^\]]+)\]/);
      if (enhancesMatch) {
        interactions.enhances = enhancesMatch[1].split(',').map(e => e.trim().replace(/['"]/g, ''));
      }
      
      const requiresMatch = content.match(/Requires:\s*(.+)/);
      if (requiresMatch && !requiresMatch[1].includes('[')) {
        interactions.requires = requiresMatch[1].trim();
      }
      
      const conflictsMatch = content.match(/Conflicts:\s*\[([^\]]+)\]/);
      if (conflictsMatch) {
        interactions.conflicts = conflictsMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
      }
      
      const autoEnablesMatch = content.match(/Auto-enables:\s*\[([^\]]+)\]/);
      if (autoEnablesMatch) {
        interactions.autoEnables = autoEnablesMatch[1].split(',').map(e => e.trim().replace(/['"]/g, ''));
      }
      
      metadata.interactions = interactions;
    }
    
    // Parse usage stats
    const statsMatch = content.match(/Usage-Frequency:\s*(.+)/);
    if (statsMatch) {
      const stats: any = { frequency: statsMatch[1].trim() };
      
      const combosMatch = content.match(/Common-Combinations:\s*\[([^\]]+)\]/);
      if (combosMatch) {
        stats.commonCombinations = combosMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
      }
      
      const successMatch = content.match(/Success-Rate:\s*(\d+)%?/);
      if (successMatch) stats.successRate = parseInt(successMatch[1]);
      
      const avgTokenMatch = content.match(/Average-Token-Usage:\s*(\d+)/);
      if (avgTokenMatch) stats.averageTokenUsage = parseInt(avgTokenMatch[1]);
      
      metadata.usageStats = stats;
    }
    
    return metadata;
  }

  async createFlagStructure(flags: FlagInfo[]): Promise<void> {
    const flagsRoot = path.join(this.rootPath, 'flags');
    
    for (const flag of flags) {
      const categoryPath = path.join(flagsRoot, flag.category);
      await fs.mkdir(categoryPath, { recursive: true });
      
      const fileName = flag.name.slice(2) + '.md';
      const filePath = path.join(categoryPath, fileName);
      await fs.writeFile(filePath, `# ${flag.name}\n\nCategory: ${flag.category}\n`);
    }
  }

  async generateFlagAliasMappings(shards: Shard[]): Promise<any> {
    const mappings: any = {};
    
    for (const shard of shards) {
      if (shard.metadata.aliases && shard.metadata.primary) {
        for (const alias of shard.metadata.aliases) {
          mappings[alias] = shard.metadata.primary;
        }
      }
    }
    
    return mappings;
  }

  async buildFlagPrecedenceHierarchy(flags: any[]): Promise<any[]> {
    return flags.sort((a, b) => (a.precedence || 999) - (b.precedence || 999));
  }

  async validateFlagCombinations(flags: string[], exclusiveGroups: any[]): Promise<any> {
    const conflicts: string[] = [];
    
    for (const group of exclusiveGroups) {
      if (group.exclusive) {
        const flagsInGroup = flags.filter(f => group.flags.includes(f));
        if (flagsInGroup.length > 1) {
          conflicts.push(group.name);
        }
      }
    }
    
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  async generateFlagCategoryIndex(categories: any): Promise<any> {
    return categories;
  }

  async validateFlagDependencies(flags: string[], dependencies: any): Promise<any> {
    const conflicts: string[] = [];
    
    for (const flag of flags) {
      if (dependencies[flag]) {
        const dep = dependencies[flag];
        
        // Check conflicts
        for (const conflict of dep.conflicts || []) {
          if (flags.includes(conflict)) {
            conflicts.push(`${flag} conflicts with ${conflict}`);
          }
        }
      }
    }
    
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  async calculateCombinationEffect(flags: string[], combinations: any[]): Promise<any> {
    for (const combo of combinations) {
      if (combo.flags.every((f: string) => flags.includes(f))) {
        return {
          description: combo.effect,
          tokenMultiplier: combo.tokenMultiplier
        };
      }
    }
    
    return {
      description: 'Standard combination',
      tokenMultiplier: 1.0
    };
  }

  // Persona sharding methods
  async shardPersonas(content: string): Promise<ShardingResult> {
    const shards: Shard[] = [];
    
    // Split by persona sections (## persona-name)
    const personaSections = content.split(/(?=^## )/m).filter(s => s.includes('##') && !s.includes('# PERSONAS'));
    
    for (const section of personaSections) {
      const lines = section.split('\n');
      const personaLine = lines.find(l => l.startsWith('## '));
      if (!personaLine) continue;
      
      const personaName = personaLine.replace('## ', '').trim();
      
      shards.push({
        path: `personas/${personaName}.md`,
        content: section.trim(),
        metadata: {
          section: personaName
        }
      });
    }
    
    return { shards };
  }

  // Modes sharding methods
  async shardModes(content: string): Promise<ShardingResult> {
    const shards: Shard[] = [];
    
    // Split by mode sections
    const modeSections = content.split(/(?=^## )/m).filter(s => s.includes('##') && !s.includes('# MODES'));
    
    for (const section of modeSections) {
      const lines = section.split('\n');
      const modeLine = lines.find(l => l.startsWith('## '));
      if (!modeLine) continue;
      
      const modeName = modeLine.replace('## ', '').replace(' Mode', '').trim();
      const modeSlug = modeName.toLowerCase().replace(/\s+/g, '-');
      
      shards.push({
        path: `modes/${modeSlug}.md`,
        content: section.trim(),
        metadata: {
          section: modeName
        }
      });
    }
    
    return { shards };
  }

  // Orchestrator sharding methods
  async shardOrchestrator(content: string): Promise<ShardingResult> {
    const shards: Shard[] = [];
    
    // Split by major sections
    const sections = content.split(/(?=^## )/m).filter(s => s.includes('##') && !s.includes('# ORCHESTRATOR'));
    
    for (const section of sections) {
      const lines = section.split('\n');
      const sectionLine = lines.find(l => l.startsWith('## '));
      if (!sectionLine) continue;
      
      const sectionName = sectionLine.replace('## ', '').trim();
      const sectionSlug = sectionName.toLowerCase().replace(/\s+/g, '-');
      
      shards.push({
        path: `orchestrator/${sectionSlug}.md`,
        content: section.trim(),
        metadata: {
          section: sectionName
        }
      });
    }
    
    return { shards };
  }
}