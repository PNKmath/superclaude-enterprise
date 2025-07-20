import { describe, it, expect, beforeEach } from 'vitest';
import { FlagValueParser } from '../flag-value-parser';

describe('FlagValueParser (Fallback Logic)', () => {
  let parser: FlagValueParser;

  beforeEach(() => {
    parser = new FlagValueParser();
  });

  describe('parseComplexFlags - Simple fallback behavior', () => {
    it('should process AI hints directly', () => {
      const aiHints = {
        flags: {
          performance: '80-90%',
          security: true,
          validate: true
        }
      };

      const result = parser.parseComplexFlags('성능을 80-90% 수준으로', aiHints);
      
      expect(result.get('performance')).toBe('80-90%');
      expect(result.get('security')).toBe(true);
      expect(result.get('validate')).toBe(true);
    });

    it('should detect production environment', () => {
      const aiHints = { flags: {} };

      const result = parser.parseComplexFlags('프로덕션 환경에서 실행', aiHints);
      
      expect(result.get('safe-mode')).toBe(true);
      expect(result.get('env')).toBe('production');
    });
  });

  describe('transformRequirementsToFlags - Basic number extraction', () => {
    it('should extract simple memory values', () => {
      const requirements = ['2GB', '4GB'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      // Should get the last one as a simple fallback
      expect(result.get('memory-limit')).toBe('4GB');
    });

    it('should extract simple time values', () => {
      const requirements = ['5초', '100ms'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      // Should process both
      expect(result.has('timeout')).toBe(true);
    });

    it('should extract percentage values', () => {
      const requirements = ['30%', '50%'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.has('percentage')).toBe(true);
    });
  });

  describe('Utility functions - Simple extraction', () => {
    it('should extract basic security types', () => {
      const requirements = ['XSS 검사', 'CSRF 방어'];
      
      const result = parser.extractSecurityTypes(requirements);
      
      expect(result).toContain('xss');
      expect(result).toContain('csrf');
    });

    it('should extract OWASP standard', () => {
      const input = 'OWASP Top 10 기준';
      
      const result = parser.extractStandards(input);
      
      expect(result).toContain('owasp-top10');
    });

    it('should extract file extensions', () => {
      const input = '.js .ts .jsx 파일';
      
      const result = parser.extractFileTypes(input);
      
      expect(result).toEqual(['js', 'ts', 'jsx']);
    });

    it('should extract numeric ranges', () => {
      const input = '10-20 범위';
      
      const result = parser.extractNumericRange(input);
      
      expect(result).toEqual({ min: 10, max: 20, average: 15 });
    });

    it('should extract test types', () => {
      const input = 'unit test and integration test';
      
      const result = parser.extractTestTypes(input);
      
      expect(result).toContain('unit');
      expect(result).toContain('integration');
    });
  });

  describe('Edge cases - Fallback robustness', () => {
    it('should handle empty input gracefully', () => {
      const result = parser.transformRequirementsToFlags([]);
      
      expect(result.size).toBe(0);
    });

    it('should handle no matches', () => {
      const requirements = ['아무 의미 없는 텍스트'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.size).toBe(0);
    });

    it('should handle mixed language input', () => {
      const requirements = ['5GB memory', '3초 timeout'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.has('memory-limit')).toBe(true);
      expect(result.has('timeout')).toBe(true);
    });
  });

  describe('Note: Primary parsing is done by AI', () => {
    it('should be used as fallback only', () => {
      // This test documents that this parser is a fallback
      // The primary natural language understanding is done by AI (Gemini)
      
      const complexRequirement = '메모리를 2GB로 제한하되 피크시에는 3GB까지 허용';
      const result = parser.transformRequirementsToFlags([complexRequirement]);
      
      // Fallback parser can only extract simple patterns
      // AI would understand the peak memory requirement
      expect(result.size).toBeLessThanOrEqual(1);
    });

    it('demonstrates AI would handle complex context better', () => {
      const complexContext = '보안 검사를 OWASP Top 10 기준으로, 특히 인증 관련 취약점 중심으로';
      
      // Fallback can only extract OWASP
      const standards = parser.extractStandards(complexContext);
      expect(standards).toContain('owasp-top10');
      
      // But cannot understand "특히 인증 관련" context
      // AI would understand this and add appropriate flags
    });
  });
});