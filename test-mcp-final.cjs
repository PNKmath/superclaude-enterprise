// Final test for MCP server with SuperClaude detection
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== MCP Server SuperClaude Detection Test ===\n');

// Create a log file to capture all output
const logFile = fs.createWriteStream('mcp-server-test.log');

// Spawn the MCP server
const mcp = spawn('node', [path.join(__dirname, 'dist/mcp-server/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'test', DEBUG: '*' }
});

// Capture output
let stdout = '';
let stderr = '';
let foundSuperClaude = false;
let foundNotFound = false;

mcp.stdout.on('data', (data) => {
  const text = data.toString();
  stdout += text;
  logFile.write(`[STDOUT] ${text}`);
  
  // Don't print JSON-RPC messages
  if (!text.includes('jsonrpc')) {
    console.log('[STDOUT]', text.trim());
  }
});

mcp.stderr.on('data', (data) => {
  const text = data.toString();
  stderr += text;
  logFile.write(`[STDERR] ${text}`);
  
  // Check for our log messages
  if (text.includes('Using local venv Python') || 
      text.includes('Using project venv Python') ||
      text.includes('SuperClaude Python module validated')) {
    foundSuperClaude = true;
    console.log('[SUCCESS]', text.trim());
  } else if (text.includes('SuperClaude not found')) {
    foundNotFound = true;
    console.log('[ERROR]', text.trim());
  } else {
    console.log('[STDERR]', text.trim());
  }
});

// Wait a bit for initialization
setTimeout(() => {
  console.log('\nSending test request...');
  const testRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'natural_language_command',
      arguments: {
        input: '보안 검사해줘',
        execute: false
      }
    },
    id: 1
  }) + '\n';
  
  mcp.stdin.write(testRequest);
}, 500);

// Kill after 3 seconds
setTimeout(() => {
  console.log('\nAnalyzing results...');
  
  const fullOutput = stdout + stderr;
  
  if (foundSuperClaude && !foundNotFound) {
    console.log('\n✅ SUCCESS: SuperClaude detected correctly!');
    console.log('   The virtual environment Python is being used.');
  } else if (foundNotFound) {
    console.log('\n❌ ERROR: SuperClaude not found!');
    console.log('   Check the Python path detection logic.');
  } else {
    console.log('\n⚠️  WARNING: Could not determine SuperClaude status');
    console.log('   Check mcp-server-test.log for details');
  }
  
  logFile.end();
  mcp.kill();
  process.exit(foundSuperClaude && !foundNotFound ? 0 : 1);
}, 3000);