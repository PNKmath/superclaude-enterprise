/**
 * Context-Preserving Claude Code Bridge
 * Enhanced version that maintains full command context for Gemini integration
 */

import { EventEmitter } from 'events';
import { EnhancedCommandParser, ParsedCommand } from '../utils/enhanced-command-parser.js';
import { normalizePersonaNames } from '../utils/persona-mapping.js';

export interface EnhancedConversionResult {
  success: boolean;
  originalInput: string;
  convertedCommand: string;
  suggestedPersonas: string[];
  confidence: number;
  error?: string;
  context?: {
    flags: Map<string, string | boolean>;
    target?: string;
    targets?: string[];
    naturalContext: string;
    detectedIntent: string;
    needsHybridMode?: boolean;
  };
  sessionInfo?: {
    sessionId?: string;
    turnNumber?: number;
    previousContext?: any;
  };
}

export class ContextPreservingBridge extends EventEmitter {
  private parser: EnhancedCommandParser;
  private sessionContexts: Map<string, any> = new Map();

  constructor() {
    super();
    this.parser = new EnhancedCommandParser();
  }

  /**
   * Convert natural language to SuperClaude command with full context preservation
   */
  async convertNaturalLanguage(
    naturalInput: string,
    options?: {
      sessionId?: string;
      previousContext?: any;
      turnNumber?: number;
    }
  ): Promise<EnhancedConversionResult> {
    try {
      this.emit('converting', { input: naturalInput, options });
      
      // Parse the natural language input
      const parsed = this.parser.parse(naturalInput);
      
      // Build the full SuperClaude command
      const fullCommand = this.parser.buildFullCommand(parsed);
      
      // Normalize and enhance personas
      const normalizedPersonas = normalizePersonaNames(parsed.suggestedPersonas);
      
      // If session context exists, merge with previous context
      if (options?.sessionId && options.previousContext) {
        this.mergeWithPreviousContext(parsed, options.previousContext);
      }
      
      const result: EnhancedConversionResult = {
        success: true,
        originalInput: naturalInput,
        convertedCommand: fullCommand,
        suggestedPersonas: normalizedPersonas,
        confidence: parsed.confidence,
        context: {
          flags: parsed.flags,
          target: parsed.target,
          targets: parsed.targets,
          naturalContext: parsed.naturalContext,
          detectedIntent: parsed.detectedIntent,
          needsHybridMode: parsed.flags.has('hybrid-mode')
        }
      };
      
      // Add session info if available
      if (options?.sessionId) {
        result.sessionInfo = {
          sessionId: options.sessionId,
          turnNumber: options.turnNumber,
          previousContext: options.previousContext
        };
        
        // Store session context for future reference
        this.sessionContexts.set(options.sessionId, result.context);
      }
      
      this.emit('converted', result);
      return result;
      
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        originalInput: naturalInput,
        convertedCommand: '',
        suggestedPersonas: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Merge current context with previous context for session continuity
   */
  private mergeWithPreviousContext(parsed: ParsedCommand, previousContext: any): void {
    // If previous command was analyze and current is fix/implement, maintain target
    if (!parsed.target && previousContext.target) {
      parsed.target = previousContext.target;
      parsed.targets = previousContext.targets || [previousContext.target];
    }
    
    // Inherit certain flags from previous context
    const inheritableFlags = ['security', 'performance', 'pattern'];
    for (const flag of inheritableFlags) {
      if (previousContext.flags?.has(flag) && !parsed.flags.has(flag)) {
        parsed.flags.set(flag, previousContext.flags.get(flag));
      }
    }
    
    // Merge personas intelligently
    if (previousContext.suggestedPersonas) {
      const mergedPersonas = new Set([
        ...parsed.suggestedPersonas,
        ...previousContext.suggestedPersonas.filter((p: string) => 
          this.isRelevantPersona(p, parsed.baseCommand)
        )
      ]);
      parsed.suggestedPersonas = Array.from(mergedPersonas);
    }
  }

  /**
   * Check if a persona is relevant for the current command
   */
  private isRelevantPersona(persona: string, command: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      'analyze': ['analyzer', 'security', 'performance', 'architect'],
      'implement': ['backend', 'frontend', 'architect', 'security'],
      'improve': ['refactorer', 'performance', 'architect'],
      'test': ['qa', 'backend', 'frontend'],
      'review': ['qa', 'analyzer', 'security']
    };
    
    return relevanceMap[command]?.includes(persona) || false;
  }

  /**
   * Get session context for multi-turn conversations
   */
  getSessionContext(sessionId: string): any {
    return this.sessionContexts.get(sessionId);
  }

  /**
   * Clear session context
   */
  clearSessionContext(sessionId: string): void {
    this.sessionContexts.delete(sessionId);
  }

  /**
   * Validate and enhance the converted command
   */
  validateCommand(result: EnhancedConversionResult): boolean {
    // Check if command has minimum required components
    if (!result.convertedCommand || !result.convertedCommand.startsWith('/sc:')) {
      return false;
    }
    
    // Verify personas are valid
    if (result.suggestedPersonas.length === 0) {
      result.suggestedPersonas = ['analyzer']; // Default fallback
    }
    
    // Ensure confidence is reasonable
    if (result.confidence < 30) {
      this.emit('low-confidence', result);
    }
    
    return true;
  }

  /**
   * Generate execution context for Gemini
   */
  generateGeminiContext(result: EnhancedConversionResult): any {
    return {
      command: result.convertedCommand,
      personas: result.suggestedPersonas,
      targetFiles: result.context?.targets || [],
      flags: result.context?.flags ? Object.fromEntries(result.context.flags) : {},
      naturalLanguageInput: result.originalInput,
      detectedIntent: result.context?.detectedIntent,
      needsHybridMode: result.context?.needsHybridMode,
      confidence: result.confidence,
      sessionInfo: result.sessionInfo
    };
  }
}