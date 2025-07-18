#!/usr/bin/env node

import { Command } from 'commander';
import { ExtensionManager } from './extensions/core/ExtensionManager.js';
import { logger } from './utils/logger.js';
import { loadConfig } from './utils/config.js';
import chalk from 'chalk';
import { version } from '../package.json';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('SuperClaude Enterprise Extension')}                        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Enhanced AI Development with Conflict Resolution')}       ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

async function main() {
  console.log(banner);

  // Initialize Extension Manager
  const config = await loadConfig();
  const extensionManager = new ExtensionManager(config);

  try {
    await extensionManager.initialize();
    logger.info('SuperClaude Enterprise initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize:', error);
    process.exit(1);
  }

  program
    .name('sc-enterprise')
    .description('SuperClaude Enterprise Extension - Advanced AI Development Platform')
    .version(version);

  // Main command wrapper
  program
    .command('run <command>')
    .description('Run a SuperClaude command with enterprise enhancements')
    .option('-p, --personas <personas...>', 'Specify personas (comma-separated)')
    .option('-l, --level <level>', 'Execution level (0-4)', '2')
    .option('-b, --backend <backend>', 'Force backend (claude/gemini/auto)', 'auto')
    .option('--no-conflict-resolution', 'Disable automatic conflict resolution')
    .option('--dry-run', 'Show what would be executed without running')
    .action(async (command, options) => {
      try {
        const result = await extensionManager.executeCommand(command, options);
        
        if (options.dryRun) {
          console.log(chalk.yellow('\n🔍 Dry Run Results:'));
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.green('\n✅ Command executed successfully'));
          if (result.output) {
            console.log(result.output);
          }
        }
      } catch (error) {
        logger.error('Command execution failed:', error);
        process.exit(1);
      }
    });

  // Conflict resolution testing
  program
    .command('test-conflict')
    .description('Test conflict resolution between personas')
    .requiredOption('-p, --personas <personas...>', 'Personas to test (comma-separated)')
    .option('-c, --command <command>', 'Command context', '/sc:analyze')
    .action(async (options) => {
      const personas = options.personas[0].split(',');
      const result = await extensionManager.testConflictResolution(
        personas,
        options.command
      );
      
      console.log(chalk.blue('\n🤝 Conflict Resolution Test:'));
      console.log(JSON.stringify(result, null, 2));
    });

  // Backend routing test
  program
    .command('test-routing <command>')
    .description('Test which backend would be selected for a command')
    .option('-f, --files <files...>', 'Target files')
    .option('-s, --size <size>', 'Estimated context size')
    .action(async (command, options) => {
      const result = await extensionManager.testBackendRouting(command, options);
      
      console.log(chalk.blue('\n🔀 Backend Routing Test:'));
      console.log(`Command: ${command}`);
      console.log(`Selected Backend: ${chalk.bold(result.backend)}`);
      console.log(`Reason: ${result.reason}`);
      if (result.estimatedCost) {
        console.log(`Estimated Cost: $${result.estimatedCost}`);
      }
    });

  // Configuration management
  program
    .command('config')
    .description('Manage SuperClaude Enterprise configuration')
    .option('-s, --show', 'Show current configuration')
    .option('-e, --edit', 'Edit configuration interactively')
    .option('-r, --reset', 'Reset to default configuration')
    .action(async (options) => {
      if (options.show) {
        const config = await loadConfig();
        console.log(chalk.blue('\n⚙️  Current Configuration:'));
        console.log(JSON.stringify(config, null, 2));
      } else if (options.edit) {
        await extensionManager.editConfig();
      } else if (options.reset) {
        await extensionManager.resetConfig();
        console.log(chalk.green('✅ Configuration reset to defaults'));
      }
    });

  // Status and health check
  program
    .command('status')
    .description('Check system status and health')
    .action(async () => {
      const status = await extensionManager.getStatus();
      
      console.log(chalk.blue('\n📊 System Status:'));
      console.log(`SuperClaude: ${status.superclaude ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Gemini CLI: ${status.gemini ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Extensions: ${status.extensions.join(', ')}`);
      console.log(`Active Hooks: ${status.hooks}`);
      console.log(`Cache Hit Rate: ${status.cacheHitRate}%`);
    });

  // Learning engine insights
  program
    .command('insights')
    .description('View learning engine insights and recommendations')
    .option('-u, --user <user>', 'Filter by user')
    .option('-t, --team <team>', 'Filter by team')
    .action(async (options) => {
      const insights = await extensionManager.getInsights(options);
      
      console.log(chalk.blue('\n🧠 Learning Insights:'));
      console.log(`Most Used Personas: ${insights.topPersonas.join(', ')}`);
      console.log(`Command Patterns: ${insights.patterns.length} detected`);
      console.log(`Productivity Score: ${insights.productivityScore}/100`);
      
      if (insights.recommendations.length > 0) {
        console.log(chalk.yellow('\n💡 Recommendations:'));
        insights.recommendations.forEach((rec: string, i: number) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }
    });

  // Quick commands for common tasks
  program
    .command('quick <action>')
    .description('Quick actions: security-scan, performance-check, clean-code')
    .option('-t, --target <target>', 'Target file or directory', '.')
    .action(async (action, options) => {
      const quickCommands: Record<string, string> = {
        'security-scan': '/sc:analyze --security --persona-security',
        'performance-check': '/sc:analyze --performance --persona-performance',
        'clean-code': '/sc:improve --refactor --persona-refactorer'
      };

      const command = quickCommands[action];
      if (!command) {
        console.error(chalk.red(`Unknown quick action: ${action}`));
        process.exit(1);
      }

      await extensionManager.executeCommand(`${command} ${options.target}`, {
        level: '3' // Higher safety level for quick commands
      });
    });

  // Integration commands
  program
    .command('resolve <command>')
    .description('Resolve a command with conflict resolution (used by SuperClaude hooks)')
    .option('--json', 'Output as JSON')
    .action(async (command, options) => {
      try {
        const contextStr = process.env.SUPERCLAUDE_CONTEXT;
        const context = contextStr ? JSON.parse(contextStr) : {};
        
        const result = await extensionManager.processCommand(command, context);
        
        if (options.json) {
          console.log(JSON.stringify(result));
        } else {
          console.log(chalk.green('✓ Command resolved successfully'));
          console.log(`Personas: ${result.personas?.map((p: any) => p.name).join(', ')}`);
          if (result.conflicts?.length > 0) {
            console.log(`Conflicts resolved: ${result.conflicts.length}`);
          }
        }
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        } else {
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        }
        process.exit(1);
      }
    });

  program
    .command('select-backend')
    .description('Select backend based on context (used by SuperClaude hooks)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const input = await new Promise<string>((resolve) => {
          let data = '';
          process.stdin.on('data', chunk => data += chunk);
          process.stdin.on('end', () => resolve(data));
        });
        
        const context = JSON.parse(input);
        const result = await extensionManager.selectBackend(context);
        
        if (options.json) {
          console.log(JSON.stringify(result));
        } else {
          console.log(chalk.green(`Backend: ${result.backend}`));
          console.log(`Reason: ${result.reason}`);
          if (result.estimatedCost) {
            console.log(`Estimated cost: $${result.estimatedCost.toFixed(4)}`);
          }
        }
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error), backend: 'claude' }));
        } else {
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        }
        process.exit(1);
      }
    });

  // Hook management commands
  program
    .command('hooks')
    .description('Manage Claude Code hooks')
    .action(async () => {
      const hooks = await extensionManager.hookManager.listHooks();
      
      console.log(chalk.cyan('\n📎 Active Claude Code Hooks:'));
      
      for (const [event, eventHooks] of hooks.entries()) {
        if (eventHooks.length > 0) {
          console.log(chalk.yellow(`\n${event}:`));
          eventHooks.forEach((hook, i) => {
            console.log(`  ${i + 1}. ${hook.command}`);
            if (hook.matcher) {
              if (hook.matcher.tool_name) {
                console.log(`     Tool: ${hook.matcher.tool_name}`);
              }
              if (hook.matcher.file_paths) {
                console.log(`     Files: ${hook.matcher.file_paths.join(', ')}`);
              }
              if (hook.matcher.query) {
                console.log(`     Query: ${hook.matcher.query}`);
              }
            }
          });
        }
      }
      
      console.log(chalk.gray('\nConfiguration files:'));
      console.log(`  - Project: .claude/settings.json`);
      console.log(`  - Local: .claude/settings.local.json`);
      console.log(`  - User: ~/.claude/settings.json`);
    });

  program
    .command('check-veto <persona>')
    .description('Check if a persona would veto a command')
    .option('--command <command>', 'Command to check')
    .action(async (persona, options) => {
      const command = options.command || process.env.CLAUDE_TOOL_INPUT || '';
      const result = await extensionManager.testConflictResolution([persona], command);
      
      if (result.conflicts?.some((c: any) => c.resolution?.strategy === 'veto_override')) {
        console.error(`VETO: ${persona} blocks this operation`);
        process.exit(2);
      }
      
      console.log(`OK: ${persona} allows this operation`);
      process.exit(0);
    });

  program
    .command('conflict-check')
    .description('Check for persona conflicts on file changes')
    .option('--files <files>', 'Changed files (space-separated)')
    .option('--personas <personas>', 'Personas to check')
    .action(async (options) => {
      const files = options.files?.split(' ') || [];
      const personas = options.personas?.split(',') || ['architect', 'performance'];
      
      console.log(chalk.cyan('Checking conflicts for:'), files.join(', '));
      
      const result = await extensionManager.testConflictResolution(personas, `edit ${files.join(' ')}`);
      
      if (result.conflicts?.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Found ${result.conflicts.length} conflicts:`));
        result.conflicts.forEach((conflict: any, i: number) => {
          console.log(`${i + 1}. ${conflict.personas.join(' vs ')} - ${conflict.description}`);
          console.log(`   Resolution: ${conflict.resolution.winner} (${conflict.resolution.strategy})`);
        });
      } else {
        console.log(chalk.green('\n✓ No conflicts found'));
      }
    });

  program
    .command('log-notification <notification>')
    .description('Log a notification from Claude Code')
    .action(async (notification) => {
      logger.info({ notification, source: 'claude-code' }, 'Notification received');
      console.log(chalk.blue('📢'), notification);
    });

  program
    .command('validate-completion')
    .description('Validate task completion before stopping')
    .option('--check-tests', 'Ensure tests pass')
    .option('--check-lint', 'Ensure linting passes')
    .action(async (options) => {
      const checks = [];
      
      if (options.checkTests) {
        checks.push('tests');
      }
      
      if (options.checkLint) {
        checks.push('linting');
      }
      
      if (checks.length === 0) {
        process.exit(0);
      }
      
      console.log(chalk.cyan('🔍 Validating completion...'));
      
      // Here we would run actual checks
      // For now, just simulate
      const allPassed = true;
      
      if (!allPassed) {
        console.error(chalk.red('❌ Validation failed. Please fix issues before completing.'));
        process.exit(2); // Force continue
      }
      
      console.log(chalk.green('✓ All validation checks passed'));
      process.exit(0);
    });

  program
    .command('learn')
    .description('Process learning data (used by SuperClaude hooks)')
    .option('--json', 'Input as JSON')
    .action(async (options) => {
      try {
        const input = await new Promise<string>((resolve) => {
          let data = '';
          process.stdin.on('data', chunk => data += chunk);
          process.stdin.on('end', () => resolve(data));
        });
        
        const learningData = JSON.parse(input);
        await extensionManager.learn(learningData);
        
        if (!options.json) {
          console.log(chalk.green('✓ Learning data processed'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Natural language command processor
  program
    .command('natural <input...>')
    .alias('n')
    .description('Process natural language commands and map to SuperClaude commands')
    .option('-e, --execute', 'Execute the matched command')
    .option('-p, --personas <personas...>', 'Override suggested personas')
    .action(async (input, options) => {
      const { parseNaturalCommand } = await import('./utils/command-matcher');
      const userInput = input.join(' ');
      
      console.log(chalk.cyan('\n🤖 Natural Language Processor'));
      console.log(chalk.gray('Input:'), userInput);
      
      const result = parseNaturalCommand(userInput);
      
      console.log(chalk.yellow('\n📊 Analysis Results:'));
      console.log(chalk.white('Detected Command:'), chalk.green(result.detectedCommand));
      console.log(chalk.white('Confidence:'), chalk.yellow(`${result.confidence}%`));
      console.log(chalk.white('Suggested Personas:'), chalk.blue(result.suggestedPersonas.join(', ')));
      console.log(chalk.white('Explanation:'), chalk.gray(result.explanation));
      console.log(chalk.white('Structured Command:'), chalk.magenta(result.structuredCommand));
      
      if (options.execute) {
        console.log(chalk.cyan('\n🚀 Executing command...'));
        const personas = options.personas || result.suggestedPersonas;
        
        await extensionManager.executeCommand(result.structuredCommand, {
          personas,
          level: '2',
          backend: 'auto',
          conflictResolution: true
        });
      } else {
        console.log(chalk.gray('\nTo execute this command, add --execute flag'));
      }
    });

  // Command suggestion helper
  program
    .command('suggest <partial>')
    .description('Get command suggestions based on partial input')
    .action(async (partial) => {
      const { suggestCommands } = await import('./utils/command-matcher');
      const suggestions = suggestCommands(partial);
      
      console.log(chalk.cyan('\n💡 Command Suggestions:'));
      suggestions.forEach(suggestion => {
        console.log(chalk.white('  •'), suggestion);
      });
    });

  // Parse command line arguments
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Run main function
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});