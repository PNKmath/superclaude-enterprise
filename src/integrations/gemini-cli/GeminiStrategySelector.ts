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
import { HybridModeDetector } from './HybridModeDetector.js';

export class GeminiStrategySelector {
  private templateDefinitions: Map<string, ExtractionTemplate>;
  private hybridDetector: HybridModeDetector;

  constructor() {
    this.templateDefinitions = this.initializeTemplates();
    this.hybridDetector = new HybridModeDetector();
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

    // Use enhanced hybrid detection
    const hybridResult = this.hybridDetector.shouldUseHybrid(command, context);
    if (hybridResult.shouldUseHybrid) {
      return this.createEnhancedHybridStrategy(command, context, hybridResult);
    }

    // Assess complexity to determine mode
    const complexity = this.assessComplexity(context);
    const hasTemplate = this.hasWellDefinedTemplate(command);
    const isExploratory = this.isExploratoryCommand(command, context);

    // Check adaptive for complex cases
    if (complexity > 0.7 || isExploratory || this.isHighStakesOperation(context)) {
      return this.createAdaptiveStrategy(command, context);
    }

    // Check for well-defined templates
    if (hasTemplate && complexity < 0.6 && !isExploratory) {
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
    const flagComplexity = complexFlags.filter(f => context.flags?.[f]).length * 0.15;
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
      contextLevel: complexity >= 0.6 || isHighStakes ? 'detailed' : 'standard',
      preservationRules: this.generatePreservationRules(context),
      validationEnabled: isHighStakes || complexity >= 0.6
    };

    return {
      mode: 'adaptive',
      confidence: 0.75,
      adaptive,
      common: this.extractCommonSettings(context)
    };
  }

  /**
   * Create a hybrid strategy (legacy method for backward compatibility)
   * @deprecated Use createEnhancedHybridStrategy instead
   */
  /*
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
  */

  /**
   * Create an enhanced hybrid strategy using HybridModeDetector
   */
  private createEnhancedHybridStrategy(
    command: string, 
    context: CommandContext, 
    hybridResult: any
  ): GeminiStrategy {
    // Get hybrid configuration
    const hybridConfig = this.hybridDetector.getHybridConfiguration(command, context);
    
    // Find or create template
    const template = this.findTemplate(command) || this.createGenericTemplate(command);
    
    // Configure adaptive settings based on detector results
    const adaptive: AdaptiveSettings = {
      contextLevel: hybridConfig?.configuration.contextDepth || 'standard',
      preservationRules: this.generateHybridPreservationRules(context, hybridResult),
      validationEnabled: hybridResult.score > 0.7
    };

    // Add hybrid-specific metadata
    const strategy: GeminiStrategy = {
      mode: 'hybrid',
      confidence: Math.min(0.9, 0.7 + hybridResult.score * 0.2),
      template,
      adaptive,
      common: this.extractCommonSettings(context),
      metadata: {
        hybridScore: hybridResult.score,
        hybridReasons: hybridResult.reasons,
        templateComponent: hybridResult.templateComponent,
        adaptiveComponent: hybridResult.adaptiveComponent,
        balanceRatio: hybridConfig?.configuration.balanceRatio
      }
    };

    return strategy;
  }

  /**
   * Generate preservation rules for hybrid mode
   */
  private generateHybridPreservationRules(context: CommandContext, hybridResult: any): string[] {
    const rules: string[] = [];

    // Pattern-specific rules
    if (hybridResult.adaptiveComponent?.includes('pattern')) {
      rules.push('Preserve existing pattern implementations');
      rules.push('Maintain pattern consistency across codebase');
      rules.push('Extract reusable pattern components');
    }

    // Add context-specific rules
    if (context.flags?.pattern) {
      rules.push(`Follow ${context.flags.pattern} pattern specifications`);
    }

    // Add general hybrid rules
    rules.push('Balance structure with flexibility');
    rules.push('Maintain clear separation between template and adaptive components');

    return rules;
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
   * @deprecated Use HybridModeDetector.shouldUseHybrid() instead
   */
  /*
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
    const hasComplexRequirements = context.flags?.preserveApi || 
                                   context.flags?.preserveStyle ||
                                   (command.includes('preserve') && command.includes('pattern'));
    const complexity = this.assessComplexity(context);
    
    // Only use hybrid if explicitly needed for pattern preservation
    return hasComplexRequirements && complexity < 0.7;
  }
  */

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
      context.command.includes('breach') ||
      context.command.includes('vulnerability') ||
      (context.personas?.includes('security') && 
       (context.command.includes('potential') || context.command.includes('critical')))
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
   * @deprecated Moved to generateHybridPreservationRules
   */
  /*
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
  */

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