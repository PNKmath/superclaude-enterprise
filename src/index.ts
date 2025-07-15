#!/usr/bin/env node

import { Command } from 'commander';
import { ExtensionManager } from './extensions/core/ExtensionManager';
import { logger } from './utils/logger';
import { loadConfig } from './utils/config';
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