import { jest } from '@jest/globals';
import { PathResolver } from '../../src/utils/path-resolver';
import * as fs from 'fs';
import { execSync } from 'child_process';
import type { PathLike } from 'fs';

// Mock modules
jest.mock('fs');
jest.mock('child_process');

describe('PathResolver', () => {
  let pathResolver: PathResolver;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear singleton instance
    (PathResolver as any).instance = null;
    pathResolver = PathResolver.getInstance();
    // Clear cache before each test
    pathResolver.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PathResolver.getInstance();
      const instance2 = PathResolver.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('findSuperClaude', () => {
    it('should find SuperClaude in project directory', () => {
      mockFs.existsSync.mockImplementation((p: PathLike) => {
        const pathStr = p.toString();
        return pathStr.includes('SuperClaude') && pathStr.includes('setup.py');
      });
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true,
        isFile: () => false
      } as any);

      const result = pathResolver.findSuperClaude();
      expect(result).toContain('SuperClaude');
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should return null when SuperClaude is not found', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = pathResolver.findSuperClaude();
      expect(result).toBeNull();
    });

    it('should check for various SuperClaude indicators', () => {
      const checkedPaths: string[] = [];
      mockFs.existsSync.mockImplementation((p: PathLike) => {
        checkedPaths.push(p.toString());
        return false;
      });

      pathResolver.findSuperClaude();

      const indicators = ['setup.py', 'pyproject.toml', 'SuperClaude.egg-info'];
      const hasIndicatorChecks = indicators.some(indicator =>
        checkedPaths.some(p => p.includes(indicator))
      );
      expect(hasIndicatorChecks).toBe(true);
    });

    it('should cache results', () => {
      mockFs.existsSync.mockReturnValue(false);

      // First call
      pathResolver.findSuperClaude();
      const firstCallCount = mockFs.existsSync.mock.calls.length;

      // Second call should use cache
      pathResolver.findSuperClaude();
      const secondCallCount = mockFs.existsSync.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('findPythonExecutable', () => {
    it('should prefer virtual environment Python', () => {
      mockFs.existsSync.mockImplementation((p: PathLike) => {
        const pathStr = p.toString();
        return pathStr.includes('venv') && pathStr.includes('python');
      });
      mockExecSync.mockReturnValue(Buffer.from('Python 3.9.0'));

      const result = pathResolver.findPythonExecutable();
      expect(result).toContain('venv');
    });

    it('should fall back to system Python when venv not found', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('python3')) {
          return Buffer.from('Python 3.9.0');
        }
        throw new Error('Command not found');
      });

      const result = pathResolver.findPythonExecutable();
      expect(result).toBe('python3');
    });

    it('should try multiple Python commands', () => {
      mockFs.existsSync.mockReturnValue(false);
      const triedCommands: string[] = [];
      mockExecSync.mockImplementation((cmd: string) => {
        triedCommands.push(cmd);
        throw new Error('Command not found');
      });

      pathResolver.findPythonExecutable();

      const pythonVariants = ['python3', 'python', 'python3.9', 'python3.10', 'python3.11'];
      const hasTriedVariants = pythonVariants.some(variant =>
        triedCommands.some(cmd => cmd.includes(variant))
      );
      expect(hasTriedVariants).toBe(true);
    });
  });

  describe('getMCPConfigDir', () => {
    it('should return Windows path on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const result = pathResolver.getMCPConfigDir();
      expect(result).toContain('Claude');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    it('should return Unix path on non-Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      const result = pathResolver.getMCPConfigDir();
      expect(result).toContain('.config/claude');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });
  });

  describe('getResolvedPaths', () => {
    it('should return all resolved paths', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const paths = pathResolver.getResolvedPaths();

      expect(paths).toHaveProperty('superclaude');
      expect(paths).toHaveProperty('python');
      expect(paths).toHaveProperty('mcpConfig');
      expect(paths).toHaveProperty('virtualEnv');
    });
  });

  describe('clearCache', () => {
    it('should clear cached paths', () => {
      mockFs.existsSync.mockReturnValue(false);

      // First call - caches result
      pathResolver.findSuperClaude();
      const firstCallCount = mockFs.existsSync.mock.calls.length;

      // Clear cache
      pathResolver.clearCache();

      // Second call - should not use cache
      pathResolver.findSuperClaude();
      const totalCallCount = mockFs.existsSync.mock.calls.length;

      expect(totalCallCount).toBe(firstCallCount * 2);
    });
  });
});