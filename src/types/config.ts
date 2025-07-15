export interface Config {
  version: string;
  
  conflict_resolver: {
    enabled: boolean;
    default_strategy: string;
    negotiation_timeout: string;
  };
  
  gemini: {
    enabled: boolean;
    autoRouting: boolean;
    costThreshold: number;
    quotaManagement: {
      dailyLimit: number;
      rateLimit: string;
    };
  };
  
  execution_levels: {
    default: number;
    production_override: number;
    auto_determine: boolean;
  };
  
  hooks: {
    batch_size: number;
    debounce_time: string;
    cache_ttl: string;
  };
  
  learning: {
    enabled: boolean;
    privacy_mode: string;
    retention_days: number;
  };
  
  security: {
    audit_all: boolean;
    encryption: string;
    sso_provider: string;
  };
}