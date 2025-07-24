import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

export interface DirectoryStructure {
  bootstrap: string[];
  commands: {
    analysis: string[];
    development: string[];
    quality: string[];
    meta: string[];
  };
  flags: {
    planning: string[];
    compression: string[];
    mcp: string[];
    scope: string[];
    personas: string[];
    iteration: string[];
  };
  personas: string[];
  modes: string[];
  orchestrator: string[];
  principles: string[];
  rules: string[];
  mcp: string[];
}

export class DocumentStructureManager {
  private baseDir: string;
  
  // Define the complete directory structure
  private structure = {
    bootstrap: [],
    commands: {
      analysis: [],
      development: [],
      quality: [],
      meta: []
    },
    flags: {
      planning: [],
      compression: [],
      mcp: [],
      scope: [],
      personas: [],
      iteration: []
    },
    personas: [],
    modes: [],
    orchestrator: [],
    principles: [],
    rules: [],
    mcp: []
  };

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async createStructure(): Promise<void> {
    try {
      // Create root directories
      const rootDirs = ['bootstrap', 'commands', 'flags', 'personas', 'modes', 
                       'orchestrator', 'principles', 'rules', 'mcp'];
      
      for (const dir of rootDirs) {
        await fs.mkdir(path.join(this.baseDir, dir), { recursive: true });
      }

      // Create command subdirectories
      const commandSubdirs = ['analysis', 'development', 'quality', 'meta'];
      for (const subdir of commandSubdirs) {
        await fs.mkdir(path.join(this.baseDir, 'commands', subdir), { recursive: true });
      }

      // Create flag subdirectories
      const flagSubdirs = ['planning', 'compression', 'mcp', 'scope', 'personas', 'iteration'];
      for (const subdir of flagSubdirs) {
        await fs.mkdir(path.join(this.baseDir, 'flags', subdir), { recursive: true });
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create directory structure: ${error.message}`);
      }
      throw error;
    }
  }

  async validateStructure(): Promise<boolean> {
    try {
      // Check root directories
      const rootDirs = ['bootstrap', 'commands', 'flags', 'personas', 'modes', 
                       'orchestrator', 'principles', 'rules', 'mcp'];
      
      for (const dir of rootDirs) {
        const dirPath = path.join(this.baseDir, dir);
        if (!existsSync(dirPath)) {
          return false;
        }
      }

      // Check command subdirectories
      const commandSubdirs = ['analysis', 'development', 'quality', 'meta'];
      for (const subdir of commandSubdirs) {
        const dirPath = path.join(this.baseDir, 'commands', subdir);
        if (!existsSync(dirPath)) {
          return false;
        }
      }

      // Check flag subdirectories
      const flagSubdirs = ['planning', 'compression', 'mcp', 'scope', 'personas', 'iteration'];
      for (const subdir of flagSubdirs) {
        const dirPath = path.join(this.baseDir, 'flags', subdir);
        if (!existsSync(dirPath)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  getDocumentPath(type: string, category?: string, name?: string): string {
    const validTypes = ['bootstrap', 'commands', 'flags', 'personas', 'modes', 
                       'orchestrator', 'principles', 'rules', 'mcp'];
    
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    if (type === 'commands' || type === 'flags') {
      if (!category || !name) {
        throw new Error(`Category and name required for ${type} documents`);
      }
      return path.join(this.baseDir, type, category, name);
    }

    if (!name) {
      throw new Error(`Name required for ${type} documents`);
    }

    return path.join(this.baseDir, type, name);
  }

  async getAllPaths(type: string): Promise<string[]> {
    const validTypes = ['bootstrap', 'commands', 'flags', 'personas', 'modes', 
                       'orchestrator', 'principles', 'rules', 'mcp'];
    
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    const basePath = path.join(this.baseDir, type);
    const files: string[] = [];

    async function walkDir(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    }

    await walkDir(basePath);
    return files.sort();
  }
}