import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import Ajv from 'ajv';

export interface DocumentRegistry {
  version: string;
  lastUpdated: string;
  documents: {
    commands: {
      [category: string]: Array<{
        name: string;
        path: string;
        description: string;
        category: string;
      }>;
    };
    flags: {
      [category: string]: Array<{
        name: string;
        path: string;
        description: string;
        category: string;
        type: 'boolean' | 'string' | 'number';
      }>;
    };
    personas: Array<{
      name: string;
      path: string;
      description: string;
      autoActivationScore: number;
    }>;
    modes: Array<{
      name: string;
      path: string;
      description: string;
    }>;
    orchestrator: {
      [component: string]: {
        name: string;
        path: string;
        description: string;
      };
    };
    principles: {
      [category: string]: {
        name: string;
        path: string;
        description: string;
      };
    };
    rules: {
      [category: string]: {
        name: string;
        path: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
      };
    };
    mcp: {
      [server: string]: {
        name: string;
        path: string;
        description: string;
        capabilities: string[];
      };
    };
  };
  metadata: {
    totalDocuments: number;
    categories: {
      commands: string[];
      flags: string[];
      principles: string[];
      rules: string[];
    };
    indexedAt: string;
  };
}

export class DocumentRegistryManager {
  private registryPath: string;
  private schema: any;
  private ajv: Ajv;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.ajv = new Ajv({ allErrors: true });
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.schema = {
      type: 'object',
      required: ['version', 'lastUpdated', 'documents', 'metadata'],
      properties: {
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        lastUpdated: {
          type: 'string',
          format: 'date-time'
        },
        documents: {
          type: 'object',
          required: ['commands', 'flags', 'personas', 'modes', 'orchestrator', 'principles', 'rules', 'mcp'],
          properties: {
            commands: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'path', 'description', 'category'],
                  properties: {
                    name: { type: 'string' },
                    path: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' }
                  }
                }
              }
            },
            flags: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'path', 'description', 'category', 'type'],
                  properties: {
                    name: { type: 'string' },
                    path: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    type: { 
                      type: 'string',
                      enum: ['boolean', 'string', 'number']
                    }
                  }
                }
              }
            },
            personas: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'path', 'description', 'autoActivationScore'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' },
                  autoActivationScore: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 1
                  }
                }
              }
            },
            modes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'path', 'description'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            orchestrator: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                required: ['name', 'path', 'description'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            principles: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                required: ['name', 'path', 'description'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            rules: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                required: ['name', 'path', 'description', 'priority'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  }
                }
              }
            },
            mcp: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                required: ['name', 'path', 'description', 'capabilities'],
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  description: { type: 'string' },
                  capabilities: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1
                  }
                }
              }
            }
          }
        },
        metadata: {
          type: 'object',
          required: ['totalDocuments', 'categories', 'indexedAt'],
          properties: {
            totalDocuments: { type: 'number' },
            categories: {
              type: 'object',
              required: ['commands', 'flags', 'principles', 'rules'],
              properties: {
                commands: {
                  type: 'array',
                  items: { type: 'string' }
                },
                flags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                principles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                rules: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            indexedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    };
  }

  async loadRegistry(): Promise<DocumentRegistry> {
    if (!existsSync(this.registryPath)) {
      throw new Error(`Registry file not found: ${this.registryPath}`);
    }
    
    const content = await fs.readFile(this.registryPath, 'utf-8');
    const registry = JSON.parse(content);
    
    const validation = await this.validateRegistry(registry);
    if (!validation.valid) {
      throw new Error(`Invalid registry: ${JSON.stringify(validation.errors)}`);
    }
    
    return registry;
  }

  async saveRegistry(registry: DocumentRegistry): Promise<void> {
    const validation = await this.validateRegistry(registry);
    if (!validation.valid) {
      throw new Error(`Invalid registry: ${JSON.stringify(validation.errors)}`);
    }
    
    const dir = path.dirname(this.registryPath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  }

  async validateRegistry(registry: any): Promise<{ valid: boolean; errors?: any[] }> {
    // Add date-time format handler
    this.ajv.addFormat('date-time', {
      validate: (dateTime: string) => {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        return regex.test(dateTime);
      }
    });
    
    const validate = this.ajv.compile(this.schema);
    const valid = validate(registry);
    
    return {
      valid,
      errors: valid ? undefined : validate.errors
    };
  }

  async addDocument(type: string, category: string, document: any): Promise<void> {
    const registry = await this.loadRegistry();
    
    switch (type) {
      case 'commands':
      case 'flags':
        if (!registry.documents[type][category]) {
          registry.documents[type][category] = [];
        }
        registry.documents[type][category].push(document);
        break;
        
      case 'personas':
      case 'modes':
        registry.documents[type].push(document);
        break;
        
      case 'orchestrator':
      case 'principles':
      case 'rules':
      case 'mcp':
        registry.documents[type][category] = document;
        break;
        
      default:
        throw new Error(`Invalid document type: ${type}`);
    }
    
    await this.updateMetadata(registry);
    await this.saveRegistry(registry);
  }

  async removeDocument(type: string, category: string, name: string): Promise<void> {
    const registry = await this.loadRegistry();
    
    switch (type) {
      case 'commands':
      case 'flags':
        if (registry.documents[type][category]) {
          registry.documents[type][category] = 
            registry.documents[type][category].filter(doc => doc.name !== name);
          if (registry.documents[type][category].length === 0) {
            delete registry.documents[type][category];
          }
        }
        break;
        
      case 'personas':
      case 'modes':
        registry.documents[type] = 
          registry.documents[type].filter(doc => doc.name !== name);
        break;
        
      case 'orchestrator':
      case 'principles':
      case 'rules':
      case 'mcp':
        if (registry.documents[type][category]?.name === name) {
          delete registry.documents[type][category];
        }
        break;
    }
    
    await this.updateMetadata(registry);
    await this.saveRegistry(registry);
  }

  async findDocument(type: string, name: string): Promise<any | null> {
    const registry = await this.loadRegistry();
    
    switch (type) {
      case 'commands':
      case 'flags':
        for (const category in registry.documents[type]) {
          const found = registry.documents[type][category].find(doc => doc.name === name);
          if (found) return found;
        }
        break;
        
      case 'personas':
      case 'modes':
        return registry.documents[type].find(doc => doc.name === name) || null;
        
      case 'orchestrator':
      case 'principles':
      case 'rules':
      case 'mcp':
        for (const key in registry.documents[type]) {
          if (registry.documents[type][key].name === name) {
            return registry.documents[type][key];
          }
        }
        break;
    }
    
    return null;
  }

  async updateMetadata(registry?: DocumentRegistry): Promise<void> {
    if (!registry) {
      registry = await this.loadRegistry();
    }
    
    // Count total documents
    let total = 0;
    
    // Commands and flags
    for (const type of ['commands', 'flags'] as const) {
      for (const category in registry.documents[type]) {
        total += registry.documents[type][category].length;
      }
    }
    
    // Personas and modes
    total += registry.documents.personas.length;
    total += registry.documents.modes.length;
    
    // Other types
    for (const type of ['orchestrator', 'principles', 'rules', 'mcp'] as const) {
      total += Object.keys(registry.documents[type]).length;
    }
    
    // Update categories
    registry.metadata.categories.commands = Object.keys(registry.documents.commands);
    registry.metadata.categories.flags = Object.keys(registry.documents.flags);
    registry.metadata.categories.principles = Object.keys(registry.documents.principles);
    registry.metadata.categories.rules = Object.keys(registry.documents.rules);
    
    // Update metadata
    registry.metadata.totalDocuments = total;
    registry.metadata.indexedAt = new Date().toISOString();
    
    await this.saveRegistry(registry);
  }

  generateEmptyRegistry(): DocumentRegistry {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      documents: {
        commands: {},
        flags: {},
        personas: [],
        modes: [],
        orchestrator: {},
        principles: {},
        rules: {},
        mcp: {}
      },
      metadata: {
        totalDocuments: 0,
        categories: {
          commands: [],
          flags: [],
          principles: [],
          rules: []
        },
        indexedAt: new Date().toISOString()
      }
    };
  }
}