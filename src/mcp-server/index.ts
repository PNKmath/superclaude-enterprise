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
import { ClaudeCodeBridge } from '../integration/claude-code-bridge';
import { commandMatcher } from '../utils/command-matcher';
import { normalizePersonaNames } from '../utils/persona-mapping';

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
  return {
    tools: [
      {
        name: 'natural_language_command',
        description: 'Process natural language commands in Korean or English and convert to SuperClaude commands',
        inputSchema: NaturalLanguageToolSchema,
      },
      {
        name: 'suggest_commands',
        description: 'Get command suggestions based on partial input',
        inputSchema: SuggestCommandToolSchema,
      },
      {
        name: 'resolve_persona_conflicts',
        description: 'Resolve conflicts between multiple personas',
        inputSchema: ConflictResolutionToolSchema,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SuperClaude Enterprise MCP server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});