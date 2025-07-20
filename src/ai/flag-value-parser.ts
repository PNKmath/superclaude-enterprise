/**
 * Flag Value Parser
 * Extracts and transforms complex flag values from natural language
 */

export class FlagValueParser {
  
  parseComplexFlags(input: string, aiHints: any): Map<string, any> {
    const flags = new Map();
    const lowerInput = input.toLowerCase();

    // Parse range values
    if (aiHints.flags.performance && typeof aiHints.flags.performance === 'string') {
      const rangeMatch = aiHints.flags.performance.match(/(\d+)-(\d+)%?/);
      if (rangeMatch) {
        const avg = (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
        flags.set('performance', avg);
      }
    }

    // Parse security types from requirements
    if (aiHints.flags.security && aiHints.additionalRequirements) {
      const securityTypes = this.extractSecurityTypes(aiHints.additionalRequirements);
      if (securityTypes.length > 0) {
        flags.set('security', securityTypes.join(','));
      }
    }

    // Production environment detection
    if (lowerInput.includes('프로덕션') || lowerInput.includes('production')) {
      flags.set('safe-mode', true);
      flags.set('env', 'production');
    }

    // Development environment detection
    if (lowerInput.includes('개발') || lowerInput.includes('development')) {
      flags.set('env', 'development');
    }

    return flags;
  }

  transformRequirementsToFlags(requirements: string[]): Map<string, string> {
    const transformations = new Map();

    requirements.forEach(req => {
      const lowerReq = req.toLowerCase();

      // Memory limits
      const memoryMatch = req.match(/메모리\s*(\d+(?:\.\d+)?)\s*(GB|MB|KB)/i) ||
                         req.match(/memory\s*(\d+(?:\.\d+)?)\s*(GB|MB|KB)/i);
      if (memoryMatch) {
        const value = this.normalizeMemoryUnit(parseFloat(memoryMatch[1]), memoryMatch[2]);
        transformations.set('memory-limit', value);
        
        // Check for peak memory
        if (req.includes('피크') || req.includes('peak')) {
          transformations.set('memory-peak', value);
        }
      }

      // Time constraints
      const timeMatch = req.match(/(\d+)\s*(초|sec|second|s)\s*(?:내|이내|within)?/i) ||
                       req.match(/(\d+)\s*(밀리초|ms|millisecond)\s*(?:내|이내|within)?/i);
      if (timeMatch) {
        const unit = timeMatch[2].toLowerCase();
        let value = parseInt(timeMatch[1]);
        
        if (unit.includes('밀리') || unit === 'ms' || unit.includes('milli')) {
          if (value >= 1000) {
            value = Math.floor(value / 1000);
            transformations.set('timeout', `${value}s`);
          } else {
            transformations.set('timeout', `${value}ms`);
          }
        } else {
          transformations.set('timeout', `${value}s`);
        }
      }

      // Framework versions
      const versionMatch = req.match(/(React|Vue|Angular|Node|TypeScript)\s*(\d+(?:\.\d+)?)/i);
      if (versionMatch) {
        transformations.set('framework', versionMatch[1].toLowerCase());
        transformations.set('version', versionMatch[2]);
      }

      // Percentage improvements
      const percentMatch = req.match(/(\d+)\s*%\s*(향상|개선|단축|improvement|reduction)/i);
      if (percentMatch) {
        if (lowerReq.includes('성능') || lowerReq.includes('performance')) {
          transformations.set('performance-target', `${percentMatch[1]}%`);
        } else if (lowerReq.includes('응답') || lowerReq.includes('response')) {
          transformations.set('response-time-reduction', `${percentMatch[1]}%`);
        }
      }

      // CPU limits
      const cpuMatch = req.match(/CPU\s*(\d+)\s*%/i);
      if (cpuMatch) {
        transformations.set('cpu-limit', `${cpuMatch[1]}%`);
      }

      // Browser versions
      if (lowerReq.includes('chrome')) {
        const chromeMatch = req.match(/Chrome\s*(\d+)/i);
        if (chromeMatch) {
          transformations.set('min-chrome-version', chromeMatch[1]);
        }
      }

      if (lowerReq.includes('safari') && lowerReq.includes('최신')) {
        transformations.set('safari', 'latest');
      }

      // Concurrent limits
      const concurrentMatch = req.match(/(?:동시|병렬|concurrent|parallel)\s*(\d+)/i);
      if (concurrentMatch) {
        transformations.set('concurrency', concurrentMatch[1]);
      }
    });

    return transformations;
  }

  extractSecurityTypes(requirements: string[]): string[] {
    const securityTypes = new Set<string>();
    const patterns = {
      'xss': /XSS|크로스\s*사이트\s*스크립팅/i,
      'csrf': /CSRF|크로스\s*사이트\s*요청\s*위조/i,
      'sql-injection': /SQL\s*인젝션|SQL\s*injection/i,
      'auth': /인증|authentication/i,
      'authz': /인가|authorization/i
    };

    requirements.forEach(req => {
      Object.entries(patterns).forEach(([type, pattern]) => {
        if (pattern.test(req)) {
          securityTypes.add(type);
        }
      });
    });

    return Array.from(securityTypes);
  }

  extractStandards(input: string): string[] {
    const standards = [];
    
    if (/OWASP\s*Top\s*10/i.test(input)) {
      standards.push('owasp-top10');
    }
    if (/PCI[\s-]?DSS/i.test(input)) {
      standards.push('pci-dss');
    }
    if (/ISO[\s-]?27001/i.test(input)) {
      standards.push('iso-27001');
    }
    
    return standards;
  }

  extractFileTypes(input: string): string[] {
    const fileTypes = new Set<string>();
    const match = input.match(/\.(js|ts|jsx|tsx|py|java|go|rs|cpp|cs)\b/gi);
    
    if (match) {
      match.forEach(ext => {
        fileTypes.add(ext.substring(1)); // Remove the dot
      });
    }
    
    return Array.from(fileTypes);
  }

  extractNumericRange(input: string): { min: number; max: number; average: number } | null {
    const match = input.match(/(\d+)\s*[-~]\s*(\d+)/);
    
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return {
        min,
        max,
        average: Math.floor((min + max) / 2)
      };
    }
    
    return null;
  }

  extractTestTypes(input: string): string[] {
    const testTypes = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('단위') || lowerInput.includes('unit')) {
      testTypes.push('unit');
    }
    if (lowerInput.includes('통합') || lowerInput.includes('integration')) {
      testTypes.push('integration');
    }
    if (lowerInput.includes('e2e') || lowerInput.includes('end-to-end')) {
      testTypes.push('e2e');
    }
    
    return testTypes;
  }

  parseEnvironmentFlags(input: string): Map<string, string> {
    const envFlags = new Map();
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('개발') || lowerInput.includes('dev')) {
      if (lowerInput.includes('디버그') || lowerInput.includes('debug')) {
        envFlags.set('dev-mode', 'debug');
      }
    }
    
    if (lowerInput.includes('프로덕션') || lowerInput.includes('production')) {
      if (lowerInput.includes('최적화') || lowerInput.includes('optimiz')) {
        envFlags.set('prod-mode', 'optimized');
      }
    }
    
    return envFlags;
  }

  resolveConflicts(requirements: string[]): Map<string, string> {
    const resolved = new Map();
    
    const hasSpeed = requirements.some(r => 
      r.includes('빠른') || r.includes('fast') || r.includes('quick')
    );
    
    const hasQuality = requirements.some(r => 
      r.includes('철저한') || r.includes('thorough') || r.includes('comprehensive')
    );
    
    if (hasSpeed && hasQuality) {
      resolved.set('mode', 'balanced');
      resolved.set('priority', 'quality'); // Safety over speed
    } else if (hasSpeed) {
      resolved.set('mode', 'fast');
      resolved.set('priority', 'speed');
    } else if (hasQuality) {
      resolved.set('mode', 'thorough');
      resolved.set('priority', 'quality');
    }
    
    return resolved;
  }

  private normalizeMemoryUnit(value: number, unit: string): string {
    const upperUnit = unit.toUpperCase();
    
    if (upperUnit === 'MB' && value >= 1024) {
      return `${(value / 1024).toFixed(1)}GB`;
    }
    
    if (upperUnit === 'KB' && value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)}GB`;
    }
    
    return `${value}${upperUnit}`;
  }
}