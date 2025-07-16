# SuperClaude Enterprise MCP Server Integration Guide

SuperClaude Enterprise를 Claude Code의 MCP 서버로 등록하여 자연어 명령어를 처리할 수 있습니다.

## 🚀 설치 방법

### 1. MCP 서버 빌드

```bash
cd /path/to/SuperClaude-Enterprise
npm run build
```

### 2. Claude Code에 MCP 서버 등록

#### 방법 1: mcp.json 파일 직접 수정 (권장)

Claude Code의 MCP 설정 파일을 직접 수정합니다:

**macOS:**
```bash
# 설정 파일 열기
open ~/Library/Application\ Support/Claude/mcp.json
```

**Windows:**
```
# 설정 파일 위치
%APPDATA%\Claude\mcp.json
```

**Linux:**
```bash
# 설정 파일 열기
nano ~/.config/claude/mcp.json
```

다음 내용을 추가:
```json
{
  "superclaude-enterprise": {
    "command": "node",
    "args": ["/absolute/path/to/SuperClaude-Enterprise/dist/mcp-server/index.js"],
    "env": {}
  }
}
```

**중요**: `/absolute/path/to/` 부분을 실제 SuperClaude-Enterprise 경로로 변경하세요.

#### 방법 2: Claude CLI 사용

```bash
# MCP 서버 추가
claude mcp add -s user superclaude-enterprise "node $PWD/dist/mcp-server/index.js"

# 설치 확인
claude mcp list
```


### 3. Claude Code 재시작

MCP 서버 등록 후 Claude Code를 재시작해야 합니다:

```bash
# Claude Code 재시작
pkill -f "claude" && claude
```

## 🎯 사용 방법

### 자연어 명령어 처리

Claude Code에서 다음과 같이 사용할 수 있습니다:

```
User: SuperClaude Enterprise를 사용해서 보안 취약점을 검사해줘
Claude: [natural_language_command 도구를 호출하여 처리]

User: implement a user authentication system with JWT
Claude: [natural_language_command 도구를 호출하여 처리]

User: API 성능 문제를 분석하고 개선해줘
Claude: [natural_language_command 도구를 호출하여 처리]
```

### 명령어 제안

```
User: SuperClaude에서 'anal'로 시작하는 명령어를 추천해줘
Claude: [suggest_commands 도구를 호출하여 제안]
```

### 페르소나 충돌 해결

```
User: security와 performance 페르소나 간 충돌을 해결해줘
Claude: [resolve_persona_conflicts 도구를 호출하여 해결]
```

## 🔧 작동 원리

1. **사용자 요청**: 자연어로 작업 요청
2. **Claude 이해**: Claude가 요청을 이해하고 적절한 MCP 도구 선택
3. **MCP 서버 호출**: SuperClaude Enterprise MCP 서버의 도구 실행
4. **자연어 처리**: 한국어/영어 입력을 SuperClaude 명령어로 변환
5. **결과 반환**: 변환된 명령어와 추천 페르소나 제공

## 📊 도구 상세 설명

### natural_language_command

자연어 입력을 SuperClaude 명령어로 변환합니다.

**입력**:
- `input`: 자연어 명령어 (한국어/영어)
- `execute`: 즉시 실행 여부 (선택사항)

**출력**:
- 변환된 SuperClaude 명령어
- 신뢰도 점수
- 추천 페르소나 목록

### suggest_commands

부분 입력을 기반으로 명령어를 제안합니다.

**입력**:
- `partial_input`: 부분 입력 문자열

**출력**:
- 상위 5개 명령어 제안

### resolve_persona_conflicts

여러 페르소나 간 충돌을 해결합니다.

**입력**:
- `personas`: 페르소나 목록
- `command`: 명령어 컨텍스트

**출력**:
- 우선순위에 따른 페르소나 정렬
- 추천 사용 방법

## ❗ 주의사항

1. **도구 호출 필요**: Claude가 자연어를 이해하고 적절한 도구를 호출해야 합니다
2. **명시적 요청**: "SuperClaude를 사용해서" 같은 명시적 요청이 도움이 됩니다
3. **MCP 서버 상태**: 서버가 실행 중이어야 합니다

## 🚀 MCP 서버 안정성 개선사항

### Health Check 시스템
- 30초 이상 활동이 없으면 자동 재시작
- 모든 요청마다 health check ping으로 안정성 보장

### Graceful Shutdown
- SIGINT/SIGTERM 시그널 정상 처리
- stdin 종료 시 깔끔한 종료
- 리소스 정리 후 안전한 종료

### Auto-Restart Wrapper
- 최대 5회 자동 재시작 시도
- Exponential backoff로 재시작 간격 증가
- 로그 파일로 문제 추적 가능

### 개선된 에러 처리
- Uncaught exception 자동 처리
- Unhandled rejection 캐치
- stdin/stdout 에러 감지 및 복구

## 🐛 문제 해결

### MCP 서버가 "failed" 상태로 표시됨

**원인 및 해결방법:**

1. **Node.js 버전 확인**
```bash
node --version  # 18.0.0 이상이어야 함
```

2. **빌드 확인**
```bash
cd /path/to/SuperClaude-Enterprise
npm install
npm run build
ls -la dist/mcp-server/index.js  # 파일이 존재해야 함
```

3. **MCP 서버 테스트**
```bash
# 테스트 스크립트 실행
node test-mcp-full.cjs
```

4. **경로 확인**
mcp.json의 경로가 절대 경로인지 확인:
```json
{
  "superclaude-enterprise": {
    "command": "node",
    "args": ["/home/user/SuperClaude-Enterprise/dist/mcp-server/index.js"],
    "env": {}
  }
}
```

### 모듈 로딩 오류

**증상**: `ERR_MODULE_NOT_FOUND` 오류

**해결방법**: 
1. package.json에 `"type": "module"` 확인
2. 모든 import에 .js 확장자 포함 확인
3. 다시 빌드: `npm run build`

### Health Check 문제

**증상**: "Health check failed" 메시지

**해결방법**:
```bash
# Health check 비활성화 (선택사항)
export ENABLE_HEALTH_CHECK=false
```

### Claude Code 재시작 후 MCP 서버가 연결되지 않음

**해결책: Claude Code 완전 재시작**
```bash
# macOS/Linux
pkill -f "claude"
sleep 5
claude

# Windows: 작업 관리자에서 Claude 프로세스 종료 후 재시작
```

### MCP 서버가 보이지 않음

```bash
# MCP 서버 목록 확인
claude mcp list

# mcp.json 직접 확인
# macOS: ~/Library/Application Support/Claude/mcp.json
# Windows: %APPDATA%\Claude\mcp.json
# Linux: ~/.config/claude/mcp.json
```

### 도구가 호출되지 않음

Claude에게 명시적으로 도구 사용을 요청하세요:
- "SuperClaude Enterprise의 natural_language_command를 사용해서..."
- "MCP 도구를 사용해서..."

### 로그 확인

```bash
# MCP 서버 로그
cat mcp-server.log

# Claude Code 로그 (있는 경우)
# macOS: ~/Library/Logs/Claude/
# Windows: %APPDATA%\Claude\Logs\
# Linux: ~/.config/claude/logs/
```

## 🔗 관련 문서

- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [SuperClaude Enterprise README](README.md)
- [Natural Language Processing Guide](NATURAL_LANGUAGE.md)