import { Logger } from 'pino';

export interface ExecutionLevel {
  level: number;
  name: string;
  emoji: string;
  description: string;
}

export interface LevelRule {
  pattern: string | RegExp;
  level: number;
  condition?: (context: any) => boolean;
  reason: string;
}

export class ExecutionLevelManager {
  private logger: Logger;
  private levels: ExecutionLevel[];
  private rules: LevelRule[];
  private defaultLevel: number = 2;

  constructor(logger: Logger) {
    this.logger = logger;
    this.levels = this.initializeLevels();
    this.rules = this.initializeRules();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Execution Level Manager...');
    
    // Load custom rules from config if available
    await this.loadCustomRules();
    
    this.logger.info(`Loaded ${this.rules.length} execution level rules`);
  }

  async determineLevel(context: any): Promise<number> {
    // Check for explicit level in context
    if (context.flags?.level !== undefined) {
      const level = parseInt(context.flags.level);
      if (this.isValidLevel(level)) {
        this.logger.info({ level }, 'Using explicit level from flags');
        return level;
      }
    }

    // Check environment override
    const envLevel = this.getEnvironmentLevel(context);
    if (envLevel !== null) {
      this.logger.info({ level: envLevel, environment: context.environment }, 
        'Using environment-based level');
      return envLevel;
    }

    // Apply rule-based determination
    for (const rule of this.rules) {
      if (this.matchesRule(context, rule)) {
        this.logger.info({ 
          level: rule.level, 
          rule: rule.pattern.toString(), 
          reason: rule.reason 
        }, 'Rule matched - applying level');
        return rule.level;
      }
    }

    // Return default level
    this.logger.info({ level: this.defaultLevel }, 'Using default level');
    return this.defaultLevel;
  }

  getLevel(levelNumber: number): ExecutionLevel | undefined {
    return this.levels.find(l => l.level === levelNumber);
  }

  getLevelDescription(levelNumber: number): string {
    const level = this.getLevel(levelNumber);
    return level ? `${level.emoji} ${level.name}: ${level.description}` : 'Unknown level';
  }

  shouldBlock(level: number): boolean {
    return level === 3;
  }

  shouldAutoExecute(level: number): boolean {
    return level === 4;
  }

  // Private methods

  private initializeLevels(): ExecutionLevel[] {
    return [
      {
        level: 0,
        name: 'Silent',
        emoji: '🔇',
        description: 'Execute silently, log only'
      },
      {
        level: 1,
        name: 'Notify',
        emoji: '💬',
        description: 'Execute and notify on important events'
      },
      {
        level: 2,
        name: 'Suggest',
        emoji: '💡',
        description: 'Execute with suggestions and recommendations'
      },
      {
        level: 3,
        name: 'Block',
        emoji: '🚫',
        description: 'Block execution, require explicit approval'
      },
      {
        level: 4,
        name: 'Auto',
        emoji: '🤖',
        description: 'Fully automated execution'
      }
    ];
  }

  private initializeRules(): LevelRule[] {
    return [
      // Production deployment - high caution
      {
        pattern: /deploy.*prod/i,
        level: 3,
        reason: 'Production deployments require approval'
      },
      
      // Hotfix - allow faster execution
      {
        pattern: /fix.*urgent|hotfix/i,
        level: 4,
        condition: (ctx) => ctx.flags?.hotfix === true,
        reason: 'Urgent fixes can be automated'
      },
      
      // Security operations - require review
      {
        pattern: /security|auth|crypto/i,
        level: 3,
        condition: (ctx) => ctx.personas?.includes('security'),
        reason: 'Security operations need review'
      },
      
      // Testing - can be automated
      {
        pattern: /test|spec/i,
        level: 1,
        condition: (ctx) => ctx.environment !== 'production',
        reason: 'Tests can run with minimal interaction'
      },
      
      // Analysis - moderate interaction
      {
        pattern: /analyze|review/i,
        level: 2,
        reason: 'Analysis benefits from suggestions'
      },
      
      // Refactoring - needs review
      {
        pattern: /refactor|improve/i,
        level: 2,
        condition: (ctx) => ctx.targetFiles?.length < 5,
        reason: 'Small refactoring can proceed with suggestions'
      },
      
      // Large changes - require approval
      {
        pattern: /.*/,
        level: 3,
        condition: (ctx) => ctx.targetFiles?.length > 20,
        reason: 'Large changes need careful review'
      },
      
      // Skip validation flag - always block
      {
        pattern: /.*--skip-validation/,
        level: 3,
        reason: 'Skipping validation is dangerous'
      },
      
      // Force flag - allow automation
      {
        pattern: /.*--force/,
        level: 4,
        condition: (ctx) => ctx.user === 'admin',
        reason: 'Admin force operations can be automated'
      }
    ];
  }

  private async loadCustomRules(): Promise<void> {
    // In a real implementation, this would load from config file
    // For now, just log that we're using default rules
    this.logger.debug('Using default execution level rules');
  }

  private isValidLevel(level: number): boolean {
    return level >= 0 && level <= 4;
  }

  private getEnvironmentLevel(context: any): number | null {
    if (!context.environment) return null;

    const envLevels: Record<string, number> = {
      production: 3,    // More cautious in production
      staging: 2,       // Balanced for staging
      development: 1,   // More permissive in dev
      test: 0          // Silent in test
    };

    return envLevels[context.environment] ?? null;
  }

  private matchesRule(context: any, rule: LevelRule): boolean {
    // Check pattern match
    const commandMatches = typeof rule.pattern === 'string' 
      ? context.command?.includes(rule.pattern)
      : rule.pattern.test(context.command || '');

    if (!commandMatches) return false;

    // Check additional condition if provided
    if (rule.condition) {
      return rule.condition(context);
    }

    return true;
  }

  // Public utility methods

  async validateLevel(level: number, context: any): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    if (!this.isValidLevel(level)) {
      return {
        valid: false,
        reason: `Invalid level ${level}. Must be 0-4.`
      };
    }

    // Check if level is appropriate for context
    const suggestedLevel = await this.determineLevel(context);
    
    if (level > suggestedLevel + 1) {
      return {
        valid: false,
        reason: `Level ${level} is too permissive for this operation. Suggested: ${suggestedLevel}`
      };
    }

    if (level < suggestedLevel - 1) {
      this.logger.warn(`Level ${level} is more restrictive than suggested ${suggestedLevel}`);
    }

    return { valid: true };
  }

  getSummary(): Record<string, any> {
    return {
      levels: this.levels,
      rulesCount: this.rules.length,
      defaultLevel: this.defaultLevel,
      levelDescriptions: this.levels.map(l => this.getLevelDescription(l.level))
    };
  }
}