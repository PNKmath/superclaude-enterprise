#!/usr/bin/env node
/**
 * SuperClaude Enterprise MCP Server
 * Provides natural language processing capabilities as an MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ClaudeCodeBridge } from '../integration/claude-code-bridge.js';
import { commandMatcher } from '../utils/command-matcher.js';
import { normalizePersonaNames } from '../utils/persona-mapping.js';
import { HealthCheck } from './health.js';
import { SessionManager } from '../integrations/session/SessionManager.js';
import { ExtensionManager } from '../extensions/core/ExtensionManager.js';
import { createLogger } from '../utils/logger.js';
import { AIParserConfig } from '../ai/ai-command-parser.js';
import fs from 'fs/promises';
import path from 'path';

// Create logger that writes to stderr for MCP compatibility
const logger = createLogger('superclaude-enterprise', {
  transport: {
    target: 'pino/file',
    options: { destination: 2 } // stderr
  }
});

// Tool schemas
const NaturalLanguageToolSchema = z.object({
  input: z.string().describe('Natural language command in Korean or English'),
  execute: z.boolean().optional().describe('Whether to execute the command immediately'),
  sessionId: z.string().optional().describe('Session ID for multi-turn conversations'),
  userId: z.string().optional().describe('User ID for session management'),
});

const SuggestCommandToolSchema = z.object({
  partial_input: z.string().describe('Partial input for command suggestions'),
});

const ConflictResolutionToolSchema = z.object({
  personas: z.array(z.string()).describe('List of personas with potential conflicts'),
  command: z.string().describe('Command context for conflict resolution'),
});

// Initialize components
let claudeCodeBridge: ClaudeCodeBridge;
const healthCheck = new HealthCheck();
const sessionManager = SessionManager.getInstance();

// Load AI parser config if available
async function loadAIConfig(): Promise<AIParserConfig | null> {
  try {
    const configPath = path.join(process.cwd(), 'config', 'ai-parser.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // Replace environment variables
    if (config.ai.apiKey === '${GEMINI_API_KEY}') {
      config.ai.apiKey = process.env.GEMINI_API_KEY || '';
    }
    
    if (!config.ai.apiKey) {
      logger.info('Gemini API key not found, AI features disabled');
      return null;
    }
    
    return {
      geminiApiKey: config.ai.apiKey,
      enableAI: config.ai.enabled,
      complexityThreshold: 0.0, // Always use AI
      maxTokens: config.ai.maxTokens,
      useCompression: false // Never use compression
    };
  } catch (error) {
    logger.info('AI config not found or invalid, using rule-based parsing only');
    return null;
  }
}

// Initialize Claude Code Bridge with AI support
async function initializeClaudeCodeBridge() {
  const aiConfig = await loadAIConfig();
  claudeCodeBridge = new ClaudeCodeBridge(true, aiConfig || undefined);
}

// Initialize ExtensionManager for SuperClaude integration
let extensionManager: ExtensionManager | null = null;
// Extension manager ready flag removed - not needed

// Initialize Extension Manager
async function initializeExtensionManager() {
  try {
    // Suppress stdout logging for MCP compatibility
    const originalConsoleLog = console.log;
    console.log = () => {}; // Disable console.log
    
    // Load config using the config manager
    const { loadConfig } = await import('../utils/config.js');
    const config = await loadConfig();
    
    // Create ExtensionManager with production config to suppress logs
    process.env.NODE_ENV = 'production'; // Force production mode
    extensionManager = new ExtensionManager(config);
    await extensionManager.initialize();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Extension manager is now ready
    logger.info('ExtensionManager initialized successfully in MCP server');
  } catch (error) {
    logger.error('Failed to initialize ExtensionManager:', error);
    logger.warn('MCP server running without SuperClaude integration');
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'superclaude-enterprise',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  healthCheck.ping();
  return {
    tools: [
      {
        name: 'natural_language_command',
        description: 'Process natural language commands in Korean or English and convert to SuperClaude commands',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Natural language command in Korean or English' },
            execute: { type: 'boolean', description: 'Whether to execute the command immediately', default: false }
          },
          required: ['input']
        },
      },
      {
        name: 'suggest_commands',
        description: 'Get command suggestions based on partial input',
        inputSchema: {
          type: 'object',
          properties: {
            partial_input: { type: 'string', description: 'Partial input for command suggestions' }
          },
          required: ['partial_input']
        },
      },
      {
        name: 'resolve_persona_conflicts',
        description: 'Resolve conflicts between multiple personas',
        inputSchema: {
          type: 'object',
          properties: {
            personas: { type: 'array', items: { type: 'string' }, description: 'List of personas with potential conflicts' },
            command: { type: 'string', description: 'Command context for conflict resolution' }
          },
          required: ['personas', 'command']
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  healthCheck.ping();
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'natural_language_command': {
      const { input, execute, sessionId, userId } = NaturalLanguageToolSchema.parse(args);
      
      try {
        // Get or create session
        const session = await sessionManager.getOrCreateSession(
          userId || 'default',
          sessionId
        );
        
        // Get previous context from session
        const previousContext = session.turns.length > 0
          ? session.turns[session.turns.length - 1].context
          : undefined;
        
        // Convert natural language to command with session context
        const result = await claudeCodeBridge.convertNaturalLanguage(input, {
          sessionId: session.id,
          previousContext,
          turnNumber: session.turns.length + 1
        });
        
        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${result.error}`,
              },
            ],
          };
        }
        
        // Add turn to session
        await sessionManager.addTurn(session.id, {
          input,
          command: result.convertedCommand || '',
          result,
          timestamp: new Date(),
          context: result.context || {}
        });
        
        // Format output with session info
        const output = [
          '🤖 Natural Language Processing Result',
          `Session: ${session.id.substring(0, 16)}... (Turn ${session.turns.length})`,
          `Input: "${input}"`,
          `Command: ${result.convertedCommand}`,
          `Confidence: ${result.confidence}%`,
          `Personas: ${result.suggestedPersonas?.join(', ')}`,
        ];
        
        // Add context preservation info if available
        if (result.context?.detectedIntent) {
          output.push(`Intent: ${result.context.detectedIntent}`);
        }
        
        if (result.context?.needsHybridMode) {
          output.push(`Mode: Hybrid (Pattern-based)`);
        }
        
        // Show session continuity
        if (previousContext) {
          output.push('', '🔗 Session Context:');
          if (previousContext.target) {
            output.push(`  Previous target: ${previousContext.target}`);
          }
          if (previousContext.flags?.size > 0) {
            output.push(`  Inherited flags: ${Array.from(previousContext.flags.keys()).join(', ')}`);
          }
        }
        
        if (execute && result.convertedCommand) {
          output.push('', '📌 Suggested next action:');
          output.push(`Execute: ${result.convertedCommand}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: output.join('\n'),
            },
          ],
          metadata: {
            sessionId: session.id,
            turnNumber: session.turns.length
          }
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error processing natural language: ${error}`,
            },
          ],
        };
      }
    }

    case 'suggest_commands': {
      const { partial_input } = SuggestCommandToolSchema.parse(args);
      
      try {
        const suggestions = commandMatcher.suggestCommands(partial_input);
        
        const output = [
          '💡 Command Suggestions',
          `Input: "${partial_input}"`,
          '',
          ...suggestions.map((s, i) => `${i + 1}. ${s}`),
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: output.join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting suggestions: ${error}`,
            },
          ],
        };
      }
    }

    case 'resolve_persona_conflicts': {
      const { personas, command } = ConflictResolutionToolSchema.parse(args);
      
      try {
        // Normalize persona names
        const normalizedPersonas = normalizePersonaNames(personas);
        
        // Simple conflict resolution logic
        const priorityMap: Record<string, number> = {
          security: 10,
          architect: 9,
          qa: 8,
          backend: 7,
          frontend: 7,
          performance: 6,
          refactorer: 5,
          analyzer: 5,
          devops: 4,
          scribe: 3,
          mentor: 2,
        };
        
        const sortedPersonas = normalizedPersonas.sort(
          (a, b) => (priorityMap[b] || 0) - (priorityMap[a] || 0)
        );
        
        const output = [
          '🤝 Persona Conflict Resolution',
          `Command: ${command}`,
          `Requested: ${personas.join(', ')}`,
          '',
          '📊 Resolution:',
          `Primary: ${sortedPersonas[0]}`,
          `Secondary: ${sortedPersonas.slice(1).join(', ')}`,
          '',
          '💡 Recommendation:',
          `Use ${sortedPersonas[0]} as the primary persona with support from others`,
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: output.join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error resolving conflicts: ${error}`,
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Store cleanup handlers to prevent duplicate registration
let isShuttingDown = false;
const cleanupHandlers: (() => Promise<void>)[] = [];

// Single cleanup function
const cleanup = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  // Run all cleanup handlers
  for (const handler of cleanupHandlers) {
    try {
      await handler();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  process.exit(0);
};

// Register cleanup handlers once
cleanupHandlers.push(async () => {
  healthCheck.stop();
  await server.close();
});

// Set max listeners to prevent warnings
process.setMaxListeners(20);

// Handle graceful shutdown - register only once
if (!process.listenerCount('SIGINT')) {
  process.once('SIGINT', cleanup);
}

if (!process.listenerCount('SIGTERM')) {
  process.once('SIGTERM', cleanup);
}

// Handle uncaught errors - use once to prevent multiple registrations
if (!process.listenerCount('uncaughtException')) {
  process.once('uncaughtException', () => {
    process.exit(1);
  });
}

if (!process.listenerCount('unhandledRejection')) {
  process.once('unhandledRejection', () => {
    process.exit(1);
  });
}

// Start the server
async function main() {
  // Initialize Claude Code Bridge with AI support
  await initializeClaudeCodeBridge();
  
  // Initialize ExtensionManager before starting server
  await initializeExtensionManager();
  
  const transport = new StdioServerTransport();
  
  // Handle stdin/stdout errors silently
  process.stdin.on('error', () => {
    process.exit(1);
  });
  
  process.stdout.on('error', () => {
    process.exit(1);
  });
  
  // Handle stdin close - use once to prevent multiple registrations
  process.stdin.once('close', cleanup);
  
  await server.connect(transport);
  // Server is now ready to handle requests
  
  // Start health check only if explicitly enabled
  if (process.env.ENABLE_HEALTH_CHECK === 'true') {
    healthCheck.start();
  }
  
  // Keep the process alive
  process.stdin.resume();
}

main().catch(() => {
  // Don't log to stderr - just exit with error code
  process.exit(1);
});