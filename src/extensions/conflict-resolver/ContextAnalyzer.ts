import { ExecutionContext } from './types';

export class ContextAnalyzer {
  private contextRules: Map<string, any>;

  constructor() {
    this.contextRules = new Map();
    this.initializeRules();
  }

  private initializeRules(): void {
    // Production environment rules
    this.contextRules.set('production', {
      modifiers: {
        security: 1.5,
        qa: 1.3,
        devops: 1.2,
        performance: 0.8,
        frontend: 0.7
      }
    });

    // Development environment rules
    this.contextRules.set('development', {
      modifiers: {
        frontend: 1.3,
        refactorer: 1.2,
        analyzer: 1.1,
        security: 0.7,
        qa: 0.6
      }
    });

    // Staging environment rules
    this.contextRules.set('staging', {
      modifiers: {
        qa: 1.4,
        performance: 1.2,
        security: 1.1,
        devops: 1.1
      }
    });

    // Time-based rules
    this.contextRules.set('time_critical', {
      condition: (ctx: ExecutionContext) => ctx.flags?.urgent || ctx.flags?.hotfix,
      modifiers: {
        performance: 1.5,
        devops: 1.3,
        qa: 0.7
      }
    });

    // Command-based rules
    this.contextRules.set('deployment', {
      condition: (ctx: ExecutionContext) => ctx.command.includes('deploy'),
      modifiers: {
        devops: 1.5,
        security: 1.4,
        qa: 1.3
      }
    });

    this.contextRules.set('design', {
      condition: (ctx: ExecutionContext) => ctx.command.includes('design'),
      modifiers: {
        architect: 1.5,
        frontend: 1.2,
        backend: 1.2
      }
    });
  }

  async analyze(context: ExecutionContext): Promise<Map<string, number>> {
    const weights = new Map<string, number>();
    
    // Initialize all personas with base weight of 1.0
    const allPersonas = [
      'security', 'architect', 'performance', 'qa', 'backend',
      'frontend', 'devops', 'refactorer', 'analyzer', 'mentor', 'scribe'
    ];
    
    allPersonas.forEach(persona => weights.set(persona, 1.0));

    // Apply environment modifiers
    if (context.environment) {
      const envRule = this.contextRules.get(context.environment);
      if (envRule?.modifiers) {
        this.applyModifiers(weights, envRule.modifiers);
      }
    }

    // Apply conditional rules
    for (const [, rule] of this.contextRules) {
      if (rule.condition && rule.condition(context)) {
        this.applyModifiers(weights, rule.modifiers);
      }
    }

    // Apply time-based adjustments
    this.applyTimeBasedAdjustments(weights, context);

    // Apply file-based adjustments
    this.applyFileBasedAdjustments(weights, context);

    return weights;
  }

  private applyModifiers(
    weights: Map<string, number>,
    modifiers: Record<string, number>
  ): void {
    for (const [persona, modifier] of Object.entries(modifiers)) {
      const currentWeight = weights.get(persona) || 1.0;
      weights.set(persona, currentWeight * modifier);
    }
  }

  private applyTimeBasedAdjustments(
    weights: Map<string, number>,
    _context: ExecutionContext
  ): void {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Late night deployments need extra security
    if (hour >= 22 || hour <= 4) {
      this.adjustWeight(weights, 'security', 1.3);
      this.adjustWeight(weights, 'qa', 1.2);
    }

    // Friday deployments need extra caution
    if (dayOfWeek === 5) {
      this.adjustWeight(weights, 'qa', 1.3);
      this.adjustWeight(weights, 'security', 1.2);
      this.adjustWeight(weights, 'devops', 1.1);
    }

    // Monday morning - focus on stability
    if (dayOfWeek === 1 && hour >= 8 && hour <= 10) {
      this.adjustWeight(weights, 'performance', 1.2);
      this.adjustWeight(weights, 'analyzer', 1.1);
    }
  }

  private applyFileBasedAdjustments(
    weights: Map<string, number>,
    context: ExecutionContext
  ): void {
    if (!context.targetFiles || context.targetFiles.length === 0) {
      return;
    }

    const files = context.targetFiles;

    // Security-sensitive files
    if (files.some(f => f.includes('auth') || f.includes('security') || f.includes('crypto'))) {
      this.adjustWeight(weights, 'security', 1.5);
    }

    // Frontend files
    if (files.some(f => f.includes('component') || f.includes('ui') || f.endsWith('.jsx') || f.endsWith('.tsx'))) {
      this.adjustWeight(weights, 'frontend', 1.3);
    }

    // Backend/API files
    if (files.some(f => f.includes('api') || f.includes('server') || f.includes('route'))) {
      this.adjustWeight(weights, 'backend', 1.3);
    }

    // Configuration files
    if (files.some(f => f.includes('config') || f.endsWith('.yaml') || f.endsWith('.json'))) {
      this.adjustWeight(weights, 'devops', 1.2);
      this.adjustWeight(weights, 'security', 1.1);
    }

    // Test files
    if (files.some(f => f.includes('test') || f.includes('spec'))) {
      this.adjustWeight(weights, 'qa', 1.4);
    }

    // Large files or many files
    if (files.length > 10 || context.flags?.large) {
      this.adjustWeight(weights, 'performance', 1.2);
      this.adjustWeight(weights, 'architect', 1.1);
    }
  }

  private adjustWeight(
    weights: Map<string, number>,
    persona: string,
    multiplier: number
  ): void {
    const current = weights.get(persona) || 1.0;
    weights.set(persona, current * multiplier);
  }

  getContextSummary(context: ExecutionContext): string {
    const factors = [];

    if (context.environment) {
      factors.push(`Environment: ${context.environment}`);
    }

    if (context.flags?.urgent) {
      factors.push('Time critical');
    }

    if (context.targetFiles?.length) {
      factors.push(`Files: ${context.targetFiles.length}`);
    }

    const now = new Date();
    factors.push(`Time: ${now.toLocaleString()}`);

    return factors.join(', ');
  }
}