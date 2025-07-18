/**
 * SuperClaude Bridge Module
 * Provides minimal integration between SuperClaude Enterprise and SuperClaude MCP server
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { ConfigManager } from '../config/config-manager';

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
  private superclaudePath: string | null;
  private pythonCommand: string = 'python3';
  private cacheEnabled: boolean;
  private cache: Map<string, ExecutionResult> = new Map();
  private configManager: ConfigManager;

  constructor(superclaudePath?: string) {
    super();
    this.configManager = ConfigManager.getInstance();
    
    const config = this.configManager.getSuperClaudeConfig();
    this.superclaudePath = superclaudePath || config.path;
    this.pythonCommand = config.pythonPath || 'python3';
    this.cacheEnabled = this.configManager.getExecutionConfig().cacheEnabled;
    
    // Initialize Python command detection
    this.detectAndSetPythonCommand().catch(err => {
      this.emit('error', `Failed to detect Python command: ${err.message}`);
    });
    
    // Log configuration for debugging
    this.emit('info', `SuperClaude config: ${JSON.stringify(config, null, 2)}`);
  }
  
  /**
   * Set the Python command to use (for virtual environments)
   */
  setPythonCommand(pythonCmd: string): void {
    this.pythonCommand = pythonCmd;
    this.emit('info', `Python command updated to: ${pythonCmd}`);
  }


  /**
   * Validate SuperClaude installation
   */
  async validate(): Promise<boolean> {
    try {
      // Try to validate Python module installation
      const { stdout } = await execAsync(
        `${this.pythonCommand} -c "import SuperClaude; print('valid')"`
      );
      
      if (stdout.includes('valid')) {
        this.emit('info', 'SuperClaude Python module validated successfully');
        return true;
      }
      
      // If module validation fails but we have a path, try path-based validation
      if (this.superclaudePath) {
        const result = await this.execute({ command: '--version' });
        return result.success;
      }
      
      return false;
    } catch (error) {
      this.emit('error', `Validation failed: ${error}`);
      // Allow standalone mode
      this.emit('info', 'Running in standalone mode - validation skipped');
      return true;
    }
  }

  /**
   * Execute SuperClaude command via subprocess
   */
  async execute(command: SuperClaudeCommand): Promise<ExecutionResult> {
    const cacheKey = JSON.stringify(command);
    
    // Check cache
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      this.emit('cache-hit', cacheKey);
      return this.cache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      // Always use module execution for installed SuperClaude
      const args = ['-m', 'SuperClaude'];
      
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

      this.emit('executing', { 
        command: `${this.pythonCommand} ${args.join(' ')}`,
        pythonCommand: this.pythonCommand 
      });

      // Use the correct Python command (handles virtual environments)
      const childProcess = spawn(this.pythonCommand, args, {
        cwd: process.cwd(),
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
  
  /**
   * Detect and set the appropriate Python command
   * This method is called during initialization
   */
  private async detectAndSetPythonCommand(): Promise<void> {
    // Priority order for Python detection
    const candidates = [];
    
    // 1. Environment variable (highest priority)
    if (process.env.SUPERCLAUDE_PYTHON) {
      candidates.push({
        name: 'SUPERCLAUDE_PYTHON env var',
        path: process.env.SUPERCLAUDE_PYTHON
      });
    }
    
    // 2. Configuration file
    const configPython = this.configManager.getSuperClaudeConfig()?.pythonPath;
    if (configPython && configPython !== 'python3') {
      candidates.push({
        name: 'Config file',
        path: configPython
      });
    }
    
    // 3. Active virtual environment
    if (process.env.VIRTUAL_ENV) {
      candidates.push({
        name: 'VIRTUAL_ENV',
        path: path.join(process.env.VIRTUAL_ENV, 'bin', 'python')
      });
    }
    
    // 4. Common virtual environment locations
    const projectRoot = path.join(__dirname, '../..');
    const venvPaths = [
      { name: 'Project venv', path: path.join(projectRoot, 'venv', 'bin', 'python') },
      { name: 'Project .venv', path: path.join(projectRoot, '.venv', 'bin', 'python') },
      { name: 'CWD venv', path: path.join(process.cwd(), 'venv', 'bin', 'python') },
      { name: 'CWD .venv', path: path.join(process.cwd(), '.venv', 'bin', 'python') }
    ];
    
    // Check which venv paths exist
    for (const venv of venvPaths) {
      if (fs.existsSync(venv.path)) {
        candidates.push(venv);
      }
    }
    
    // 5. System Python paths
    candidates.push(
      { name: 'python3', path: 'python3' },
      { name: 'python', path: 'python' }
    );
    
    // Test each candidate
    for (const candidate of candidates) {
      try {
        const { stdout } = await execAsync(
          `${candidate.path} -c "import SuperClaude; print('found')"`
        );
        
        if (stdout.includes('found')) {
          this.pythonCommand = candidate.path;
          this.emit('info', `Using Python from ${candidate.name}: ${candidate.path}`);
          return;
        }
      } catch {
        // Try next candidate
      }
    }
    
    // Fallback to python3
    this.emit('warn', 'No Python with SuperClaude found, using default python3');
    this.pythonCommand = 'python3';
  }
}