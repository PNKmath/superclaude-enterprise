import { describe, it, expect } from 'vitest';
import { FlagValueParser } from '../flag-value-parser';

describe('FlagValueParser', () => {
  let parser: FlagValueParser;

  beforeEach(() => {
    parser = new FlagValueParser();
  });

  describe('parseComplexFlags', () => {
    it('should parse range values to average', () => {
      const aiHints = {
        flags: {
          performance: '80-90%'
        }
      };

      const result = parser.parseComplexFlags('성능을 80-90% 수준으로', aiHints);
      
      expect(result.get('performance')).toBe(85);
    });

    it('should parse multiple security types', () => {
      const aiHints = {
        flags: {
          security: true
        },
        additionalRequirements: [
          'XSS 검사 필요',
          'CSRF 취약점 확인'
        ]
      };

      const result = parser.parseComplexFlags('보안에서 XSS와 CSRF 검사', aiHints);
      
      expect(result.get('security')).toBe('xss,csrf');
    });

    it('should add safe-mode for production', () => {
      const aiHints = { flags: {} };

      const result = parser.parseComplexFlags('프로덕션 환경에서 실행', aiHints);
      
      expect(result.get('safe-mode')).toBe(true);
      expect(result.get('env')).toBe('production');
    });
  });

  describe('transformRequirementsToFlags', () => {
    it('should parse memory limits', () => {
      const requirements = ['메모리 2GB 이하', '메모리를 1.5GB로 제한'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('memory-limit')).toBe('1.5GB'); // Takes the last one
    });

    it('should parse time constraints', () => {
      const requirements = ['5초 내 응답', '3초 이내로 처리'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('timeout')).toBe('3s');
    });

    it('should parse framework versions', () => {
      const requirements = ['React 18 버전용', 'TypeScript 지원'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('framework')).toBe('react');
      expect(result.get('version')).toBe('18');
    });

    it('should parse percentage improvements', () => {
      const requirements = ['성능 30% 향상', '응답시간 50% 단축'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('performance-target')).toBe('30%');
      expect(result.get('response-time-reduction')).toBe('50%');
    });

    it('should parse browser specifications', () => {
      const requirements = [
        'Chrome 100 이상에서 테스트',
        'Safari 최신 버전 지원'
      ];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('min-chrome-version')).toBe('100');
      expect(result.get('safari')).toBe('latest');
    });

    it('should parse concurrent limits', () => {
      const requirements = ['동시 5개까지 처리', '병렬 10개 작업'];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('concurrency')).toBe('10'); // Takes the last/highest
    });
  });

  describe('extractSpecificValues', () => {
    it('should extract OWASP standards', () => {
      const input = 'OWASP Top 10 기준으로 검사';
      
      const result = parser.extractStandards(input);
      
      expect(result).toContain('owasp-top10');
    });

    it('should extract multiple file types', () => {
      const input = '.js, .ts, .jsx 파일만 검사';
      
      const result = parser.extractFileTypes(input);
      
      expect(result).toEqual(['js', 'ts', 'jsx']);
    });

    it('should extract numeric ranges', () => {
      const input = '10-20개 파일을 동시에';
      
      const result = parser.extractNumericRange(input);
      
      expect(result).toEqual({ min: 10, max: 20, average: 15 });
    });
  });

  describe('Complex value combinations', () => {
    it('should handle memory and CPU constraints together', () => {
      const requirements = [
        '메모리 4GB 이하, CPU 50% 이하로 유지',
        '피크 시에도 메모리 6GB를 넘지 않도록'
      ];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('memory-limit')).toBe('4GB');
      expect(result.get('memory-peak')).toBe('6GB');
      expect(result.get('cpu-limit')).toBe('50%');
    });

    it('should handle multiple test types', () => {
      const input = '단위 테스트, 통합 테스트, E2E 테스트 모두 실행';
      
      const result = parser.extractTestTypes(input);
      
      expect(result).toEqual(['unit', 'integration', 'e2e']);
    });

    it('should parse environment-specific flags', () => {
      const input = '개발 환경에서는 디버그 모드로, 프로덕션에서는 최적화 모드로';
      
      const result = parser.parseEnvironmentFlags(input);
      
      expect(result.get('dev-mode')).toBe('debug');
      expect(result.get('prod-mode')).toBe('optimized');
    });
  });

  describe('Edge cases', () => {
    it('should handle Korean and English mixed input', () => {
      const requirements = [
        'Memory를 2GB로 제한',
        'Response time은 100ms 이하'
      ];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('memory-limit')).toBe('2GB');
      expect(result.get('response-time')).toBe('100ms');
    });

    it('should handle conflicting requirements gracefully', () => {
      const requirements = [
        '빠른 실행',
        '철저한 검사'
      ];
      
      const result = parser.resolveConflicts(requirements);
      
      expect(result.get('mode')).toBe('balanced');
      expect(result.get('priority')).toBe('quality'); // Safety over speed
    });

    it('should handle units conversion', () => {
      const requirements = [
        '1024MB 메모리 제한',
        '1000 밀리초 타임아웃'
      ];
      
      const result = parser.transformRequirementsToFlags(requirements);
      
      expect(result.get('memory-limit')).toBe('1GB');
      expect(result.get('timeout')).toBe('1s');
    });
  });
});