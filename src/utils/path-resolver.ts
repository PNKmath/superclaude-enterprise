import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { platform } from 'os';

/**
 * PathResolver centralizes all path-finding logic for SuperClaude-Enterprise
 * Handles SuperClaude detection, Python executable discovery, and virtual environment resolution
 */
export class PathResolver {
  private static instance: PathResolver;
  private cachedPaths: Map<string, string | null> = new Map();

  private constructor() {}

  static getInstance(): PathResolver {
    if (!PathResolver.instance) {
      PathResolver.instance = new PathResolver();
    }
    return PathResolver.instance;
  }

  /**
   * Find SuperClaude installation path
   * Checks multiple locations in order of preference
   */
  findSuperClaude(): string | null {
    const cacheKey = 'superclaude';
    if (this.cachedPaths.has(cacheKey)) {
      return this.cachedPaths.get(cacheKey)!;
    }

    const possiblePaths = [
      // 1. Local installation within project
      path.join(process.cwd(), 'SuperClaude'),
      path.join(process.cwd(), 'superclaude'),
      
      // 2. Parent directory
      path.join(process.cwd(), '..', 'SuperClaude'),
      path.join(process.cwd(), '..', 'superclaude'),
      
      // 3. User's home directory
      path.join(process.env.HOME || '', 'SuperClaude'),
      path.join(process.env.HOME || '', '.SuperClaude'),
      
      // 4. Global installation paths
      '/usr/local/lib/SuperClaude',
      '/opt/SuperClaude',
      
      // 5. Check if SuperClaude command is available in PATH
      this.findInPath('SuperClaude')
    ].filter(Boolean);

    for (const possiblePath of possiblePaths) {
      if (this.isValidSuperClaudePath(possiblePath as string)) {
        this.cachedPaths.set(cacheKey, possiblePath);
        return possiblePath;
      }
    }

    this.cachedPaths.set(cacheKey, null);
    return null;
  }

  /**
   * Find Python executable, preferring virtual environment
   */
  findPythonExecutable(): string {
    const cacheKey = 'python';
    if (this.cachedPaths.has(cacheKey)) {
      return this.cachedPaths.get(cacheKey)!;
    }

    // Check environment variable first (highest priority)
    if (process.env.SUPERCLAUDE_PYTHON) {
      if (this.isPythonWithSuperClaude(process.env.SUPERCLAUDE_PYTHON)) {
        this.cachedPaths.set(cacheKey, process.env.SUPERCLAUDE_PYTHON);
        return process.env.SUPERCLAUDE_PYTHON;
      }
    }

    const superclaudePath = this.findSuperClaude();
    const baseDir = superclaudePath ? path.dirname(superclaudePath) : process.cwd();

    // Check for virtual environment first
    const venvPython = this.findVirtualEnvPython(baseDir);
    if (venvPython && this.isPythonWithSuperClaude(venvPython)) {
      this.cachedPaths.set(cacheKey, venvPython);
      return venvPython;
    }

    // Fall back to system Python with SuperClaude
    const systemPython = this.findSystemPythonWithSuperClaude();
    this.cachedPaths.set(cacheKey, systemPython);
    return systemPython;
  }

  /**
   * Find Python in virtual environment
   */
  private findVirtualEnvPython(baseDir: string): string | null {
    const venvPaths = [
      path.join(baseDir, 'venv', 'bin', 'python3'),
      path.join(baseDir, 'venv', 'bin', 'python'),
      path.join(baseDir, '.venv', 'bin', 'python3'),
      path.join(baseDir, '.venv', 'bin', 'python'),
      path.join(baseDir, 'env', 'bin', 'python3'),
      path.join(baseDir, 'env', 'bin', 'python'),
      
      // Windows paths
      path.join(baseDir, 'venv', 'Scripts', 'python.exe'),
      path.join(baseDir, '.venv', 'Scripts', 'python.exe'),
      path.join(baseDir, 'env', 'Scripts', 'python.exe')
    ];

    for (const venvPath of venvPaths) {
      if (fs.existsSync(venvPath)) {
        try {
          execSync(`"${venvPath}" --version`, { stdio: 'ignore' });
          return venvPath;
        } catch {
          // Python executable not working, continue
        }
      }
    }

    return null;
  }

  /**
   * Find system Python executable
   */
  private findSystemPython(): string {
    const pythonCommands = ['python3', 'python', 'python3.9', 'python3.10', 'python3.11', 'python3.12'];
    
    for (const cmd of pythonCommands) {
      try {
        execSync(`${cmd} --version`, { stdio: 'ignore' });
        return cmd;
      } catch {
        // Continue to next option
      }
    }

    // Default fallback
    return 'python3';
  }

  /**
   * Find system Python with SuperClaude installed
   */
  private findSystemPythonWithSuperClaude(): string {
    const pythonCommands = ['python3', 'python', 'python3.9', 'python3.10', 'python3.11', 'python3.12'];
    
    for (const cmd of pythonCommands) {
      if (this.isPythonWithSuperClaude(cmd)) {
        return cmd;
      }
    }

    // If no Python has SuperClaude, return the first working Python
    return this.findSystemPython();
  }

  /**
   * Check if a Python executable has SuperClaude installed
   */
  private isPythonWithSuperClaude(pythonPath: string): boolean {
    try {
      execSync(`"${pythonPath}" -c "import SuperClaude"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is a valid SuperClaude installation
   */
  private isValidSuperClaudePath(possiblePath: string): boolean {
    if (!fs.existsSync(possiblePath)) {
      return false;
    }

    // Check for indicators of a valid SuperClaude installation
    const indicators = [
      'setup.py',
      'pyproject.toml',
      'SuperClaude.egg-info',
      'src/SuperClaude',
      '__init__.py'
    ];

    const stats = fs.statSync(possiblePath);
    if (stats.isDirectory()) {
      return indicators.some(indicator => 
        fs.existsSync(path.join(possiblePath, indicator))
      );
    } else if (stats.isFile()) {
      // It might be the SuperClaude executable itself
      return path.basename(possiblePath) === 'SuperClaude';
    }

    return false;
  }

  /**
   * Find command in system PATH
   */
  private findInPath(command: string): string | null {
    try {
      const result = execSync(platform() === 'win32' ? `where ${command}` : `which ${command}`, {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      if (result) {
        // Get the directory containing the command
        return path.dirname(result);
      }
    } catch {
      // Command not found in PATH
    }
    return null;
  }

  /**
   * Get MCP configuration directory
   */
  getMCPConfigDir(): string {
    const configDir = platform() === 'win32'
      ? path.join(process.env.APPDATA || '', 'Claude')
      : path.join(process.env.HOME || '', '.config', 'claude');
    
    return configDir;
  }

  /**
   * Clear cached paths (useful for testing or after installation changes)
   */
  clearCache(): void {
    this.cachedPaths.clear();
  }

  /**
   * Get all resolved paths for debugging
   */
  getResolvedPaths(): Record<string, string | null> {
    return {
      superclaude: this.findSuperClaude(),
      python: this.findPythonExecutable(),
      mcpConfig: this.getMCPConfigDir(),
      virtualEnv: this.findVirtualEnvPython(process.cwd())
    };
  }
}