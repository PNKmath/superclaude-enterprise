#!/usr/bin/env node

/**
 * Path checking utility for installation scripts
 * Uses PathResolver to find SuperClaude and Python paths
 */

const { PathResolver } = require('../dist/utils/path-resolver');

const pathResolver = PathResolver.getInstance();

// Command line arguments
const command = process.argv[2];

switch (command) {
  case 'superclaude':
    const superclaudePath = pathResolver.findSuperClaude();
    if (superclaudePath) {
      console.log(superclaudePath);
      process.exit(0);
    } else {
      process.exit(1);
    }
    break;

  case 'python':
    const pythonPath = pathResolver.findPythonExecutable();
    console.log(pythonPath);
    process.exit(0);
    break;

  case 'mcp-config':
    const mcpConfigDir = pathResolver.getMCPConfigDir();
    console.log(mcpConfigDir);
    process.exit(0);
    break;

  case 'all':
    const paths = pathResolver.getResolvedPaths();
    console.log(JSON.stringify(paths, null, 2));
    process.exit(0);
    break;

  default:
    console.error('Usage: check-paths.js [superclaude|python|mcp-config|all]');
    process.exit(1);
}