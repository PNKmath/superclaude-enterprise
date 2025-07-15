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
Extensions: conflict-resolver, execution-levels, gemini-adapter, hooks-v4, learning-engine, security-layer
Active Hooks: 3
Cache Hit Rate: 0%
```

### 2. 첫 번째 명령 실행

간단한 파일 분석부터 시작해보세요:

```bash
# 단일 파일 분석
sc-enterprise run '/sc:analyze README.md'

# 보안 중심 분석
sc-enterprise run '/sc:analyze auth.js --security'
```

## 📚 주요 사용 시나리오

### 시나리오 1: 보안 취약점 검사

새로운 인증 시스템을 구현하기 전에 보안 검토:

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

## 🎓 다음 단계

1. **고급 설정 커스터마이징**: `config/` 디렉토리의 YAML 파일 수정
2. **커스텀 Hook 작성**: `extensions/hooks-v4/custom/` 디렉토리 활용
3. **팀 프로필 생성**: 팀별 최적화된 설정 공유
4. **플러그인 개발**: 조직 특화 기능 추가

더 자세한 정보는 [Architecture.md](Architecture.md)와 [API 문서](docs/api/)를 참고하세요.