# 한글 명령어 예제

SuperClaude Enterprise는 한글 명령어를 완벽히 지원합니다.

## 기본 사용법

### 1. 분석 명령어
```bash
# 영어
superclaude-enterprise run "/sc:analyze auth.js --security"

# 한글
superclaude-enterprise run "/sc:analyze auth.js --보안검사"
superclaude-enterprise run "/sc:분석 인증.js --보안"
```

### 2. 구현 명령어
```bash
# 영어
superclaude-enterprise run "/sc:implement user login feature"

# 한글
superclaude-enterprise run "/sc:implement 사용자 로그인 기능"
superclaude-enterprise run "/sc:구현 사용자_인증_시스템"
```

### 3. 개선 명령어
```bash
# 영어
superclaude-enterprise run "/sc:improve performance of database queries"

# 한글
superclaude-enterprise run "/sc:improve 데이터베이스 쿼리 성능"
superclaude-enterprise run "/sc:개선 DB_성능_최적화"
```

## 페르소나 지정 (한글)

```bash
# 보안과 성능 페르소나
superclaude-enterprise run "/sc:분석 결제시스템" -p 보안,성능

# 아키텍트와 백엔드 페르소나
superclaude-enterprise run "/sc:설계 마이크로서비스" -p 아키텍트,백엔드
```

## Claude Code Hooks에서 한글 사용

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool_name": "bash",
          "query": "삭제"
        },
        "command": "echo '경고: 삭제 명령이 감지되었습니다' >&2 && exit 2"
      }
    ],
    "Notification": [
      {
        "command": "superclaude-enterprise log-notification \"작업 완료: $CLAUDE_NOTIFICATION\""
      }
    ]
  }
}
```

## 복잡한 한글 명령어

### 1. 프로젝트 전체 리팩토링
```bash
superclaude-enterprise run "/sc:improve 전체_프로젝트_구조_개선 --타입스크립트_마이그레이션" \
  -p 아키텍트,리팩토러 \
  --level 3
```

### 2. 보안 감사
```bash
superclaude-enterprise run "/sc:analyze 전체_코드베이스 --보안_취약점_검사 --OWASP_기준" \
  -p 보안,QA \
  --backend gemini
```

### 3. 성능 최적화
```bash
superclaude-enterprise run "/sc:improve API_응답속도 --목표_100ms_이하" \
  -p 성능,백엔드,DevOps
```

## 팀 협업 시나리오

### 한국 개발팀을 위한 설정
```bash
# 한글 응답 설정
superclaude-enterprise response-language --language "한국어"

# 한글 태그 사용
superclaude-enterprise add-tag --name "기능개발"
superclaude-enterprise add-tag --name "버그수정"
superclaude-enterprise add-tag --name "성능개선"

# 한글로 작업 추가
superclaude-enterprise add-task --prompt "사용자 인증 시스템 구현"
superclaude-enterprise add-task --prompt "데이터베이스 성능 최적화"
```

## 주의사항

1. **인코딩**: UTF-8 인코딩을 사용하는지 확인
2. **따옴표**: 공백이 포함된 한글은 따옴표로 감싸기
3. **특수문자**: 파일명에는 영문 사용 권장

## 자주 사용하는 한글 페르소나 매핑

| 영어 | 한글 |
|------|------|
| security | 보안 |
| architect | 아키텍트 |
| performance | 성능 |
| qa | QA, 품질보증 |
| backend | 백엔드 |
| frontend | 프론트엔드 |
| devops | 데브옵스 |
| refactorer | 리팩토러 |
| analyzer | 분석가 |