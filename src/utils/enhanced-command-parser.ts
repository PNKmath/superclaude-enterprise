/**
 * Enhanced Command Parser for Natural Language Processing
 * Preserves full context while converting natural language to SuperClaude commands
 */

import { commandParseCache } from './performance-cache.js';

export interface ParsedCommand {
  baseCommand: string;
  target?: string;
  targets?: string[];
  flags: Map<string, string | boolean>;
  modifiers: string[];
  naturalContext: string;
  confidence: number;
  detectedIntent: string;
  suggestedPersonas: string[];
}

export class EnhancedCommandParser {
  // Intent to flags mapping with unified Korean-English support
  private intentToFlags = new Map([
    // Security related
    ['보안', ['--security']],
    ['security', ['--security']],
    ['취약점', ['--security', '--vulnerability']],
    ['vulnerability', ['--security', '--vulnerability']],
    
    // Performance related - EXPANDED
    ['성능', ['--performance']],
    ['performance', ['--performance']],
    ['최적화', ['--performance', '--optimize']],
    ['optimize', ['--performance', '--optimize']],
    ['memory', ['--performance', '--memory']],
    ['메모리', ['--performance', '--memory']],
    ['memory leak', ['--performance', '--memory-leak']],
    ['메모리 누수', ['--performance', '--memory-leak']],
    ['leak', ['--performance', '--leak']],
    ['누수', ['--performance', '--leak']],
    
    // Development patterns
    ['리팩토링', ['--refactor']],
    ['refactor', ['--refactor']],
    ['테스트', ['--test']],
    ['test', ['--test']],
    ['문서', ['--document']],
    ['document', ['--document']],
    ['패턴', ['--pattern']],
    ['pattern', ['--pattern']],
    ['repository', ['--pattern=repository']],
    ['repository pattern', ['--pattern=repository']],
    ['singleton', ['--pattern=singleton']],
    ['factory', ['--pattern=factory']],
    
    // Backend/Service related - EXPANDED
    ['서비스', ['--backend', '--service']],
    ['service', ['--backend', '--service']],
    ['api', ['--backend', '--api']],
    ['endpoint', ['--backend', '--endpoint']],
    ['백엔드', ['--backend']],
    ['backend', ['--backend']],
  ]);

  // Korean to English intent mapping for unified processing
  private koreanToEnglishIntent = new Map([
    ['보안', 'security'],
    ['취약점', 'vulnerability'],
    ['성능', 'performance'],
    ['최적화', 'optimize'],
    ['메모리', 'memory'],
    ['메모리 누수', 'memory leak'],
    ['누수', 'leak'],
    ['리팩토링', 'refactor'],
    ['테스트', 'test'],
    ['문서', 'document'],
    ['패턴', 'pattern'],
    ['서비스', 'service'],
    ['백엔드', 'backend'],
  ]);

  // Command patterns with advanced matching
  private commandPatterns = [
    {
      command: 'analyze',
      patterns: [/분석|검사|검토|확인|analyze|check|review|inspect|audit/gi],
      contextClues: ['문제', '이슈', 'issue', 'problem', 'bug', 'error']
    },
    {
      command: 'implement',
      patterns: [/구현|만들|생성|추가|implement|create|add|build|develop/gi],
      contextClues: ['기능', 'feature', 'endpoint', 'api', 'component']
    },
    {
      command: 'improve',
      patterns: [/개선|최적화|향상|리팩토|improve|optimize|enhance|refactor/gi],
      contextClues: ['성능', 'performance', 'quality', 'code']
    },
    {
      command: 'test',
      patterns: [/테스트|검증|test|validate|verify/gi],
      contextClues: ['단위', 'unit', 'integration', 'e2e']
    },
    {
      command: 'review',
      patterns: [/리뷰|검토|review|examine/gi],
      contextClues: ['pr', 'pull request', 'code', '코드']
    }
  ];

  // Pattern detection for hybrid mode
  private patternIndicators = [
    'pattern', '패턴',
    'following', '따라',
    'existing', '기존',
    'similar to', '비슷한',
    'like', '같은',
    'based on', '기반으로'
  ];

  parse(input: string): ParsedCommand {
    // Check cache first
    const cacheKey = commandParseCache.generateKey(input);
    const cached = commandParseCache.get(cacheKey);
    if (cached) {
      // Convert flags array back to Map
      if (cached.flags && Array.isArray(cached.flags)) {
        cached.flags = new Map(cached.flags);
      }
      return cached;
    }

    const result: ParsedCommand = {
      baseCommand: '',
      flags: new Map(),
      modifiers: [],
      naturalContext: input,
      confidence: 0,
      detectedIntent: '',
      suggestedPersonas: []
    };

    // Step 1: Extract base command
    const commandResult = this.extractCommand(input);
    result.baseCommand = commandResult.command;
    result.confidence = commandResult.confidence;

    // Step 2: Extract targets (files, directories, etc.)
    const targets = this.extractTargets(input);
    if (targets.length > 0) {
      result.target = targets[0];
      result.targets = targets;
    }

    // Step 3: Detect intent and generate flags
    const intents = this.detectIntents(input);
    for (const intent of intents) {
      const flags = this.intentToFlags.get(intent.toLowerCase());
      if (flags) {
        flags.forEach(flag => {
          const [key, value] = this.parseFlag(flag);
          result.flags.set(key, value || true);
        });
      }
    }
    result.detectedIntent = intents.join(', ');

    // Step 4: Extract explicit flags
    const explicitFlags = this.extractExplicitFlags(input);
    explicitFlags.forEach(([key, value]) => {
      result.flags.set(key, value);
    });

    // Step 5: Extract modifiers and context
    result.modifiers = this.extractModifiers(input);

    // Step 6: Suggest personas based on context
    result.suggestedPersonas = this.suggestPersonas(input, result);

    // Step 7: Detect if this needs hybrid mode
    if (this.needsHybridMode(input, result)) {
      result.flags.set('hybrid-mode', true);
    }

    // Cache the result (convert Map to array for serialization)
    const cacheableResult = {
      ...result,
      flags: Array.from(result.flags.entries())
    };
    commandParseCache.set(cacheKey, cacheableResult);

    return result;
  }

  private extractCommand(input: string): { command: string; confidence: number } {
    let bestMatch = { command: 'analyze', confidence: 30 }; // default

    for (const pattern of this.commandPatterns) {
      const matches = input.match(pattern.patterns[0]);
      if (matches && matches.length > 0) {
        let confidence = 60;
        
        // Boost confidence if context clues are present
        for (const clue of pattern.contextClues) {
          if (input.toLowerCase().includes(clue)) {
            confidence += 10;
          }
        }

        if (confidence > bestMatch.confidence) {
          bestMatch = { command: pattern.command, confidence };
        }
      }
    }

    return bestMatch;
  }

  private extractTargets(input: string): string[] {
    const targets: string[] = [];
    
    // Match file patterns
    const filePattern = /\b[\w\-\/]+\.\w+\b/g;
    const fileMatches = input.match(filePattern);
    if (fileMatches) {
      targets.push(...fileMatches);
    }

    // Match quoted strings as potential targets
    const quotedPattern = /["']([^"']+)["']/g;
    let match;
    while ((match = quotedPattern.exec(input)) !== null) {
      if (!targets.includes(match[1])) {
        targets.push(match[1]);
      }
    }

    // Match PR numbers
    const prPattern = /#(\d+)/g;
    while ((match = prPattern.exec(input)) !== null) {
      targets.push(`#${match[1]}`);
    }

    return targets;
  }

  private detectIntents(input: string): string[] {
    const intents: string[] = [];
    const lowerInput = input.toLowerCase();

    for (const [intent, _] of this.intentToFlags) {
      if (lowerInput.includes(intent)) {
        // Convert Korean intent to English for unified processing
        const englishIntent = this.koreanToEnglishIntent.get(intent) || intent;
        
        // Add the English intent if not already present
        if (!intents.includes(englishIntent)) {
          intents.push(englishIntent);
        }
      }
    }

    return intents;
  }

  private extractExplicitFlags(input: string): Array<[string, string | boolean]> {
    const flags: Array<[string, string | boolean]> = [];
    const flagPattern = /--(\w+)(?:=(\S+))?/g;
    let match;

    while ((match = flagPattern.exec(input)) !== null) {
      const key = match[1];
      const value = match[2] || true;
      flags.push([key, value]);
    }

    return flags;
  }

  private extractModifiers(input: string): string[] {
    const modifiers: string[] = [];
    
    // Extract descriptive modifiers
    const modifierPatterns = [
      /strange|이상한/gi,
      /complex|복잡한/gi,
      /simple|간단한/gi,
      /urgent|긴급한/gi,
      /critical|중요한/gi
    ];

    for (const pattern of modifierPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        modifiers.push(...matches);
      }
    }

    return modifiers;
  }

  private suggestPersonas(input: string, parsed: ParsedCommand): string[] {
    const personas: string[] = [];
    const lowerInput = input.toLowerCase();

    // Security-related
    if (lowerInput.includes('보안') || lowerInput.includes('security') || 
        lowerInput.includes('vulnerability') || lowerInput.includes('취약')) {
      personas.push('security');
    }

    // Performance-related - EXPANDED
    if (lowerInput.includes('성능') || lowerInput.includes('performance') ||
        lowerInput.includes('optimize') || lowerInput.includes('slow') ||
        lowerInput.includes('memory') || lowerInput.includes('메모리') ||
        lowerInput.includes('memory leak') || lowerInput.includes('메모리 누수') ||
        lowerInput.includes('leak') || lowerInput.includes('누수')) {
      personas.push('performance');
    }

    // Architecture-related
    if (lowerInput.includes('design') || lowerInput.includes('architecture') ||
        lowerInput.includes('설계') || lowerInput.includes('pattern')) {
      personas.push('architect');
    }

    // Backend-related - EXPANDED
    if (lowerInput.includes('api') || lowerInput.includes('endpoint') ||
        lowerInput.includes('server') || lowerInput.includes('database') ||
        lowerInput.includes('service') || lowerInput.includes('서비스') ||
        lowerInput.includes('backend') || lowerInput.includes('백엔드') ||
        lowerInput.includes('repository')) {
      personas.push('backend');
    }

    // Frontend-related
    if (lowerInput.includes('ui') || lowerInput.includes('component') ||
        lowerInput.includes('frontend') || lowerInput.includes('react')) {
      personas.push('frontend');
    }

    // Testing-related
    if (parsed.baseCommand === 'test' || lowerInput.includes('test') ||
        lowerInput.includes('테스트')) {
      personas.push('qa');
    }

    // Analysis-related
    if (parsed.baseCommand === 'analyze' || parsed.modifiers.includes('strange') ||
        parsed.modifiers.includes('complex')) {
      personas.push('analyzer');
    }

    // Default persona based on command
    if (personas.length === 0) {
      switch (parsed.baseCommand) {
        case 'implement':
          personas.push('backend', 'frontend');
          break;
        case 'analyze':
          personas.push('analyzer');
          break;
        case 'improve':
          personas.push('refactorer');
          break;
        case 'review':
          personas.push('qa', 'analyzer');
          break;
      }
    }

    return [...new Set(personas)]; // Remove duplicates
  }

  private needsHybridMode(input: string, parsed: ParsedCommand): boolean {
    const lowerInput = input.toLowerCase();
    
    // Check for pattern indicators
    for (const indicator of this.patternIndicators) {
      if (lowerInput.includes(indicator)) {
        // If it's an implementation with patterns, it's likely hybrid
        if (parsed.baseCommand === 'implement' || parsed.baseCommand === 'create') {
          return true;
        }
      }
    }

    // Check for specific pattern flags
    if (parsed.flags.has('pattern')) {
      return true;
    }

    return false;
  }

  private parseFlag(flag: string): [string, string | boolean] {
    if (flag.includes('=')) {
      const [key, value] = flag.substring(2).split('=');
      return [key, value];
    }
    return [flag.substring(2), true];
  }

  /**
   * Build the full SuperClaude command from parsed components
   */
  buildFullCommand(parsed: ParsedCommand): string {
    let command = `/sc:${parsed.baseCommand}`;

    // Add flags
    for (const [key, value] of parsed.flags) {
      if (value === true) {
        command += ` --${key}`;
      } else {
        command += ` --${key}=${value}`;
      }
    }

    // Add target
    if (parsed.target) {
      command += ` ${parsed.target}`;
    }

    return command;
  }
}