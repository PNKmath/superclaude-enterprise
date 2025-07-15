#!/usr/bin/env tsx
/**
 * MCP Integration Test Suite
 * Tests the integration between SuperClaude Enterprise and SuperClaude MCP server
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

// Test configuration
const SUPERCLAUDE_PATH = path.join(__dirname, '..', 'SuperClaude');
const ENTERPRISE_PATH = __dirname;

// Color codes for output
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

async function testCommandExecution() {
  log('\n=== Testing Direct Command Execution ===', colors.BLUE);
  
  try {
    // Test 1: Direct SuperClaude command
    log('Test 1: Direct SuperClaude command', colors.YELLOW);
    const { stdout: directOutput } = await execAsync(
      `cd ${SUPERCLAUDE_PATH} && python3 SuperClaude.py --help`,
      { timeout: 5000 }
    );
    log('✓ Direct command works', colors.GREEN);
    
    // Test 2: Natural language processing
    log('\nTest 2: Natural language through Enterprise', colors.YELLOW);
    const { stdout: nlpOutput } = await execAsync(
      `cd ${ENTERPRISE_PATH} && npm run natural -- "analyze security vulnerabilities" --dry-run`,
      { timeout: 5000 }
    );
    log('✓ Natural language processing works', colors.GREEN);
    
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, colors.RED);
    return false;
  }
  
  return true;
}

async function testMCPServerAvailability() {
  log('\n=== Testing MCP Server Availability ===', colors.BLUE);
  
  try {
    // Check if Claude CLI is available
    log('Checking Claude CLI...', colors.YELLOW);
    const { stdout: claudeVersion } = await execAsync('claude --version');
    log(`✓ Claude CLI available: ${claudeVersion.trim()}`, colors.GREEN);
    
    // List MCP servers
    log('\nListing MCP servers...', colors.YELLOW);
    const { stdout: mcpList } = await execAsync('claude mcp list');
    log('MCP Servers:', colors.GREEN);
    console.log(mcpList);
    
    // Check if SuperClaude is registered as MCP server
    if (mcpList.toLowerCase().includes('superclaude')) {
      log('✓ SuperClaude is registered as MCP server', colors.GREEN);
    } else {
      log('⚠ SuperClaude not found in MCP servers', colors.YELLOW);
    }
    
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, colors.RED);
    return false;
  }
  
  return true;
}

async function testIntegrationFlow() {
  log('\n=== Testing Integration Flow ===', colors.BLUE);
  
  try {
    // Test 1: Natural language to SuperClaude command
    log('Test 1: Convert natural language to command', colors.YELLOW);
    const testInput = "보안 취약점을 검사해줘";
    
    // First, get the command match
    const { stdout: matchOutput } = await execAsync(
      `cd ${ENTERPRISE_PATH} && npm run suggest -- "${testInput}"`,
      { timeout: 5000 }
    );
    log('✓ Command suggestion works', colors.GREEN);
    console.log(matchOutput);
    
    // Test 2: Execute through SuperClaude (dry-run)
    log('\nTest 2: Execute matched command', colors.YELLOW);
    const { stdout: execOutput } = await execAsync(
      `cd ${ENTERPRISE_PATH} && npm run natural -- "${testInput}" --dry-run`,
      { timeout: 5000 }
    );
    log('✓ Command execution flow works', colors.GREEN);
    
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, colors.RED);
    return false;
  }
  
  return true;
}

async function testMinimalIntegration() {
  log('\n=== Testing Minimal Integration Approach ===', colors.BLUE);
  
  try {
    // Test subprocess call to SuperClaude
    log('Testing subprocess integration...', colors.YELLOW);
    
    const testCommand = '/sc:analyze --focus security';
    const pythonScript = `
import subprocess
import sys

# Call SuperClaude directly
result = subprocess.run(
    [sys.executable, '${SUPERCLAUDE_PATH}/SuperClaude.py', '--help'],
    capture_output=True,
    text=True
)

print(f"Return code: {result.returncode}")
print(f"Output: {result.stdout[:100]}...")
`;
    
    const { stdout } = await execAsync(
      `python3 -c "${pythonScript}"`,
      { timeout: 5000 }
    );
    
    log('✓ Subprocess integration works', colors.GREEN);
    console.log(stdout);
    
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, colors.RED);
    return false;
  }
  
  return true;
}

async function main() {
  log('🧪 SuperClaude Enterprise MCP Integration Tests', colors.BLUE);
  log('='.repeat(50), colors.BLUE);
  
  const tests = [
    testCommandExecution,
    testMCPServerAvailability,
    testIntegrationFlow,
    testMinimalIntegration
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  log('\n' + '='.repeat(50), colors.BLUE);
  log(`Tests completed: ${passed} passed, ${failed} failed`, 
      failed > 0 ? colors.RED : colors.GREEN);
  
  // Provide integration recommendations
  log('\n📋 Integration Recommendations:', colors.BLUE);
  log('1. Use subprocess calls for minimal integration', colors.YELLOW);
  log('2. Register SuperClaude Enterprise as separate MCP server', colors.YELLOW);
  log('3. Create bridge module for command translation', colors.YELLOW);
  log('4. Implement caching for repeated operations', colors.YELLOW);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.RED);
  process.exit(1);
});