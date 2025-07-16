/**
 * Gemini Strategy Selector
 * Determines the optimal strategy (template/adaptive/hybrid) for Gemini execution
 */

import { 
  GeminiStrategy, 
  CommandContext, 
  ExtractionTemplate,
  AdaptiveSettings,
  CommonSettings 
} from './types.js';

export class GeminiStrategySelector {
  private templateDefinitions: Map<string, ExtractionTemplate>;

  constructor() {
    this.templateDefinitions = this.initializeTemplates();
  }

  /**
   * Select the optimal strategy based on command and context
   */
  selectStrategy(command: string, context: CommandContext): GeminiStrategy {
    // Check for explicit mode override
    if (context.flags?.useTemplate) {
      return this.createTemplateStrategy(command, context);
    }
    
    if (context.flags?.useAdaptive) {
      return this.createAdaptiveStrategy(command, context);
    }

    // Assess complexity to determine mode
    const complexity = this.assessComplexity(context);
    const hasTemplate = this.hasWellDefinedTemplate(command);
    const needsHybrid = this.needsHybridApproach(command, context);

    // Decision logic - Check hybrid first
    if (needsHybrid) {
      return this.createHybridStrategy(command, context);
    }

    if (complexity > 0.7 || this.isExploratoryCommand(command, context)) {
      return this.createAdaptiveStrategy(command, context);
    }

    if (hasTemplate && complexity < 0.4) {
      return this.createTemplateStrategy(command, context);
    }

    // Default to template mode
    return this.createTemplateStrategy(command, context);
  }

  /**
   * Assess the complexity of the context
   */
  assessComplexity(context: CommandContext): number {
    let complexity = 0;

    // File count factor
    const fileCount = context.targetFiles?.length || 0;
    if (fileCount > 10) complexity += 0.3;
    else if (fileCount > 5) complexity += 0.2;
    else if (fileCount > 1) complexity += 0.1;

    // Persona count factor
    const personaCount = context.personas?.length || 0;
    if (personaCount > 3) complexity += 0.2;
    else if (personaCount > 1) complexity += 0.1;

    // Command complexity
    if (this.isVagueCommand(context.command)) complexity += 0.2;
    if (context.command.includes('complex') || context.command.includes('strange')) complexity += 0.15;

    // Flag complexity
    const complexFlags = ['detailed', 'comprehensive', 'exploratory', 'production'];
    const flagComplexity = complexFlags.filter(f => context.flags?.[f]).length * 0.1;
    complexity += flagComplexity;

    // High-stakes personas
    if (context.personas?.includes('security')) complexity += 0.1;
    if (context.personas?.includes('architect')) complexity += 0.1;

    return Math.min(complexity, 1.0);
  }

  /**
   * Create a template-based strategy
   */
  private createTemplateStrategy(command: string, context: CommandContext): GeminiStrategy {
    const template = this.findTemplate(command);
    const confidence = template ? 0.9 : 0.6;

    return {
      mode: 'template',
      confidence,
      template: template || this.createGenericTemplate(command),
      common: this.extractCommonSettings(context)
    };
  }

  /**
   * Create an adaptive strategy
   */
  private createAdaptiveStrategy(_command: string, context: CommandContext): GeminiStrategy {
    const complexity = this.assessComplexity(context);
    const isHighStakes = this.isHighStakesOperation(context);

    const adaptive: AdaptiveSettings = {
      contextLevel: complexity > 0.7 || isHighStakes ? 'detailed' : 'standard',
      preservationRules: this.generatePreservationRules(context),
      validationEnabled: isHighStakes || complexity > 0.6
    };

    return {
      mode: 'adaptive',
      confidence: 0.75,
      adaptive,
      common: this.extractCommonSettings(context)
    };
  }

  /**
   * Create a hybrid strategy
   */
  private createHybridStrategy(command: string, context: CommandContext): GeminiStrategy {
    const template = this.findTemplate(command) || this.createGenericTemplate(command);
    
    const adaptive: AdaptiveSettings = {
      contextLevel: 'standard',
      preservationRules: this.generateEssentialRules(context),
      validationEnabled: false
    };

    return {
      mode: 'hybrid',
      confidence: 0.8,
      template,
      adaptive,
      common: this.extractCommonSettings(context)
    };
  }

  /**
   * Extract common settings from context
   */
  private extractCommonSettings(context: CommandContext): CommonSettings {
    const personas = context.personas || [];
    const constraints: string[] = [];

    // Extract constraints from flags
    if (context.flags?.maxLength) {
      constraints.push(`Maximum output length: ${context.flags.maxLength}`);
    }
    if (context.flags?.format) {
      constraints.push(`Output format: ${context.flags.format}`);
    }
    if (context.flags?.language) {
      constraints.push(`Language: ${context.flags.language}`);
    }

    return {
      personas,
      constraints
    };
  }

  /**
   * Check if command has a well-defined template
   */
  private hasWellDefinedTemplate(command: string): boolean {
    const normalizedCommand = this.normalizeCommand(command);
    return this.templateDefinitions.has(normalizedCommand);
  }

  /**
   * Find template for command
   */
  private findTemplate(command: string): ExtractionTemplate | undefined {
    const normalizedCommand = this.normalizeCommand(command);
    return this.templateDefinitions.get(normalizedCommand);
  }

  /**
   * Normalize command for template matching
   */
  private normalizeCommand(command: string): string {
    // Handle exact matches for flags
    if (command.includes('--security')) return '/sc:analyze --security';
    if (command.includes('--performance')) return '/sc:analyze --performance';
    
    // Extract base command
    const match = command.match(/^(\/sc:\w+)/);
    return match ? match[1] : command;
  }

  /**
   * Check if command needs hybrid approach
   */
  private needsHybridApproach(command: string, context: CommandContext): boolean {
    // Pattern-based implementation
    if (command.includes('following existing patterns') || 
        command.includes('following patterns') ||
        command.includes('new feature following')) {
      return true;
    }

    // Guided refactoring
    if (command.includes('improve') && command.includes('modern patterns')) {
      return true;
    }

    // Mixed requirements - but not for very complex tasks
    const hasTemplate = this.hasWellDefinedTemplate(command);
    const hasComplexRequirements = context.flags?.preserveApi || 
                                   (context.personas && context.personas.length >= 2);
    const complexity = this.assessComplexity(context);
    
    return hasTemplate && hasComplexRequirements && complexity < 0.7;
  }

  /**
   * Check if command is exploratory
   */
  private isExploratoryCommand(command: string, context: CommandContext): boolean {
    const exploratoryKeywords = [
      'why', 'strange', 'debug', 'investigate', 'explore',
      'potential', 'possible', 'might', 'could'
    ];

    return exploratoryKeywords.some(keyword => 
      command.toLowerCase().includes(keyword)
    ) || context.flags?.exploratory === true;
  }

  /**
   * Check if command is vague
   */
  private isVagueCommand(command: string): boolean {
    const vaguePatterns = [
      'do something',
      'check this',
      'look at',
      'see what',
      'find out'
    ];

    return vaguePatterns.some(pattern => 
      command.toLowerCase().includes(pattern)
    );
  }

  /**
   * Check if operation is high-stakes
   */
  private isHighStakesOperation(context: CommandContext): boolean {
    return !!(
      context.flags?.production ||
      context.personas?.includes('security') ||
      context.command.includes('breach') ||
      context.command.includes('vulnerability')
    );
  }

  /**
   * Generate preservation rules for adaptive mode
   */
  private generatePreservationRules(context: CommandContext): string[] {
    const rules: string[] = [];

    if (context.personas?.includes('security')) {
      rules.push('preserve_all_security_findings');
      rules.push('maintain_cve_cwe_references');
    }

    if (context.personas?.includes('performance')) {
      rules.push('preserve_performance_metrics');
      rules.push('maintain_measurement_accuracy');
    }

    if (context.targetFiles && context.targetFiles.length > 0) {
      rules.push('preserve_file_specific_context');
      rules.push('maintain_cross_file_relationships');
    }

    return rules;
  }

  /**
   * Generate essential rules for hybrid mode
   */
  private generateEssentialRules(context: CommandContext): string[] {
    const rules: string[] = [];

    if (context.flags?.preserveApi) {
      rules.push('preserve_api_compatibility');
    }

    if (context.personas?.includes('architect')) {
      rules.push('maintain_architectural_patterns');
    }

    rules.push('preserve_critical_information');
    
    return rules;
  }

  /**
   * Create generic template
   */
  private createGenericTemplate(command: string): ExtractionTemplate {
    const baseCommand = command.split(' ')[0].replace('/sc:', '');
    
    return {
      type: baseCommand,
      requiredFields: ['summary', 'details', 'recommendations'],
      outputFormat: 'Structured analysis with clear sections',
      specificInstructions: [
        'Provide comprehensive analysis',
        'Include specific examples',
        'Make actionable recommendations'
      ]
    };
  }

  /**
   * Initialize template definitions
   */
  private initializeTemplates(): Map<string, ExtractionTemplate> {
    const templates = new Map<string, ExtractionTemplate>();

    // Basic analyze template
    templates.set('/sc:analyze', {
      type: 'analyze',
      requiredFields: ['summary', 'issues', 'recommendations'],
      outputFormat: 'Structured analysis report',
      specificInstructions: ['Identify all issues', 'Provide fixes']
    });

    // Security analysis template
    templates.set('/sc:analyze --security', {
      type: 'security-analysis',
      requiredFields: ['vulnerability_type', 'cwe_id', 'risk_level', 'mitigation'],
      outputFormat: 'Security vulnerability report',
      specificInstructions: ['Include CWE IDs', 'Assess risk levels']
    });

    // Performance analysis template
    templates.set('/sc:analyze --performance', {
      type: 'performance-analysis',
      requiredFields: ['bottleneck_type', 'measured_time', 'optimization'],
      outputFormat: 'Performance analysis report',
      specificInstructions: ['Measure performance', 'Quantify improvements']
    });

    // Implementation template
    templates.set('/sc:implement', {
      type: 'implement',
      requiredFields: ['requirements_understood', 'implementation', 'tests'],
      outputFormat: 'Complete implementation with tests',
      specificInstructions: ['Generate runnable code', 'Include tests']
    });

    // Improve template
    templates.set('/sc:improve', {
      type: 'improve',
      requiredFields: ['current_issues', 'improvements', 'benefits'],
      outputFormat: 'Improvement plan with before/after',
      specificInstructions: ['Show comparisons', 'Quantify benefits']
    });

    return templates;
  }
}