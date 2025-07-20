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
    ['위협', ['--security', '--validate']],
    ['threat', ['--security', '--validate']],
    
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
    ['느린', ['--performance', '--persona-performance']],
    ['slow', ['--performance', '--persona-performance']],
    ['빠르게', ['--performance', '--optimize']],
    ['fast', ['--performance', '--optimize']],
    
    // Planning & Analysis Flags
    ['계획', ['--plan']],
    ['plan', ['--plan']],
    ['생각', ['--think']],
    ['think', ['--think']],
    ['깊이 생각', ['--think-hard']],
    ['think deeply', ['--think-hard']],
    ['철저히 분석', ['--ultrathink']],
    ['comprehensive analysis', ['--ultrathink']],
    ['분석해서', ['--think']],
    ['analyze with', ['--think']],
    
    // Compression & Efficiency Flags
    ['압축', ['--uc']],
    ['compressed', ['--uc']],
    ['간단히', ['--uc']],
    ['briefly', ['--uc']],
    ['답변만', ['--answer-only']],
    ['answer only', ['--answer-only']],
    ['검증', ['--validate']],
    ['validate', ['--validate']],
    ['안전 모드', ['--safe-mode']],
    ['safe mode', ['--safe-mode']],
    ['자세히', ['--verbose']],
    ['verbose', ['--verbose']],
    ['상세하게', ['--verbose']],
    ['detailed', ['--verbose']],
    
    // MCP Server Control Flags
    ['문서 참고', ['--c7']],
    ['documentation', ['--c7']],
    ['라이브러리', ['--c7', '--context7']],
    ['library', ['--c7', '--context7']],
    ['복잡한', ['--seq']],
    ['complex', ['--seq']],
    ['단계별', ['--seq', '--sequential']],
    ['step by step', ['--seq', '--sequential']],
    ['UI 컴포넌트', ['--magic']],
    ['UI component', ['--magic']],
    ['컴포넌트', ['--magic']],
    ['component', ['--magic']],
    ['E2E 테스트', ['--play', '--playwright']],
    ['E2E test', ['--play', '--playwright']],
    ['브라우저', ['--play', '--playwright']],
    ['browser', ['--play', '--playwright']],
    ['모든 MCP', ['--all-mcp']],
    ['all MCP', ['--all-mcp']],
    
    // Sub-Agent Delegation Flags
    ['위임', ['--delegate']],
    ['delegate', ['--delegate']],
    ['병렬', ['--delegate', '--concurrency']],
    ['parallel', ['--delegate', '--concurrency']],
    ['동시에', ['--delegate', '--concurrency']],
    ['concurrently', ['--delegate', '--concurrency']],
    
    // Wave Orchestration Flags
    ['웨이브', ['--wave-mode']],
    ['wave', ['--wave-mode']],
    ['단계적', ['--wave-mode', '--wave-strategy=progressive']],
    ['progressive', ['--wave-mode', '--wave-strategy=progressive']],
    ['체계적', ['--wave-mode', '--wave-strategy=systematic']],
    ['systematic', ['--wave-mode', '--wave-strategy=systematic']],
    
    // Scope & Focus Flags
    ['파일 범위', ['--scope=file']],
    ['file scope', ['--scope=file']],
    ['모듈 범위', ['--scope=module']],
    ['module scope', ['--scope=module']],
    ['프로젝트 전체', ['--scope=project']],
    ['entire project', ['--scope=project']],
    ['시스템 전체', ['--scope=system']],
    ['entire system', ['--scope=system']],
    
    // Iterative Improvement Flags
    ['반복', ['--loop']],
    ['iterate', ['--loop']],
    ['개선하며', ['--loop']],
    ['iteratively', ['--loop']],
    ['점진적', ['--loop', '--iterations']],
    ['incrementally', ['--loop', '--iterations']],
    
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
    
    // Persona Activation Flags
    ['아키텍트', ['--persona-architect']],
    ['architect', ['--persona-architect']],
    ['프론트엔드', ['--persona-frontend']],
    ['frontend', ['--persona-frontend']],
    ['분석가', ['--persona-analyzer']],
    ['analyzer', ['--persona-analyzer']],
    ['QA', ['--persona-qa']],
    ['품질', ['--persona-qa']],
    ['quality', ['--persona-qa']],
    ['DevOps', ['--persona-devops']],
    ['배포', ['--persona-devops']],
    ['deploy', ['--persona-devops']],
    ['멘토', ['--persona-mentor']],
    ['mentor', ['--persona-mentor']],
    ['작성자', ['--persona-scribe']],
    ['writer', ['--persona-scribe']],
    
    // Introspection Flags
    ['내성', ['--introspect']],
    ['introspect', ['--introspect']],
    ['자기 분석', ['--introspection']],
    ['self analysis', ['--introspection']],
  ]);

  // Korean to English intent mapping for unified processing
  private koreanToEnglishIntent = new Map([
    ['보안', 'security'],
    ['취약점', 'vulnerability'],
    ['위협', 'threat'],
    ['성능', 'performance'],
    ['최적화', 'optimize'],
    ['메모리', 'memory'],
    ['메모리 누수', 'memory leak'],
    ['누수', 'leak'],
    ['느린', 'slow'],
    ['빠르게', 'fast'],
    ['계획', 'plan'],
    ['생각', 'think'],
    ['깊이 생각', 'think deeply'],
    ['철저히 분석', 'comprehensive analysis'],
    ['분석해서', 'analyze with'],
    ['압축', 'compressed'],
    ['간단히', 'briefly'],
    ['답변만', 'answer only'],
    ['검증', 'validate'],
    ['안전 모드', 'safe mode'],
    ['자세히', 'verbose'],
    ['상세하게', 'detailed'],
    ['문서 참고', 'documentation'],
    ['라이브러리', 'library'],
    ['복잡한', 'complex'],
    ['단계별', 'step by step'],
    ['UI 컴포넌트', 'UI component'],
    ['컴포넌트', 'component'],
    ['E2E 테스트', 'E2E test'],
    ['브라우저', 'browser'],
    ['모든 MCP', 'all MCP'],
    ['위임', 'delegate'],
    ['병렬', 'parallel'],
    ['동시에', 'concurrently'],
    ['웨이브', 'wave'],
    ['단계적', 'progressive'],
    ['체계적', 'systematic'],
    ['파일 범위', 'file scope'],
    ['모듈 범위', 'module scope'],
    ['프로젝트 전체', 'entire project'],
    ['시스템 전체', 'entire system'],
    ['반복', 'iterate'],
    ['개선하며', 'iteratively'],
    ['점진적', 'incrementally'],
    ['리팩토링', 'refactor'],
    ['테스트', 'test'],
    ['문서', 'document'],
    ['패턴', 'pattern'],
    ['서비스', 'service'],
    ['백엔드', 'backend'],
    ['아키텍트', 'architect'],
    ['프론트엔드', 'frontend'],
    ['분석가', 'analyzer'],
    ['QA', 'QA'],
    ['품질', 'quality'],
    ['DevOps', 'DevOps'],
    ['배포', 'deploy'],
    ['멘토', 'mentor'],
    ['작성자', 'writer'],
    ['내성', 'introspect'],
    ['자기 분석', 'self analysis'],
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

    // Enhanced pattern matching with context awareness
    for (const [intent, _] of this.intentToFlags) {
      // Match exact phrases or words with word boundaries
      const regex = new RegExp(`\\b${intent}\\b`, 'i');
      if (regex.test(input) || lowerInput.includes(intent)) {
        // Convert Korean intent to English for unified processing
        const englishIntent = this.koreanToEnglishIntent.get(intent) || intent;
        
        // Add the English intent if not already present
        if (!intents.includes(englishIntent)) {
          intents.push(englishIntent);
        }
      }
    }

    // Additional contextual pattern matching
    this.detectContextualIntents(input, intents);

    return intents;
  }

  private detectContextualIntents(input: string, intents: string[]): void {
    const lowerInput = input.toLowerCase();

    // Deep thinking patterns
    if (/깊게 생각|think deeply|thoroughly analyze|철저히 분석/i.test(input)) {
      if (!intents.includes('think deeply')) intents.push('think deeply');
    }

    // Comprehensive analysis patterns
    if (/전체적으로 분석|comprehensive analysis|전반적인 검토|overall review/i.test(input)) {
      if (!intents.includes('comprehensive analysis')) intents.push('comprehensive analysis');
    }

    // Safe mode patterns
    if (/안전하게|safely|신중하게|carefully|production|프로덕션/i.test(input)) {
      if (!intents.includes('safe mode')) intents.push('safe mode');
    }

    // Wave mode patterns
    if (/체계적으로|systematically|단계적으로|progressively|포괄적으로|comprehensively/i.test(input)) {
      if (!intents.includes('wave')) intents.push('wave');
    }

    // Delegation patterns
    if (/동시에 처리|process concurrently|병렬로|in parallel|위임하여|delegate/i.test(input)) {
      if (!intents.includes('delegate')) intents.push('delegate');
    }

    // Iteration patterns
    if (/반복적으로|iteratively|개선하면서|while improving|점진적으로|incrementally/i.test(input)) {
      if (!intents.includes('iterate')) intents.push('iterate');
    }

    // MCP server patterns
    if (/라이브러리 문서|library docs|공식 문서|official documentation/i.test(input)) {
      if (!intents.includes('documentation')) intents.push('documentation');
    }

    if (/복잡한 분석|complex analysis|다단계|multi-step|순차적으로|sequentially/i.test(input)) {
      if (!intents.includes('complex')) intents.push('complex');
    }

    if (/UI 생성|UI generation|컴포넌트 생성|component creation|디자인 시스템|design system/i.test(input)) {
      if (!intents.includes('UI component')) intents.push('UI component');
    }

    if (/브라우저 테스트|browser test|E2E|end-to-end|시각적 테스트|visual test/i.test(input)) {
      if (!intents.includes('E2E test')) intents.push('E2E test');
    }
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

    // Check explicit persona flags first
    for (const [flag, _] of parsed.flags) {
      if (flag.startsWith('persona-')) {
        const persona = flag.substring(8); // Remove 'persona-' prefix
        if (!personas.includes(persona)) {
          personas.push(persona);
        }
      }
    }

    // Security-related
    if (lowerInput.includes('보안') || lowerInput.includes('security') || 
        lowerInput.includes('vulnerability') || lowerInput.includes('취약') ||
        lowerInput.includes('threat') || lowerInput.includes('위협') ||
        lowerInput.includes('compliance') || lowerInput.includes('규정')) {
      if (!personas.includes('security')) personas.push('security');
    }

    // Performance-related - EXPANDED
    if (lowerInput.includes('성능') || lowerInput.includes('performance') ||
        lowerInput.includes('optimize') || lowerInput.includes('slow') ||
        lowerInput.includes('memory') || lowerInput.includes('메모리') ||
        lowerInput.includes('memory leak') || lowerInput.includes('메모리 누수') ||
        lowerInput.includes('leak') || lowerInput.includes('누수') ||
        lowerInput.includes('bottleneck') || lowerInput.includes('병목')) {
      if (!personas.includes('performance')) personas.push('performance');
    }

    // Architecture-related
    if (lowerInput.includes('design') || lowerInput.includes('architecture') ||
        lowerInput.includes('설계') || lowerInput.includes('pattern') ||
        lowerInput.includes('structure') || lowerInput.includes('구조') ||
        lowerInput.includes('scalability') || lowerInput.includes('확장성')) {
      if (!personas.includes('architect')) personas.push('architect');
    }

    // Backend-related - EXPANDED
    if (lowerInput.includes('api') || lowerInput.includes('endpoint') ||
        lowerInput.includes('server') || lowerInput.includes('database') ||
        lowerInput.includes('service') || lowerInput.includes('서비스') ||
        lowerInput.includes('backend') || lowerInput.includes('백엔드') ||
        lowerInput.includes('repository') || lowerInput.includes('reliability')) {
      if (!personas.includes('backend')) personas.push('backend');
    }

    // Frontend-related
    if (lowerInput.includes('ui') || lowerInput.includes('component') ||
        lowerInput.includes('frontend') || lowerInput.includes('react') ||
        lowerInput.includes('vue') || lowerInput.includes('angular') ||
        lowerInput.includes('프론트엔드') || lowerInput.includes('컴포넌트') ||
        lowerInput.includes('accessibility') || lowerInput.includes('접근성')) {
      if (!personas.includes('frontend')) personas.push('frontend');
    }

    // Testing-related
    if (parsed.baseCommand === 'test' || lowerInput.includes('test') ||
        lowerInput.includes('테스트') || lowerInput.includes('validation') ||
        lowerInput.includes('검증') || lowerInput.includes('quality') ||
        lowerInput.includes('품질')) {
      if (!personas.includes('qa')) personas.push('qa');
    }

    // Analysis-related
    if (parsed.baseCommand === 'analyze' || parsed.modifiers.includes('strange') ||
        parsed.modifiers.includes('complex') || lowerInput.includes('investigate') ||
        lowerInput.includes('조사') || lowerInput.includes('root cause') ||
        lowerInput.includes('근본 원인')) {
      if (!personas.includes('analyzer')) personas.push('analyzer');
    }

    // DevOps-related
    if (lowerInput.includes('deploy') || lowerInput.includes('배포') ||
        lowerInput.includes('infrastructure') || lowerInput.includes('인프라') ||
        lowerInput.includes('cicd') || lowerInput.includes('automation') ||
        lowerInput.includes('자동화')) {
      if (!personas.includes('devops')) personas.push('devops');
    }

    // Mentor-related
    if (lowerInput.includes('explain') || lowerInput.includes('설명') ||
        lowerInput.includes('teach') || lowerInput.includes('가르쳐') ||
        lowerInput.includes('learn') || lowerInput.includes('배우') ||
        lowerInput.includes('understand') || lowerInput.includes('이해')) {
      if (!personas.includes('mentor')) personas.push('mentor');
    }

    // Scribe-related
    if (lowerInput.includes('document') || lowerInput.includes('문서') ||
        lowerInput.includes('write') || lowerInput.includes('작성') ||
        lowerInput.includes('readme') || lowerInput.includes('guide') ||
        lowerInput.includes('가이드')) {
      if (!personas.includes('scribe')) personas.push('scribe');
    }

    // Refactorer-related
    if (lowerInput.includes('refactor') || lowerInput.includes('리팩토링') ||
        lowerInput.includes('cleanup') || lowerInput.includes('정리') ||
        lowerInput.includes('technical debt') || lowerInput.includes('기술 부채') ||
        lowerInput.includes('simplify') || lowerInput.includes('간소화')) {
      if (!personas.includes('refactorer')) personas.push('refactorer');
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