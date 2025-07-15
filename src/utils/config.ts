import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Config } from '../types/config';

const DEFAULT_CONFIG: Config = {
  version: '1.0.0',
  
  conflict_resolver: {
    enabled: true,
    default_strategy: 'priority_based',
    negotiation_timeout: '100ms'
  },
  
  gemini: {
    enabled: true,
    autoRouting: true,
    costThreshold: 0.10,
    quotaManagement: {
      dailyLimit: 1000,
      rateLimit: '60/min'
    }
  },
  
  execution_levels: {
    default: 2,
    production_override: 3,
    auto_determine: true
  },
  
  hooks: {
    batch_size: 10,
    debounce_time: '2000ms',
    cache_ttl: '3600s'
  },
  
  learning: {
    enabled: true,
    privacy_mode: 'strict',
    retention_days: 90
  },
  
  security: {
    audit_all: true,
    encryption: 'aes-256-gcm',
    sso_provider: 'oauth2'
  }
};

export async function loadConfig(): Promise<Config> {
  const configPaths = [
    path.join(process.env.HOME || '', '.claude/enterprise/config/config.yaml'),
    path.join(process.cwd(), 'config/enterprise.yaml'),
    path.join(process.cwd(), 'config/default.yaml')
  ];
  
  for (const configPath of configPaths) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = yaml.load(content) as any;
      return mergeConfigs(DEFAULT_CONFIG, config.enterprise || config);
    } catch {
      // Try next path
    }
  }
  
  // Return default config if no file found
  return DEFAULT_CONFIG;
}

function mergeConfigs(base: Config, override: Partial<Config>): Config {
  const merged = { ...base };
  
  for (const key in override) {
    const k = key as keyof Config;
    if (override[k] !== undefined) {
      if (typeof override[k] === 'object' && !Array.isArray(override[k])) {
        merged[k] = { ...base[k] as any, ...override[k] as any };
      } else {
        merged[k] = override[k] as any;
      }
    }
  }
  
  return merged;
}