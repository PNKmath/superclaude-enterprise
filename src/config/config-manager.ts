import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PathResolver } from '../utils/path-resolver.js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration structure for SuperClaude Enterprise
 */
export interface SuperClaudeEnterpriseConfig {
  // SuperClaude Integration
  superclaude: {
    path: string | null;
    pythonPath: string;
    enabled: boolean;
    defaultPersonas?: string[];
  };

  // MCP (Model Context Protocol) Configuration
  mcp: {
    configDir: string;
    servers: {
      name: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }[];
  };

  // Natural Language Processing
  nlp: {
    language: 'en' | 'ko' | 'multi';
    contextRetention: boolean;
    maxContextSize: number;
  };

  // Execution Configuration
  execution: {
    defaultLevel: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    timeout: number;
  };

  // Monitoring & Metrics
  monitoring: {
    enabled: boolean;
    metricsPort?: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };

  // Feature Flags
  features: {
    hybridMode: boolean;
    sessionManagement: boolean;
    conflictResolution: boolean;
    learningEngine: boolean;
  };
}

/**
 * ConfigManager centralizes all configuration management for SuperClaude Enterprise
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: SuperClaudeEnterpriseConfig;
  private configPath: string;
  private pathResolver: PathResolver;

  private constructor() {
    this.pathResolver = PathResolver.getInstance();
    this.configPath = this.getConfigPath();
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get the configuration file path
   */
  private getConfigPath(): string {
    // Check multiple locations for config file
    const possiblePaths = [
      // 1. Environment variable
      process.env.SUPERCLAUDE_CONFIG,
      // 2. Current directory
      path.join(process.cwd(), 'superclaude-config.json'),
      // 3. Home directory
      path.join(process.env.HOME || '', '.superclaude', 'config.json'),
      // 4. System-wide config
      '/etc/superclaude/config.json'
    ].filter(Boolean);

    for (const configPath of possiblePaths) {
      if (configPath && fs.existsSync(configPath)) {
        return configPath;
      }
    }

    // Default config path
    return path.join(process.env.HOME || '', '.superclaude', 'config.json');
  }

  /**
   * Load configuration from file or create default
   */
  private loadConfig(): SuperClaudeEnterpriseConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(configData);
        return this.mergeWithDefaults(fileConfig);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
    }

    return this.getDefaultConfig();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SuperClaudeEnterpriseConfig {
    const resolvedPaths = this.pathResolver.getResolvedPaths();
    
    return {
      superclaude: {
        path: resolvedPaths.superclaude,
        pythonPath: resolvedPaths.python || 'python3',
        enabled: !!resolvedPaths.superclaude,
        defaultPersonas: []
      },
      mcp: {
        configDir: resolvedPaths.mcpConfig || path.join(process.env.HOME || '', '.config', 'claude'),
        servers: [
          {
            name: 'superclaude',
            command: 'node',
            args: [path.join(__dirname, '..', '..', 'dist', 'mcp-server.js')],
            env: {}
          }
        ]
      },
      nlp: {
        language: 'multi',
        contextRetention: true,
        maxContextSize: 10
      },
      execution: {
        defaultLevel: 3,
        cacheEnabled: true,
        cacheTTL: 3600,
        timeout: 300000 // 5 minutes
      },
      monitoring: {
        enabled: false,
        logLevel: 'info'
      },
      features: {
        hybridMode: true,
        sessionManagement: true,
        conflictResolution: true,
        learningEngine: true
      }
    };
  }

  /**
   * Merge file config with defaults
   */
  private mergeWithDefaults(fileConfig: Partial<SuperClaudeEnterpriseConfig>): SuperClaudeEnterpriseConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      superclaude: { ...defaultConfig.superclaude, ...fileConfig.superclaude },
      mcp: { ...defaultConfig.mcp, ...fileConfig.mcp },
      nlp: { ...defaultConfig.nlp, ...fileConfig.nlp },
      execution: { ...defaultConfig.execution, ...fileConfig.execution },
      monitoring: { ...defaultConfig.monitoring, ...fileConfig.monitoring },
      features: { ...defaultConfig.features, ...fileConfig.features }
    };
  }

  /**
   * Save current configuration to file
   */
  async saveConfig(): Promise<void> {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      'utf8'
    );
  }

  /**
   * Get full configuration
   */
  getConfig(): SuperClaudeEnterpriseConfig {
    return { ...this.config };
  }

  /**
   * Get SuperClaude configuration
   */
  getSuperClaudeConfig() {
    return { ...this.config.superclaude };
  }

  /**
   * Get MCP configuration
   */
  getMCPConfig() {
    return { ...this.config.mcp };
  }

  /**
   * Get NLP configuration
   */
  getNLPConfig() {
    return { ...this.config.nlp };
  }

  /**
   * Get execution configuration
   */
  getExecutionConfig() {
    return { ...this.config.execution };
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig() {
    return { ...this.config.monitoring };
  }

  /**
   * Get feature flags
   */
  getFeatures() {
    return { ...this.config.features };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SuperClaudeEnterpriseConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
  }

  /**
   * Update specific feature flag
   */
  setFeature(feature: keyof SuperClaudeEnterpriseConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  /**
   * Check if SuperClaude is available
   */
  isSuperClaudeAvailable(): boolean {
    return this.config.superclaude.enabled && !!this.config.superclaude.path;
  }

  /**
   * Get environment variables for subprocess execution
   */
  getEnvironmentVariables(): Record<string, string> {
    return {
      SUPERCLAUDE_PATH: this.config.superclaude.path || '',
      SUPERCLAUDE_PYTHON: this.config.superclaude.pythonPath,
      SUPERCLAUDE_CONFIG: this.configPath,
      SUPERCLAUDE_CACHE_ENABLED: this.config.execution.cacheEnabled.toString(),
      SUPERCLAUDE_LOG_LEVEL: this.config.monitoring.logLevel
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate SuperClaude path if enabled
    if (this.config.superclaude.enabled && !this.config.superclaude.path) {
      errors.push('SuperClaude is enabled but path is not set');
    }

    // Validate Python path
    if (!this.config.superclaude.pythonPath) {
      errors.push('Python path is not set');
    }

    // Validate MCP servers
    if (this.config.mcp.servers.length === 0) {
      errors.push('No MCP servers configured');
    }

    // Validate execution timeout
    if (this.config.execution.timeout < 1000) {
      errors.push('Execution timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export configuration as JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(jsonConfig: string): void {
    try {
      const importedConfig = JSON.parse(jsonConfig);
      this.config = this.mergeWithDefaults(importedConfig);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig();
  }

  /**
   * Reload configuration from file
   */
  reloadConfig(): void {
    this.config = this.loadConfig();
  }
}