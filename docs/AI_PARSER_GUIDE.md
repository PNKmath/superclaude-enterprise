# AI-Enhanced Command Parser Guide

SuperClaude Enterprise의 AI 기반 자연어 명령어 파싱 시스템 가이드입니다.

## 개요

AI 파서는 Google Gemini를 활용하여 복잡한 자연어 명령을 정확하게 이해하고 SuperClaude 명령어로 변환합니다.

## 주요 기능

### 1. 복잡한 값 처리
- **성능 목표**: "50% 개선" → `--target-improvement=50%`
- **메모리 제한**: "4GB 이하" → `--memory-limit=4GB`
- **시간 제약**: "5초 내" → `--timeout=5s`
- **브라우저 버전**: "Chrome 최신 3개" → `--browsers=chrome:latest-3`

### 2. 다중 요구사항 처리
```
입력: "보안 검사를 OWASP Top 10 기준으로 하면서 성능도 개선하고, 
      테스트 커버리지를 80% 이상으로 올려줘"

결과:
- Command: improve
- Flags: --security=owasp-top10 --performance --test-coverage=80%
- Personas: security, performance, qa
```

### 3. 컨텍스트 인식
- 프로덕션 환경 자동 감지 → `--safe-mode --env=production`
- 조건부 플래그 설정
- 환경별 최적화

### 4. Gemini 압축 (--uc 대체)
- AI 기반 지능형 압축
- 기술적 정확성 유지
- 3단계 압축 레벨: minimal, balanced, aggressive

## 설정

### 1. 환경 변수 설정
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### 2. 설정 파일 (`config/ai-parser.json`)
```json
{
  "ai": {
    "enabled": true,              // AI 파서 활성화
    "provider": "gemini",         
    "apiKey": "${GEMINI_API_KEY}", // 환경 변수에서 읽음
    "complexityThreshold": 0.7,   // AI 사용 기준 (0.0-1.0)
    "maxTokens": 1000,
    "compressionEnabled": true,
    "compressionLevel": "balanced" // minimal|balanced|aggressive
  },
  "fallback": {
    "useRuleBasedOnly": false,    // AI 실패시 규칙 기반 사용
    "timeout": 3000               // AI 응답 타임아웃 (ms)
  },
  "cache": {
    "enabled": true,              // 파싱 결과 캐싱
    "ttl": 3600                   // 캐시 유효시간 (초)
  }
}
```

## 사용 예시

### 기본 사용
```bash
# 간단한 명령 (규칙 기반 처리)
"코드 분석해줘"
→ /sc:analyze

# 복잡한 명령 (AI 처리)
"메모리 누수를 찾기 위해 10분 동안 힙 프로파일링하면서 깊게 분석해줘"
→ /sc:analyze --performance --memory-leak --profiling=heap --duration=10m --think-hard
```

### 고급 예시

#### 1. 성능 최적화
```
입력: "API 응답속도를 현재보다 50% 개선하되, 메모리는 4GB를 넘지 않도록 최적화해줘"

AI 파싱 결과:
{
  "command": "improve",
  "flags": {
    "performance": true,
    "target-improvement": "50%",
    "memory-limit": "4GB",
    "focus": "api-response"
  },
  "additionalRequirements": [
    "현재 대비 50% 개선 목표",
    "메모리 사용량 모니터링 필요"
  ],
  "personas": ["performance", "backend"]
}
```

#### 2. 보안 감사
```
입력: "보안 검사를 OWASP Top 10 기준으로, 특히 인증 관련 취약점을 중점적으로 상세한 보고서로"

AI 파싱 결과:
{
  "command": "analyze",
  "flags": {
    "security": "owasp-top10",
    "focus": "authentication",
    "validate": true,
    "report-format": "detailed"
  },
  "personas": ["security", "qa"]
}
```

#### 3. 브라우저 테스트
```
입력: "Chrome 최신 3개 버전과 Safari에서 호환성 테스트를 병렬로 실행"

AI 파싱 결과:
{
  "command": "test",
  "flags": {
    "playwright": true,
    "browsers": "chrome:latest-3,safari",
    "test-type": "compatibility",
    "parallel": true
  },
  "personas": ["qa", "frontend"]
}
```

## 복잡도 평가 기준

AI 파서는 다음 기준으로 복잡도를 평가하여 AI 사용 여부를 결정합니다:

1. **다중 요구사항** (+0.1): "그리고", "동시에", "면서" 등
2. **구체적 값** (+0.15): 퍼센트, 메모리 크기, 시간 등
3. **플래그 개수** (+0.2): 3개 이상
4. **입력 길이** (+0.1): 100자 이상
5. **조건부 요구** (+0.15): "프로덕션", "조건" 등

복잡도가 0.7 이상이면 AI 파서를 사용합니다.

## 성능 최적화

### 캐싱
- 동일한 입력은 캐시에서 즉시 반환
- TTL 기반 캐시 만료

### 병렬 처리
- Gemini API 호출은 비동기 처리
- 규칙 기반 파싱과 동시 실행

### 폴백 전략
- AI 실패시 자동으로 규칙 기반 파싱
- 타임아웃 설정으로 응답 시간 보장

## 문제 해결

### AI 파서가 작동하지 않을 때
1. Gemini API 키 확인
2. 설정 파일의 `enabled: true` 확인
3. 복잡도 임계값 조정
4. 로그 확인: `~/.superclaude/logs/`

### 성능 이슈
1. 캐시 활성화 확인
2. 복잡도 임계값 높이기
3. maxTokens 줄이기

## 향후 개선 계획

1. **학습 기능**: 사용 패턴 학습으로 정확도 향상
2. **다국어 지원**: 더 많은 언어 지원
3. **커스텀 패턴**: 프로젝트별 맞춤 패턴 등록
4. **로컬 모델**: Gemini 외 로컬 LLM 지원