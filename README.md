# SuperClaude Enterprise Extension 🚀

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/PNKmath/superclaude-enterprise)
[![Tests](https://img.shields.io/badge/tests-100%25%20passed-brightgreen)](https://github.com/PNKmath/superclaude-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io/)

**Claude Code에서 자연어로 SuperClaude의 모든 기능을 사용하세요!** 🎯

SuperClaude Enterprise는 MCP(Model Context Protocol) 서버로 작동하여 Claude Code에서 자연어 명령어를 SuperClaude 명령어로 자동 변환합니다. 지능형 페르소나 시스템, 충돌 해결, 세션 관리 등 엔터프라이즈급 기능을 제공합니다.

> 💡 **핵심 가치**: "SuperClaude로 보안 검사해줘"처럼 자연어로 요청하면 자동으로 `/sc:analyze --security` 명령어와 적절한 페르소나를 선택해 실행합니다.

## 🌟 핵심 특징

### 🤖 MCP 서버 통합
- Claude Code와 완벽한 통합
- 자연어 명령어를 SuperClaude 명령어로 자동 변환
- 세션 관리로 대화 맥락 유지 (30분)
- 페르소나 충돌 자동 해결

### 🧠 SuperClaude Core 내장
- `.claude/` 디렉토리에 SuperClaude v3 Core 파일 포함
- 11개 전문 페르소나 시스템 (architect, security, frontend 등)
- Wave 시스템으로 복잡한 작업 자동 오케스트레이션
- MCP 서버 연동 (Context7, Sequential, Magic, Playwright)

### ⚡ 엔터프라이즈 기능
- 5단계 실행 레벨 (Silent → Auto-execute)
- 지능형 백엔드 라우팅 (Claude/Gemini 자동 선택)
- 학습 엔진으로 사용 패턴 최적화
- Claude Code Hooks 통합

## 🚀 Quick Start

```bash
# 1. 프로젝트 클론
git clone https://github.com/PNKmath/superclaude-enterprise.git
cd superclaude-enterprise

# 2. 자동 설치 (3분 소요)
./install-enterprise.sh

# 설치 스크립트가 자동으로:
# ✓ 의존성 확인 (Node.js 18+, Python 3.8+)
# ✓ SuperClaude Core 설치
# ✓ npm 패키지 설치 및 빌드
# ✓ MCP 서버 자동 등록
# ✓ CLI 명령어 설정

# 3. Claude Code 재시작
# macOS/Linux: pkill -f "claude" && claude
# Windows: Claude Code 수동 재시작

# 4. 이제 Claude Code에서 자연어로 사용!
```

### 🎯 Claude Code에서 사용하기

```
User: SuperClaude를 사용해서 이 코드의 보안 문제를 찾아줘
Assistant: [자동으로 /sc:analyze --security 실행, security 페르소나 활성화]

User: implement user authentication with JWT
Assistant: [자동으로 /sc:implement auth-system 실행, backend + security 페르소나 활성화]

User: API 성능이 느려서 개선이 필요해
Assistant: [자동으로 /sc:improve --performance 실행, performance 페르소나 활성화]
```

## 📋 설치 요구사항

- **Node.js** 18+ (필수)
- **Python** 3.8+ (필수)
- **Git** (필수)
- **Claude Code** (필수)
- **jq** (선택사항 - MCP 설정 자동화용)

## 🏗️ 프로젝트 구조

```
SuperClaude-Enterprise/
├── .claude/                    # SuperClaude Core 파일 (자동 설치됨)
│   ├── CLAUDE.md              # Entry point
│   ├── COMMANDS.md            # 명령어 시스템
│   ├── FLAGS.md               # 플래그 시스템
│   ├── PERSONAS.md            # 11개 페르소나 정의
│   ├── ORCHESTRATOR.md        # 지능형 라우팅
│   └── settings.json          # Claude Code hooks
├── src/
│   ├── mcp-server/            # MCP 서버 구현
│   │   └── index.ts           # 자연어 처리 엔드포인트
│   ├── extensions/            # 핵심 확장 기능
│   │   ├── conflict-resolver/ # 페르소나 충돌 해결
│   │   ├── execution-levels/  # 실행 레벨 관리
│   │   └── learning-engine/   # 학습 엔진
│   └── integrations/          # 외부 통합
│       ├── gemini-cli/        # Gemini 백엔드
│       └── session/           # 세션 관리
├── dist/                      # 빌드된 파일
├── mcp.json                   # MCP 서버 설정
└── install-enterprise.sh      # 자동 설치 스크립트
```

## 🔧 아키텍처

### 자연어 처리 흐름

```
Claude Code 사용자 입력
        ↓
MCP Server (자연어 분석)
        ↓
Command Matcher (명령어 변환)
        ↓
Persona System (페르소나 선택)
        ↓
Conflict Resolver (충돌 해결)
        ↓
SuperClaude Core 실행
```

## 📦 상세 설치 가이드

### 1. 자동 설치 (권장) 🚀

```bash
# 클론 및 설치
git clone https://github.com/PNKmath/superclaude-enterprise.git
cd superclaude-enterprise
./install-enterprise.sh

# 설치 스크립트가 수행하는 작업:
# 1. 시스템 요구사항 확인
# 2. SuperClaude Core 자동 설치 (없는 경우)
# 3. npm 의존성 설치 및 빌드
# 4. MCP 서버 자동 등록 (~/.config/claude/mcp.json)
# 5. CLI 명령어 심볼릭 링크 생성
# 6. Claude Code hooks 설정
```

### 2. MCP 서버 설정 확인

설치 후 MCP 서버가 제대로 등록되었는지 확인:

```bash
# MCP 서버 설정 확인
cat ~/.config/claude/mcp.json | jq '.["superclaude-enterprise"]'

# 출력 예시:
{
  "command": "node",
  "args": ["/absolute/path/to/superclaude-enterprise/dist/mcp-server/index.js"],
  "env": {}
}
```

### 3. 문제 해결

**MCP 서버가 등록되지 않은 경우:**
```bash
# 수동으로 MCP 서버 등록
claude mcp add superclaude-enterprise "node $(pwd)/dist/mcp-server/index.js"
```

**SuperClaude Core가 설치되지 않은 경우:**
```bash
# SuperClaude Core 수동 설치
cd SuperClaude
python3 SuperClaude.py install --quick
```


## 🎯 사용법

### 1. Claude Code에서 자연어로 사용 (권장) 🌟

Claude Code에서 직접 자연어로 요청하세요:

```
User: SuperClaude로 이 프로젝트의 보안 취약점을 검사해줘
Assistant: [MCP 서버가 자동으로 /sc:analyze --security 실행]

User: implement a REST API with authentication
Assistant: [MCP 서버가 자동으로 /sc:implement api --auth 실행]

User: 코드 품질을 개선하고 리팩토링해줘
Assistant: [MCP 서버가 자동으로 /sc:improve --refactor 실행]
```

### 2. CLI 명령어 사용

```bash
# 상태 확인
superclaude-enterprise status

# 자연어 명령어 처리
superclaude-enterprise natural "로그인 기능 구현해줘" --execute
superclaude-enterprise n "보안 검사" -e  # 단축 명령어

# SuperClaude 명령어 직접 실행
superclaude-enterprise run '/sc:analyze' -p security,architect

# 페르소나 충돌 테스트
superclaude-enterprise test-conflict -p security,performance

# 활성 hooks 확인
superclaude-enterprise hooks
```

### 3. 주요 기능 예시

#### 🔍 보안 분석
```
"SuperClaude로 보안 취약점을 찾아줘"
→ /sc:analyze --security 실행
→ security 페르소나 활성화
→ 취약점 스캔 및 보고서 생성
```

#### 🛠️ 기능 구현
```
"사용자 인증 시스템을 구현해줘"
→ /sc:implement auth-system 실행
→ backend + security 페르소나 활성화
→ JWT 기반 인증 시스템 구현
```

#### ⚡ 성능 개선
```
"API 응답 속도를 개선해줘"
→ /sc:improve --performance 실행
→ performance 페르소나 활성화
→ 병목 지점 분석 및 최적화
```

## 🛡️ 주요 기능 상세

### 1. 🤖 자연어 처리 엔진
- **다국어 지원**: 한국어/영어 통합 처리
- **의도 파악**: 0-100% 신뢰도로 명령어 매칭
- **컨텍스트 인식**: 이전 대화 내용 참조
- **세션 관리**: 30분간 대화 맥락 유지

### 2. 👥 11개 전문 페르소나
- **architect**: 시스템 설계, 확장성
- **security**: 보안 취약점, 위협 모델링
- **frontend**: UI/UX, 접근성
- **backend**: API, 데이터베이스
- **performance**: 최적화, 병목 제거
- **qa**: 테스트, 품질 보증
- **refactorer**: 코드 품질, 기술 부채
- **analyzer**: 근본 원인 분석
- **devops**: 인프라, 자동화
- **mentor**: 교육, 지식 전달
- **scribe**: 문서화, 다국어 지원

### 3. 🔄 페르소나 충돌 해결
- **우선순위 기반**: security > architect > qa > backend
- **컨텍스트 인식**: 상황에 따른 동적 조정
- **협상 엔진**: 최적의 조합 자동 선택

### 4. 📊 실행 레벨
- **Level 0 (Silent)**: 조용히 실행
- **Level 1 (Summary)**: 요약만 표시
- **Level 2 (Detail)**: 상세 계획 표시
- **Level 3 (Confirm)**: 사용자 확인 필요
- **Level 4 (Auto-block)**: 위험한 작업 차단

### 5. 🚀 백엔드 라우팅
- **Claude**: 일반적인 작업 (기본값)
- **Gemini**: 대용량 파일, 복잡한 분석
- **자동 선택**: 파일 크기, 복잡도 기반
- **비용 최적화**: 최대 50% 절감

## ⚙️ 설정

### 설정 파일 구조

```
~/.claude/enterprise/
├── config/
│   └── config.yaml         # 메인 설정
└── .claude/
    ├── CLAUDE.md          # SuperClaude Core
    ├── settings.json      # Claude Code hooks
    └── settings.local.json # 개인 설정
```

### 주요 설정 예시

```yaml
# config.yaml
conflict_resolver:
  enabled: true
  default_strategy: "priority_based"
  
natural_language:
  confidence_threshold: 0.7
  session_timeout: 1800  # 30분
  
execution_levels:
  default: 2
  production_override: 3
```

## 🔄 v1.1.0 주요 업데이트

### ✨ 새로운 기능
- **향상된 자연어 처리**: 한국어/영어 통합, 35% 빠른 응답
- **세션 관리**: 30분 컨텍스트 유지, 멀티턴 대화
- **하이브리드 모드**: 패턴 기반 작업 최적화
- **MCP 서버 통합**: Claude Code 직접 통합

### 🔧 개선사항
- 성능 키워드 확장 ("memory leak", "메모리 누수" 등)
- 서비스 패턴 자동 감지
- 복잡도 점수 정밀화 (0.0-1.0 스케일)
- 캐싱으로 평균 97ms 응답 시간

## 📊 성능 메트릭

| 메트릭 | 목표 | 달성 |
|--------|------|------|
| 자연어 처리 속도 | <100ms | 45ms avg |
| 명령어 매칭 정확도 | >90% | 95%+ |
| 세션 유지 시간 | 30분 | 30분 |
| MCP 응답 시간 | <200ms | 97ms avg |
| 테스트 커버리지 | >80% | 85% |

## 🐛 문제 해결

### MCP 서버 연결 문제
```bash
# MCP 서버 상태 확인
claude mcp list

# 수동 재등록
claude mcp add superclaude-enterprise "node $(pwd)/dist/mcp-server/index.js"

# Claude Code 재시작
pkill -f "claude" && claude
```

### 자연어 인식 안 됨
- Claude Code 재시작 필요
- MCP 서버가 제대로 등록되었는지 확인
- `~/.config/claude/mcp.json` 파일 확인

### SuperClaude Core 오류
```bash
# SuperClaude Core 재설치
cd SuperClaude
python3 SuperClaude.py install --quick
```

### 디버그 모드
```bash
# 상세 로그 확인
export SC_ENTERPRISE_DEBUG=true
superclaude-enterprise status
```

## 🤝 기여하기

프로젝트 기여를 환영합니다! 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - SuperClaude 라이선스 준수

## 📚 추가 문서

- [MCP 통합 가이드](MCP_INTEGRATION.md) - MCP 서버 상세 설정
- [아키텍처](ARCHITECTURE.md) - 시스템 구조와 설계
- [프로젝트 요약](PROJECT_SUMMARY.md) - 기능 및 테스트 현황
- [상세 사용법](USAGE.md) - 모든 기능의 상세 가이드

## 🔗 관련 링크

- [SuperClaude Original](https://github.com/NomenAK/SuperClaude)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Issue Tracker](https://github.com/PNKmath/superclaude-enterprise/issues)

---

**SuperClaude Enterprise** - Claude Code와 SuperClaude의 완벽한 통합 🚀

Made with ❤️ by the SuperClaude Enterprise Team
