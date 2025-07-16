/**
 * Type definitions for Gemini integration system
 */

export type StrategyMode = 'template' | 'adaptive' | 'hybrid';

export interface ExtractionTemplate {
  type: string;
  requiredFields: string[];
  outputFormat: string;
  specificInstructions: string[];
  examples?: string;
}

export interface AdaptiveSettings {
  contextLevel: 'minimal' | 'standard' | 'detailed';
  preservationRules: string[];
  validationEnabled: boolean;
}

export interface CommonSettings {
  personas: string[];
  constraints: string[];
  examples?: string[];
}

export interface GeminiStrategy {
  mode: StrategyMode;
  confidence: number;
  
  // Template Mode settings
  template?: ExtractionTemplate;
  
  // Adaptive Mode settings
  adaptive?: AdaptiveSettings;
  
  // Common settings for all modes
  common: CommonSettings;
}

export interface CommandContext {
  command: string;
  targetFiles?: string[];
  personas?: string[];
  flags?: Record<string, any>;
  estimatedSize?: string;
  sessionId?: string;
}

export interface StrategySelector {
  selectStrategy(command: string, context: CommandContext): GeminiStrategy;
  assessComplexity(context: CommandContext): number;
}

export interface ValidationResult {
  valid: boolean;
  missingFields?: string[];
  coverage?: number;
  issues?: string[];
  contextLossScore?: number;
}

export interface GeminiExecutionResult {
  success: boolean;
  output: string;
  backend: 'gemini';
  metadata?: {
    sessionId: string;
    executionTime: number;
    retries: number;
    contextValidated: boolean;
    preservationLevel: string;
    strategy: GeminiStrategy;
  };
  validation?: ValidationResult;
}