/**
 * Claude Code Bridge Module
 * Converts natural language commands to Claude Code compatible commands
 */

import { EventEmitter } from 'events';
import { commandMatcher } from '../utils/command-matcher';
import { normalizePersonaNames } from '../utils/persona-mapping';

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
}

export class ClaudeCodeBridge extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Convert natural language to Claude Code command
   */
  async convertNaturalLanguage(naturalInput: string): Promise<ConversionResult> {
    try {
      this.emit('converting', { input: naturalInput });
      
      // Get command matches
      const matches = await commandMatcher.findBestMatches(naturalInput);
      
      if (!matches || matches.length === 0) {
        return {
          success: false,
          originalInput: naturalInput,
          error: 'No matching command found'
        };
      }
      
      const bestMatch = matches[0];
      
      // Build Claude Code command
      let convertedCommand = bestMatch.command;
      
      // Add target if specified
      if (bestMatch.target) {
        convertedCommand += ` ${bestMatch.target}`;
      }
      
      // Add flags
      if (bestMatch.flags && bestMatch.flags.length > 0) {
        convertedCommand += ' ' + bestMatch.flags.join(' ');
      }
      
      // Normalize personas
      const normalizedPersonas = normalizePersonaNames(bestMatch.personas || []);
      
      const result: ConversionResult = {
        success: true,
        originalInput: naturalInput,
        convertedCommand,
        suggestedPersonas: normalizedPersonas,
        confidence: bestMatch.confidence
      };
      
      this.emit('converted', result);
      return result;
      
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
   * Format command for Claude Code execution
   */
  formatForClaudeCode(command: string, personas?: string[], options?: any): string {
    // Claude Code expects commands in specific format
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
    // Extract key information from Claude's response
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
    // Extract first paragraph or summary
    const lines = response.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      return lines[0].substring(0, 200) + (lines[0].length > 200 ? '...' : '');
    }
    return 'No summary available';
  }

  private extractActions(response: string): string[] {
    const actions: string[] = [];
    
    // Look for action indicators
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
    
    return output.join('\n');
  }
}