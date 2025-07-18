#!/usr/bin/env node

// Test script to verify SuperClaude detection
import { ExtensionManager } from './dist/extensions/core/ExtensionManager.js';
import { SuperClaudeBridge } from './dist/integration/superclaude-bridge.js';

async function testSuperClaudeDetection() {
  console.log('=== Testing SuperClaude Detection ===\n');
  
  // Test 1: Check current Python environment
  console.log('1. Current Python environment:');
  console.log(`   VIRTUAL_ENV: ${process.env.VIRTUAL_ENV || 'Not set'}`);
  console.log(`   CWD: ${process.cwd()}`);
  console.log();
  
  // Test 2: Test SuperClaudeBridge Python detection
  console.log('2. Testing SuperClaudeBridge Python detection:');
  const bridge = new SuperClaudeBridge();
  
  // Listen to bridge events
  bridge.on('info', (msg) => console.log(`   [INFO] ${msg}`));
  bridge.on('error', (msg) => console.log(`   [ERROR] ${msg}`));
  
  // Test validation
  const isValid = await bridge.validate();
  console.log(`   Validation result: ${isValid}`);
  console.log();
  
  // Test 3: Test ExtensionManager initialization
  console.log('3. Testing ExtensionManager initialization:');
  const config = {
    conflictResolver: { enabled: true },
    executionLevels: { default: 2 },
    gemini: { enabled: false },
    learning: { enabled: false }
  };
  
  try {
    const manager = new ExtensionManager(config);
    await manager.initialize();
    console.log('   ✓ ExtensionManager initialized successfully');
  } catch (error) {
    console.log(`   ✗ ExtensionManager initialization failed: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testSuperClaudeDetection().catch(console.error);