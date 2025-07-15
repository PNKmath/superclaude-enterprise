# Claude Code Integration Guide

## Overview

SuperClaude Enterprise는 Claude Code와 함께 사용할 수 있도록 설계되었습니다. 두 가지 통합 방법을 제공합니다:

1. **Claude Code Hooks를 통한 자동 통합**
2. **직접 명령어 실행**

## 방법 1: Claude Code Hooks (권장)

### 설정 방법

1. **프로젝트에 .claude 디렉토리 생성**:
```bash
cd /your/project
mkdir -p .claude
```

2. **SuperClaude Enterprise hooks 복사**:
```bash
# 기본 hooks 사용 (자연어 처리 포함!)
cp /path/to/superclaude-enterprise/.claude/settings.json .claude/

# 또는 언어별 템플릿 사용
cp /path/to/superclaude-enterprise/.claude/hooks/typescript-project.json .claude/settings.json
```

**중요**: 기본 settings.json에는 자연어 처리 hook이 포함되어 있습니다!

3. **PATH 확인**:
```bash
which superclaude-enterprise
# 출력: /home/user/.npm-global/bin/superclaude-enterprise
```

### 자동으로 실행되는 기능들

설정이 완료되면 Claude Code가 자동으로 다음을 수행합니다:

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

## 방법 2: 자연어 명령어 처리 (NEW!)

SuperClaude Enterprise의 자연어 처리 기능을 사용하면 정확한 명령어를 몰라도 됩니다:

### 자연어 입력 예시

```bash
# 기존 방식 (정확한 명령어 필요)
/sc:analyze auth.js --security

# 새로운 방식 (자연어 입력)
/sc: 이 파일의 보안 문제를 확인해줘
/sc: auth.js 보안 검사
/sc: 인증 파일에 취약점이 있는지 봐줘
```

### 자동 명령어 매칭

입력한 내용을 분석해서:
1. 가장 적합한 명령어 자동 선택
2. 관련 페르소나 자동 추천
3. 명령어 구조화

### 설정 방법

`.claude/settings.json`에 추가:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": {
        "tool_name": "bash",
        "query": "/sc:"
      },
      "command": "superclaude-enterprise natural \"$CLAUDE_TOOL_INPUT\" --execute"
    }]
  }
}
```

### 지원되는 자연어 패턴

**분석/검사:**
- "보안 검사해줘"
- "코드 분석 필요"
- "취약점 찾아줘"
- "문제점 확인"

**구현/개발:**
- "로그인 기능 만들어줘"
- "API 엔드포인트 추가"
- "새 기능 구현"

**개선/최적화:**
- "성능 개선 필요"
- "더 빠르게 만들어줘"
- "리팩토링 해줘"

**디버깅:**
- "버그 찾아줘"
- "왜 안 되는지 봐줘"
- "에러 해결"

## 방법 3: 기존 명령어 직접 실행

Claude Code 내에서 SuperClaude의 정해진 `/sc:` 명령어 사용:

### 예제 1: 보안 분석
```bash
# Claude Code에서:
/sc:analyze auth.js --security

# SuperClaude Enterprise로 enhanced 실행:
superclaude-enterprise run "/sc:analyze auth.js --security" -p security,qa
```

### 예제 2: 아키텍처 설계
```bash
# Claude Code에서:
/sc:design payment-system

# 충돌 해결과 함께 실행:
superclaude-enterprise run "/sc:design payment-system" -p architect,security,backend
```

### 예제 3: 코드 개선
```bash
# Claude Code에서:
/sc:improve legacy-module.js

# 실행 레벨 지정:
superclaude-enterprise run "/sc:improve legacy-module.js" --level 2
```

## 통합 시나리오

### 시나리오 1: 자동 보안 검증

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

### 시나리오 2: 자동 충돌 해결

파일 수정 시 자동으로 페르소나 충돌 확인:
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

### 시나리오 3: 비용 최적화

대용량 파일 분석 시 자동으로 Gemini로 라우팅:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": {
        "tool_name": "read_file",
        "file_paths": ["*.json"]
      },
      "command": "superclaude-enterprise select-backend --file \"$CLAUDE_FILE_PATHS\" --threshold 100KB"
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

### Hook 동작 확인
```bash
# 현재 활성 hooks 보기
superclaude-enterprise hooks

# Hook 실행 로그 보기
tail -f ~/.claude/logs/hooks.log
```

### 문제 해결

1. **"command not found" 오류**:
   - PATH에 superclaude-enterprise가 있는지 확인
   - `hash -r` 실행 후 재시도

2. **Hook이 실행되지 않음**:
   - `.claude/settings.json`이 프로젝트 루트에 있는지 확인
   - JSON 문법 오류 확인

3. **충돌 해결이 작동하지 않음**:
   - `superclaude-enterprise status` 실행
   - 필요한 페르소나가 활성화되어 있는지 확인

## 모범 사례

1. **프로젝트별 설정**: 각 프로젝트에 맞는 `.claude/settings.json` 사용
2. **팀 공유**: `.claude/settings.json`을 Git에 포함
3. **개인 설정**: `.claude/settings.local.json`은 Git에서 제외
4. **점진적 도입**: 기본 hooks부터 시작해서 필요에 따라 추가

## 추가 리소스

- [SuperClaude 문서](https://github.com/NomenAK/SuperClaude)
- [Claude Code Hooks 문서](../ClaudeCode_hook.md)
- [SuperClaude Enterprise 사용 가이드](USAGE.md)