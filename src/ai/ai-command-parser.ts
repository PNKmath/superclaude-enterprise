/**
 * AI-Enhanced Command Parser
 * Combines rule-based parsing with Gemini AI for complex natural language understanding
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { EnhancedCommandParser } from '../utils/enhanced-command-parser.js';
import { FlagValueParser } from './flag-value-parser.js';
import { GeminiCompressor } from './gemini-compressor.js';
import { commandParseCache } from '../utils/performance-cache.js';

export interface AIParserConfig {
  geminiApiKey: string;
  enableAI: boolean;
  complexityThreshold: number;
  maxTokens: number;
  useCompression: boolean;
}

export interface ParsedCommand {
  baseCommand: string;
  target?: string;
  targets?: string[];
  flags: Map<string, string | boolean | number>;
  flagContexts: Map<string, string>;
  naturalContext: string;
  additionalRequirements: string[];
  confidence: number;
  suggestedPersonas: string[];
  detectedIntent?: string;
}

interface AIAnalysisResult {
  intent: string;
  command: string;
  flags: Record<string, any>;
  flagContexts: Record<string, string>;
  additionalRequirements: string[];
  personas: string[];
  confidence: number;
}

export class AICommandParser {
  private gemini: GoogleGenerativeAI;
  private model: GenerativeModel;
  private ruleParser: EnhancedCommandParser;
  private flagValueParser: FlagValueParser;
  private compressor: GeminiCompressor;
  private config: AIParserConfig;
  private contextHistory: Map<string, any>;

  constructor(config: AIParserConfig) {
    this.config = config;
    this.gemini = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.gemini.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: config.maxTokens
      }
    });
    this.ruleParser = new EnhancedCommandParser();
    this.flagValueParser = new FlagValueParser();
    this.compressor = new GeminiCompressor(this.gemini);
    this.contextHistory = new Map();
  }

  async parse(input: string, context?: any): Promise<ParsedCommand> {
    try {
      // Check cache first
      const cacheKey = `ai_${commandParseCache.generateKey(input)}`;
      const cached = commandParseCache.get(cacheKey);
      if (cached) {
        return this.reconstructParsedCommand(cached);
      }

      // Step 1: Rule-based parsing
      const ruleResult = this.ruleParser.parse(input);
      
      // Step 2: Evaluate complexity (for logging/debugging)
      // const complexity = this.evaluateComplexity(input, ruleResult);
      
      // Step 3: Always use AI if enabled (ignore complexity threshold)
      if (!this.config.enableAI) {
        return this.convertToAIFormat(ruleResult);
      }

      // Step 4: AI-enhanced parsing
      try {
        const aiResult = await this.analyzeWithGemini(input, {
          ruleBasedHints: ruleResult,
          projectContext: context,
          history: this.getRecentHistory()
        });

        // Step 5: Merge results
        const finalResult = this.mergeAndOptimize(ruleResult, aiResult);
        
        // Cache the result
        commandParseCache.set(cacheKey, this.serializeParsedCommand(finalResult));
        
        return finalResult;
      } catch (aiError) {
        console.error('AI analysis failed, falling back to rule-based:', aiError);
        const fallbackResult = this.convertToAIFormat(ruleResult);
        fallbackResult.confidence *= 0.8; // Lower confidence due to fallback
        return fallbackResult;
      }
    } catch (error) {
      console.error('Parser error:', error);
      throw error;
    }
  }

  private evaluateComplexity(input: string, ruleResult: any): number {
    let complexity = 0.3; // Base complexity

    // Multiple requirements increase complexity
    const requirementIndicators = [
      '그리고', '또한', '동시에', '면서', 'and', 'also', 'while', 'with'
    ];
    requirementIndicators.forEach(indicator => {
      if (input.includes(indicator)) complexity += 0.1;
    });

    // Specific values and constraints
    const valuePatterns = [
      /\d+%/, /\d+GB/, /\d+초/, /\d+ms/, /버전/, /version/
    ];
    valuePatterns.forEach(pattern => {
      if (pattern.test(input)) complexity += 0.15;
    });

    // Multiple flags detected
    if (ruleResult.flags.size > 3) complexity += 0.2;

    // Long input suggests complexity
    if (input.length > 100) complexity += 0.1;

    // Environmental or conditional requirements
    if (input.includes('프로덕션') || input.includes('production') ||
        input.includes('조건') || input.includes('if')) {
      complexity += 0.15;
    }

    return Math.min(complexity, 1.0);
  }

  private async analyzeWithGemini(input: string, context: any): Promise<AIAnalysisResult> {
    const prompt = this.buildAIPrompt(input, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      return this.parseAIResponse(responseText);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private buildAIPrompt(input: string, context: any): string {
    const projectInfo = context.projectContext || {};
    const ruleHints = context.ruleBasedHints;
    
    return `
SuperClaude 명령어 분석 요청:

사용자 입력: "${input}"

프로젝트 정보:
- 언어: ${projectInfo.language || '알 수 없음'}
- 프레임워크: ${projectInfo.frameworks?.join(', ') || '없음'}
- 환경: ${projectInfo.environment || '개발'}

규칙 기반 초기 분석:
- 명령어: ${ruleHints.baseCommand}
- 감지된 플래그: ${Array.from(ruleHints.flags.keys()).join(', ')}
- 신뢰도: ${ruleHints.confidence}%

예시 분석 패턴:
1. "메모리를 2GB 이하로 유지하면서 성능 개선"
   → flags: { "performance": true, "memory-limit": "2GB" }
   → flagContexts: { "performance": "메모리 2GB 제약 하에서 최적화" }

2. "OWASP Top 10 기준으로 보안 검사"
   → flags: { "security": "owasp-top10", "validate": true }
   → additionalRequirements: ["OWASP Top 10 체크리스트 사용"]

3. "Chrome 최신 3개 버전에서 테스트"
   → flags: { "playwright": true, "browsers": "chrome:latest-3" }

요청사항:
1. 사용자의 정확한 의도 파악
2. 구체적인 값이 있는 플래그 추출 (예: --memory-limit=2GB)
3. 플래그로 표현하기 어려운 요구사항은 additionalRequirements에 포함
4. 관련 페르소나 추천
5. JSON 형식으로 응답

응답 형식:
{
  "intent": "사용자 의도 한 줄 요약",
  "command": "analyze|implement|improve|test|review|etc",
  "flags": {
    "flag_name": "value 또는 true",
    "memory-limit": "2GB",
    "test-coverage": "80%"
  },
  "flagContexts": {
    "flag_name": "플래그에 대한 추가 설명"
  },
  "additionalRequirements": [
    "플래그로 표현 안 되는 세부 요구사항"
  ],
  "personas": ["관련 페르소나 리스트"],
  "confidence": 0.0-1.0
}`;
  }

  private parseAIResponse(responseText: string): AIAnalysisResult {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.command || !parsed.flags) {
        throw new Error('Missing required fields in AI response');
      }

      return {
        intent: parsed.intent || '',
        command: parsed.command,
        flags: parsed.flags || {},
        flagContexts: parsed.flagContexts || {},
        additionalRequirements: parsed.additionalRequirements || [],
        personas: parsed.personas || [],
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private mergeAndOptimize(ruleResult: any, aiResult: AIAnalysisResult): ParsedCommand {
    const merged: ParsedCommand = {
      baseCommand: aiResult.command || ruleResult.baseCommand,
      target: ruleResult.target,
      targets: ruleResult.targets,
      flags: new Map(),
      flagContexts: new Map(),
      naturalContext: ruleResult.naturalContext,
      additionalRequirements: aiResult.additionalRequirements,
      confidence: Math.max(ruleResult.confidence, aiResult.confidence * 100),
      suggestedPersonas: this.mergePersonas(ruleResult.suggestedPersonas, aiResult.personas),
      detectedIntent: aiResult.intent
    };

    // Merge flags from rule-based parsing
    for (const [key, value] of ruleResult.flags) {
      merged.flags.set(key, value);
    }

    // Override/add AI-detected flags
    for (const [key, value] of Object.entries(aiResult.flags)) {
      merged.flags.set(key, value);
    }

    // Add flag contexts
    for (const [key, context] of Object.entries(aiResult.flagContexts)) {
      merged.flagContexts.set(key, context);
    }

    // Apply complex flag transformations
    const complexFlags = this.flagValueParser.parseComplexFlags(
      ruleResult.naturalContext,
      { flags: aiResult.flags, additionalRequirements: aiResult.additionalRequirements }
    );

    for (const [key, value] of complexFlags) {
      merged.flags.set(key, value);
    }

    return merged;
  }

  private convertToAIFormat(ruleResult: any): ParsedCommand {
    return {
      baseCommand: ruleResult.baseCommand,
      target: ruleResult.target,
      targets: ruleResult.targets,
      flags: ruleResult.flags,
      flagContexts: new Map(),
      naturalContext: ruleResult.naturalContext,
      additionalRequirements: [],
      confidence: ruleResult.confidence,
      suggestedPersonas: ruleResult.suggestedPersonas,
      detectedIntent: ruleResult.detectedIntent
    };
  }

  private mergePersonas(rulePersonas: string[], aiPersonas: string[]): string[] {
    const merged = new Set([...rulePersonas, ...aiPersonas]);
    return Array.from(merged);
  }

  private getRecentHistory(): string[] {
    // Get last 3 commands from history
    const history = Array.from(this.contextHistory.values()).slice(-3);
    return history.map(h => h.command || '').filter(Boolean);
  }

  private serializeParsedCommand(command: ParsedCommand): any {
    return {
      ...command,
      flags: Array.from(command.flags.entries()),
      flagContexts: Array.from(command.flagContexts.entries())
    };
  }

  private reconstructParsedCommand(serialized: any): ParsedCommand {
    return {
      ...serialized,
      flags: new Map(serialized.flags),
      flagContexts: new Map(serialized.flagContexts)
    };
  }

  getCompressor(): GeminiCompressor {
    return this.compressor;
  }

  // Build full command string for execution
  buildFullCommand(parsed: ParsedCommand): string {
    let command = `/sc:${parsed.baseCommand}`;

    // Sort flags by priority
    const priorityOrder = ['security', 'safe-mode', 'performance', 'validate'];
    const sortedFlags = new Map();

    // Add priority flags first
    for (const priority of priorityOrder) {
      if (parsed.flags.has(priority)) {
        sortedFlags.set(priority, parsed.flags.get(priority));
      }
    }

    // Add remaining flags
    for (const [key, value] of parsed.flags) {
      if (!sortedFlags.has(key)) {
        sortedFlags.set(key, value);
      }
    }

    // Build flag string
    for (const [key, value] of sortedFlags) {
      if (value === true) {
        command += ` --${key}`;
      } else {
        command += ` --${key}="${value}"`;
      }
    }

    // Add targets
    if (parsed.targets && parsed.targets.length > 0) {
      command += ` ${parsed.targets.join(' ')}`;
    }

    // Add additional requirements as comment
    if (parsed.additionalRequirements.length > 0) {
      command += ` # ${parsed.additionalRequirements.join('; ')}`;
    }

    return command;
  }
}