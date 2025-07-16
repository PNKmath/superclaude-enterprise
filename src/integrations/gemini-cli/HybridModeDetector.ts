/**
 * Hybrid Mode Detector for Gemini Strategy Selection
 * Improves detection of pattern-based implementations that require hybrid approach
 */

export interface HybridDetectionResult {
  shouldUseHybrid: boolean;
  score: number;
  reasons: string[];
  templateComponent?: string;
  adaptiveComponent?: string;
}

export class HybridModeDetector {
  // Pattern-based indicators
  private patternIndicators = {
    strong: ['pattern', 'repository pattern', 'factory pattern', 'singleton pattern'],
    medium: ['following', 'based on', 'similar to', 'like existing'],
    weak: ['existing', 'current', 'our']
  };

  // Korean pattern indicators
  private koreanPatternIndicators = {
    strong: ['패턴', '리포지토리 패턴', '팩토리 패턴', '싱글톤 패턴'],
    medium: ['따라', '기반으로', '비슷한', '같은'],
    weak: ['기존', '현재', '우리']
  };

  // Commands that often use patterns
  private patternCommands = ['implement', 'create', 'design', 'build', 'develop'];

  // Modifiers that suggest hybrid approach
  // private hybridModifiers = [
  //   'using pattern',
  //   'following existing',
  //   'based on current',
  //   'similar implementation',
  //   'like our'
  // ];

  /**
   * Determine if hybrid mode should be used
   */
  shouldUseHybrid(command: string, context: any): HybridDetectionResult {
    const result: HybridDetectionResult = {
      shouldUseHybrid: false,
      score: 0,
      reasons: []
    };

    // 1. Check for pattern keywords (40% weight)
    const patternScore = this.calculatePatternScore(command, context);
    if (patternScore > 0) {
      result.score += patternScore * 0.4;
      result.reasons.push(`Pattern keywords detected (score: ${patternScore.toFixed(2)})`);
    }

    // 2. Check if it's implementation with patterns (30% weight)
    if (this.isPatternBasedImplementation(command, context)) {
      result.score += 0.3;
      result.reasons.push('Pattern-based implementation detected');
      result.templateComponent = 'implementation';
      result.adaptiveComponent = 'pattern_matching';
    }

    // 3. Check complexity range (20% weight)
    const complexity = this.estimateComplexity(context);
    if (complexity >= 0.5 && complexity <= 0.7) {
      result.score += 0.2;
      result.reasons.push(`Complexity in hybrid range (${complexity.toFixed(2)})`);
    }

    // 4. Check for multiple personas with pattern context (10% weight)
    if (this.hasMultiplePersonasWithPattern(context)) {
      result.score += 0.1;
      result.reasons.push('Multiple personas with pattern context');
    }

    // 5. Check for explicit hybrid indicators
    if (context.flags?.hybrid || context.flags?.['hybrid-mode']) {
      result.score += 0.3;
      result.reasons.push('Explicit hybrid mode requested');
    }

    // Decision threshold
    result.shouldUseHybrid = result.score >= 0.5;

    // Set components if hybrid
    if (result.shouldUseHybrid && !result.templateComponent) {
      result.templateComponent = this.determineTemplateComponent(command, context);
      result.adaptiveComponent = this.determineAdaptiveComponent(command, context);
    }

    return result;
  }

  /**
   * Calculate pattern score based on keywords
   */
  private calculatePatternScore(command: string, context: any): number {
    let score = 0;
    const lowerCommand = command.toLowerCase();
    const naturalContext = context.naturalContext?.toLowerCase() || '';
    const fullText = `${lowerCommand} ${naturalContext}`;

    // Check English indicators
    for (const indicator of this.patternIndicators.strong) {
      if (fullText.includes(indicator)) {
        score += 1.0;
      }
    }
    for (const indicator of this.patternIndicators.medium) {
      if (fullText.includes(indicator)) {
        score += 0.6;
      }
    }
    for (const indicator of this.patternIndicators.weak) {
      if (fullText.includes(indicator)) {
        score += 0.3;
      }
    }

    // Check Korean indicators
    for (const indicator of this.koreanPatternIndicators.strong) {
      if (fullText.includes(indicator)) {
        score += 1.0;
      }
    }
    for (const indicator of this.koreanPatternIndicators.medium) {
      if (fullText.includes(indicator)) {
        score += 0.6;
      }
    }
    for (const indicator of this.koreanPatternIndicators.weak) {
      if (fullText.includes(indicator)) {
        score += 0.3;
      }
    }

    // Check for specific pattern names in flags
    if (context.flags?.pattern) {
      score += 1.5;
    }

    // Normalize score (max 1.0)
    return Math.min(1.0, score / 2.0);
  }

  /**
   * Check if this is a pattern-based implementation
   */
  private isPatternBasedImplementation(command: string, context: any): boolean {
    const lowerCommand = command.toLowerCase();
    
    // Check if it's an implementation command
    const isImplementation = this.patternCommands.some(cmd => 
      lowerCommand.includes(cmd)
    );
    
    if (!isImplementation) {
      return false;
    }

    // Check for pattern context
    const hasPatternContext = 
      this.calculatePatternScore(command, context) > 0.3 ||
      context.flags?.pattern ||
      context.detectedIntent?.includes('pattern');

    return hasPatternContext;
  }

  /**
   * Estimate complexity for hybrid mode consideration
   */
  private estimateComplexity(context: any): number {
    let complexity = 0.4; // Base complexity

    // File count factor
    const fileCount = context.targetFiles?.length || 0;
    complexity += Math.min(0.2, fileCount * 0.05);

    // Persona count factor
    const personaCount = context.personas?.length || 0;
    complexity += Math.min(0.2, personaCount * 0.1);

    // Flag complexity
    const flagCount = Object.keys(context.flags || {}).length;
    complexity += Math.min(0.1, flagCount * 0.05);

    // Natural language complexity
    const words = context.naturalContext?.split(' ').length || 0;
    if (words > 20) complexity += 0.1;

    return Math.min(1.0, complexity);
  }

  /**
   * Check for multiple personas with pattern context
   */
  private hasMultiplePersonasWithPattern(context: any): boolean {
    const personas = context.personas || [];
    const hasMultiplePersonas = personas.length >= 2;
    
    // Check if architect or backend persona is included (pattern-relevant)
    const hasPatternPersona = personas.some((p: string) => 
      ['architect', 'backend', 'frontend'].includes(p)
    );

    return hasMultiplePersonas && hasPatternPersona;
  }

  /**
   * Determine template component for hybrid mode
   */
  private determineTemplateComponent(command: string, _context: any): string {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('implement') || lowerCommand.includes('create')) {
      return 'implementation';
    } else if (lowerCommand.includes('analyze')) {
      return 'analysis';
    } else if (lowerCommand.includes('design')) {
      return 'design';
    } else {
      return 'generic';
    }
  }

  /**
   * Determine adaptive component for hybrid mode
   */
  private determineAdaptiveComponent(_command: string, context: any): string {
    // Check for specific patterns
    if (context.flags?.pattern === 'repository') {
      return 'repository_pattern_matching';
    } else if (context.flags?.pattern === 'factory') {
      return 'factory_pattern_matching';
    } else if (context.flags?.pattern) {
      return 'generic_pattern_matching';
    }

    // Check for other adaptive needs
    if (context.naturalContext?.includes('existing') || 
        context.naturalContext?.includes('기존')) {
      return 'existing_code_analysis';
    }

    return 'pattern_matching';
  }

  /**
   * Get detailed hybrid mode configuration
   */
  getHybridConfiguration(command: string, context: any): any {
    const detection = this.shouldUseHybrid(command, context);
    
    if (!detection.shouldUseHybrid) {
      return null;
    }

    return {
      mode: 'hybrid',
      score: detection.score,
      reasons: detection.reasons,
      configuration: {
        templateComponent: detection.templateComponent || 'generic',
        adaptiveComponent: detection.adaptiveComponent || 'pattern_matching',
        balanceRatio: this.calculateBalanceRatio(detection.score),
        preservationStrategy: 'selective',
        contextDepth: 'medium'
      }
    };
  }

  /**
   * Calculate balance ratio between template and adaptive components
   */
  private calculateBalanceRatio(score: number): { template: number; adaptive: number } {
    // Higher scores mean more pattern-focused (more adaptive)
    if (score >= 0.8) {
      return { template: 0.3, adaptive: 0.7 };
    } else if (score >= 0.6) {
      return { template: 0.5, adaptive: 0.5 };
    } else {
      return { template: 0.7, adaptive: 0.3 };
    }
  }
}