import { jest } from '@jest/globals';
import { ConfigManager } from '../../src/config/config-manager';
import * as fs from 'fs';
import { PathResolver } from '../../src/utils/path-resolver';

// Mock modules
jest.mock('fs');
jest.mock('../../src/utils/path-resolver');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPathResolver = PathResolver as jest.MockedClass<typeof PathResolver>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock PathResolver instance
    const mockResolverInstance = {
      findSuperClaude: jest.fn().mockReturnValue('/path/to/superclaude'),
      findPythonExecutable: jest.fn().mockReturnValue('python3'),
      getMCPConfigDir: jest.fn().mockReturnValue('/home/user/.config/claude'),
      getResolvedPaths: jest.fn().mockReturnValue({
        superclaude: '/path/to/superclaude',
        python: 'python3',
        mcpConfig: '/home/user/.config/claude',
        virtualEnv: null
      })
    };
    
    mockPathResolver.getInstance = jest.fn().mockReturnValue(mockResolverInstance);
    
    // Clear singleton instance
    (ConfigManager as any).instance = null;
    
    // Mock file system
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockImplementation(() => {});
    
    configManager = ConfigManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Loading', () => {
    it('should load default configuration when no file exists', () => {
      const config = configManager.getConfig();
      
      expect(config.superclaude.path).toBe('/path/to/superclaude');
      expect(config.superclaude.pythonPath).toBe('python3');
      expect(config.nlp.language).toBe('multi');
      expect(config.execution.cacheEnabled).toBe(true);
    });

    it('should merge file configuration with defaults', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        nlp: { language: 'ko' },
        execution: { defaultLevel: 5 }
      }));

      // Create new instance to trigger file loading
      (ConfigManager as any).instance = null;
      const newConfigManager = ConfigManager.getInstance();
      const config = newConfigManager.getConfig();

      expect(config.nlp.language).toBe('ko');
      expect(config.execution.defaultLevel).toBe(5);
      expect(config.execution.cacheEnabled).toBe(true); // Default value
    });
  });

  describe('Configuration Access', () => {
    it('should get SuperClaude configuration', () => {
      const superclaudeConfig = configManager.getSuperClaudeConfig();
      expect(superclaudeConfig.path).toBe('/path/to/superclaude');
      expect(superclaudeConfig.pythonPath).toBe('python3');
    });

    it('should get MCP configuration', () => {
      const mcpConfig = configManager.getMCPConfig();
      expect(mcpConfig.configDir).toBe('/home/user/.config/claude');
      expect(mcpConfig.servers).toHaveLength(1);
    });

    it('should get feature flags', () => {
      const features = configManager.getFeatures();
      expect(features.hybridMode).toBe(true);
      expect(features.sessionManagement).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      configManager.updateConfig({
        nlp: { language: 'en' }
      });

      const config = configManager.getConfig();
      expect(config.nlp.language).toBe('en');
    });

    it('should update feature flags', () => {
      configManager.setFeature('learningEngine', false);
      
      const features = configManager.getFeatures();
      expect(features.learningEngine).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validation = configManager.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      configManager.updateConfig({
        superclaude: { enabled: true, path: null },
        execution: { timeout: 500 }
      });

      const validation = configManager.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('SuperClaude is enabled but path is not set');
      expect(validation.errors).toContain('Execution timeout must be at least 1000ms');
    });
  });

  describe('SuperClaude Availability', () => {
    it('should detect SuperClaude availability', () => {
      expect(configManager.isSuperClaudeAvailable()).toBe(true);
    });

    it('should detect SuperClaude unavailability', () => {
      configManager.updateConfig({
        superclaude: { enabled: false }
      });
      expect(configManager.isSuperClaudeAvailable()).toBe(false);
    });
  });

  describe('Environment Variables', () => {
    it('should generate environment variables', () => {
      const envVars = configManager.getEnvironmentVariables();
      
      expect(envVars.SUPERCLAUDE_PATH).toBe('/path/to/superclaude');
      expect(envVars.SUPERCLAUDE_PYTHON).toBe('python3');
      expect(envVars.SUPERCLAUDE_CACHE_ENABLED).toBe('true');
      expect(envVars.SUPERCLAUDE_LOG_LEVEL).toBe('info');
    });
  });

  describe('Import/Export', () => {
    it('should export configuration as JSON', () => {
      const exported = configManager.exportConfig();
      const parsed = JSON.parse(exported);
      
      expect(parsed.superclaude.path).toBe('/path/to/superclaude');
      expect(parsed.nlp.language).toBe('multi');
    });

    it('should import configuration from JSON', () => {
      const importData = JSON.stringify({
        nlp: { language: 'ja' },
        features: { learningEngine: false }
      });

      configManager.importConfig(importData);
      const config = configManager.getConfig();

      expect(config.nlp.language).toBe('ja');
      expect(config.features.learningEngine).toBe(false);
    });
  });

  describe('File Operations', () => {
    it('should save configuration', async () => {
      await configManager.saveConfig();
      
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should reset to defaults', () => {
      configManager.updateConfig({ nlp: { language: 'ko' } });
      configManager.resetToDefaults();
      
      const config = configManager.getConfig();
      expect(config.nlp.language).toBe('multi');
    });
  });
});