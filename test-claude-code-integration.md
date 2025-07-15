# Claude Code `/sc:` 자연어 명령어 테스트 가이드

## 테스트 방법

### 1. 테스트 프로젝트 생성
```bash
# 테스트용 프로젝트 생성
mkdir -p ~/test-superclaude-project
cd ~/test-superclaude-project

# .claude 디렉토리와 설정 파일 복사
mkdir -p .claude
cp /home/abundzu48/project/CC_persona_based_system/SuperClaude-Enterprise/.claude/settings.json .claude/

# 테스트 파일 생성
echo "console.log('test');" > test.js
```

### 2. Claude Code에서 테스트

Claude Code를 열고 다음 명령어들을 입력해보세요:

#### 테스트 1: 보안 검사 (한글)
```
/sc: 이 파일의 보안 문제를 확인해줘
```

예상 결과:
- SuperClaude Enterprise가 자동으로 호출됨
- 'natural' 명령어로 변환되어 실행
- security 페르소나가 활성화되어 보안 분석 실행

#### 테스트 2: 기능 구현 (한글)
```
/sc: 로그인 기능 만들어줘
```

예상 결과:
- implement 명령어로 매칭
- backend, frontend, security 페르소나 추천

#### 테스트 3: 성능 개선 (영어)
```
/sc: improve performance of this function
```

예상 결과:
- improve 명령어로 매칭
- performance 페르소나 활성화

### 3. 동작 확인 방법

#### A. 직접 출력 확인
Claude Code에서 위 명령어 실행 시:
1. SuperClaude Enterprise의 출력이 표시됨
2. 자연어가 적절한 명령어로 변환됨
3. 관련 페르소나가 추천됨

#### B. 로그 확인
```bash
# Claude Code 로그 확인 (있다면)
tail -f ~/.claude/logs/hooks.log

# SuperClaude Enterprise 로그 확인
tail -f ~/.claude/enterprise/logs/natural-language.log
```

#### C. 테스트 명령어로 확인
터미널에서 직접 테스트:
```bash
# 자연어 처리가 제대로 되는지 확인
superclaude-enterprise natural "보안 검사해줘" --dry-run

# 실제 실행 테스트
superclaude-enterprise natural "이 파일 분석해줘" --execute
```

### 4. 문제 해결

#### 작동하지 않을 때 확인사항:

1. **설정 파일 위치**
   - 프로젝트 루트에 `.claude/settings.json`이 있어야 함
   - Claude Code가 실행되는 디렉토리와 동일한지 확인

2. **PATH 설정**
   ```bash
   # PATH에 superclaude-enterprise가 있는지 확인
   echo $PATH | grep -o "[^:]*npm[^:]*"
   
   # 없다면 추가
   export PATH="$HOME/.npm-global/bin:$PATH"
   ```

3. **권한 문제**
   ```bash
   # 실행 권한 확인
   ls -la $(which superclaude-enterprise)
   
   # 필요시 권한 부여
   chmod +x $(which superclaude-enterprise)
   ```

4. **JSON 문법 오류**
   ```bash
   # settings.json 검증
   python3 -m json.tool .claude/settings.json > /dev/null
   ```

### 5. 디버그 모드 실행

상세한 디버그 정보를 보려면:
```bash
# 환경 변수 설정
export SC_ENTERPRISE_DEBUG=true

# Claude Code에서 다시 테스트
/sc: 테스트 명령어
```

## 확인 체크리스트

- [ ] `.claude/settings.json` 파일이 프로젝트 루트에 있음
- [ ] settings.json에 "/sc:" natural language hook이 포함됨
- [ ] `superclaude-enterprise` 명령어가 PATH에 있음
- [ ] SuperClaude가 설치되어 있음
- [ ] Claude Code가 bash 명령을 실행할 수 있는 권한이 있음

## 성공 지표

다음과 같은 출력이 보이면 정상 작동:
```
🔍 Analyzing input: "보안 검사해줘"
✅ Matched command: /sc:analyze --security
🎯 Suggested personas: security, analyzer
📝 Executing: superclaude analyze --security --personas security,analyzer
```