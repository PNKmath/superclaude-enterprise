#!/usr/bin/env node
// Test deployment fixes for SuperClaude detection

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing Deployment Fixes ===\n');

// Test 1: Check Python detection
console.log('1. Testing Python Detection:');
const pythonTests = [
  { name: 'System Python', cmd: 'python3' },
  { name: 'Venv Python', cmd: path.join(process.cwd(), 'venv/bin/python') },
  { name: 'ENV VAR Python', cmd: process.env.SUPERCLAUDE_PYTHON || 'not set' }
];

pythonTests.forEach(test => {
  if (test.cmd === 'not set') {
    console.log(`   ${test.name}: ${test.cmd}`);
    return;
  }
  
  try {
    const child = spawn(test.cmd, ['-c', 'import SuperClaude; print("Found")'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    child.stdout.on('data', (data) => {
      console.log(`   ✓ ${test.name}: SuperClaude ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.log(`   ✗ ${test.name}: ${data.toString().trim()}`);
    });
  } catch (err) {
    console.log(`   ✗ ${test.name}: ${err.message}`);
  }
});

// Test 2: Simulate MCP server initialization
setTimeout(() => {
  console.log('\n2. Testing MCP Server Initialization:');
  
  const { ExtensionManager } = require('./dist/extensions/core/ExtensionManager.js');
  const config = {
    version: '1.0.0',
    conflict_resolver: {
      enabled: true,
      default_strategy: 'priority_based',
      negotiation_timeout: '5s'
    },
    gemini: {
      enabled: false,
      autoRouting: false,
      costThreshold: 0.1,
      quotaManagement: {
        dailyLimit: 1000,
        rateLimit: '10/min'
      }
    },
    execution_levels: {
      default: 2,
      production_override: 3,
      auto_determine: false
    },
    hooks: {
      batch_size: 10,
      debounce_time: '500ms',
      cache_ttl: '1h'
    },
    learning: {
      enabled: false,
      privacy_mode: 'strict',
      retention_days: 30
    },
    security: {
      audit_all: false,
      encryption: 'aes256',
      sso_provider: 'none'
    }
  };
  
  const manager = new ExtensionManager(config);
  
  manager.logger = {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.log('[WARN]', ...args),
    error: (...args) => console.log('[ERROR]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args)
  };
  
  manager.initialize()
    .then(() => {
      console.log('\n✅ Initialization completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Initialization failed:', err.message);
      process.exit(1);
    });
}, 1000);