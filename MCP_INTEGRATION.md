# SuperClaude Enterprise MCP Server Integration Guide

SuperClaude Enterprise를 Claude Code의 MCP 서버로 등록하여 자연어 명령어를 처리할 수 있습니다.

## 🚀 설치 방법

### 1. MCP 서버 빌드

```bash
cd /path/to/SuperClaude-Enterprise
npm run build
```

### 2. Claude Code에 MCP 서버 등록

#### 방법 1: Claude CLI 사용 (권장)

```bash
# MCP 서버 추가
claude mcp add -s user superclaude-enterprise "node $HOME/project/CC_persona_based_system/SuperClaude-Enterprise/dist/mcp-server/index.js"

# 설치 확인
claude mcp list
```

#### 방법 2: 수동 설정

`~/.claude/settings.json` 파일에 다음 내용을 추가:

```json
{
  "mcpServers": {
    "superclaude-enterprise": {
      "command": "node",
      "args": ["${HOME}/project/CC_persona_based_system/SuperClaude-Enterprise/dist/mcp-server/index.js"],
      "env": {}
    }
  }
}
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

### Claude Code 재시작 후 MCP 서버가 연결되지 않음

**해결책: Claude Code 완전 재시작**
```bash
pkill -f "claude"
sleep 5
claude
```

### MCP 서버가 보이지 않음

```bash
# MCP 서버 목록 확인
claude mcp list

# 서버 제거 후 재추가
claude mcp remove superclaude-enterprise
claude mcp add -s user superclaude-enterprise "node /path/to/dist/mcp-server/index.js"
```

### 도구가 호출되지 않음

Claude에게 명시적으로 도구 사용을 요청하세요:
- "SuperClaude Enterprise의 natural_language_command를 사용해서..."
- "MCP 도구를 사용해서..."

### 로그 확인

```bash
# Claude Code 로그 확인
tail -f ~/.claude/logs/claude.log

# MCP 서버 로그는 stderr로 출력됩니다
```

## 🔗 관련 문서

- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [SuperClaude Enterprise README](README.md)
- [Natural Language Processing Guide](NATURAL_LANGUAGE.md)