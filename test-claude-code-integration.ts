#!/usr/bin/env tsx
/**
 * Claude Code Integration Test
 * Tests how SuperClaude Enterprise integrates with Claude Code hooks
 */

import { ClaudeCodeBridge } from './src/integration/claude-code-bridge';
import * as path from 'path';

// Color codes
const colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(message: string, color: string = '') {
  console.log(`${color}${message}${colors.RESET}`);
}

async function testNaturalLanguageConversion() {
  log('\n🧪 Testing Natural Language to Claude Code Conversion', colors.BLUE);
  log('='.repeat(50), colors.BLUE);
  
  const bridge = new ClaudeCodeBridge();
  
  // Test cases
  const testCases = [
    {
      input: '보안 취약점을 검사해줘',
      expectedCommand: '/sc:analyze',
      expectedPersonas: ['security']
    },
    {
      input: '로그인 기능을 만들어줘',
      expectedCommand: '/sc:implement',
      expectedPersonas: ['backend', 'security']
    },
    {
      input: 'check performance issues in api.js',
      expectedCommand: '/sc:analyze',
      expectedPersonas: ['performance']
    },
    {
      input: 'API 성능을 개선해줘',
      expectedCommand: '/sc:improve',
      expectedPersonas: ['performance', 'backend']
    }
  ];
  
  for (const testCase of testCases) {
    log(`\nTest: "${testCase.input}"`, colors.YELLOW);
    
    const result = await bridge.convertNaturalLanguage(testCase.input);
    
    if (result.success) {
      log(`✅ Converted to: ${result.convertedCommand}`, colors.GREEN);
      log(`   Personas: ${result.suggestedPersonas?.join(', ')}`, colors.GREEN);
      log(`   Confidence: ${result.confidence}%`, colors.GREEN);
      
      // Check if it matches expected
      if (result.convertedCommand?.includes(testCase.expectedCommand)) {
        log('   ✓ Command matches expected', colors.GREEN);
      } else {
        log(`   ✗ Expected: ${testCase.expectedCommand}`, colors.RED);
      }
    } else {
      log(`❌ Conversion failed: ${result.error}`, colors.RED);
    }
  }
}

async function testClaudeCodeFormatting() {
  log('\n\n📝 Testing Claude Code Command Formatting', colors.BLUE);
  log('='.repeat(50), colors.BLUE);
  
  const bridge = new ClaudeCodeBridge();
  
  // Test formatting
  const formattingTests = [
    {
      command: '/sc:analyze auth.js',
      personas: ['security', 'backend'],
      options: { think: true, validate: true }
    },
    {
      command: '/sc:implement payment-system',
      personas: ['architect'],
      options: { scope: 'module' }
    }
  ];
  
  for (const test of formattingTests) {
    const formatted = bridge.formatForClaudeCode(
      test.command,
      test.personas,
      test.options
    );
    
    log(`\nOriginal: ${test.command}`, colors.YELLOW);
    log(`Formatted: ${formatted}`, colors.GREEN);
  }
}

async function testHookOutput() {
  log('\n\n🪝 Testing Hook Output Generation', colors.BLUE);
  log('='.repeat(50), colors.BLUE);
  
  const bridge = new ClaudeCodeBridge();
  
  // Simulate conversion result
  const conversion = {
    success: true,
    originalInput: '보안 검사를 실행해줘',
    convertedCommand: '/sc:analyze --focus security',
    suggestedPersonas: ['security', 'analyzer'],
    confidence: 95
  };
  
  const hookOutput = bridge.generateHookOutput(conversion);
  log('\nHook Output:', colors.YELLOW);
  console.log(hookOutput);
}

async function testIntegrationFlow() {
  log('\n\n🔄 Testing Full Integration Flow', colors.BLUE);
  log('='.repeat(50), colors.BLUE);
  
  log('\n1. User types in Claude Code:', colors.YELLOW);
  log('   /sc: API 성능 문제를 분석하고 개선해줘', colors.RESET);
  
  log('\n2. Hook intercepts and processes:', colors.YELLOW);
  log('   - Pattern matches: ^/sc:\\s*(.+)$', colors.RESET);
  log('   - Executes: superclaude-enterprise natural "API 성능 문제를 분석하고 개선해줘" --execute', colors.RESET);
  
  log('\n3. SuperClaude Enterprise processes:', colors.YELLOW);
  log('   - Natural language → Command: /sc:analyze --focus performance', colors.RESET);
  log('   - Suggested personas: performance, backend', colors.RESET);
  log('   - Conflict resolution if needed', colors.RESET);
  log('   - Backend selection (Claude/Gemini)', colors.RESET);
  
  log('\n4. Converted command sent to Claude:', colors.YELLOW);
  log('   - /sc:analyze api.js --focus performance --persona-performance --persona-backend', colors.RESET);
  
  log('\n5. Claude executes with SuperClaude context', colors.GREEN);
}

async function main() {
  log('🚀 Claude Code Integration Test Suite', colors.BLUE);
  
  await testNaturalLanguageConversion();
  await testClaudeCodeFormatting();
  await testHookOutput();
  await testIntegrationFlow();
  
  log('\n\n✅ Integration tests completed!', colors.GREEN);
  
  log('\n📋 Next Steps:', colors.BLUE);
  log('1. Copy .claude/settings.json to your project', colors.YELLOW);
  log('2. Ensure superclaude-enterprise is in PATH', colors.YELLOW);
  log('3. Test in Claude Code with: /sc: 보안 검사해줘', colors.YELLOW);
  log('4. Monitor logs for hook execution', colors.YELLOW);
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.RED);
  console.error(error);
  process.exit(1);
});