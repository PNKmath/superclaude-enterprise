import { Logger } from 'pino';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GeminiConfig {
  enabled: boolean;
  autoRouting: boolean;
  costThreshold: number;
  quotaManagement: {
    dailyLimit: number;
    rateLimit: string;
  };
}

export interface BackendDecision {
  backend: 'claude' | 'gemini';
  reason: string;
  estimatedCost?: number;
}

export class GeminiAdapter {
  protected logger: Logger;
  protected config: GeminiConfig;
  protected isGeminiAvailable: boolean = false;
  protected dailyUsage: number = 0;
  protected lastResetDate: Date = new Date();

  constructor(logger: Logger, config: GeminiConfig) {
    this.logger = logger;
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Gemini CLI adapter...');
    
    // Check if Gemini CLI is available
    this.isGeminiAvailable = await this.checkGeminiCLI();
    
    if (this.isGeminiAvailable) {
      this.logger.info('Gemini CLI detected and ready');
    } else {
      this.logger.warn('Gemini CLI not available - will use Claude exclusively');
    }
  }

  async selectBackend(context: any): Promise<'claude' | 'gemini'> {
    const decision = await this.makeBackendDecision(context);
    return decision.backend;
  }

  async makeBackendDecision(context: any): Promise<BackendDecision> {
    // If Gemini is not available or disabled, always use Claude
    if (!this.isGeminiAvailable || !this.config.enabled) {
      return {
        backend: 'claude',
        reason: 'Gemini not available or disabled'
      };
    }

    // Check daily quota
    if (this.isDailyQuotaExceeded()) {
      return {
        backend: 'claude',
        reason: 'Gemini daily quota exceeded'
      };
    }

    // Auto-routing logic
    if (this.config.autoRouting) {
      // Large file detection
      if (context.targetFiles?.some((f: string) => this.isLargeFile(f))) {
        return {
          backend: 'gemini',
          reason: 'Large file detected - using Gemini for cost efficiency',
          estimatedCost: await this.estimateCost(context, 'gemini')
        };
      }

      // Multiple files
      if (context.targetFiles?.length > 10) {
        return {
          backend: 'gemini',
          reason: 'Multiple files (>10) - using Gemini for large context',
          estimatedCost: await this.estimateCost(context, 'gemini')
        };
      }

      // Estimated context size
      if (context.estimatedSize && this.parseSize(context.estimatedSize) > 100 * 1024) {
        return {
          backend: 'gemini',
          reason: 'Large context size - using Gemini',
          estimatedCost: await this.estimateCost(context, 'gemini')
        };
      }

      // Cost-sensitive operations
      if (context.flags?.costSensitive) {
        return {
          backend: 'gemini',
          reason: 'Cost-sensitive operation - using Gemini',
          estimatedCost: await this.estimateCost(context, 'gemini')
        };
      }
    }

    // Default to Claude for better quality on smaller tasks
    return {
      backend: 'claude',
      reason: 'Default to Claude for optimal quality',
      estimatedCost: await this.estimateCost(context, 'claude')
    };
  }

  async executeWithGemini(command: string, context: any): Promise<any> {
    if (!this.isGeminiAvailable) {
      throw new Error('Gemini CLI not available');
    }

    // Transform SuperClaude command to Gemini format
    const geminiCommand = this.transformCommand(command, context);
    
    this.logger.info({ geminiCommand }, 'Executing with Gemini CLI');
    
    try {
      const { stdout, stderr } = await execAsync(geminiCommand);
      
      if (stderr) {
        this.logger.warn({ stderr }, 'Gemini CLI warning');
      }
      
      // Update usage tracking
      this.updateUsage(context);
      
      return {
        success: true,
        output: stdout,
        backend: 'gemini'
      };
    } catch (error) {
      this.logger.error({ error }, 'Gemini CLI execution failed');
      throw error;
    }
  }

  async getSelectionReason(context: any): Promise<string> {
    const decision = await this.makeBackendDecision(context);
    return decision.reason;
  }

  async estimateCost(context: any, backend?: 'claude' | 'gemini'): Promise<number> {
    const selectedBackend = backend || (await this.selectBackend(context));
    
    // Rough cost estimation based on context size
    const estimatedTokens = this.estimateTokens(context);
    
    const costPerMillionTokens = {
      claude: 15.0, // $15 per million tokens (Claude 3)
      gemini: 0.5   // $0.50 per million tokens (Gemini 1.5)
    };
    
    return (estimatedTokens / 1_000_000) * costPerMillionTokens[selectedBackend];
  }

  async isAvailable(): Promise<boolean> {
    return this.isGeminiAvailable;
  }

  // Private helper methods

  private async checkGeminiCLI(): Promise<boolean> {
    try {
      await execAsync('gemini --version');
      return true;
    } catch {
      return false;
    }
  }

  private isLargeFile(filepath: string): boolean {
    // Simple heuristic - in real implementation would check actual file size
    return filepath.includes('large') || 
           filepath.includes('dataset') ||
           filepath.endsWith('.log');
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(kb|mb|gb)?/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'b').toLowerCase();
    
    const multipliers: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || 1);
  }

  private isDailyQuotaExceeded(): boolean {
    // Reset daily counter if it's a new day
    const today = new Date();
    if (today.toDateString() !== this.lastResetDate.toDateString()) {
      this.dailyUsage = 0;
      this.lastResetDate = today;
    }
    
    return this.dailyUsage >= this.config.quotaManagement.dailyLimit;
  }

  protected transformCommand(command: string, context: any): string {
    // Map SuperClaude commands to Gemini CLI format
    const commandMappings: Record<string, string> = {
      '/sc:analyze': 'gemini analyze',
      '/sc:review': 'gemini review',
      '/sc:implement': 'gemini generate',
      '/sc:explain': 'gemini explain',
      '/sc:improve': 'gemini refactor'
    };
    
    let geminiCmd = command;
    
    // Replace command prefix
    for (const [sc, gemini] of Object.entries(commandMappings)) {
      if (command.startsWith(sc)) {
        geminiCmd = command.replace(sc, gemini);
        break;
      }
    }
    
    // Add context files
    if (context.targetFiles?.length > 0) {
      geminiCmd += ` @${context.targetFiles.join(' @')}`;
    }
    
    // Add flags
    if (context.flags) {
      for (const [flag, value] of Object.entries(context.flags)) {
        if (value === true) {
          geminiCmd += ` --${flag}`;
        } else if (value !== false) {
          geminiCmd += ` --${flag}="${value}"`;
        }
      }
    }
    
    return geminiCmd;
  }

  private estimateTokens(context: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    let characterCount = 0;
    
    // Command tokens
    characterCount += (context.command || '').length;
    
    // File content estimation (assuming 1KB average per file)
    const fileCount = context.targetFiles?.length || 0;
    characterCount += fileCount * 1024;
    
    // Context size if provided
    if (context.estimatedSize) {
      characterCount += this.parseSize(context.estimatedSize);
    }
    
    return Math.ceil(characterCount / 4);
  }

  private updateUsage(context: any): void {
    const tokens = this.estimateTokens(context);
    this.dailyUsage += tokens;
    
    this.logger.info({
      dailyUsage: this.dailyUsage,
      dailyLimit: this.config.quotaManagement.dailyLimit,
      percentUsed: (this.dailyUsage / this.config.quotaManagement.dailyLimit) * 100
    }, 'Gemini usage updated');
  }
}