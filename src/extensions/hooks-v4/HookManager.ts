import { Logger } from 'pino';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export enum HookEvent {
  PRE_TOOL_USE = 'PreToolUse',
  POST_TOOL_USE = 'PostToolUse',
  NOTIFICATION = 'Notification',
  STOP = 'Stop',
  SUBAGENT_STOP = 'SubagentStop'
}

export interface HookMatcher {
  tool_name?: string;
  file_paths?: string[];
  query?: string;
}

export interface Hook {
  event?: HookEvent;
  matcher?: HookMatcher;
  command: string;
  run_in_background?: boolean;
  timeout?: number;
}

export interface HookConfig {
  hooks: {
    [key in HookEvent]?: Hook[];
  };
}

export interface HookContext {
  tool_name?: string;
  tool_input?: any;
  tool_response?: any;
  file_paths?: string[];
  notification?: string;
  command?: string;
  personas?: string[];
}

export interface HookResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  decision?: 'approve' | 'block';
  reason?: string;
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

export class HookManager {
  private logger: Logger;
  private hooks: Map<HookEvent, Hook[]> = new Map();
  private configPath: string;
  private localConfigPath: string;
  private userConfigPath: string;

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Configuration paths
    const projectRoot = process.cwd();
    this.configPath = path.join(projectRoot, '.claude', 'settings.json');
    this.localConfigPath = path.join(projectRoot, '.claude', 'settings.local.json');
    this.userConfigPath = path.join(process.env.HOME || '', '.claude', 'settings.json');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Claude Code Hook Manager v4...');
    
    // Load hooks from configuration files
    await this.loadHooks();
    
    this.logger.info({
      loadedHooks: {
        PreToolUse: this.hooks.get(HookEvent.PRE_TOOL_USE)?.length || 0,
        PostToolUse: this.hooks.get(HookEvent.POST_TOOL_USE)?.length || 0,
        Notification: this.hooks.get(HookEvent.NOTIFICATION)?.length || 0,
        Stop: this.hooks.get(HookEvent.STOP)?.length || 0,
        SubagentStop: this.hooks.get(HookEvent.SUBAGENT_STOP)?.length || 0
      }
    }, 'Hooks loaded successfully');
  }

  private async loadHooks(): Promise<void> {
    // Clear existing hooks
    this.hooks.clear();
    
    // Load from multiple sources (in order of priority)
    const configPaths = [
      this.userConfigPath,      // User global config
      this.configPath,          // Project config
      this.localConfigPath      // Local project config (highest priority)
    ];
    
    for (const configPath of configPaths) {
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        const config: HookConfig = JSON.parse(configData);
        
        if (config.hooks) {
          for (const [event, hooks] of Object.entries(config.hooks)) {
            const hookEvent = event as HookEvent;
            const existingHooks = this.hooks.get(hookEvent) || [];
            this.hooks.set(hookEvent, [...existingHooks, ...hooks]);
          }
        }
        
        this.logger.debug({ configPath }, 'Loaded hooks from config');
      } catch (error) {
        // Config file doesn't exist or is invalid - this is okay
        this.logger.debug({ configPath, error }, 'Config file not found or invalid');
      }
    }
  }

  async executeHooks(event: HookEvent, context: HookContext): Promise<HookResult[]> {
    const hooks = this.hooks.get(event) || [];
    const matchingHooks = hooks.filter(hook => this.matchesContext(hook, context));
    
    if (matchingHooks.length === 0) {
      return [];
    }
    
    this.logger.debug({ event, matchingHooks: matchingHooks.length }, 'Executing hooks');
    
    // Execute all matching hooks in parallel
    const results = await Promise.all(
      matchingHooks.map(hook => this.executeHook(hook, event, context))
    );
    
    return results;
  }

  private matchesContext(hook: Hook, context: HookContext): boolean {
    if (!hook.matcher) {
      return true; // No matcher means always match
    }
    
    const { matcher } = hook;
    
    // Check tool name
    if (matcher.tool_name && context.tool_name !== matcher.tool_name) {
      return false;
    }
    
    // Check query
    if (matcher.query && context.tool_input) {
      const input = typeof context.tool_input === 'string' 
        ? context.tool_input 
        : JSON.stringify(context.tool_input);
      
      if (!input.includes(matcher.query)) {
        return false;
      }
    }
    
    // Check file paths
    if (matcher.file_paths && context.file_paths) {
      const matchesAnyPattern = context.file_paths.some(filePath => {
        return matcher.file_paths!.some(pattern => {
          // Use glob pattern matching
          return this.matchesGlobPattern(filePath, pattern);
        });
      });
      
      if (!matchesAnyPattern) {
        return false;
      }
    }
    
    return true;
  }

  private matchesGlobPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');
    
    return new RegExp(`^${regex}$`).test(filePath);
  }

  private async executeHook(
    hook: Hook, 
    _event: HookEvent, 
    context: HookContext
  ): Promise<HookResult> {
    const env = this.buildEnvironment(context);
    const timeout = hook.timeout || 60000; // Default 60 seconds
    
    try {
      if (hook.run_in_background) {
        // Execute in background
        const child = spawn('sh', ['-c', hook.command], {
          env: { ...process.env, ...env },
          detached: true,
          stdio: 'ignore'
        });
        
        child.unref();
        
        return {
          exitCode: 0,
          stdout: 'Hook started in background',
          stderr: ''
        };
      } else {
        // Execute and wait for result
        const { stdout, stderr } = await execAsync(hook.command, {
          env: { ...process.env, ...env },
          timeout
        });
        
        // Try to parse JSON response
        let result: HookResult = {
          exitCode: 0,
          stdout,
          stderr
        };
        
        try {
          const jsonOutput = JSON.parse(stdout.trim());
          result = { ...result, ...jsonOutput };
        } catch {
          // Not JSON, that's okay
        }
        
        return result;
      }
    } catch (error: any) {
      const exitCode = error.code || 1;
      
      return {
        exitCode,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      };
    }
  }

  private buildEnvironment(context: HookContext): Record<string, string> {
    const env: Record<string, string> = {};
    
    // File paths
    if (context.file_paths) {
      env.CLAUDE_FILE_PATHS = context.file_paths.join(' ');
    }
    
    // Tool information
    if (context.tool_name) {
      env.CLAUDE_TOOL_NAME = context.tool_name;
    }
    
    if (context.tool_input) {
      env.CLAUDE_TOOL_INPUT = typeof context.tool_input === 'string'
        ? context.tool_input
        : JSON.stringify(context.tool_input);
    }
    
    if (context.tool_response) {
      env.CLAUDE_TOOL_RESPONSE = typeof context.tool_response === 'string'
        ? context.tool_response
        : JSON.stringify(context.tool_response);
    }
    
    // Notification
    if (context.notification) {
      env.CLAUDE_NOTIFICATION = context.notification;
    }
    
    // SuperClaude Enterprise specific
    if (context.personas) {
      env.SUPERCLAUDE_PERSONAS = context.personas.join(',');
    }
    
    if (context.command) {
      env.SUPERCLAUDE_COMMAND = context.command;
    }
    
    return env;
  }

  async shouldBlockTool(context: HookContext): Promise<{ block: boolean; reason?: string }> {
    const results = await this.executeHooks(HookEvent.PRE_TOOL_USE, context);
    
    for (const result of results) {
      // Exit code 2 means block
      if (result.exitCode === 2 || result.decision === 'block') {
        return {
          block: true,
          reason: result.reason || result.stderr || 'Tool blocked by hook'
        };
      }
    }
    
    return { block: false };
  }

  async shouldContinue(context: HookContext): Promise<{ continue: boolean; reason?: string }> {
    const results = await this.executeHooks(HookEvent.STOP, context);
    
    for (const result of results) {
      // Exit code 2 means force continue
      if (result.exitCode === 2 || result.decision === 'block' || result.continue === false) {
        return {
          continue: true,
          reason: result.reason || result.stopReason || 'Continuation required by hook'
        };
      }
    }
    
    return { continue: false };
  }

  async getActiveHooks(): Promise<number> {
    let total = 0;
    for (const hooks of this.hooks.values()) {
      total += hooks.length;
    }
    return total;
  }

  async addHook(event: HookEvent, hook: Hook): Promise<void> {
    const hooks = this.hooks.get(event) || [];
    hooks.push(hook);
    this.hooks.set(event, hooks);
    
    // Save to local config
    await this.saveLocalConfig();
  }

  async removeHook(event: HookEvent, index: number): Promise<void> {
    const hooks = this.hooks.get(event) || [];
    if (index >= 0 && index < hooks.length) {
      hooks.splice(index, 1);
      this.hooks.set(event, hooks);
      await this.saveLocalConfig();
    }
  }

  private async saveLocalConfig(): Promise<void> {
    const config: HookConfig = { hooks: {} };
    
    for (const [event, hooks] of this.hooks.entries()) {
      config.hooks[event] = hooks;
    }
    
    await fs.mkdir(path.dirname(this.localConfigPath), { recursive: true });
    await fs.writeFile(this.localConfigPath, JSON.stringify(config, null, 2));
  }

  async listHooks(): Promise<Map<HookEvent, Hook[]>> {
    return new Map(this.hooks);
  }
}