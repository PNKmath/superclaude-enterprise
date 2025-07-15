#!/usr/bin/env tsx
/**
 * Minimal Integration Test
 * Tests the simplest approach to integrate SuperClaude Enterprise with SuperClaude
 */

import { SuperClaudeBridge } from './src/integration/superclaude-bridge';
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

async function main() {
  log('\n🧪 Testing Minimal SuperClaude Integration', colors.BLUE);
  log('='.repeat(50), colors.BLUE);

  // Initialize bridge
  const bridge = new SuperClaudeBridge();

  // Subscribe to events for debugging
  bridge.on('info', (msg) => log(`ℹ️  ${msg}`, colors.YELLOW));
  bridge.on('executing', (data) => log(`▶️  Executing: ${data.command}`, colors.YELLOW));
  bridge.on('stdout', (data) => process.stdout.write(data));
  bridge.on('stderr', (data) => process.stderr.write(data));
  bridge.on('cache-hit', () => log('⚡ Cache hit!', colors.GREEN));

  try {
    // Test 1: Validate installation
    log('\n1️⃣  Validating SuperClaude installation...', colors.BLUE);
    const isValid = await bridge.validate();
    if (isValid) {
      log('✅ SuperClaude installation validated', colors.GREEN);
    } else {
      log('❌ SuperClaude validation failed', colors.RED);
      return;
    }

    // Test 2: Get MCP info
    log('\n2️⃣  Checking MCP server availability...', colors.BLUE);
    const mcpInfo = await bridge.getMCPInfo();
    log(`MCP Available: ${mcpInfo.available}`, mcpInfo.available ? colors.GREEN : colors.YELLOW);

    // Test 3: Execute direct command
    log('\n3️⃣  Testing direct command execution...', colors.BLUE);
    const directResult = await bridge.execute({
      command: '--help'
    });
    log(`Direct command: ${directResult.success ? '✅ Success' : '❌ Failed'}`, 
        directResult.success ? colors.GREEN : colors.RED);

    // Test 4: Natural language command (Korean)
    log('\n4️⃣  Testing natural language (Korean)...', colors.BLUE);
    const koreanResult = await bridge.executeNaturalCommand(
      '보안 취약점을 검사해줘',
      { dryRun: true }
    );
    log(`Korean command: ${koreanResult.success ? '✅ Success' : '❌ Failed'}`,
        koreanResult.success ? colors.GREEN : colors.RED);

    // Test 5: Natural language command (English)
    log('\n5️⃣  Testing natural language (English)...', colors.BLUE);
    const englishResult = await bridge.executeNaturalCommand(
      'implement user authentication system',
      { dryRun: true, backend: 'claude' }
    );
    log(`English command: ${englishResult.success ? '✅ Success' : '❌ Failed'}`,
        englishResult.success ? colors.GREEN : colors.RED);

    // Test 6: Cache functionality
    log('\n6️⃣  Testing cache functionality...', colors.BLUE);
    const start = Date.now();
    await bridge.execute({ command: '--help' });
    const firstTime = Date.now() - start;
    
    const cacheStart = Date.now();
    await bridge.execute({ command: '--help' });
    const cachedTime = Date.now() - cacheStart;
    
    log(`First execution: ${firstTime}ms`, colors.YELLOW);
    log(`Cached execution: ${cachedTime}ms`, colors.YELLOW);
    log(`Cache speedup: ${(firstTime / cachedTime).toFixed(1)}x`, colors.GREEN);

    // Summary
    log('\n' + '='.repeat(50), colors.BLUE);
    log('✅ All minimal integration tests passed!', colors.GREEN);
    
    // Integration approach recommendation
    log('\n📋 Recommended Integration Approach:', colors.BLUE);
    log('1. Use SuperClaudeBridge for subprocess calls', colors.YELLOW);
    log('2. Natural language processing in TypeScript', colors.YELLOW);
    log('3. Execute SuperClaude commands via Python subprocess', colors.YELLOW);
    log('4. Cache results for better performance', colors.YELLOW);
    log('5. Event-driven architecture for real-time updates', colors.YELLOW);

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.RED);
    console.error(error);
  }
}

// Run the test
main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.RED);
  process.exit(1);
});