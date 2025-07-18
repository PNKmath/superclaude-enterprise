const { exec } = require('child_process');
const path = require('path');

// Test Python paths
const testPaths = [
  'python3',
  path.join(process.cwd(), 'venv/bin/python'),
  path.join(process.cwd(), '../venv/bin/python')
];

console.log('Testing Python paths for SuperClaude...\n');

testPaths.forEach(pythonPath => {
  exec(`${pythonPath} -c "import SuperClaude; print('SUCCESS: SuperClaude found with ${pythonPath}')"`, (err, stdout, stderr) => {
    if (!err && stdout.includes('SUCCESS')) {
      console.log(`✓ ${stdout.trim()}`);
    } else {
      console.log(`✗ ${pythonPath}: SuperClaude not found`);
      if (stderr) console.log(`  Error: ${stderr.trim()}`);
    }
  });
});