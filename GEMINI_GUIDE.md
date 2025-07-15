# Gemini CLI Integration Guide

## Overview

SuperClaude Enterprise는 대용량 파일과 컨텍스트 처리 시 비용을 절감하기 위해 Gemini CLI와 통합됩니다.

## 비용 비교

| Backend | 비용 (per 1M tokens) | 장점 | 단점 |
|---------|---------------------|------|------|
| Claude 3 | $15.00 | 높은 품질, 정확한 응답 | 비용이 높음 |
| Gemini 1.5 | $0.50 | 매우 저렴 (97% 절감) | 품질이 다소 낮을 수 있음 |

## 자동 백엔드 선택

SuperClaude Enterprise는 다음 조건에서 자동으로 Gemini를 선택합니다:

### 1. 큰 파일 처리
- 단일 파일 크기 > 100KB
- 파일명에 'large' 포함

### 2. 다중 파일 처리
- 파일 개수 > 10개

### 3. 대용량 컨텍스트
- 전체 컨텍스트 크기 > 100KB

### 4. 비용 민감 작업
- `--cost-sensitive` 플래그 사용 시

## 수동 백엔드 선택

### Claude 강제 사용
```bash
# 중요한 코드 분석 - 품질 우선
sc-enterprise run '/sc:analyze critical-auth.js' --backend claude
```

### Gemini 강제 사용
```bash
# 대용량 데이터 처리 - 비용 우선
sc-enterprise run '/sc:analyze logs/*.json' --backend gemini
```

## 설치 방법

### 1. Google AI Python SDK 설치 (권장)
```bash
pip install google-generativeai
```

### 2. 환경 변수 설정
```bash
export GOOGLE_API_KEY="your-api-key-here"
```

### 3. 설치 확인
```bash
# Gemini CLI 확인
gemini --version

# SuperClaude Enterprise에서 확인
sc-enterprise status
# Output: Gemini CLI: ✓
```

## 사용 예시

### 예시 1: 대용량 로그 분석
```bash
# 자동으로 Gemini 선택됨
sc-enterprise run '/sc:analyze server-logs.json'
# Backend: gemini (Reason: Large file detected)
# Estimated cost: $0.05 (vs $1.50 with Claude)
```

### 예시 2: 프로젝트 전체 스캔
```bash
# 많은 파일로 인해 Gemini 선택
sc-enterprise run '/sc:analyze src/' --recursive
# Backend: gemini (Reason: Multiple files (>10))
# Estimated cost: $0.20 (vs $6.00 with Claude)
```

### 예시 3: 비용 최적화 모드
```bash
# 명시적으로 비용 최적화 요청
sc-enterprise run '/sc:improve performance' --cost-sensitive
# Backend: gemini (Reason: Cost-sensitive operation)
```

## 백엔드 선택 테스트

실제 실행 전에 어떤 백엔드가 선택될지 확인:

```bash
# 테스트 명령어
sc-enterprise test-routing '/sc:analyze' -f "data.json" -s "500KB"

# 출력 예시:
# Backend Decision: gemini
# Reason: Large file detected - using Gemini for cost efficiency
# Estimated Cost: $0.25 (Gemini) vs $7.50 (Claude)
# Savings: 96.7%
```

## 성능 고려사항

### Gemini 사용이 적합한 경우:
- 대용량 데이터 처리
- 단순 분석 작업
- 비용이 중요한 경우
- 대량 파일 일괄 처리

### Claude 사용이 적합한 경우:
- 복잡한 로직 구현
- 보안 관련 코드 검토
- 정확도가 중요한 작업
- 아키텍처 설계

## 문제 해결

### "Gemini CLI not available" 오류
```bash
# Python 패키지 재설치
pip install --upgrade google-generativeai

# PATH 확인
which gemini
```

### API 키 오류
```bash
# API 키 설정 확인
echo $GOOGLE_API_KEY

# 키 재설정
export GOOGLE_API_KEY="your-new-key"
```

## 모니터링

### 사용량 추적
```bash
# 일일 사용량 확인
sc-enterprise insights --backend-usage

# 비용 분석
sc-enterprise insights --cost-analysis
```

## 모범 사례

1. **하이브리드 접근**: 중요도에 따라 백엔드 선택
2. **배치 처리**: 여러 파일은 한 번에 처리하여 비용 절감
3. **프리뷰 모드**: `--dry-run`으로 비용 미리 확인
4. **정기 모니터링**: 사용 패턴 분석으로 최적화 기회 발견