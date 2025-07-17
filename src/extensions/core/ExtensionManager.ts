import { Logger } from 'pino';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ConflictResolver } from '../conflict-resolver/ConflictResolver';
import { GeminiAdapter } from '../../integrations/gemini-cli/GeminiAdapter';
import { ExecutionLevelManager } from '../execution-levels/ExecutionLevelManager';
import { HookManager, HookEvent, HookContext } from '../hooks-v4/HookManager';
import { LearningEngine } from '../learning-engine/LearningEngine';
import { SecurityLayer } from '../security/SecurityLayer';
import { MetricsCollector } from '../../integrations/monitoring/MetricsCollector';
import { createLogger } from '../../utils/logger';
import { Config } from '../../types/config';
import { normalizePersonaNames } from '../../utils/persona-mapping';
import { SuperClaudeBridge } from '../../integration/superclaude-bridge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface CommandOptions {
  personas?: string[];
  level?: string;
  backend?: string;
  conflictResolution?: boolean;
  dryRun?: boolean;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: any;
}

export class ExtensionManager {
  private logger: Logger;
  private conflictResolver: ConflictResolver;
  public geminiAdapter: GeminiAdapter;
  private executionLevels: ExecutionLevelManager;
  public hookManager: HookManager;
  private learningEngine: LearningEngine;
  private securityLayer: SecurityLayer;
  private metricsCollector: MetricsCollector;
  private superClaudePath: string;
  private superClaudeBridge: SuperClaudeBridge;

  constructor(config: Config) {
    this.logger = createLogger('ExtensionManager');
    // Look for SuperClaude in multiple locations
    this.superClaudePath = this.findSuperClaudePath();
    
    // Initialize components
    this.conflictResolver = new ConflictResolver(this.logger);
    this.geminiAdapter = new GeminiAdapter(this.logger, config.gemini);
    this.executionLevels = new ExecutionLevelManager(this.logger);
    this.hookManager = new HookManager(this.logger);
    this.learningEngine = new LearningEngine(this.logger);
    this.securityLayer = new SecurityLayer(this.logger);
    this.metricsCollector = new MetricsCollector();
    
    // Initialize SuperClaude bridge
    this.superClaudeBridge = new SuperClaudeBridge(this.superClaudePath);
    this.setupBridgeEventHandlers();
  }

  private findSuperClaudePath(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'SuperClaude'),
      path.join(process.cwd(), '..', 'SuperClaude'),
      path.join(process.env.HOME || '', 'SuperClaude'),
      path.join(__dirname, '..', '..', '..', 'SuperClaude')
    ];

    for (const p of possiblePaths) {
      try {
        if (require('fs').existsSync(p)) {
          this.logger?.info(`Found SuperClaude at: ${p}`);
          return p;
        }
      } catch {
        // Continue searching
      }
    }

    // Default path if not found
    return path.join(process.cwd(), 'SuperClaude');
  }

  private setupBridgeEventHandlers(): void {
    // Set up event handlers for SuperClaude bridge
    this.superClaudeBridge.on('info', (msg) => this.logger.info(msg));
    this.superClaudeBridge.on('executing', (data) => this.logger.debug('Executing:', data));
    this.superClaudeBridge.on('stdout', (data) => this.logger.debug(data));
    this.superClaudeBridge.on('stderr', (data) => this.logger.warn(data));
    this.superClaudeBridge.on('error', (error) => this.logger.error('Bridge error:', error));
    this.superClaudeBridge.on('completed', (result) => this.logger.info('Bridge completed:', result));
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing SuperClaude Enterprise Extension...');
    
    try {
      // Verify SuperClaude installation
      await this.verifySuperClaude();
      
      // Validate SuperClaude bridge
      const bridgeValid = await this.superClaudeBridge.validate();
      if (!bridgeValid) {
        this.logger.warn('SuperClaude bridge validation failed - running in standalone mode');
        // Continue initialization in standalone mode instead of throwing
      }
      
      // Initialize all components
      await Promise.all([
        this.geminiAdapter.initialize(),
        this.executionLevels.initialize(),
        this.hookManager.initialize(),
        this.learningEngine.initialize(),
        this.securityLayer.initialize()
      ]);
      
      // Start metrics collection
      this.metricsCollector.start();
      
      this.logger.info('Extension Manager initialized successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Extension Manager');
      throw error;
    }
  }

  async processCommand(command: string, context: any): Promise<any> {
    const personas = context.personas || [];
    const personaObjects = personas.map((p: any) => 
      typeof p === 'string' ? { name: p } : p
    );
    
    // Execute PreToolUse hooks
    const hookContext: HookContext = {
      command,
      personas: personas,
      tool_name: 'process_command',
      tool_input: command
    };
    
    const blockResult = await this.hookManager.shouldBlockTool(hookContext);
    if (blockResult.block) {
      return {
        success: false,
        error: blockResult.reason,
        blocked: true
      };
    }
    
    const resolvedContext = await this.conflictResolver.resolve(
      command,
      personaObjects,
      { ...context, command }
    );
    
    // Execute PostToolUse hooks
    await this.hookManager.executeHooks(HookEvent.POST_TOOL_USE, {
      ...hookContext,
      tool_response: resolvedContext
    });
    
    return {
      success: true,
      ...resolvedContext,
      metadata: {
        resolutionTime: resolvedContext.resolutionTime,
        strategy: resolvedContext.strategy
      }
    };
  }

  async executeCommand(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Parse command and options
      const context = await this.buildExecutionContext(command, options);
      
      // Security check
      const securedContext = await this.securityLayer.secure(context);
      
      // Determine execution level
      const level = options.level 
        ? parseInt(options.level) 
        : await this.executionLevels.determineLevel(securedContext);
      
      // Check if we should proceed based on level
      if (level === 3 && !options.dryRun) {
        return {
          success: false,
          error: 'Execution blocked by security level. Use --dry-run to preview.'
        };
      }
      
      // Resolve persona conflicts if multiple personas
      if (options.personas && options.personas.length > 1 && options.conflictResolution !== false) {
        const resolved = await this.conflictResolver.resolve(
          command,
          options.personas.map(name => ({ name })),
          securedContext
        );
        securedContext.personas = resolved.personas;
        securedContext.conflictResolution = resolved;
      }
      
      // Select backend
      const backend = options.backend === 'auto' 
        ? await this.geminiAdapter.selectBackend(securedContext)
        : options.backend || 'claude';
      
      // Execute command
      const result = await this.executeWithBackend(command, securedContext, backend, options.dryRun);
      
      // Learn from execution
      await this.learningEngine.learn({
        command,
        options,
        result,
        duration: Date.now() - startTime
      });
      
      // Collect metrics
      this.metricsCollector.recordCommandExecution({
        command,
        backend,
        duration: Date.now() - startTime,
        success: result.success
      });
      
      return result;
      
    } catch (error) {
      this.logger.error({ error, command }, 'Command execution failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async testConflictResolution(personas: string[], command: string): Promise<any> {
    const context = {
      command,
      personas: personas.map(name => ({ name })),
      environment: 'test'
    };
    
    return await this.conflictResolver.resolve(
      command,
      context.personas,
      context
    );
  }

  async testBackendRouting(command: string, options: any): Promise<any> {
    const context = {
      command,
      files: options.files,
      estimatedSize: options.size,
      environment: 'test'
    };
    
    const backend = await this.geminiAdapter.selectBackend(context);
    const reason = await this.geminiAdapter.getSelectionReason(context);
    const estimatedCost = await this.geminiAdapter.estimateCost(context);
    
    return {
      backend,
      reason,
      estimatedCost
    };
  }

  async selectBackend(context: any): Promise<any> {
    return await this.geminiAdapter.makeBackendDecision(context);
  }

  async learn(data: any): Promise<void> {
    await this.learningEngine.learn(data);
  }

  async getStatus(): Promise<any> {
    const status = {
      superclaude: await this.checkSuperClaude(),
      gemini: await this.geminiAdapter.isAvailable(),
      extensions: await this.getLoadedExtensions(),
      hooks: await this.hookManager.getActiveHooks(),
      cacheHitRate: this.metricsCollector.getCacheHitRate()
    };
    
    return status;
  }

  async getInsights(options?: any): Promise<any> {
    const insights = await this.learningEngine.getInsights({
      userId: options?.user,
      teamId: options?.team,
      timeRange: '7d'
    });
    
    return {
      topPersonas: insights.topPersonas || [],
      patterns: insights.patterns || [],
      productivityScore: insights.productivityScore || 0,
      recommendations: insights.recommendations || []
    };
  }

  async editConfig(): Promise<void> {
    // Implementation for interactive config editing
    this.logger.info('Config editing not yet implemented');
  }

  async resetConfig(): Promise<void> {
    const defaultConfigPath = path.join(__dirname, '../../../config/default.yaml');
    const userConfigPath = path.join(process.env.HOME!, '.claude/enterprise/config/config.yaml');
    
    await fs.copyFile(defaultConfigPath, userConfigPath);
    this.logger.info('Configuration reset to defaults');
  }

  // Private helper methods
  
  private async verifySuperClaude(): Promise<void> {
    try {
      // Check if SuperClaude is installed as a Python package
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Check if we're in a virtual environment
      const venvPath = process.env.VIRTUAL_ENV;
      let pythonCmd = 'python3';
      
      if (venvPath) {
        // Use the virtual environment's Python
        pythonCmd = path.join(venvPath, 'bin', 'python');
        this.logger.info(`Using virtual environment Python: ${pythonCmd}`);
      }
      
      // Try to import SuperClaude
      const checkCmd = `${pythonCmd} -c "import SuperClaude; print('SuperClaude found')"`;
      const { stdout } = await execAsync(checkCmd);
      
      if (stdout.includes('SuperClaude found')) {
        this.logger.info('SuperClaude Python package verified');
        // Update the bridge to use Python module execution
        this.superClaudeBridge.setPythonCommand(pythonCmd);
      } else {
        throw new Error('SuperClaude module not found');
      }
    } catch (error) {
      this.logger.warn('SuperClaude not found. Running in standalone mode.');
      this.logger.debug({ error }, 'SuperClaude verification error');
      // Don't throw error - allow standalone operation
    }
  }

  private async buildExecutionContext(command: string, options: CommandOptions): Promise<any> {
    return {
      command,
      personas: normalizePersonaNames(options.personas || []),
      timestamp: Date.now(),
      user: process.env.USER,
      environment: process.env.SC_ENTERPRISE_ENV || 'development',
      targetFiles: this.extractTargetFiles(command),
      flags: this.extractFlags(command)
    };
  }

  private extractTargetFiles(command: string): string[] {
    // Simple extraction - can be enhanced
    const filePattern = /\b[\w\-/]+\.\w+\b/g;
    return command.match(filePattern) || [];
  }

  private extractFlags(command: string): Record<string, any> {
    const flags: Record<string, any> = {};
    const flagPattern = /--(\w+)(?:=(\S+))?/g;
    let match;
    
    while ((match = flagPattern.exec(command)) !== null) {
      flags[match[1]] = match[2] || true;
    }
    
    return flags;
  }

  private async executeWithBackend(
    command: string, 
    context: any, 
    backend: string,
    dryRun?: boolean
  ): Promise<CommandResult> {
    if (dryRun) {
      return {
        success: true,
        output: `[DRY RUN] Would execute: ${command} with backend: ${backend}`,
        metadata: { context, backend }
      };
    }
    
    try {
      // Check if command is a natural language command
      if (command.startsWith('/sc:')) {
        // Extract natural language part
        const naturalLanguage = command.substring(4).trim();
        
        // Use SuperClaude bridge for natural language processing
        const result = await this.superClaudeBridge.executeNaturalCommand(
          naturalLanguage,
          {
            backend: backend as 'claude' | 'gemini',
            level: context.level
          }
        );
        
        return {
          success: result.success,
          output: result.output || result.error,
          error: result.error,
          metadata: {
            backend,
            personas: context.personas?.map((p: any) => p.name),
            executionTime: Date.now() - context.timestamp,
            exitCode: result.exitCode
          }
        };
      } else {
        // Direct command execution
        const superClaudeCommand = {
          command: command,
          personas: context.personas?.map((p: any) => p.name),
          flags: Object.entries(context.flags || {}).map(([k, v]) => 
            v === true ? `--${k}` : `--${k}=${v}`
          )
        };
        
        const result = await this.superClaudeBridge.execute(superClaudeCommand);
        
        return {
          success: result.success,
          output: result.output || result.error,
          error: result.error,
          metadata: {
            backend,
            personas: context.personas?.map((p: any) => p.name),
            executionTime: Date.now() - context.timestamp,
            exitCode: result.exitCode
          }
        };
      }
    } catch (error) {
      this.logger.error({ error, command }, 'Failed to execute with backend');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkSuperClaude(): Promise<boolean> {
    try {
      await fs.access(path.join(this.superClaudePath, 'SuperClaude.py'));
      return true;
    } catch {
      return false;
    }
  }

  private async getLoadedExtensions(): Promise<string[]> {
    return [
      'conflict-resolver',
      'execution-levels',
      'gemini-adapter',
      'hooks-v4',
      'learning-engine',
      'security-layer'
    ];
  }
}