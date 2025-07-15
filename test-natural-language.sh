#!/bin/bash

echo "🧪 SuperClaude Enterprise Natural Language Test"
echo "============================================="
echo ""

# Check if superclaude-enterprise is available
if ! command -v superclaude-enterprise &> /dev/null; then
    echo "❌ superclaude-enterprise command not found!"
    echo "   Please run: npm install -g"
    exit 1
fi

echo "✅ superclaude-enterprise found at: $(which superclaude-enterprise)"
echo ""

# Test natural language processing
echo "📝 Testing natural language processing..."
echo ""

# Test 1: Korean security check
echo "Test 1: Korean - '보안 검사해줘'"
superclaude-enterprise natural "보안 검사해줘" --dry-run
echo ""

# Test 2: Korean implementation
echo "Test 2: Korean - '로그인 기능 만들어줘'"
superclaude-enterprise natural "로그인 기능 만들어줘" --dry-run
echo ""

# Test 3: English performance
echo "Test 3: English - 'improve performance'"
superclaude-enterprise natural "improve performance" --dry-run
echo ""

# Test 4: Check if hook would trigger
echo "Test 4: Simulating Claude Code hook trigger"
echo "Command that would be sent: /sc: 이 파일 분석해줘"
CLAUDE_TOOL_INPUT="/sc: 이 파일 분석해줘" superclaude-enterprise natural "/sc: 이 파일 분석해줘" --dry-run
echo ""

echo "✅ All tests completed!"
echo ""
echo "To test in Claude Code:"
echo "1. Copy .claude/settings.json to your project"
echo "2. Use Claude Code and type: /sc: 원하는 명령어"
echo "3. Check the output"