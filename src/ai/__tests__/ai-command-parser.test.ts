import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AICommandParser } from '../ai-command-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
vi.mock('@google/generative-ai');

describe('AICommandParser', () => {
  let parser: AICommandParser;
  let mockGeminiGenerate: Mock;

  beforeEach(() => {
    // Setup mock
    mockGeminiGenerate = vi.fn();
    (GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGeminiGenerate
      })
    }));

    parser = new AICommandParser({
      geminiApiKey: 'test-key',
      enableAI: true,
      complexityThreshold: 0.7,
      maxTokens: 1000,
      useCompression: true
    });
  });

  describe('Simple Commands (Rule-based only)', () => {
    it('should parse simple analyze command without AI', async () => {
      const result = await parser.parse('코드 분석해줘');
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(mockGeminiGenerate).not.toHaveBeenCalled();
    });

    it('should parse explicit flags without AI', async () => {
      const result = await parser.parse('보안 검사 --validate --safe-mode');
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.flags.get('security')).toBe(true);
      expect(result.flags.get('validate')).toBe(true);
      expect(result.flags.get('safe-mode')).toBe(true);
      expect(mockGeminiGenerate).not.toHaveBeenCalled();
    });
  });

  describe('Complex Commands with Values (AI-assisted)', () => {
    it('should parse performance requirements with specific values', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "API 성능 최적화 with constraints",
            command: "improve",
            flags: {
              "performance": true,
              "target-improvement": "50%",
              "memory-limit": "4GB",
              "focus": "api-response"
            },
            flagContexts: {
              "performance": "API 응답 속도 50% 개선, 메모리 4GB 제한"
            },
            additionalRequirements: [
              "현재 대비 50% 개선 목표",
              "메모리 사용량 모니터링 필요"
            ],
            personas: ["performance", "backend"],
            confidence: 0.9
          })
        }
      });

      const result = await parser.parse(
        'API 응답속도를 현재보다 50% 개선하되, 메모리는 4GB를 넘지 않도록 최적화해줘'
      );

      expect(result.baseCommand).toBe('improve');
      expect(result.flags.get('performance')).toBe(true);
      expect(result.flags.get('target-improvement')).toBe('50%');
      expect(result.flags.get('memory-limit')).toBe('4GB');
      expect(result.flags.get('focus')).toBe('api-response');
      expect(result.flagContexts.get('performance')).toBe('API 응답 속도 50% 개선, 메모리 4GB 제한');
      expect(result.additionalRequirements).toContain('현재 대비 50% 개선 목표');
      expect(mockGeminiGenerate).toHaveBeenCalled();
    });

    it('should parse security audit with specific standards', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "OWASP 기준 보안 검사",
            command: "analyze",
            flags: {
              "security": "owasp-top10",
              "focus": "authentication",
              "validate": true,
              "report-format": "detailed"
            },
            flagContexts: {
              "security": "OWASP Top 10 기준, 인증 취약점 중심"
            },
            additionalRequirements: [
              "OWASP Top 10 체크리스트 사용",
              "인증/인가 로직 집중 검토",
              "상세 보고서 생성"
            ],
            personas: ["security", "qa"],
            confidence: 0.95
          })
        }
      });

      const result = await parser.parse(
        '보안 검사를 하는데 OWASP Top 10 기준으로, 특히 인증 관련 취약점을 중점적으로 상세한 보고서로 만들어줘'
      );

      expect(result.baseCommand).toBe('analyze');
      expect(result.flags.get('security')).toBe('owasp-top10');
      expect(result.flags.get('focus')).toBe('authentication');
      expect(result.flags.get('report-format')).toBe('detailed');
      expect(result.additionalRequirements).toHaveLength(3);
    });

    it('should parse browser testing with specific versions', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "특정 브라우저 버전 호환성 테스트",
            command: "test",
            flags: {
              "playwright": true,
              "browsers": "chrome:latest-3,safari",
              "test-type": "compatibility",
              "parallel": true
            },
            flagContexts: {
              "playwright": "Chrome 최신 3개 버전, Safari"
            },
            additionalRequirements: [
              "Chrome 최신 3개 버전 테스트",
              "Safari 최신 버전 테스트",
              "병렬 실행으로 시간 단축"
            ],
            personas: ["qa", "frontend"],
            confidence: 0.88
          })
        }
      });

      const result = await parser.parse(
        '브라우저 호환성 테스트를 Chrome 최신 3개 버전과 Safari에서만 병렬로 실행해줘'
      );

      expect(result.baseCommand).toBe('test');
      expect(result.flags.get('playwright')).toBe(true);
      expect(result.flags.get('browsers')).toBe('chrome:latest-3,safari');
      expect(result.flags.get('parallel')).toBe(true);
    });
  });

  describe('Context-aware parsing', () => {
    it('should handle production environment requirements', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "프로덕션 환경 안전 배포",
            command: "deploy",
            flags: {
              "safe-mode": true,
              "env": "production",
              "validate": true,
              "rollback-enabled": true,
              "health-check": "comprehensive"
            },
            flagContexts: {
              "safe-mode": "프로덕션 환경 보호"
            },
            additionalRequirements: [
              "배포 전 전체 검증",
              "롤백 계획 준비",
              "헬스체크 강화"
            ],
            personas: ["devops", "security"],
            confidence: 0.92
          })
        }
      });

      const result = await parser.parse(
        '프로덕션에 배포하는데 안전하게 롤백 가능하도록 준비해줘'
      );

      expect(result.flags.get('safe-mode')).toBe(true);
      expect(result.flags.get('env')).toBe('production');
      expect(result.flags.get('rollback-enabled')).toBe(true);
    });

    it('should handle memory leak specific analysis', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "메모리 누수 심층 분석",
            command: "analyze",
            flags: {
              "performance": true,
              "memory-leak": true,
              "profiling": "heap",
              "duration": "10m",
              "think-hard": true
            },
            flagContexts: {
              "performance": "메모리 누수 집중 분석",
              "profiling": "10분간 힙 프로파일링"
            },
            additionalRequirements: [
              "힙 스냅샷 비교 분석",
              "메모리 증가 패턴 추적",
              "가비지 컬렉션 동작 분석"
            ],
            personas: ["performance", "analyzer"],
            confidence: 0.94
          })
        }
      });

      const result = await parser.parse(
        '메모리 누수를 찾기 위해 10분 동안 힙 프로파일링하면서 깊게 분석해줘'
      );

      expect(result.flags.get('memory-leak')).toBe(true);
      expect(result.flags.get('profiling')).toBe('heap');
      expect(result.flags.get('duration')).toBe('10m');
      expect(result.flags.get('think-hard')).toBe(true);
    });
  });

  describe('Fallback and error handling', () => {
    it('should fallback to rule-based when AI fails', async () => {
      mockGeminiGenerate.mockRejectedValue(new Error('API Error'));

      const result = await parser.parse(
        '복잡한 보안 분석을 해줘'
      );

      expect(result.baseCommand).toBe('analyze');
      expect(result.flags.get('security')).toBe(true);
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence due to fallback
    });

    it('should handle malformed AI responses', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const result = await parser.parse(
        'API 성능을 개선해줘'
      );

      expect(result.baseCommand).toBe('improve');
      expect(result.flags.get('performance')).toBe(true);
      // Should use rule-based results
    });
  });

  describe('Compression with Gemini', () => {
    it('should use Gemini for output compression instead of --uc', async () => {
      const compressor = parser.getCompressor();
      
      const longText = `
        This is a very long technical explanation about the system architecture
        including multiple components, services, and their interactions...
        [Imagine 1000+ words here]
      `;

      const compressed = await compressor.compressOutput(longText, 'balanced');
      
      expect(compressed.length).toBeLessThan(longText.length * 0.5);
      expect(compressed).toContain('system architecture');
    });
  });

  describe('Complex multi-requirement parsing', () => {
    it('should handle multiple requirements in single command', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "종합적인 코드 개선",
            command: "improve",
            flags: {
              "security": "xss,csrf",
              "performance": true,
              "test-coverage": "80%",
              "refactor": true,
              "wave-mode": "progressive"
            },
            flagContexts: {
              "security": "XSS, CSRF 취약점 수정",
              "test-coverage": "80% 이상 커버리지 목표"
            },
            additionalRequirements: [
              "보안과 성능 동시 개선",
              "리팩토링하면서 테스트 추가",
              "단계적 개선 접근"
            ],
            personas: ["security", "performance", "refactorer", "qa"],
            confidence: 0.85
          })
        }
      });

      const result = await parser.parse(
        '보안 문제(특히 XSS, CSRF)를 수정하면서 성능도 개선하고, ' +
        '리팩토링도 하면서 테스트 커버리지를 80% 이상으로 올려줘'
      );

      expect(result.flags.get('security')).toBe('xss,csrf');
      expect(result.flags.get('performance')).toBe(true);
      expect(result.flags.get('test-coverage')).toBe('80%');
      expect(result.flags.get('refactor')).toBe(true);
      expect(result.suggestedPersonas).toHaveLength(4);
    });
  });
});