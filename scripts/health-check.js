#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function checkComponent(name, checkFn) {
  process.stdout.write(`Checking ${name}...`);
  try {
    const result = await checkFn();
    console.log(` ${colors.green}✓${colors.reset}`);
    return { name, status: 'ok', ...result };
  } catch (error) {
    console.log(` ${colors.red}✗${colors.reset}`);
    return { name, status: 'error', error: error.message };
  }
}

async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.split('.')[0].substring(1));
  if (major < 18) {
    throw new Error(`Node.js 18+ required (current: ${version})`);
  }
  return { version };
}

async function checkSuperClaude() {
  const superClaudePath = path.join(__dirname, '../SuperClaude');
  if (!fs.existsSync(superClaudePath)) {
    throw new Error('SuperClaude not found');
  }
  return { path: superClaudePath };
}

async function checkGeminiCLI() {
  try {
    const { stdout } = await execAsync('gemini --version');
    return { version: stdout.trim() };
  } catch {
    throw new Error('Gemini CLI not installed');
  }
}

async function checkBuildArtifacts() {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build artifacts not found. Run npm run build');
  }
  return { path: distPath };
}

async function checkConfig() {
  const configPaths = [
    path.join(process.env.HOME, '.claude/enterprise/config/config.yaml'),
    path.join(__dirname, '../config/default.yaml')
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      return { path: configPath };
    }
  }
  throw new Error('No configuration file found');
}

async function checkCLI() {
  const cliPath = path.join(process.env.HOME, '.local/bin/sc-enterprise');
  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI not installed');
  }
  return { path: cliPath };
}

async function main() {
  console.log(`${colors.blue}SuperClaude Enterprise Health Check${colors.reset}`);
  console.log('='.repeat(40));
  
  const checks = [
    { name: 'Node.js', fn: checkNodeVersion },
    { name: 'SuperClaude', fn: checkSuperClaude },
    { name: 'Gemini CLI', fn: checkGeminiCLI },
    { name: 'Build Artifacts', fn: checkBuildArtifacts },
    { name: 'Configuration', fn: checkConfig },
    { name: 'CLI Installation', fn: checkCLI }
  ];
  
  const results = [];
  for (const check of checks) {
    const result = await checkComponent(check.name, check.fn);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(40));
  
  const failedChecks = results.filter(r => r.status === 'error');
  
  if (failedChecks.length === 0) {
    console.log(`${colors.green}All checks passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${failedChecks.length} checks failed:${colors.reset}`);
    failedChecks.forEach(check => {
      console.log(`  - ${check.name}: ${check.error}`);
    });
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}Health check failed:${colors.reset}`, error);
  process.exit(1);
});