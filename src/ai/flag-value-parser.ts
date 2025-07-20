/**
 * Flag Value Parser (Fallback only)
 * Simple fallback parser for when AI is not available
 * The primary parsing should be done by AI (Gemini)
 */

export class FlagValueParser {
  
  /**
   * Basic flag extraction for AI hints
   * This is a simple fallback - AI should handle complex parsing
   */
  parseComplexFlags(input: string, aiHints: any): Map<string, any> {
    const flags = new Map();
    const lowerInput = input.toLowerCase();

    // Only process explicit AI hints
    if (aiHints && aiHints.flags) {
      Object.entries(aiHints.flags).forEach(([key, value]) => {
        flags.set(key, value);
      });
    }

    // Very basic environment detection as fallback
    if (lowerInput.includes('프로덕션') || lowerInput.includes('production')) {
      flags.set('safe-mode', true);
      flags.set('env', 'production');
    }

    return flags;
  }

  /**
   * Simple requirement to flag transformation
   * This should rarely be used - AI handles most conversions
   */
  transformRequirementsToFlags(requirements: string[]): Map<string, string> {
    const transformations = new Map();

    requirements.forEach(req => {
      // Very basic patterns only - AI should handle complex parsing
      
      // Simple number extraction
      const numberMatch = req.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB|%|초|sec|ms)/i);
      if (numberMatch) {
        const value = numberMatch[1];
        const unit = numberMatch[2];
        
        // Basic unit mapping
        if (unit.match(/GB|MB|KB/i)) {
          transformations.set('memory-limit', `${value}${unit.toUpperCase()}`);
        } else if (unit.match(/초|sec/i)) {
          transformations.set('timeout', `${value}s`);
        } else if (unit === 'ms') {
          transformations.set('timeout', `${value}ms`);
        } else if (unit === '%') {
          transformations.set('percentage', value);
        }
      }
    });

    return transformations;
  }

  /**
   * Extract security types - simplified fallback
   */
  extractSecurityTypes(requirements: string[]): string[] {
    const securityTypes = new Set<string>();
    
    requirements.forEach(req => {
      if (/XSS/i.test(req)) securityTypes.add('xss');
      if (/CSRF/i.test(req)) securityTypes.add('csrf');
      if (/SQL/i.test(req)) securityTypes.add('sql-injection');
    });

    return Array.from(securityTypes);
  }

  /**
   * Extract standards - simplified
   */
  extractStandards(input: string): string[] {
    const standards = [];
    if (/OWASP/i.test(input)) standards.push('owasp-top10');
    return standards;
  }

  /**
   * Extract file types - simplified
   */
  extractFileTypes(input: string): string[] {
    const match = input.match(/\.(js|ts|jsx|tsx|py|java|go|rs|cpp|cs)\b/gi);
    return match ? match.map(ext => ext.substring(1)) : [];
  }

  /**
   * Extract numeric range - simplified
   */
  extractNumericRange(input: string): { min: number; max: number; average: number } | null {
    const match = input.match(/(\d+)\s*[-~]\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return { min, max, average: Math.floor((min + max) / 2) };
    }
    return null;
  }

  /**
   * Extract test types - simplified
   */
  extractTestTypes(input: string): string[] {
    const testTypes = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('unit')) testTypes.push('unit');
    if (lowerInput.includes('integration')) testTypes.push('integration');
    if (lowerInput.includes('e2e')) testTypes.push('e2e');
    
    return testTypes;
  }

  /**
   * Parse environment flags - simplified
   */
  parseEnvironmentFlags(input: string): Map<string, string> {
    const envFlags = new Map();
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('debug')) {
      envFlags.set('debug', 'true');
    }
    
    return envFlags;
  }

  /**
   * Resolve conflicts - simplified
   */
  resolveConflicts(_requirements: string[]): Map<string, string> {
    // This is a placeholder - AI should handle conflict resolution
    return new Map();
  }
}