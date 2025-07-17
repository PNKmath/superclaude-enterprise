#!/usr/bin/env node

/**
 * Configuration helper for installation and management scripts
 */

const fs = require('fs');
const path = require('path');

// Build the config manager path
const configManagerPath = path.join(__dirname, '..', 'dist', 'config', 'config-manager.js');

// Check if compiled version exists
if (!fs.existsSync(configManagerPath)) {
  console.error('Error: ConfigManager not found. Please run "npm run build" first.');
  process.exit(1);
}

const { ConfigManager } = require(configManagerPath);

const configManager = ConfigManager.getInstance();
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'get':
    // Get specific configuration value
    const key = args[0];
    if (!key) {
      console.error('Usage: config-helper.js get <key>');
      process.exit(1);
    }
    
    const config = configManager.getConfig();
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    console.log(JSON.stringify(value));
    break;

  case 'set':
    // Set configuration value
    const setKey = args[0];
    const setValue = args[1];
    if (!setKey || !setValue) {
      console.error('Usage: config-helper.js set <key> <value>');
      process.exit(1);
    }
    
    // Parse value if it's JSON
    let parsedValue;
    try {
      parsedValue = JSON.parse(setValue);
    } catch {
      parsedValue = setValue;
    }
    
    // Build update object
    const keys = setKey.split('.');
    const update = {};
    let current = update;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = parsedValue;
    
    configManager.updateConfig(update);
    configManager.saveConfig()
      .then(() => {
        console.log('Configuration updated successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error('Failed to save configuration:', err);
        process.exit(1);
      });
    break;

  case 'validate':
    // Validate configuration
    const validation = configManager.validateConfig();
    if (validation.valid) {
      console.log('Configuration is valid');
      process.exit(0);
    } else {
      console.error('Configuration errors:');
      validation.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }
    break;

  case 'export':
    // Export configuration
    console.log(configManager.exportConfig());
    break;

  case 'import':
    // Import configuration from stdin
    let configData = '';
    process.stdin.on('data', chunk => {
      configData += chunk;
    });
    process.stdin.on('end', () => {
      try {
        configManager.importConfig(configData);
        configManager.saveConfig()
          .then(() => {
            console.log('Configuration imported successfully');
            process.exit(0);
          })
          .catch(err => {
            console.error('Failed to save configuration:', err);
            process.exit(1);
          });
      } catch (err) {
        console.error('Failed to import configuration:', err.message);
        process.exit(1);
      }
    });
    break;

  case 'reset':
    // Reset to defaults
    configManager.resetToDefaults();
    configManager.saveConfig()
      .then(() => {
        console.log('Configuration reset to defaults');
        process.exit(0);
      })
      .catch(err => {
        console.error('Failed to save configuration:', err);
        process.exit(1);
      });
    break;

  case 'superclaude-available':
    // Check if SuperClaude is available
    if (configManager.isSuperClaudeAvailable()) {
      console.log('true');
      process.exit(0);
    } else {
      console.log('false');
      process.exit(1);
    }
    break;

  case 'env':
    // Get environment variables
    const envVars = configManager.getEnvironmentVariables();
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`export ${key}="${value}"`);
    });
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Available commands:');
    console.error('  get <key>         - Get configuration value');
    console.error('  set <key> <value> - Set configuration value');
    console.error('  validate          - Validate configuration');
    console.error('  export            - Export configuration as JSON');
    console.error('  import            - Import configuration from stdin');
    console.error('  reset             - Reset to default configuration');
    console.error('  superclaude-available - Check if SuperClaude is available');
    console.error('  env               - Get environment variables');
    process.exit(1);
}