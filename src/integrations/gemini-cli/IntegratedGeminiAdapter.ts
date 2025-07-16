/**
 * Integrated Gemini Adapter
 * Combines template-based and adaptive approaches for optimal context preservation
 */

import { Logger } from 'pino';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { GeminiAdapter, GeminiConfig, BackendDecision } from './GeminiAdapter.js';
import { GeminiStrategySelector } from './GeminiStrategySelector.js';
import { GeminiExtractionTemplates } from './GeminiExtractionTemplates.js';
import { 
  CommandContext, 
  GeminiStrategy, 
  GeminiExecutionResult,
  ValidationResult 
} from './types.js';

const execAsync = promisify(exec);

export interface IntegratedGeminiConfig extends GeminiConfig {
  strategy: {
    autoSelectMode: boolean;
    defaultMode: 'template' | 'adaptive' | 'hybrid';
    validationThreshold: number;
    maxRetries: number;
  };
}

export class IntegratedGeminiAdapter extends GeminiAdapter {
  private strategySelector: GeminiStrategySelector;
  private integratedConfig: IntegratedGeminiConfig;
  private sessionHistory: Map<string, Array<{command: string; output: string}>> = new Map();
  
  constructor(logger: Logger, config: IntegratedGeminiConfig) {
    super(logger, config);
    this.integratedConfig = config;
    this.strategySelector = new GeminiStrategySelector();
  }
  
  /**
   * Execute with Gemini using integrated strategy system
   */
  async executeWithGemini(command: string, context: CommandContext): Promise<GeminiExecutionResult> {
    const startTime = Date.now();
    
    // Generate session ID if not provided
    if (!context.sessionId) {
      context.sessionId = this.generateSessionId();
    }
    
    // Select strategy
    const strategy = this.integratedConfig.strategy.autoSelectMode
      ? this.strategySelector.selectStrategy(command, context)
      : this.createDefaultStrategy(context);
    
    this.logger.info({
      sessionId: context.sessionId,
      strategy: strategy.mode,
      confidence: strategy.confidence,
      command: command
    }, 'Executing with integrated Gemini adapter');
    
    let result: GeminiExecutionResult;
    let retries = 0;
    
    // Execute based on strategy mode
    while (retries <= this.integratedConfig.strategy.maxRetries) {
      try {
        switch (strategy.mode) {
          case 'template':
            result = await this.executeTemplateMode(command, context, strategy);
            break;
            
          case 'adaptive':
            result = await this.executeAdaptiveMode(command, context, strategy);
            break;
            
          case 'hybrid':
            result = await this.executeHybridMode(command, context, strategy);
            break;
            
          default:
            throw new Error(`Unknown strategy mode: ${strategy.mode}`);
        }
        
        // Validate if needed
        if (this.shouldValidate(strategy, context)) {
          const validation = await this.validateOutput(result, command, strategy);
          
          if (validation.valid || validation.coverage! >= this.integratedConfig.strategy.validationThreshold) {
            result.validation = validation;
            break;
          } else {
            this.logger.warn({
              validation,
              retry: retries + 1
            }, 'Validation failed, retrying');
            retries++;
          }
        } else {
          break;
        }
      } catch (error) {
        this.logger.error({ error, retry: retries }, 'Execution failed');
        if (retries < this.integratedConfig.strategy.maxRetries) {
          retries++;
        } else {
          throw error;
        }
      }
    }
    
    // Update session history
    this.updateSessionHistory(context.sessionId, command, result!.output);
    
    // Add metadata
    result!.metadata = {
      sessionId: context.sessionId,
      executionTime: Date.now() - startTime,
      retries,
      contextValidated: !!result!.validation?.valid,
      preservationLevel: strategy.adaptive?.contextLevel || 'standard',
      strategy
    };
    
    return result!;
  }
  
  /**
   * Execute in template mode
   */
  private async executeTemplateMode(
    command: string, 
    context: CommandContext, 
    _strategy: GeminiStrategy
  ): Promise<GeminiExecutionResult> {
    // Generate extraction prompt
    const extractionPrompt = GeminiExtractionTemplates.generateExtractionPrompt(
      command,
      context
    );
    
    // Create prompt file
    const promptFile = await this.createTempFile(extractionPrompt, 'prompt');
    
    // Build Gemini command
    const geminiCommand = this.buildGeminiCommand(command, context, promptFile);
    
    // Execute
    const { stdout, stderr } = await execAsync(geminiCommand, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000
    });
    
    if (stderr && !stderr.includes('Warning:')) {
      this.logger.warn({ stderr }, 'Gemini stderr output');
    }
    
    // Clean up
    await this.cleanupTempFile(promptFile);
    
    return {
      success: true,
      output: stdout,
      backend: 'gemini'
    };
  }
  
  /**
   * Execute in adaptive mode
   */
  private async executeAdaptiveMode(
    command: string,
    context: CommandContext,
    strategy: GeminiStrategy
  ): Promise<GeminiExecutionResult> {
    // Build comprehensive prompt with preservation rules
    const adaptivePrompt = this.buildAdaptivePrompt(command, context, strategy);
    
    // Add session history if available
    const history = this.sessionHistory.get(context.sessionId || '');
    if (history && history.length > 0) {
      adaptivePrompt.push('\n## Previous Context:');
      history.slice(-3).forEach((entry, i) => {
        adaptivePrompt.push(`### Interaction ${i + 1}:`);
        adaptivePrompt.push(`Command: ${entry.command}`);
        adaptivePrompt.push(`Summary: ${entry.output.substring(0, 500)}...`);
      });
    }
    
    // Create files
    const promptFile = await this.createTempFile(adaptivePrompt.join('\n'), 'adaptive-prompt');
    
    // Build command with extra flags for detailed output
    const geminiCommand = this.buildGeminiCommand(command, context, promptFile);
    const enhancedCommand = strategy.adaptive?.contextLevel === 'detailed' 
      ? `${geminiCommand} --verbose`
      : geminiCommand;
    
    // Execute
    const { stdout, stderr } = await execAsync(enhancedCommand, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000
    });
    
    if (stderr && !stderr.includes('Warning:')) {
      this.logger.warn({ stderr }, 'Gemini stderr output');
    }
    
    // Clean up
    await this.cleanupTempFile(promptFile);
    
    return {
      success: true,
      output: stdout,
      backend: 'gemini'
    };
  }
  
  /**
   * Execute in hybrid mode
   */
  private async executeHybridMode(
    command: string,
    context: CommandContext,
    strategy: GeminiStrategy
  ): Promise<GeminiExecutionResult> {
    // Combine template structure with adaptive preservation
    const templatePrompt = GeminiExtractionTemplates.generateExtractionPrompt(
      command,
      context
    );
    
    const adaptiveEnhancements = this.buildAdaptivePrompt(command, context, strategy);
    
    // Merge prompts
    const hybridPrompt = [
      '# HYBRID MODE EXECUTION',
      '## Structured Template Requirements:',
      templatePrompt,
      '',
      '## Additional Context Preservation:',
      ...adaptiveEnhancements.slice(0, 5), // Take key preservation rules
      '',
      '## Output Requirements:',
      '1. Follow the template structure above',
      '2. Preserve all context specified in preservation rules',
      '3. Include any additional relevant findings'
    ].join('\n');
    
    // Create prompt file
    const promptFile = await this.createTempFile(hybridPrompt, 'hybrid-prompt');
    
    // Execute
    const geminiCommand = this.buildGeminiCommand(command, context, promptFile);
    const { stdout, stderr } = await execAsync(geminiCommand, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000
    });
    
    if (stderr && !stderr.includes('Warning:')) {
      this.logger.warn({ stderr }, 'Gemini stderr output');
    }
    
    // Clean up
    await this.cleanupTempFile(promptFile);
    
    return {
      success: true,
      output: stdout,
      backend: 'gemini'
    };
  }
  
  /**
   * Build adaptive prompt
   */
  private buildAdaptivePrompt(
    command: string,
    _context: CommandContext,
    strategy: GeminiStrategy
  ): string[] {
    const prompt: string[] = [];
    
    // Base instructions
    prompt.push('# Context-Aware Analysis');
    prompt.push(`You are analyzing: ${command}`);
    
    // Add preservation rules
    if (strategy.adaptive?.preservationRules.length) {
      prompt.push('\n## Critical Preservation Rules:');
      strategy.adaptive.preservationRules.forEach(rule => {
        prompt.push(`- ${rule}`);
      });
    }
    
    // Add persona-specific guidance
    if (strategy.common.personas.length > 0) {
      prompt.push('\n## Active Personas:');
      strategy.common.personas.forEach(persona => {
        prompt.push(`- ${persona}: ${this.getPersonaGuidance(persona)}`);
      });
    }
    
    // Add constraints
    if (strategy.common.constraints.length > 0) {
      prompt.push('\n## Constraints:');
      strategy.common.constraints.forEach(constraint => {
        prompt.push(`- ${constraint}`);
      });
    }
    
    // Context level specific instructions
    switch (strategy.adaptive?.contextLevel) {
      case 'detailed':
        prompt.push('\n## Detail Level: EXHAUSTIVE');
        prompt.push('- Include ALL findings, even minor ones');
        prompt.push('- Preserve exact line numbers and code snippets');
        prompt.push('- Maintain complete context');
        break;
      case 'standard':
        prompt.push('\n## Detail Level: STANDARD');
        prompt.push('- Include significant findings');
        prompt.push('- Preserve key context');
        break;
      case 'minimal':
        prompt.push('\n## Detail Level: MINIMAL');
        prompt.push('- Focus on critical findings only');
        break;
    }
    
    return prompt;
  }
  
  /**
   * Build Gemini command
   */
  private buildGeminiCommand(
    command: string,
    _context: CommandContext,
    promptFile: string
  ): string {
    // Transform SuperClaude command to Gemini format
    const baseCommand = this.transformToGeminiCommand(command);
    
    // Add prompt file
    let geminiCmd = `${baseCommand} --prompt-file "${promptFile}"`;
    
    // Add target files
    if (_context.targetFiles && _context.targetFiles.length > 0) {
      geminiCmd += ` ${_context.targetFiles.map((f: string) => `"${f}"`).join(' ')}`;
    }
    
    // Add flags
    if (_context.flags) {
      Object.entries(_context.flags).forEach(([flag, value]) => {
        if (value === true) {
          geminiCmd += ` --${flag}`;
        } else if (value !== false) {
          geminiCmd += ` --${flag}="${value}"`;
        }
      });
    }
    
    return geminiCmd;
  }
  
  /**
   * Transform SuperClaude command to Gemini command
   */
  private transformToGeminiCommand(command: string): string {
    const mappings: Record<string, string> = {
      '/sc:analyze': 'gemini analyze',
      '/sc:review': 'gemini review',
      '/sc:implement': 'gemini generate',
      '/sc:explain': 'gemini explain',
      '/sc:improve': 'gemini refactor'
    };
    
    for (const [sc, gemini] of Object.entries(mappings)) {
      if (command.startsWith(sc)) {
        return command.replace(sc, gemini);
      }
    }
    
    return `gemini ${command}`;
  }
  
  /**
   * Validate output
   */
  private async validateOutput(
    result: GeminiExecutionResult,
    command: string,
    strategy: GeminiStrategy
  ): Promise<ValidationResult> {
    // Template validation
    if (strategy.mode === 'template' || strategy.mode === 'hybrid') {
      return GeminiExtractionTemplates.validateExtraction(result.output, command);
    }
    
    // Adaptive validation - check for preservation rules
    const issues: string[] = [];
    let preserved = 0;
    
    if (strategy.adaptive?.preservationRules) {
      strategy.adaptive.preservationRules.forEach(rule => {
        // Simple keyword check - could be more sophisticated
        const keywords = rule.toLowerCase().split('_').join(' ');
        if (result.output.toLowerCase().includes(keywords)) {
          preserved++;
        } else {
          issues.push(`Missing preservation rule: ${rule}`);
        }
      });
    }
    
    const coverage = strategy.adaptive?.preservationRules.length 
      ? preserved / strategy.adaptive.preservationRules.length
      : 1.0;
    
    return {
      valid: issues.length === 0,
      issues,
      coverage,
      contextLossScore: 1.0 - coverage
    };
  }
  
  /**
   * Check if validation is needed
   */
  private shouldValidate(strategy: GeminiStrategy, context: CommandContext): boolean {
    return !!(
      strategy.adaptive?.validationEnabled ||
      strategy.mode === 'hybrid' ||
      context.flags?.validate ||
      context.personas?.includes('security') ||
      context.personas?.includes('qa')
    );
  }
  
  /**
   * Create default strategy
   */
  private createDefaultStrategy(_context: CommandContext): GeminiStrategy {
    return {
      mode: this.integratedConfig.strategy.defaultMode,
      confidence: 0.5,
      common: {
        personas: _context.personas || [],
        constraints: []
      }
    };
  }
  
  /**
   * Get persona-specific guidance
   */
  private getPersonaGuidance(persona: string): string {
    const guidance: Record<string, string> = {
      security: 'Focus on vulnerabilities, risks, and mitigation strategies',
      performance: 'Analyze bottlenecks, metrics, and optimization opportunities',
      architect: 'Consider system design, patterns, and architectural implications',
      qa: 'Identify test gaps, edge cases, and quality issues',
      backend: 'Focus on API design, data flow, and system reliability',
      frontend: 'Consider UX, accessibility, and client-side performance'
    };
    
    return guidance[persona] || 'Apply domain-specific expertise';
  }
  
  /**
   * Update session history
   */
  private updateSessionHistory(sessionId: string, command: string, output: string): void {
    const history = this.sessionHistory.get(sessionId) || [];
    
    // Keep last 5 interactions
    if (history.length >= 5) {
      history.shift();
    }
    
    history.push({ command, output: output.substring(0, 1000) });
    this.sessionHistory.set(sessionId, history);
  }
  
  /**
   * Create temporary file
   */
  private async createTempFile(content: string, prefix: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join('/tmp', `gemini-${prefix}-`));
    const filePath = path.join(tmpDir, 'content.md');
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }
  
  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn({ error, filePath }, 'Failed to cleanup temp file');
    }
  }
  
  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Override makeBackendDecision to consider strategy complexity
   */
  async makeBackendDecision(context: CommandContext): Promise<BackendDecision> {
    const baseDecision = await super.makeBackendDecision(context);
    
    // If using adaptive or hybrid mode, consider complexity
    if (this.integratedConfig.strategy.autoSelectMode) {
      const strategy = this.strategySelector.selectStrategy(context.command, context);
      
      // High complexity adaptive mode might benefit from Claude
      if (strategy.mode === 'adaptive' && 
          strategy.adaptive?.contextLevel === 'detailed' &&
          baseDecision.backend === 'gemini') {
        
        const complexity = this.strategySelector.assessComplexity(context);
        if (complexity > 0.8) {
          return {
            backend: 'claude',
            reason: 'Very high complexity - Claude recommended for detailed context preservation',
            estimatedCost: await this.estimateCost(context, 'claude')
          };
        }
      }
    }
    
    return baseDecision;
  }
}