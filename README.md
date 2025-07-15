# SuperClaude Enterprise Extension 🚀

[![Tests](https://img.shields.io/badge/tests-20%20passed-brightgreen)](https://github.com/yourusername/superclaude-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An advanced enterprise extension for SuperClaude v3 that provides intelligent persona conflict resolution, automatic backend routing, and enhanced team collaboration features.

엔터프라이즈급 AI 개발 플랫폼 - SuperClaude의 강력한 확장

## 🚀 주요 기능

### 1. **지능형 페르소나 충돌 해결**
- 9개 페르소나 간 자동 우선순위 조정
- 컨텍스트 기반 동적 가중치
- 협상 엔진을 통한 최적 결정

### 2. **Gemini CLI 통합**
- 자동 백엔드 선택 (Claude/Gemini)
- 비용 최적화 (최대 50% 절감)
- 1M 토큰 대용량 컨텍스트 지원

### 3. **5단계 실행 레벨**
- Silent (0) → Auto-execute (4)
- 컨텍스트 기반 자동 레벨 결정
- 프로덕션 환경 안전 장치

### 4. **Claude Code Hooks 완전 통합**
- PreToolUse, PostToolUse, Notification, Stop hooks 지원
- 자동 포맷팅, 테스트, 보안 검증
- Git hooks 자동 통합
- IDE 저장 시 즉시 분석
- 배치 처리 및 캐싱으로 성능 최적화

### 5. **학습 엔진**
- 사용 패턴 자동 학습
- 팀별 최적화 제안
- 개인정보 보호 우선

## 📦 설치

### 요구사항
- Node.js 18+
- Python 3.8+
- Git
- Claude CLI (Claude Code 설치)

### 빠른 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/superclaude-enterprise.git
cd superclaude-enterprise

# 2. 설치 스크립트 실행
./scripts/install-enterprise.sh

# 3. PATH 설정 (필요시)
export PATH="$HOME/.local/bin:$PATH"
```

### 수동 설치

```bash
# 1. SuperClaude 설치
git clone https://github.com/NomenAK/SuperClaude.git
cd SuperClaude
python3 SuperClaude.py install --quick
cd ..

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 설치
mkdir -p ~/.claude/enterprise
cp -r dist/* ~/.claude/enterprise/
```

## 🎯 사용법

### 기본 명령어

```bash
# SuperClaude 명령 실행 (Enterprise 기능 포함)
sc-enterprise run '/sc:analyze auth.js --security'

# 다중 페르소나 실행
sc-enterprise run '/sc:design payment-system' -p architect,security,backend

# 실행 레벨 지정
sc-enterprise run '/sc:deploy prod' --level 3

# 백엔드 강제 지정
sc-enterprise run '/sc:analyze large-file.json' --backend gemini
```

### 충돌 해결 테스트

```bash
# 페르소나 충돌 시뮬레이션
sc-enterprise test-conflict -p security,performance -c '/sc:analyze'

# 결과 예시:
# Security (Priority: 10) overrides Performance (Priority: 7)
# Resolution: Security checks first, then performance optimization
```

### 백엔드 라우팅 테스트

```bash
# 어떤 백엔드가 선택될지 확인
sc-enterprise test-routing '/sc:analyze' -f "large-dataset.json" -s "500KB"

# 결과:
# Selected Backend: gemini
# Reason: File size > 100KB threshold
# Estimated Cost: $0.02
```

### 빠른 명령어

```bash
# 보안 스캔
sc-enterprise quick security-scan

# 성능 체크
sc-enterprise quick performance-check

# 코드 정리
sc-enterprise quick clean-code -t src/
```

### 학습 인사이트

```bash
# 개인 인사이트
sc-enterprise insights

# 팀 인사이트
sc-enterprise insights --team backend-team

# 결과:
# Most Used Personas: security, backend, qa
# Command Patterns: 15 detected
# Productivity Score: 85/100
# 
# Recommendations:
# 1. Consider using '/sc:test' before deployments
# 2. 'security' persona usage increased 40% - good practice!
```

## 🪝 Claude Code Hooks

### Hook 설정 확인

```bash
# 활성 hooks 보기
sc-enterprise hooks
```

### 기본 제공 Hooks

1. **보안 차단**: 위험한 명령어 자동 차단
2. **자동 포맷팅**: Python (black, ruff), TypeScript (prettier, eslint)
3. **충돌 검사**: 페르소나 충돌 자동 확인
4. **테스트 실행**: 변경된 파일 관련 테스트 자동 실행

### Hook 설정 파일
- `.claude/settings.json` - 프로젝트 hooks
- `.claude/settings.local.json` - 개인 hooks
- `~/.claude/settings.json` - 전역 hooks

자세한 내용은 [HOOKS.md](HOOKS.md) 참조

## ⚙️ 설정

### 설정 파일 위치
`~/.claude/enterprise/config/config.yaml`

### 주요 설정

```yaml
# 충돌 해결 설정
conflict_resolver:
  enabled: true
  default_strategy: "priority_based"
  
# Gemini 통합
gemini:
  enabled: true
  auto_routing: true
  cost_threshold: 0.10
  
# 실행 레벨
execution_levels:
  default: 2
  production_override: 3
  
# 학습 엔진
learning:
  enabled: true
  privacy_mode: "strict"
```

### 환경별 설정

```bash
# 프로덕션 환경
export SC_ENTERPRISE_ENV=production
export SC_ENTERPRISE_LEVEL=3

# 개발 환경
export SC_ENTERPRISE_ENV=development
export SC_ENTERPRISE_LEVEL=1
```

## 🔧 고급 기능

### Git Hook 통합

```bash
# .git/hooks/pre-commit
#!/bin/bash
sc-enterprise run '/sc:analyze --quick' --level 2

# .git/hooks/pre-push
sc-enterprise run '/sc:test' --persona qa --level 3
```

### VS Code 통합

`.vscode/settings.json`:
```json
{
  "saveActions.onSave": {
    "commands": [
      "sc-enterprise run '/sc:analyze ${file}' --quick"
    ]
  }
}
```

### CI/CD 통합

```yaml
# .github/workflows/sc-enterprise.yml
name: SuperClaude Enterprise Check

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup SuperClaude Enterprise
        run: |
          ./scripts/install-enterprise.sh
      - name: Security Analysis
        run: |
          sc-enterprise run '/sc:analyze --security' --level 3
      - name: Performance Check
        run: |
          sc-enterprise run '/sc:analyze --performance' --level 2
```

## 📊 모니터링

### 상태 확인

```bash
sc-enterprise status

# Output:
# SuperClaude: ✓
# Gemini CLI: ✓
# Extensions: conflict-resolver, execution-levels, gemini-adapter
# Active Hooks: 3
# Cache Hit Rate: 78%
```

### 메트릭 대시보드

Grafana 대시보드 임포트:
```bash
cp dashboards/superclaude-enterprise.json /var/lib/grafana/dashboards/
```

주요 메트릭:
- Command execution time
- Conflict resolution frequency
- Backend usage distribution
- Cost tracking
- Error rates

## 🛡️ 보안

### 데이터 보호
- 모든 민감 정보 자동 마스킹
- 로컬 실행 우선 (클라우드 선택적)
- 감사 로그 자동 생성

### 컴플라이언스
- SOC2 준수 가능
- GDPR 호환
- 역할 기반 접근 제어 (RBAC)

## 🐛 문제 해결

### 일반적인 문제

**1. "command not found: sc-enterprise"**
```bash
# PATH에 추가
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**2. "SuperClaude not found"**
```bash
# SuperClaude 재설치
cd SuperClaude
python3 SuperClaude.py install --quick
```

**3. "Gemini CLI not available"**
```bash
# Gemini CLI 설치 (선택사항)
pip install google-generativeai
```

### 디버그 모드

```bash
# 상세 로그 활성화
export SC_ENTERPRISE_DEBUG=true
sc-enterprise run '/sc:analyze' --dry-run
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - SuperClaude 라이선스 준수

## 🔗 관련 링크

- [SuperClaude Original](https://github.com/NomenAK/SuperClaude)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Issue Tracker](https://github.com/your-org/superclaude-enterprise/issues)
- [Discussions](https://github.com/your-org/superclaude-enterprise/discussions)

---

Made with ❤️ by the SuperClaude Enterprise Team