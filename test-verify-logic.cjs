// Test the verification logic directly
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function testVerifyLogic() {
  console.log('=== Testing SuperClaude Verification Logic ===\n');
  
  // Simulate the verifySuperClaude logic
  try {
    // Check if we're in a virtual environment
    const venvPath = process.env.VIRTUAL_ENV;
    let pythonCmd = 'python3';
    
    if (venvPath) {
      pythonCmd = path.join(venvPath, 'bin', 'python');
      console.log(`Using virtual environment Python: ${pythonCmd}`);
    } else {
      // Check for local venv directory
      const localVenvPath = path.join(process.cwd(), 'venv');
      try {
        if (fs.existsSync(path.join(localVenvPath, 'bin', 'python'))) {
          pythonCmd = path.join(localVenvPath, 'bin', 'python');
          console.log(`Using local venv Python: ${pythonCmd}`);
        }
      } catch (err) {
        console.log('Error checking local venv:', err);
      }
    }
    
    // Try to import SuperClaude
    const checkCmd = `${pythonCmd} -c "import SuperClaude; print('SuperClaude found')"`;
    console.log(`\nExecuting: ${checkCmd}`);
    
    const { stdout, stderr } = await execAsync(checkCmd);
    
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);
    
    if (stdout.includes('SuperClaude found')) {
      console.log('\n✅ SUCCESS: SuperClaude Python package verified');
      return true;
    } else {
      throw new Error('SuperClaude module not found in output');
    }
  } catch (error) {
    console.log('\n❌ ERROR: SuperClaude not found. Running in standalone mode.');
    console.log('Error details:', error.message);
    return false;
  }
}

// Test SuperClaudeBridge validation logic
async function testBridgeValidation() {
  console.log('\n=== Testing SuperClaudeBridge Validation ===\n');
  
  const pythonCommand = path.join(process.cwd(), 'venv/bin/python');
  
  try {
    const { stdout } = await execAsync(
      `${pythonCommand} -c "import SuperClaude; print('valid')"`
    );
    
    if (stdout.includes('valid')) {
      console.log('✅ SuperClaude Python module validated successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('❌ Validation failed:', error.message);
    return false;
  }
}

// Run tests
(async () => {
  await testVerifyLogic();
  await testBridgeValidation();
})();