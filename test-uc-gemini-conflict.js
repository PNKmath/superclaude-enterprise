#!/usr/bin/env node

/**
 * Test script to reproduce and analyze the conflict between --uc flag and Gemini
 */

import { EnhancedCommandParser } from './src/utils/enhanced-command-parser.js';
import { IntegratedGeminiAdapter } from './src/integrations/gemini-cli/IntegratedGeminiAdapter.js';
import { createLogger } from './src/utils/logger.js';

async function testUcFlagConflict() {
  console.log('=== Testing --uc Flag and Gemini Conflict ===\n');
  
  // Test Case 1: Natural language with compression intent
  console.log('Test Case 1: Natural language with compression intent');
  const parser = new EnhancedCommandParser();
  const input1 = "간단히 설명해줘 main.js";
  const parsed1 = parser.parse(input1);
  console.log('Input:', input1);
  console.log('Parsed command:', parsed1.baseCommand);
  console.log('Flags:', Array.from(parsed1.flags.entries()));
  console.log('Full command:', parser.buildFullCommand(parsed1));
  console.log('---\n');
  
  // Test Case 2: Explicit --uc flag
  console.log('Test Case 2: Explicit --uc flag');
  const input2 = "analyze main.js --uc";
  const parsed2 = parser.parse(input2);
  console.log('Input:', input2);
  console.log('Parsed command:', parsed2.baseCommand);
  console.log('Flags:', Array.from(parsed2.flags.entries()));
  console.log('Full command:', parser.buildFullCommand(parsed2));
  console.log('---\n');
  
  // Test Case 3: Command that would be routed to Gemini
  console.log('Test Case 3: Gemini routing with --uc');
  const context = {
    command: '/sc:analyze --uc',
    targetFiles: ['main.js'],
    flags: { uc: true },
    personas: ['analyzer']
  };
  
  // Simulate Gemini adapter processing
  const logger = createLogger('test');
  const geminiConfig = {
    strategy: {
      autoSelectMode: true,
      defaultMode: 'hybrid',
      validationThreshold: 0.8,
      maxRetries: 2
    }
  };
  
  const geminiAdapter = new IntegratedGeminiAdapter(logger, geminiConfig);
  
  // Show how the command would be transformed
  console.log('Context passed to Gemini:', JSON.stringify(context, null, 2));
  
  // Test the transformation
  const testTransform = (cmd) => {
    const mappings = {
      '/sc:analyze': 'gemini analyze',
      '/sc:review': 'gemini review',
      '/sc:implement': 'gemini generate',
      '/sc:explain': 'gemini explain',
      '/sc:improve': 'gemini refactor'
    };
    
    for (const [sc, gemini] of Object.entries(mappings)) {
      if (cmd.startsWith(sc)) {
        return cmd.replace(sc, gemini);
      }
    }
    return `gemini ${cmd}`;
  };
  
  const transformedCmd = testTransform(context.command);
  console.log('Transformed command:', transformedCmd);
  
  // Show final Gemini command
  const finalCmd = `${transformedCmd} --prompt-file "temp.md" ${context.targetFiles.join(' ')}`;
  console.log('Final Gemini command (without flag duplication):', finalCmd);
  
  // Show what would happen with flag duplication
  const duplicatedCmd = `${finalCmd} --uc`;
  console.log('Final Gemini command (with flag duplication):', duplicatedCmd);
  console.log('---\n');
  
  // Analysis
  console.log('=== Analysis ===');
  console.log('1. The --uc flag is detected in natural language parsing');
  console.log('2. It\'s added to the context.flags object');
  console.log('3. When building Gemini command, flags from context are appended');
  console.log('4. This could cause duplicate --uc flags or unexpected behavior');
  console.log('\nPotential issues:');
  console.log('- Gemini might not recognize --uc flag (it\'s SuperClaude-specific)');
  console.log('- Double flag application if both parser and builder add it');
  console.log('- Context loss when transforming to Gemini command format');
}

// Run the test
testUcFlagConflict().catch(console.error);