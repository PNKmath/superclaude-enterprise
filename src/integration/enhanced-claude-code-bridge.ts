/**
 * Enhanced Claude Code Bridge Module
 * Integrates context-preserving capabilities while maintaining backward compatibility
 */

import { EventEmitter } from 'events';
import { EnhancedCommandParser } from '../utils/enhanced-command-parser.js';
import { normalizePersonaNames } from '../utils/persona-mapping.js';
import { SessionManager } from '../integrations/session/SessionManager.js';

// Maintain backward compatibility with existing interfaces
export interface ClaudeCodeCommand {
  type: 'direct' | 'natural';
  command: string;
  personas?: string[];
  flags?: string[];
  confidence?: number;
}

export interface ConversionResult {
  success: boolean;
  originalInput: string;
  convertedCommand?: string;
  suggestedPersonas?: string[];
  confidence?: number;
  error?: string;
  // Enhanced properties
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

export class EnhancedClaudeCodeBridge extends EventEmitter {
  private parser: EnhancedCommandParser;
  private sessionManager: SessionManager;
  private enableEnhancedMode: boolean;

  constructor(enableEnhanced: boolean = true) {
    super();
    this.parser = new EnhancedCommandParser();
    this.sessionManager = new SessionManager();
    this.enableEnhancedMode = enableEnhanced;
  }

  /**
   * Convert natural language to Claude Code command
   * Maintains backward compatibility while adding enhanced features
   */
  async convertNaturalLanguage(
    naturalInput: string,
    options?: {
      sessionId?: string;
      previousContext?: any;
      turnNumber?: number;
    }
  ): Promise<ConversionResult> {
    try {
      this.emit('converting', { input: naturalInput, enhanced: this.enableEnhancedMode });
      
      // Use enhanced parser if enabled
      if (this.enableEnhancedMode) {
        return await this.enhancedConvert(naturalInput, options);
      }
      
      // Fall back to legacy behavior for backward compatibility
      return await this.legacyConvert(naturalInput);
      
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        originalInput: naturalInput,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced conversion with full context preservation
   */
  private async enhancedConvert(
    naturalInput: string,
    options?: any
  ): Promise<ConversionResult> {
    // Parse with enhanced parser
    const parsed = this.parser.parse(naturalInput);
    
    // Handle session context if provided
    if (options?.sessionId) {
      const session = await this.sessionManager.getOrCreateSession(
        options.userId || 'default',
        options.sessionId
      );
      
      // Merge with previous context
      if (session.turns.length > 0) {
        const lastTurn = session.turns[session.turns.length - 1];
        this.mergeContexts(parsed, lastTurn.context);
      }
    }
    
    // Build full SuperClaude command
    const fullCommand = this.buildEnhancedCommand(parsed);
    
    // Normalize personas
    const normalizedPersonas = normalizePersonaNames(parsed.suggestedPersonas);
    
    const result: ConversionResult = {
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
        turnNumber: options.turnNumber || 0,
        previousContext: options.previousContext
      };
      
      // Add turn to session
      await this.sessionManager.addTurn(options.sessionId, {
        input: naturalInput,
        command: fullCommand,
        result: result,
        timestamp: new Date(),
        context: result.context
      });
    }
    
    this.emit('converted', result);
    return result;
  }

  /**
   * Legacy conversion for backward compatibility
   */
  private async legacyConvert(naturalInput: string): Promise<ConversionResult> {
    // Import legacy command matcher
    const { commandMatcher } = await import('../utils/command-matcher.js');
    
    const matches = await commandMatcher.findBestMatches(naturalInput);
    
    if (!matches || matches.length === 0) {
      return {
        success: false,
        originalInput: naturalInput,
        error: 'No matching command found'
      };
    }
    
    const bestMatch = matches[0];
    
    // Build legacy command
    let convertedCommand = bestMatch.command;
    
    if (bestMatch.target) {
      convertedCommand += ` ${bestMatch.target}`;
    }
    
    if (bestMatch.flags && bestMatch.flags.length > 0) {
      convertedCommand += ' ' + bestMatch.flags.join(' ');
    }
    
    const normalizedPersonas = normalizePersonaNames(bestMatch.personas || []);
    
    return {
      success: true,
      originalInput: naturalInput,
      convertedCommand,
      suggestedPersonas: normalizedPersonas,
      confidence: bestMatch.confidence
    };
  }

  /**
   * Build enhanced command with all context
   */
  private buildEnhancedCommand(parsed: any): string {
    let command = `/sc:${parsed.baseCommand}`;
    
    // Add flags in order of importance
    const flagOrder = ['security', 'performance', 'pattern', 'think', 'validate'];
    
    // Add ordered flags first
    for (const flag of flagOrder) {
      if (parsed.flags.has(flag)) {
        const value = parsed.flags.get(flag);
        if (value === true) {
          command += ` --${flag}`;
        } else {
          command += ` --${flag}=${value}`;
        }
      }
    }
    
    // Add remaining flags
    for (const [key, value] of parsed.flags) {
      if (!flagOrder.includes(key)) {
        if (value === true) {
          command += ` --${key}`;
        } else {
          command += ` --${key}=${value}`;
        }
      }
    }
    
    // Add targets
    if (parsed.targets && parsed.targets.length > 0) {
      command += ` ${parsed.targets.join(' ')}`;
    } else if (parsed.target) {
      command += ` ${parsed.target}`;
    }
    
    return command;
  }

  /**
   * Merge contexts for session continuity
   */
  private mergeContexts(current: any, previous: any): void {
    // Inherit target if not specified
    if (!current.target && previous.target) {
      current.target = previous.target;
      current.targets = [previous.target];
    }
    
    // Inherit relevant flags
    const inheritableFlags = ['security', 'performance', 'pattern', 'think'];
    for (const flag of inheritableFlags) {
      if (previous.flags?.has(flag) && !current.flags.has(flag)) {
        current.flags.set(flag, previous.flags.get(flag));
      }
    }
    
    // Merge personas intelligently
    if (previous.suggestedPersonas) {
      const relevantPersonas = previous.suggestedPersonas.filter((p: string) =>
        this.isPersonaRelevant(p, current.baseCommand)
      );
      current.suggestedPersonas = [...new Set([
        ...current.suggestedPersonas,
        ...relevantPersonas
      ])];
    }
  }

  /**
   * Check if persona is relevant for command
   */
  private isPersonaRelevant(persona: string, command: string): boolean {
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
   * Format command for Claude Code execution (backward compatible)
   */
  formatForClaudeCode(command: string, personas?: string[], options?: any): string {
    let formattedCommand = command;
    
    // Add persona flags if specified
    if (personas && personas.length > 0) {
      const personaFlags = personas.map(p => `--persona-${p}`).join(' ');
      formattedCommand += ` ${personaFlags}`;
    }
    
    // Add other options
    if (options) {
      if (options.think) {
        formattedCommand += ' --think';
      }
      if (options.validate) {
        formattedCommand += ' --validate';
      }
      if (options.scope) {
        formattedCommand += ` --scope ${options.scope}`;
      }
    }
    
    return formattedCommand;
  }

  /**
   * Parse Claude Code response for natural language
   */
  parseClaudeResponse(response: string): any {
    const result = {
      success: true,
      hasCode: response.includes('```'),
      hasTasks: response.includes('TodoWrite') || response.includes('TODO'),
      hasErrors: response.includes('Error') || response.includes('Failed'),
      summary: this.extractSummary(response),
      actions: this.extractActions(response)
    };
    
    return result;
  }

  private extractSummary(response: string): string {
    const lines = response.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      return lines[0].substring(0, 200) + (lines[0].length > 200 ? '...' : '');
    }
    return 'No summary available';
  }

  private extractActions(response: string): string[] {
    const actions: string[] = [];
    
    const actionPatterns = [
      /Created? (.+)/gi,
      /Updated? (.+)/gi,
      /Modified? (.+)/gi,
      /Analyzed? (.+)/gi,
      /Fixed? (.+)/gi,
      /Implemented? (.+)/gi
    ];
    
    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        actions.push(match[0]);
      }
    }
    
    return actions;
  }

  /**
   * Generate hook-compatible output
   */
  generateHookOutput(conversion: ConversionResult): string {
    if (!conversion.success) {
      return `Error: ${conversion.error}`;
    }
    
    const output = [
      '🤖 Natural Language Processing',
      `Input: "${conversion.originalInput}"`,
      `Command: ${conversion.convertedCommand}`,
      `Confidence: ${conversion.confidence}%`
    ];
    
    if (conversion.suggestedPersonas && conversion.suggestedPersonas.length > 0) {
      output.push(`Personas: ${conversion.suggestedPersonas.join(', ')}`);
    }
    
    // Add enhanced info if available
    if (conversion.context?.detectedIntent) {
      output.push(`Intent: ${conversion.context.detectedIntent}`);
    }
    
    if (conversion.context?.needsHybridMode) {
      output.push(`Mode: Hybrid (Pattern-based)`);
    }
    
    return output.join('\n');
  }

  /**
   * Get session manager for external use
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Enable/disable enhanced mode
   */
  setEnhancedMode(enabled: boolean): void {
    this.enableEnhancedMode = enabled;
  }
}

// Export as default for drop-in replacement
export { EnhancedClaudeCodeBridge as ClaudeCodeBridge };