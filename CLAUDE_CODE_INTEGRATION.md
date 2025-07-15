# Claude Code Integration Guide

## Overview

SuperClaude Enterprise는 Claude Code와 두 가지 방식으로 통합됩니다:

1. **MCP Server 통합** (권장) - 자연어 명령어 처리
2. **Claude Code Hooks** - 도구 실행 시 자동화

## 방법 1: MCP Server 통합 (권장)

### 설정 방법

1. **MCP 서버 등록**:
```bash
# SuperClaude Enterprise 디렉토리에서
npm run build
claude mcp add -s user superclaude-enterprise "node $PWD/dist/mcp-server/index.js"

# 또는 더 안정적인 wrapper 사용 (권장)
claude mcp add -s user superclaude-enterprise "$PWD/bin/mcp-server-wrapper.sh"
```

2. **Claude Code 재시작**:
```bash
pkill -f "claude" && claude
```

### 사용 방법

이제 Claude Code에서 자연어로 SuperClaude를 요청할 수 있습니다:

**한국어 예시**:
- "SuperClaude를 사용해서 보안 취약점을 검사해줘"
- "SuperClaude로 사용자 인증 시스템을 구현해줘"
- "API 성능을 SuperClaude로 개선해줘"
- "SuperClaude로 코드 리팩토링을 해줘"

**영어 예시**:
- "Use SuperClaude to analyze security vulnerabilities"
- "Implement user authentication with SuperClaude"
- "Improve API performance using SuperClaude"
- "Refactor this code with SuperClaude"

### MCP 도구들

Claude는 다음 도구들을 자동으로 호출합니다:

1. **natural_language_command**: 자연어를 SuperClaude 명령어로 변환
2. **suggest_commands**: 부분 입력에 대한 명령어 제안
3. **resolve_persona_conflicts**: 페르소나 충돌 해결

### 작동 원리

1. 사용자가 자연어로 요청
2. Claude가 요청을 분석하여 적절한 MCP 도구 호출
3. MCP 서버가 자연어를 SuperClaude 명령어로 변환
4. 명령어와 함께 제안된 페르소나 정보 제공
5. 사용자가 실행 여부 결정

## 방법 2: Claude Code Hooks (도구 자동화)

Hooks는 Claude가 도구(bash, edit 등)를 사용할 때만 작동합니다.

### 설정 방법

1. **프로젝트에 .claude 디렉토리 생성**:
```bash
cd /your/project
mkdir -p .claude
```

2. **SuperClaude Enterprise hooks 복사**:
```bash
# 기본 hooks 사용
cp /path/to/superclaude-enterprise/.claude/settings.json .claude/

# 또는 언어별 템플릿 사용
cp /path/to/superclaude-enterprise/.claude/hooks/typescript-project.json .claude/settings.json
```

### 자동으로 실행되는 기능들

#### PreToolUse Hooks
- 위험한 명령어 차단 (rm -rf 등)
- 민감한 파일 접근 차단 (.env, *.key 등)
- Security 페르소나의 veto 체크

#### PostToolUse Hooks
- Python 파일 자동 포맷팅 (black, ruff)
- TypeScript/JavaScript 파일 자동 포맷팅 (prettier, eslint)
- 페르소나 간 충돌 확인
- 관련 테스트 자동 실행

#### Notification Hooks
- Claude Code 알림 로깅

#### Stop Hooks
- 작업 완료 시 테스트/린트 검증

## 통합 시나리오

### 시나리오 1: 보안 검증 자동화

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": {
        "tool_name": "bash",
        "query": "deploy"
      },
      "command": "superclaude-enterprise check-veto security --command \"$CLAUDE_TOOL_INPUT\""
    }]
  }
}
```

### 시나리오 2: 파일 수정 시 충돌 확인

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": {
        "tool_name": "edit_file",
        "file_paths": ["*.ts"]
      },
      "command": "superclaude-enterprise conflict-check --files \"$CLAUDE_FILE_PATHS\" --personas architect,performance"
    }]
  }
}
```

### 시나리오 3: 자동 포맷팅

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": {
        "tool_name": "edit_file",
        "file_paths": ["*.py"]
      },
      "command": "black $CLAUDE_FILE_PATHS && ruff check --fix $CLAUDE_FILE_PATHS"
    }]
  }
}
```

## 환경 변수

Claude Code hooks에서 사용 가능한 환경 변수:

- `$CLAUDE_TOOL_NAME`: 실행되는 도구 이름
- `$CLAUDE_TOOL_INPUT`: 도구 입력 (JSON)
- `$CLAUDE_FILE_PATHS`: 파일 경로 (공백으로 구분)
- `$CLAUDE_NOTIFICATION`: 알림 메시지

## 디버깅

### MCP 서버 확인
```bash
# MCP 서버 상태 확인
claude mcp list

# MCP 서버 로그 확인
test-mcp-server.sh
```

### Hook 동작 확인
```bash
# 현재 활성 hooks 보기
superclaude-enterprise hooks

# Hook 실행 로그 보기
tail -f ~/.claude/logs/hooks.log
```

## 문제 해결

### MCP 서버 관련

1. **"MCP server not found" 오류**:
   - `claude mcp list`로 등록 확인
   - 서버 경로가 올바른지 확인
   - Claude Code 재시작

2. **자연어 명령이 인식되지 않음**:
   - "SuperClaude"라는 단어를 포함시켜 명확하게 요청
   - MCP 서버가 실행 중인지 확인

### Hook 관련

1. **Hook이 실행되지 않음**:
   - Hook은 도구 실행 시에만 작동함을 기억
   - `.claude/settings.json`이 프로젝트 루트에 있는지 확인
   - JSON 문법 오류 확인

2. **"command not found" 오류**:
   - PATH에 superclaude-enterprise가 있는지 확인
   - `which superclaude-enterprise` 실행
   - `hash -r` 실행 후 재시도

## 모범 사례

1. **MCP 서버 우선**: 자연어 처리는 MCP 서버 사용
2. **Hook은 자동화용**: 도구 실행 시 자동화가 필요한 경우만 Hook 사용
3. **프로젝트별 설정**: 각 프로젝트에 맞는 `.claude/settings.json`
4. **팀 공유**: `.claude/settings.json`을 Git에 포함
5. **개인 설정**: `.claude/settings.local.json`은 Git에서 제외

## 중요 참고사항

- **Hooks는 사용자 입력을 가로채지 않음**: Claude Code hooks는 도구 실행 시에만 작동
- **자연어 처리는 MCP 서버로**: 사용자 입력의 자연어 처리는 MCP 서버 방식 사용
- **두 방식은 상호 보완적**: MCP는 자연어 처리, Hooks는 도구 자동화

## MCP 서버 안정성 개선사항

- **Health Check 시스템**: 30초 이상 비활성 시 자동 재시작
- **Graceful Shutdown**: 안전한 종료 처리로 데이터 손실 방지
- **Auto-Restart Wrapper**: 크래시 시 최대 5회 자동 재시작
- **개선된 에러 처리**: 예상치 못한 에러 자동 복구

## 추가 리소스

- [MCP 통합 가이드](MCP_INTEGRATION.md)
- [SuperClaude 문서](https://github.com/NomenAK/SuperClaude)
- [Claude Code Hooks 문서](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [SuperClaude Enterprise 사용 가이드](USAGE.md)