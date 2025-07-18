import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

async function testPythonDetection() {
  console.log('=== Testing Python Detection Logic ===\n');
  
  // Check environment
  console.log('Environment:');
  console.log(`  VIRTUAL_ENV: ${process.env.VIRTUAL_ENV || 'Not set'}`);
  console.log(`  CWD: ${process.cwd()}`);
  console.log();
  
  // Test paths
  const testPaths = [
    { name: 'System Python', cmd: 'python3' },
    { name: 'Local venv', cmd: path.join(process.cwd(), 'venv/bin/python') },
    { name: 'Project venv', cmd: path.join(process.cwd(), '../venv/bin/python') },
    { name: '.venv', cmd: path.join(process.cwd(), '.venv/bin/python') }
  ];
  
  for (const test of testPaths) {
    console.log(`Testing ${test.name}: ${test.cmd}`);
    
    // Check if file exists
    if (!test.cmd.includes('python3') && !fs.existsSync(test.cmd)) {
      console.log(`  ✗ File not found`);
      continue;
    }
    
    // Test SuperClaude import
    const child = spawn(test.cmd, ['-c', 'import SuperClaude; print("SuperClaude found")']);
    
    const output = await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => { stdout += data; });
      child.stderr.on('data', (data) => { stderr += data; });
      
      child.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });
    });
    
    if (output.code === 0) {
      console.log(`  ✓ ${output.stdout.trim()}`);
    } else {
      console.log(`  ✗ SuperClaude not found`);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testPythonDetection().catch(console.error);