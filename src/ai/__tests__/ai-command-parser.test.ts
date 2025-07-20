import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AICommandParser } from '../ai-command-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
vi.mock('@google/generative-ai');

describe('AICommandParser', () => {
  let parser: AICommandParser;
  let mockGeminiGenerate: Mock;

  beforeEach(() => {
    // Setup mocks
    mockGeminiGenerate = vi.fn();
    
    (GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: vi.fn(() => ({
        generateContent: mockGeminiGenerate
      }))
    }));

    parser = new AICommandParser({
      geminiApiKey: 'test-key',
      enableAI: true,
      complexityThreshold: 0.7,
      maxTokens: 1000,
      useCompression: false
    });
  });

  describe('AI-First Natural Language Processing', () => {
    it('should use AI to understand security analysis request', async () => {
      // Mock realistic Gemini response for security analysis
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "보안 취약점 검사 및 분석",
            command: "analyze",
            flags: {
              "security": true,
              "validate": true,
              "report-format": "detailed"
            },
            flagContexts: {
              "security": "전체 코드베이스의 보안 취약점 검사"
            },
            additionalRequirements: [
              "OWASP Top 10 기준 검토",
              "코드 인젝션 취약점 확인",
              "인증/인가 로직 검증"
            ],
            personas: ["security", "analyzer"],
            confidence: 0.95
          })
        }
      });

      const result = await parser.parse('이 프로젝트의 보안 문제를 찾아서 상세하게 보고해줘');
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.flags.get('security')).toBe(true);
      expect(result.flags.get('validate')).toBe(true);
      expect(result.flags.get('report-format')).toBe('detailed');
      expect(result.additionalRequirements).toContain('OWASP Top 10 기준 검토');
      expect(result.suggestedPersonas).toContain('security');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should use AI to understand complex performance optimization request', async () => {
      // Mock realistic Gemini response for performance optimization
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "API 응답 속도 개선 및 메모리 최적화",
            command: "improve",
            flags: {
              "performance": true,
              "focus": "api-response",
              "memory-analysis": true,
              "benchmark": true
            },
            flagContexts: {
              "performance": "50% 성능 향상 목표, 메모리 4GB 제한"
            },
            additionalRequirements: [
              "현재 응답 시간 대비 50% 개선",
              "메모리 사용량 4GB 이하 유지",
              "병목 지점 프로파일링"
            ],
            personas: ["performance", "backend"],
            confidence: 0.92
          })
        }
      });

      const result = await parser.parse(
        'API 응답속도를 현재보다 50% 개선하되, 메모리는 4GB를 넘지 않도록 최적화해줘'
      );

      expect(result.baseCommand).toBe('improve');
      expect(result.flags.get('performance')).toBe(true);
      expect(result.flags.get('focus')).toBe('api-response');
      expect(result.flags.get('memory-analysis')).toBe(true);
      expect(result.flags.get('benchmark')).toBe(true);
      expect(result.additionalRequirements).toHaveLength(3);
      expect(result.suggestedPersonas).toContain('performance');
      expect(result.suggestedPersonas).toContain('backend');
    });

    it('should use AI to understand UI component implementation request', async () => {
      // Mock realistic Gemini response for UI component
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "React 로그인 폼 컴포넌트 구현",
            command: "implement",
            flags: {
              "framework": "react",
              "component": "login-form",
              "with-validation": true,
              "accessibility": true
            },
            flagContexts: {
              "component": "JWT 인증을 사용하는 로그인 폼"
            },
            additionalRequirements: [
              "JWT 토큰 기반 인증",
              "폼 유효성 검사 포함",
              "접근성 고려 (WCAG 2.1)",
              "반응형 디자인"
            ],
            personas: ["frontend", "security"],
            confidence: 0.88
          })
        }
      });

      const result = await parser.parse(
        'React로 JWT 인증을 사용하는 로그인 폼을 만들어줘'
      );

      expect(result.baseCommand).toBe('implement');
      expect(result.flags.get('framework')).toBe('react');
      expect(result.flags.get('component')).toBe('login-form');
      expect(result.flags.get('with-validation')).toBe(true);
      expect(result.flags.get('accessibility')).toBe(true);
      expect(result.additionalRequirements).toContain('JWT 토큰 기반 인증');
      expect(result.suggestedPersonas).toContain('frontend');
      expect(result.suggestedPersonas).toContain('security');
    });

    it('should use AI to understand testing requirements', async () => {
      // Mock realistic Gemini response for testing
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "브라우저 호환성 및 E2E 테스트",
            command: "test",
            flags: {
              "type": "e2e",
              "browsers": ["chrome", "safari", "firefox"],
              "parallel": true,
              "coverage": true
            },
            flagContexts: {
              "browsers": "Chrome, Safari, Firefox 최신 버전"
            },
            additionalRequirements: [
              "주요 사용자 시나리오 테스트",
              "크로스 브라우저 호환성 확인",
              "테스트 커버리지 80% 이상"
            ],
            personas: ["qa", "frontend"],
            confidence: 0.90
          })
        }
      });

      const result = await parser.parse(
        '주요 브라우저에서 E2E 테스트를 병렬로 실행해줘'
      );

      expect(result.baseCommand).toBe('test');
      expect(result.flags.get('type')).toBe('e2e');
      expect(result.flags.get('parallel')).toBe(true);
      expect(result.flags.get('coverage')).toBe(true);
      expect(Array.isArray(result.flags.get('browsers'))).toBe(true);
      expect(result.suggestedPersonas).toContain('qa');
    });

    it('should use AI to understand production deployment request', async () => {
      // Mock realistic Gemini response for deployment
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "프로덕션 환경 안전 배포",
            command: "deploy",
            flags: {
              "env": "production",
              "safe-mode": true,
              "rollback": true,
              "health-check": true,
              "zero-downtime": true
            },
            flagContexts: {
              "env": "프로덕션 환경, 무중단 배포"
            },
            additionalRequirements: [
              "배포 전 전체 테스트 실행",
              "롤백 계획 준비",
              "헬스체크 모니터링",
              "무중단 배포 전략"
            ],
            personas: ["devops", "security"],
            confidence: 0.94
          })
        }
      });

      const result = await parser.parse(
        '프로덕션에 안전하게 무중단 배포하고 문제시 롤백 가능하게 해줘'
      );

      expect(result.baseCommand).toBe('deploy');
      expect(result.flags.get('env')).toBe('production');
      expect(result.flags.get('safe-mode')).toBe(true);
      expect(result.flags.get('rollback')).toBe(true);
      expect(result.flags.get('zero-downtime')).toBe(true);
      expect(result.additionalRequirements).toContain('무중단 배포 전략');
      expect(result.suggestedPersonas).toContain('devops');
    });
  });

  describe('Fallback behavior', () => {
    it('should gracefully fallback to rule-based parsing when AI fails', async () => {
      mockGeminiGenerate.mockRejectedValue(new Error('API Error'));

      const result = await parser.parse('보안 검사해줘');

      // Should still work with basic parsing
      expect(result.baseCommand).toBe('analyze');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle malformed AI responses', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const result = await parser.parse('성능 개선해줘');

      // Should fallback to rule-based parsing
      expect(result.baseCommand).toBe('improve');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty AI responses', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => ''
        }
      });

      const result = await parser.parse('테스트 실행해줘');

      // Should fallback to rule-based parsing
      expect(result.baseCommand).toBe('test');
    });
  });

  describe('Complex multi-requirement parsing', () => {
    it('should handle multiple requirements in single command', async () => {
      mockGeminiGenerate.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            intent: "종합적인 코드 품질 개선",
            command: "improve",
            flags: {
              "quality": true,
              "security": true,
              "performance": true,
              "test-coverage": true,
              "documentation": true
            },
            flagContexts: {
              "quality": "보안, 성능, 테스트, 문서화 종합 개선"
            },
            additionalRequirements: [
              "보안 취약점 수정",
              "성능 병목 지점 개선",
              "테스트 커버리지 80% 달성",
              "API 문서 자동 생성",
              "코드 리팩토링"
            ],
            personas: ["security", "performance", "qa", "refactorer", "scribe"],
            confidence: 0.87
          })
        }
      });

      const result = await parser.parse(
        '보안 문제 수정하고, 성능도 개선하면서, 테스트 커버리지 80% 이상으로 올리고, 문서도 작성해줘'
      );

      expect(result.flags.get('quality')).toBe(true);
      expect(result.flags.get('security')).toBe(true);
      expect(result.flags.get('performance')).toBe(true);
      expect(result.flags.get('test-coverage')).toBe(true);
      expect(result.flags.get('documentation')).toBe(true);
      expect(result.suggestedPersonas).toHaveLength(5);
      expect(result.additionalRequirements).toHaveLength(5);
    });
  });

  describe('Context awareness', () => {
    it('should maintain context across requests', async () => {
      // First request
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            intent: "API 엔드포인트 구현",
            command: "implement",
            flags: { "type": "api", "framework": "express" },
            flagContexts: {},
            additionalRequirements: ["RESTful API 설계"],
            personas: ["backend"],
            confidence: 0.9
          })
        }
      });

      await parser.parse('Express로 API 만들어줘');

      // Second request should consider context
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            intent: "API 인증 추가",
            command: "implement",
            flags: { "type": "auth", "method": "jwt", "for": "api" },
            flagContexts: { "auth": "이전에 생성한 API에 JWT 인증 추가" },
            additionalRequirements: ["기존 API에 인증 미들웨어 적용"],
            personas: ["backend", "security"],
            confidence: 0.92
          })
        }
      });

      const result = await parser.parse('거기에 인증 추가해줘');

      expect(result.flags.get('type')).toBe('auth');
      expect(result.flags.get('method')).toBe('jwt');
      expect(result.flags.get('for')).toBe('api');
      expect(result.flagContexts.get('auth')).toContain('이전에 생성한 API');
    });
  });
});