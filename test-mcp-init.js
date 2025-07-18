// Quick test to simulate MCP server initialization
import { ExtensionManager } from './dist/extensions/core/ExtensionManager.js';

async function test() {
  console.log('Testing MCP Server Initialization...\n');
  
  const config = {
    conflictResolver: { enabled: true },
    executionLevels: { default: 2 },
    gemini: { enabled: false },
    learning: { enabled: false }
  };
  
  try {
    const manager = new ExtensionManager(config);
    
    // Listen to logger output
    if (manager.logger) {
      // Override logger methods to see output
      const originalInfo = manager.logger.info.bind(manager.logger);
      const originalWarn = manager.logger.warn.bind(manager.logger);
      const originalDebug = manager.logger.debug.bind(manager.logger);
      
      manager.logger.info = (...args) => {
        console.log('[INFO]', ...args);
        originalInfo(...args);
      };
      
      manager.logger.warn = (...args) => {
        console.log('[WARN]', ...args);
        originalWarn(...args);
      };
      
      manager.logger.debug = (...args) => {
        console.log('[DEBUG]', ...args);
        originalDebug(...args);
      };
    }
    
    await manager.initialize();
    console.log('\n✓ Initialization completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Initialization failed:', error.message);
  }
}

test().catch(console.error);