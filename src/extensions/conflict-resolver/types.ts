export interface Persona {
  name: string;
  priority?: number;
  active?: boolean;
}

export interface ExecutionContext {
  command: string;
  personas?: Persona[];
  timestamp?: number;
  user?: string;
  environment?: string;
  targetFiles?: string[];
  flags?: Record<string, any>;
  [key: string]: any;
}

export enum ConflictType {
  DIRECT = 'direct',
  RESOURCE = 'resource',
  GOAL = 'goal',
  NEGOTIABLE = 'negotiable',
  VETO = 'veto'
}

export interface Conflict {
  type: ConflictType;
  personas: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resource?: string;
  goals?: Record<string, string>;
  resolution?: {
    winner: string;
    strategy: string;
  };
}

export interface ResolvedContext extends ExecutionContext {
  conflicts: Conflict[];
  resolutionTime?: number;
  resolutionLog?: string;
  strategy?: ResolutionStrategy;
  error?: string;
  priorityScores?: Record<string, number>;
  negotiationDetails?: any;
  accessOrder?: Record<string, string[]>;
  consensusWeights?: Record<string, number>;
  conflictResolution?: any;
}

export enum ResolutionStrategy {
  VETO_OVERRIDE = 'veto_override',
  PRIORITY_BASED = 'priority_based',
  NEGOTIATION = 'negotiation',
  SEQUENTIAL_ACCESS = 'sequential_access',
  WEIGHTED_CONSENSUS = 'weighted_consensus'
}

export interface PersonaPriority {
  priority: number;
  overrides: string[];
  negotiates: string[];
  veto: string[];
}