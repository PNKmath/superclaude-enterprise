/**
 * SuperClaude Bridge Module
 * Provides minimal integration between SuperClaude Enterprise and SuperClaude MCP server
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface SuperClaudeCommand {
  command: string;
  personas?: string[];
  flags?: string[];
  args?: string[];
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}

export class SuperClaudeBridge extends EventEmitter {
  private superclaudePath: string;
  private pythonPath: string = 'python3';
  private cacheEnabled: boolean = true;
  private cache: Map<string, ExecutionResult> = new Map();

  constructor(superclaudePath?: string) {
    super();
    this.superclaudePath = superclaudePath || this.findSuperClaudePath();
    // Use virtual environment Python if available
    this.pythonPath = this.findPythonPath();
  }

  private findPythonPath(): string {
    const fs = require('fs');
    const possiblePaths = [
      path.join(path.dirname(this.superclaudePath || '.'), 'venv', 'bin', 'python3'),
      path.join(path.dirname(this.superclaudePath || '.'), 'venv', 'bin', 'python'),
      path.join(path.dirname(this.superclaudePath || '.'), '..', 'venv', 'bin', 'python3'),
      path.join(path.dirname(this.superclaudePath || '.'), '..', 'venv', 'bin', 'python'),
      'python3',
      'python'
    ];

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          this.emit('info', `Using Python at: ${p}`);
          return p;
        }
      } catch (e) {
        // Continue searching
      }
    }

    return 'python3'; // fallback
  }

  /**
   * Find SuperClaude installation path
   */
  private findSuperClaudePath(): string {
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', 'SuperClaude'),
      path.join(process.env.HOME || '', '.claude', 'SuperClaude'),
      '/opt/SuperClaude',
      path.join(process.cwd(), 'SuperClaude')
    ];

    for (const p of possiblePaths) {
      try {
        const fs = require('fs');
        // Check for setup.py or SuperClaude directory instead of SuperClaude.py
        if (fs.existsSync(path.join(p, 'setup.py')) || 
            fs.existsSync(path.join(p, 'SuperClaude')) ||
            fs.existsSync(path.join(p, 'pyproject.toml'))) {
          this.emit('info', `Found SuperClaude at: ${p}`);
          return p;
        }
      } catch (e) {
        // Continue searching
      }
    }

    // Return null instead of throwing error - allow standalone operation
    this.emit('info', 'SuperClaude not found - running in standalone mode');
    return '';
  }

  /**
   * Validate SuperClaude installation
   */
  async validate(): Promise<boolean> {
    // If no SuperClaude path found, we're in standalone mode - that's OK
    if (!this.superclaudePath) {
      this.emit('info', 'Running in standalone mode - validation skipped');
      return true; // Return true to allow standalone operation
    }
    
    try {
      const result = await this.execute({ command: '--version' });
      return result.success;
    } catch (error) {
      this.emit('error', `Validation failed: ${error}`);
      return false;
    }
  }

  /**
   * Execute SuperClaude command via subprocess
   */
  async execute(command: SuperClaudeCommand): Promise<ExecutionResult> {
    // If no SuperClaude path, return standalone mode response
    if (!this.superclaudePath) {
      return {
        success: true,
        output: 'SuperClaude Enterprise running in standalone mode',
        error: '',
        exitCode: 0
      };
    }
    
    const cacheKey = JSON.stringify(command);
    
    // Check cache
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      this.emit('cache-hit', cacheKey);
      return this.cache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      // Try to find the correct entry point
      const possibleEntryPoints = [
        path.join(this.superclaudePath, 'SuperClaude', '__main__.py'),
        path.join(this.superclaudePath, 'setup.py'),
        path.join(this.superclaudePath, 'SuperClaude.py')
      ];
      
      let entryPoint = '';
      const fs = require('fs');
      for (const ep of possibleEntryPoints) {
        if (fs.existsSync(ep)) {
          entryPoint = ep;
          break;
        }
      }
      
      if (!entryPoint) {
        // If no entry point found, run in module mode
        entryPoint = '-m';
      }
      
      const args = entryPoint === '-m' ? ['-m', 'SuperClaude'] : [entryPoint];
      
      // Add main command
      if (command.command) {
        args.push(command.command);
      }

      // Add personas
      if (command.personas && command.personas.length > 0) {
        args.push('--personas', command.personas.join(','));
      }

      // Add flags
      if (command.flags) {
        args.push(...command.flags);
      }

      // Add additional arguments
      if (command.args) {
        args.push(...command.args);
      }

      this.emit('executing', { command: args.join(' ') });

      const childProcess = spawn(this.pythonPath, args, {
        cwd: this.superclaudePath,
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        this.emit('stdout', data.toString());
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        this.emit('stderr', data.toString());
      });

      childProcess.on('close', (code: number | null) => {
        const result: ExecutionResult = {
          success: code === 0,
          output: stdout,
          error: stderr,
          exitCode: code || 0
        };

        // Cache successful results
        if (this.cacheEnabled && result.success) {
          this.cache.set(cacheKey, result);
        }

        this.emit('completed', result);
        resolve(result);
      });

      childProcess.on('error', (error: Error) => {
        const result: ExecutionResult = {
          success: false,
          error: error.message
        };
        this.emit('error', error);
        resolve(result);
      });
    });
  }

  /**
   * Execute /sc: command with natural language processing
   */
  async executeNaturalCommand(
    naturalLanguage: string,
    options?: {
      dryRun?: boolean;
      level?: number;
      backend?: 'claude' | 'gemini';
    }
  ): Promise<ExecutionResult> {
    // First, convert natural language to SuperClaude command
    const matchedCommand = await this.matchCommand(naturalLanguage);
    
    if (!matchedCommand) {
      return {
        success: false,
        error: 'Could not match natural language to any command'
      };
    }

    // Build command
    const command: SuperClaudeCommand = {
      command: matchedCommand.command,
      personas: matchedCommand.personas,
      flags: []
    };

    if (options?.dryRun) {
      command.flags!.push('--dry-run');
    }

    if (options?.level !== undefined) {
      command.flags!.push('--level', options.level.toString());
    }

    if (options?.backend) {
      command.flags!.push('--backend', options.backend);
    }

    return this.execute(command);
  }

  /**
   * Match natural language to SuperClaude command
   */
  private async matchCommand(naturalLanguage: string): Promise<any> {
    // This would integrate with the command-matcher module
    // For now, return a simple mapping
    const lowerInput = naturalLanguage.toLowerCase();
    
    if (lowerInput.includes('보안') || lowerInput.includes('security')) {
      return {
        command: '/sc:analyze',
        personas: ['security'],
        confidence: 90
      };
    }
    
    if (lowerInput.includes('성능') || lowerInput.includes('performance')) {
      return {
        command: '/sc:analyze',
        personas: ['performance'],
        confidence: 85
      };
    }
    
    if (lowerInput.includes('만들') || lowerInput.includes('implement') || lowerInput.includes('create')) {
      return {
        command: '/sc:implement',
        personas: ['architect', 'backend'],
        confidence: 80
      };
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Get SuperClaude MCP server info
   */
  async getMCPInfo(): Promise<any> {
    try {
      const { stdout } = await execAsync('claude mcp list', { timeout: 5000 });
      return {
        available: true,
        servers: stdout.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      return {
        available: false,
        error: error
      };
    }
  }
}