// Test MCP server initialization
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting MCP server test...\n');

// Spawn the MCP server
const mcp = spawn('node', [path.join(__dirname, 'dist/mcp-server/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'test' }
});

// Capture output
let stdout = '';
let stderr = '';

mcp.stdout.on('data', (data) => {
  stdout += data.toString();
  console.log('[STDOUT]', data.toString().trim());
});

mcp.stderr.on('data', (data) => {
  stderr += data.toString();
  console.log('[STDERR]', data.toString().trim());
});

// Send initialization request after a short delay
setTimeout(() => {
  console.log('\nSending initialization request...');
  const initRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {}
    },
    id: 1
  }) + '\n';
  
  mcp.stdin.write(initRequest);
}, 100);

// Kill after 2 seconds
setTimeout(() => {
  console.log('\nStopping server...');
  mcp.kill();
}, 2000);

mcp.on('close', (code) => {
  console.log(`\nServer exited with code ${code}`);
  
  // Check if we saw the log messages
  const fullOutput = stdout + stderr;
  if (fullOutput.includes('SuperClaude not found')) {
    console.log('\n❌ ERROR: SuperClaude not found!');
  } else if (fullOutput.includes('SuperClaude Python module validated')) {
    console.log('\n✅ SUCCESS: SuperClaude detected correctly!');
  }
});