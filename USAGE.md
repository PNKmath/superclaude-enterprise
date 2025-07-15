# SuperClaude Enterprise 사용 가이드

## 🎯 빠른 시작

### 1. 설치 확인

설치 후 시스템 상태를 확인합니다:

```bash
sc-enterprise status
```

정상적으로 설치되었다면 다음과 같은 출력을 볼 수 있습니다:
```
📊 System Status:
SuperClaude: ✓
Gemini CLI: ✓
Extensions: conflict-resolver, execution-levels, gemini-adapter, hooks-v4, learning-engine, security-layer, natural-language
Active Hooks: 3
Cache Hit Rate: 0%
```

### 2. 첫 번째 명령 실행

#### 방법 1: 자연어로 편하게 (NEW! 🆕)

```bash
# 한글로 자유롭게
sc-enterprise natural "이 파일 보안 검사해줘" --execute
sc-enterprise n "로그인 기능 구현" -e  # 단축 명령어

# 영어로도 자유롭게
sc-enterprise natural "check security issues in auth.js" --execute
sc-enterprise n "optimize database performance" -e
```

#### 방법 2: 기존 명령어 사용

```bash
# 단일 파일 분석
sc-enterprise run '/sc:analyze README.md'

# 보안 중심 분석
sc-enterprise run '/sc:analyze auth.js --security'
```

## 📚 주요 사용 시나리오

### 시나리오 1: 보안 취약점 검사

#### 자연어로 편하게:
```bash
# 자연어로 요청
sc-enterprise natural "auth 폴더의 보안 문제를 찾아줘" --execute
sc-enterprise n "JWT 인증 시스템 안전하게 구현" -e
```

#### 또는 기존 명령어로:
```bash
# 1. 기존 코드 보안 분석
sc-enterprise run '/sc:analyze src/auth --security' -p security,qa

# 2. 충돌 해결 결과 확인
# Security persona가 QA보다 높은 우선순위를 가지므로
# 보안 검사가 먼저 수행되고, QA 체크가 이어집니다.

# 3. 개선 사항 구현
sc-enterprise run '/sc:implement secure-jwt-auth' -p security,backend --level 2
```

### 시나리오 2: 대용량 프로젝트 분석

Gemini CLI를 활용한 비용 효율적인 분석:

```bash
# 전체 프로젝트 구조 분석 (Gemini 자동 선택)
sc-enterprise run '/sc:analyze . --architecture' --backend auto

# 라우팅 테스트로 백엔드 선택 확인
sc-enterprise test-routing '/sc:analyze' -f "src/" -s "5MB"
# Output: Selected Backend: gemini (Reason: Large context size)
```

#### Gemini 자동 선택 조건:
- 파일 크기 > 100KB
- 파일 개수 > 10개
- 전체 컨텍스트 > 100KB
- `--cost-sensitive` 플래그 사용 시

#### 수동 백엔드 지정:
```bash
# Claude 강제 사용 (높은 품질)
sc-enterprise run '/sc:analyze critical-code.js' --backend claude

# Gemini 강제 사용 (비용 절감)
sc-enterprise run '/sc:analyze large-dataset.json' --backend gemini
```

### 시나리오 3: 팀 협업 시나리오

여러 개발자가 동시에 작업할 때:

```bash
# Frontend 개발자 관점
sc-enterprise run '/sc:design user-dashboard' -p frontend,ux

# Backend 개발자 관점  
sc-enterprise run '/sc:design user-dashboard' -p backend,architect

# 통합 설계 (충돌 자동 해결)
sc-enterprise run '/sc:design user-dashboard' -p frontend,backend,architect,security
```

### 시나리오 4: CI/CD 통합

자동화된 품질 검사:

```bash
# Pre-commit hook
sc-enterprise run '/sc:analyze --quick' --level 1

# Pre-push validation
sc-enterprise run '/sc:test --comprehensive' -p qa,security --level 3

# Production deployment check
SC_ENTERPRISE_ENV=production sc-enterprise run '/sc:analyze --pre-deploy' --level 4
```

## 🎚️ 실행 레벨 활용

### Level 0: Silent (🔇)
```bash
# 로그만 남기고 조용히 실행
sc-enterprise run '/sc:analyze logs/' --level 0
```

### Level 1: Notify (💬)
```bash
# 중요한 발견사항만 알림
sc-enterprise run '/sc:analyze src/' --level 1
```

### Level 2: Suggest (💡) - 기본값
```bash
# 개선 제안과 함께 실행
sc-enterprise run '/sc:improve legacy-code.js'
```

### Level 3: Block (🚫)
```bash
# 위험한 작업은 차단
sc-enterprise run '/sc:deploy prod' --level 3
# 실행 전 확인 필요
```

### Level 4: Auto (🤖)
```bash
# 신뢰할 수 있는 작업은 자동 실행
sc-enterprise run '/sc:fix --minor-issues' --level 4
```

## 🪝 Claude Code Hooks 사용법

### Hook 설정 확인
```bash
# 현재 활성화된 hooks 보기
sc-enterprise hooks
```

### 페르소나 Veto 확인
```bash
# Security 페르소나가 명령을 차단하는지 확인
sc-enterprise check-veto security --command "rm -rf /"
```

### 파일 변경 충돌 확인
```bash
# 파일 수정 시 페르소나 간 충돌 확인
sc-enterprise conflict-check --files "api.ts db.ts" --personas "architect,performance"
```

### Hook 설정 커스터마이징
```bash
# 프로젝트 hooks 편집
vim .claude/settings.json

# 개인 hooks 편집 (git에서 제외됨)
vim .claude/settings.local.json
```

### 예제 Hook 사용
```bash
# Python 프로젝트용 hooks 복사
cp .claude/hooks/python-project.json .claude/settings.json

# TypeScript 프로젝트용 hooks 복사
cp .claude/hooks/typescript-project.json .claude/settings.json
```

## 🤝 페르소나 조합 모범 사례

### 효과적인 조합

1. **Full Stack 개발**
   ```bash
   sc-enterprise run '/sc:implement user-feature' -p frontend,backend,architect
   ```

2. **보안 강화 개발**
   ```bash
   sc-enterprise run '/sc:implement payment-api' -p security,backend,qa
   ```

3. **성능 최적화**
   ```bash
   sc-enterprise run '/sc:improve slow-endpoint' -p performance,backend,devops
   ```

4. **코드 품질 개선**
   ```bash
   sc-enterprise run '/sc:improve messy-module' -p refactorer,qa,analyzer
   ```

### 충돌이 발생하는 조합과 해결

1. **Security vs Performance**
   ```bash
   # 충돌 테스트
   sc-enterprise test-conflict -p security,performance
   
   # 실제 적용 시 Security가 우선권을 가짐
   sc-enterprise run '/sc:optimize auth-flow' -p security,performance
   ```

2. **Frontend vs Backend**
   ```bash
   # API 설계 시 협상 필요
   sc-enterprise run '/sc:design rest-api' -p frontend,backend
   # Negotiation engine이 양쪽 요구사항을 균형있게 조정
   ```

## 🚀 고급 기능

### 1. 학습 기반 최적화

시스템이 사용 패턴을 학습합니다:

```bash
# 현재 학습된 인사이트 확인
sc-enterprise insights

# 팀 레벨 인사이트
sc-enterprise insights --team backend-team
```

### 2. 배치 작업

여러 파일을 효율적으로 처리:

```bash
# Hook 시스템이 자동으로 배치 처리
sc-enterprise run '/sc:analyze src/**/*.js' -p security,performance
```

### 3. 컨텍스트 인식

프로젝트 상태에 따라 자동 조정:

```bash
# 금요일 오후 배포는 자동으로 높은 보안 레벨
sc-enterprise run '/sc:deploy staging'

# 핫픽스는 빠른 처리
sc-enterprise run '/sc:fix critical-bug' --hotfix
```

### 4. 비용 최적화

```bash
# 예상 비용 확인
sc-enterprise test-routing '/sc:analyze large-dataset' -s "10MB"

# 비용 제한 설정
export SC_ENTERPRISE_COST_LIMIT=1.00
sc-enterprise run '/sc:analyze entire-codebase'
```

## 📊 모니터링과 디버깅

### 실행 추적

```bash
# Dry run으로 미리 확인
sc-enterprise run '/sc:deploy prod' --dry-run

# 상세 로그 활성화
export SC_ENTERPRISE_DEBUG=true
sc-enterprise run '/sc:analyze complex-module'
```

### 성능 모니터링

```bash
# 캐시 효율성 확인
sc-enterprise status

# 메트릭 대시보드 (Grafana 필요)
open http://localhost:3000/d/superclaude-enterprise
```

## 🛠️ 문제 해결

### 일반적인 사용 실수와 해결법

1. **너무 많은 페르소나 지정**
   ```bash
   # 잘못된 예 - 너무 많은 충돌 발생
   sc-enterprise run '/sc:implement feature' -p frontend,backend,security,performance,qa,architect
   
   # 올바른 예 - 핵심 페르소나만
   sc-enterprise run '/sc:implement feature' -p architect,security
   ```

2. **잘못된 레벨 설정**
   ```bash
   # 프로덕션에서 위험
   SC_ENTERPRISE_ENV=production sc-enterprise run '/sc:fix' --level 4
   
   # 안전한 접근
   SC_ENTERPRISE_ENV=production sc-enterprise run '/sc:fix' --level 3
   ```

3. **백엔드 강제 지정 남용**
   ```bash
   # 작은 파일에 Gemini 강제 사용 (비효율적)
   sc-enterprise run '/sc:analyze small.js' --backend gemini
   
   # 자동 선택이 더 효율적
   sc-enterprise run '/sc:analyze small.js' --backend auto
   ```

## 💡 프로 팁

1. **별칭 설정으로 생산성 향상**
   ```bash
   alias sce='sc-enterprise'
   alias sce-sec='sc-enterprise run -p security'
   alias sce-perf='sc-enterprise run -p performance'
   ```

2. **프로젝트별 설정**
   ```bash
   # .sc-enterprise.yaml 생성
   echo "default_personas: [security, qa]" > .sc-enterprise.yaml
   echo "default_level: 2" >> .sc-enterprise.yaml
   ```

3. **Git 통합 활용**
   ```bash
   # 커밋 메시지에 분석 결과 포함
   sc-enterprise run '/sc:analyze --changes' > .git/COMMIT_ANALYSIS
   git commit -F .git/COMMIT_ANALYSIS
   ```

## 🆕 자연어 명령어 가이드

### 지원되는 자연어 패턴

SuperClaude Enterprise는 다양한 자연어 입력을 이해합니다:

#### 분석/검사 요청
```bash
sc-enterprise n "이 코드 분석해줘" -e
sc-enterprise n "보안 취약점 있나 확인" -e
sc-enterprise n "코드 품질 검사" -e
sc-enterprise n "버그 찾아줘" -e
```

#### 구현/개발 요청
```bash
sc-enterprise n "로그인 기능 만들어줘" -e
sc-enterprise n "REST API 구현해줘" -e
sc-enterprise n "회원가입 폼 추가" -e
sc-enterprise n "데이터베이스 스키마 생성" -e
```

#### 개선/최적화 요청
```bash
sc-enterprise n "성능 개선해줘" -e
sc-enterprise n "더 빠르게 만들어줘" -e
sc-enterprise n "리팩토링 필요" -e
sc-enterprise n "메모리 사용량 줄여줘" -e
```

### 자연어 처리 확인

실행 전에 어떻게 해석되는지 확인:
```bash
# --execute 없이 실행하면 분석 결과만 표시
sc-enterprise natural "복잡한 요청 내용"

# 출력 예시:
# Detected Command: implement
# Confidence: 85%
# Suggested Personas: backend, frontend, architect
# Structured Command: /sc:implement [your request]
```

### 명령어 제안 받기

부분 입력으로 제안 받기:
```bash
sc-enterprise suggest "보안"
# 출력: 관련 명령어 제안 목록
```

## 🎓 다음 단계

1. **고급 설정 커스터마이징**: `config/` 디렉토리의 YAML 파일 수정
2. **커스텀 Hook 작성**: `extensions/hooks-v4/custom/` 디렉토리 활용
3. **팀 프로필 생성**: 팀별 최적화된 설정 공유
4. **플러그인 개발**: 조직 특화 기능 추가
5. **자연어 패턴 확장**: `src/utils/command-matcher.ts` 커스터마이징

더 자세한 정보는 [Architecture.md](Architecture.md)와 [API 문서](docs/api/)를 참고하세요.