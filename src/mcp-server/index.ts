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

// Tool schemas
const NaturalLanguageToolSchema = z.object({
  input: z.string().describe('Natural language command in Korean or English'),
  execute: z.boolean().optional().describe('Whether to execute the command immediately'),
});

const SuggestCommandToolSchema = z.object({
  partial_input: z.string().describe('Partial input for command suggestions'),
});

const ConflictResolutionToolSchema = z.object({
  personas: z.array(z.string()).describe('List of personas with potential conflicts'),
  command: z.string().describe('Command context for conflict resolution'),
});

// Initialize components
const claudeCodeBridge = new ClaudeCodeBridge();
const healthCheck = new HealthCheck();

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
      const { input, execute } = NaturalLanguageToolSchema.parse(args);
      
      try {
        // Convert natural language to command
        const result = await claudeCodeBridge.convertNaturalLanguage(input);
        
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
        
        // Format output
        const output = [
          '🤖 Natural Language Processing Result',
          `Input: "${input}"`,
          `Command: ${result.convertedCommand}`,
          `Confidence: ${result.confidence}%`,
          `Personas: ${result.suggestedPersonas?.join(', ')}`,
        ];
        
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  // Don't log to stderr in MCP mode
  healthCheck.stop();
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // Don't log to stderr in MCP mode
  healthCheck.stop();
  await server.close();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', () => {
  // Log errors to file instead of stderr
  process.exit(1);
});

process.on('unhandledRejection', () => {
  // Log errors to file instead of stderr
  process.exit(1);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  
  // Handle stdin/stdout errors silently
  process.stdin.on('error', () => {
    process.exit(1);
  });
  
  process.stdout.on('error', () => {
    process.exit(1);
  });
  
  // Handle stdin close
  process.stdin.on('close', () => {
    healthCheck.stop();
    process.exit(0);
  });
  
  await server.connect(transport);
  // Don't log to stderr - it interferes with MCP protocol
  
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