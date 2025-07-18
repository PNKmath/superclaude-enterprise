import { Logger } from 'pino';
import { 
  Persona, 
  ExecutionContext, 
  Conflict, 
  ResolvedContext,
  ResolutionStrategy,
  ConflictType 
} from './types.js';
import { PriorityMatrix } from './PriorityMatrix.js';
import { NegotiationEngine } from './NegotiationEngine.js';
import { ContextAnalyzer } from './ContextAnalyzer.js';
import { ConflictLogger } from './ConflictLogger.js';

export class ConflictResolver {
  private priorityMatrix: PriorityMatrix;
  private negotiationEngine: NegotiationEngine;
  private contextAnalyzer: ContextAnalyzer;
  private conflictLogger: ConflictLogger;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.priorityMatrix = new PriorityMatrix();
    this.negotiationEngine = new NegotiationEngine(logger);
    this.contextAnalyzer = new ContextAnalyzer();
    this.conflictLogger = new ConflictLogger();
  }

  async resolve(
    command: string,
    personas: Persona[],
    context: ExecutionContext
  ): Promise<ResolvedContext> {
    const startTime = Date.now();
    
    try {
      // Single persona - no conflict
      if (personas.length <= 1) {
        return {
          ...context,
          personas,
          conflicts: [],
          resolutionTime: 0
        };
      }

      // Step 1: Detect conflicts
      const conflicts = await this.detectConflicts(personas, command, context);
      
      if (!conflicts.length) {
        return {
          ...context,
          personas,
          conflicts: [],
          resolutionTime: Date.now() - startTime
        };
      }

      this.logger.info({ conflicts }, 'Conflicts detected');

      // Step 2: Analyze context for weights
      const contextWeights = await this.contextAnalyzer.analyze(context);

      // Step 3: Select and apply resolution strategy
      const strategy = this.selectStrategy(conflicts, contextWeights);
      const resolution = await this.applyStrategy(strategy, conflicts, context, contextWeights);

      // Step 4: Log for learning
      await this.conflictLogger.log({
        command,
        conflicts,
        resolution,
        strategy,
        timestamp: Date.now(),
        resolutionTime: Date.now() - startTime
      });

      return {
        ...resolution,
        resolutionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error({ error }, 'Conflict resolution failed');
      
      // Fallback to highest priority persona
      const highestPriority = this.getHighestPriorityPersona(personas);
      const conflicts: Conflict[] = [];
      return {
        ...context,
        personas: [highestPriority],
        conflicts,
        error: (error as Error).message,
        resolutionTime: Date.now() - startTime
      };
    }
  }

  private async detectConflicts(
    personas: Persona[],
    command: string,
    context: ExecutionContext
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check pairwise conflicts
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const conflict = await this.checkConflict(
          personas[i],
          personas[j],
          command,
          context
        );
        
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    // Check resource conflicts
    const resourceConflicts = await this.checkResourceConflicts(personas, context);
    conflicts.push(...resourceConflicts);

    // Check goal conflicts
    const goalConflicts = await this.checkGoalConflicts(personas, command);
    conflicts.push(...goalConflicts);

    return conflicts;
  }

  private async checkConflict(
    persona1: Persona,
    persona2: Persona,
    command: string,
    context: ExecutionContext
  ): Promise<Conflict | null> {
    // Check if personas have conflicting approaches
    // const p1Priority = this.priorityMatrix.getPriority(persona1.name);
    // const p2Priority = this.priorityMatrix.getPriority(persona2.name);

    // Check for veto conditions FIRST (highest priority)
    if (this.hasVetoCondition(persona1, command, context)) {
      return {
        type: ConflictType.VETO,
        personas: [persona1.name, persona2.name],
        severity: 'critical',
        description: `${persona1.name} vetoes operation`,
        resolution: {
          winner: persona1.name,
          strategy: 'veto_override'
        }
      };
    }
    
    if (this.hasVetoCondition(persona2, command, context)) {
      return {
        type: ConflictType.VETO,
        personas: [persona1.name, persona2.name],
        severity: 'critical',
        description: `${persona2.name} vetoes operation`,
        resolution: {
          winner: persona2.name,
          strategy: 'veto_override'
        }
      };
    }

    // Check for direct override relationships
    if (this.priorityMatrix.canOverride(persona1.name, persona2.name)) {
      return {
        type: ConflictType.DIRECT,
        personas: [persona1.name, persona2.name],
        severity: 'high',
        description: `${persona1.name} overrides ${persona2.name}`,
        resolution: {
          winner: persona1.name,
          strategy: 'priority_override'
        }
      };
    } else if (this.priorityMatrix.canOverride(persona2.name, persona1.name)) {
      return {
        type: ConflictType.DIRECT,
        personas: [persona1.name, persona2.name],
        severity: 'high',
        description: `${persona2.name} overrides ${persona1.name}`,
        resolution: {
          winner: persona2.name,
          strategy: 'priority_override'
        }
      };
    }

    // Check for negotiation needs
    if (this.priorityMatrix.needsNegotiation(persona1.name, persona2.name)) {
      return {
        type: ConflictType.NEGOTIABLE,
        personas: [persona1.name, persona2.name],
        severity: 'medium',
        description: `${persona1.name} and ${persona2.name} need negotiation`,
        resolution: undefined // Will be resolved through negotiation
      };
    }

    return null;
  }

  private async checkResourceConflicts(
    personas: Persona[],
    context: ExecutionContext
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    
    // Group personas by target resources
    const resourceMap = new Map<string, Persona[]>();
    
    for (const persona of personas) {
      const resources = this.getTargetResources(persona, context);
      for (const resource of resources) {
        if (!resourceMap.has(resource)) {
          resourceMap.set(resource, []);
        }
        resourceMap.get(resource)!.push(persona);
      }
    }

    // Check for resource conflicts
    for (const [resource, competingPersonas] of resourceMap) {
      if (competingPersonas.length > 1) {
        conflicts.push({
          type: ConflictType.RESOURCE,
          personas: competingPersonas.map(p => p.name),
          severity: 'medium',
          description: `Multiple personas targeting ${resource}`,
          resource
        });
      }
    }

    return conflicts;
  }

  private async checkGoalConflicts(
    personas: Persona[],
    command: string
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const goals = new Map<string, string>();

    // Extract goals for each persona
    for (const persona of personas) {
      const goal = this.getPersonaGoal(persona, command);
      goals.set(persona.name, goal);
    }

    // Check for conflicting goals
    const personaNames = Array.from(goals.keys());
    for (let i = 0; i < personaNames.length; i++) {
      for (let j = i + 1; j < personaNames.length; j++) {
        const goal1 = goals.get(personaNames[i])!;
        const goal2 = goals.get(personaNames[j])!;
        
        if (this.areGoalsConflicting(goal1, goal2)) {
          conflicts.push({
            type: ConflictType.GOAL,
            personas: [personaNames[i], personaNames[j]],
            severity: 'low',
            description: `Conflicting goals: ${goal1} vs ${goal2}`,
            goals: { [personaNames[i]]: goal1, [personaNames[j]]: goal2 }
          });
        }
      }
    }

    return conflicts;
  }

  private selectStrategy(
    conflicts: Conflict[],
    _contextWeights: Map<string, number>
  ): ResolutionStrategy {
    // Check for veto conflicts first
    if (conflicts.some(c => c.type === ConflictType.VETO)) {
      return ResolutionStrategy.VETO_OVERRIDE;
    }

    // Check for clear priority differences
    const priorityDiffs = this.calculatePriorityDifferences(conflicts);
    if (Math.max(...priorityDiffs) > 3) {
      return ResolutionStrategy.PRIORITY_BASED;
    }

    // Check if negotiation is needed
    if (conflicts.some(c => c.type === ConflictType.NEGOTIABLE)) {
      return ResolutionStrategy.NEGOTIATION;
    }

    // Resource conflicts use sequential access
    if (conflicts.every(c => c.type === ConflictType.RESOURCE)) {
      return ResolutionStrategy.SEQUENTIAL_ACCESS;
    }

    // Default to weighted consensus
    return ResolutionStrategy.WEIGHTED_CONSENSUS;
  }

  private async applyStrategy(
    strategy: ResolutionStrategy,
    conflicts: Conflict[],
    context: ExecutionContext,
    contextWeights: Map<string, number>
  ): Promise<ResolvedContext> {
    switch (strategy) {
      case ResolutionStrategy.VETO_OVERRIDE:
        return this.applyVetoOverride(conflicts, context);
        
      case ResolutionStrategy.PRIORITY_BASED:
        return this.applyPriorityBased(conflicts, contextWeights);
        
      case ResolutionStrategy.NEGOTIATION:
        return this.applyNegotiation(conflicts, context, contextWeights);
        
      case ResolutionStrategy.SEQUENTIAL_ACCESS:
        return this.applySequentialAccess(conflicts, context);
        
      case ResolutionStrategy.WEIGHTED_CONSENSUS:
        return this.applyWeightedConsensus(conflicts, contextWeights);
        
      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  private async applyVetoOverride(
    conflicts: Conflict[],
    _context: ExecutionContext
  ): Promise<ResolvedContext> {
    const vetoConflict = conflicts.find(c => c.type === ConflictType.VETO);
    if (!vetoConflict) {
      throw new Error('No veto conflict found');
    }

    const vetoingPersona = vetoConflict.resolution!.winner;
    
    return {
      ..._context,
      personas: [{ name: vetoingPersona }],
      conflicts,
      resolutionLog: `${vetoingPersona} exercised veto power`,
      strategy: ResolutionStrategy.VETO_OVERRIDE
    };
  }

  private async applyPriorityBased(
    conflicts: Conflict[],
    contextWeights: Map<string, number>
  ): Promise<ResolvedContext> {
    // Get all unique personas from conflicts
    const allPersonas = new Set<string>();
    conflicts.forEach(c => c.personas.forEach(p => allPersonas.add(p)));

    // Calculate weighted priorities
    const weightedPriorities = new Map<string, number>();
    for (const persona of allPersonas) {
      const basePriority = this.priorityMatrix.getPriority(persona);
      const contextWeight = contextWeights.get(persona) || 1.0;
      weightedPriorities.set(persona, basePriority * contextWeight);
    }

    // Sort by weighted priority
    const sortedPersonas = Array.from(weightedPriorities.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => ({ name }));

    return {
      command: '', // Will be overridden by spread
      personas: sortedPersonas,
      conflicts,
      resolutionLog: 'Resolved by priority ranking',
      strategy: ResolutionStrategy.PRIORITY_BASED,
      priorityScores: Object.fromEntries(weightedPriorities)
    };
  }

  private async applyNegotiation(
    conflicts: Conflict[],
    context: ExecutionContext,
    contextWeights: Map<string, number>
  ): Promise<ResolvedContext> {
    const negotiableConflicts = conflicts.filter(
      c => c.type === ConflictType.NEGOTIABLE
    );

    const negotiationResult = await this.negotiationEngine.negotiate(
      negotiableConflicts,
      context,
      contextWeights
    );

    return {
      ...context,
      personas: negotiationResult.agreedPersonas,
      conflicts,
      resolutionLog: negotiationResult.explanation,
      strategy: ResolutionStrategy.NEGOTIATION,
      negotiationDetails: negotiationResult
    };
  }

  private async applySequentialAccess(
    conflicts: Conflict[],
    _context: ExecutionContext
  ): Promise<ResolvedContext> {
    // Group by resource
    const resourceGroups = new Map<string, string[]>();
    
    conflicts
      .filter(c => c.type === ConflictType.RESOURCE)
      .forEach(c => {
        if (c.resource) {
          resourceGroups.set(c.resource, c.personas);
        }
      });

    // Order personas by priority for each resource
    const accessOrder = new Map<string, string[]>();
    for (const [resource, personas] of resourceGroups) {
      const ordered = this.orderByPriority(personas);
      accessOrder.set(resource, ordered);
    }

    return {
      command: '', // Will be overridden if needed
      personas: this.getAllUniquePersonas(conflicts),
      conflicts,
      resolutionLog: 'Sequential access granted by priority',
      strategy: ResolutionStrategy.SEQUENTIAL_ACCESS,
      accessOrder: Object.fromEntries(accessOrder)
    };
  }

  private async applyWeightedConsensus(
    conflicts: Conflict[],
    contextWeights: Map<string, number>
  ): Promise<ResolvedContext> {
    const allPersonas = this.getAllUniquePersonas(conflicts);
    
    // Calculate consensus weights
    const consensusWeights = new Map<string, number>();
    for (const persona of allPersonas) {
      const priority = this.priorityMatrix.getPriority(persona.name);
      const contextWeight = contextWeights.get(persona.name) || 1.0;
      const conflictPenalty = this.getConflictPenalty(persona.name, conflicts);
      
      consensusWeights.set(
        persona.name,
        (priority * contextWeight) - conflictPenalty
      );
    }

    // Filter personas above threshold
    const threshold = this.calculateConsensusThreshold(consensusWeights);
    const consensusPersonas = allPersonas.filter(
      p => consensusWeights.get(p.name)! >= threshold
    );

    return {
      command: '', // Will be overridden if needed
      personas: consensusPersonas,
      conflicts,
      resolutionLog: 'Weighted consensus reached',
      strategy: ResolutionStrategy.WEIGHTED_CONSENSUS,
      consensusWeights: Object.fromEntries(consensusWeights),
      priorityScores: Object.fromEntries(consensusWeights)
    };
  }

  // Helper methods
  private hasVetoCondition(
    persona: Persona,
    command: string,
    context: ExecutionContext
  ): boolean {
    const vetoConditions = this.priorityMatrix.getVetoConditions(persona.name);
    
    for (const condition of vetoConditions) {
      if (this.matchesCondition(condition, command, context)) {
        return true;
      }
    }
    
    return false;
  }

  private getTargetResources(
    persona: Persona,
    context: ExecutionContext
  ): string[] {
    // Extract resources that this persona would modify
    const resources: string[] = [];
    
    if (context.targetFiles) {
      resources.push(...context.targetFiles);
    }
    
    // Add persona-specific resources
    switch (persona.name) {
      case 'backend':
        resources.push('api/', 'server/');
        break;
      case 'frontend':
        resources.push('ui/', 'components/');
        break;
      case 'devops':
        resources.push('.github/', 'deploy/');
        break;
    }
    
    return resources;
  }

  private getPersonaGoal(persona: Persona, command: string): string {
    // Define goals for each persona based on command
    const goalMap: Record<string, Record<string, string>> = {
      security: {
        default: 'maximize_security',
        analyze: 'identify_vulnerabilities',
        implement: 'enforce_secure_patterns'
      },
      performance: {
        default: 'optimize_speed',
        analyze: 'identify_bottlenecks',
        implement: 'reduce_latency'
      },
      frontend: {
        default: 'enhance_user_experience',
        design: 'create_intuitive_interface',
        implement: 'ensure_responsiveness'
      }
    };

    const personaGoals = goalMap[persona.name] || {};
    const commandType = command.split(':')[1]?.split(' ')[0] || 'default';
    
    return personaGoals[commandType] || personaGoals.default || 'unknown';
  }

  private areGoalsConflicting(goal1: string, goal2: string): boolean {
    const conflictingGoals: Array<[string, string]> = [
      ['maximize_security', 'optimize_speed'],
      ['enforce_secure_patterns', 'enhance_user_experience'],
      ['reduce_latency', 'identify_vulnerabilities']
    ];

    return conflictingGoals.some(
      ([g1, g2]) => 
        (goal1 === g1 && goal2 === g2) || 
        (goal1 === g2 && goal2 === g1)
    );
  }

  private calculatePriorityDifferences(conflicts: Conflict[]): number[] {
    return conflicts.map(conflict => {
      const priorities = conflict.personas.map(
        p => this.priorityMatrix.getPriority(p)
      );
      return Math.max(...priorities) - Math.min(...priorities);
    });
  }

  private getHighestPriorityPersona(personas: Persona[]): Persona {
    return personas.reduce((highest, current) => {
      const highestPriority = this.priorityMatrix.getPriority(highest.name);
      const currentPriority = this.priorityMatrix.getPriority(current.name);
      return currentPriority > highestPriority ? current : highest;
    });
  }

  private orderByPriority(personaNames: string[]): string[] {
    return personaNames.sort(
      (a, b) => 
        this.priorityMatrix.getPriority(b) - 
        this.priorityMatrix.getPriority(a)
    );
  }

  private getAllUniquePersonas(conflicts: Conflict[]): Persona[] {
    const uniqueNames = new Set<string>();
    conflicts.forEach(c => c.personas.forEach(p => uniqueNames.add(p)));
    return Array.from(uniqueNames).map(name => ({ name }));
  }

  private getConflictPenalty(persona: string, conflicts: Conflict[]): number {
    // Penalize personas involved in more conflicts
    const conflictCount = conflicts.filter(
      c => c.personas.includes(persona)
    ).length;
    
    return conflictCount * 0.5;
  }

  private calculateConsensusThreshold(weights: Map<string, number>): number {
    const values = Array.from(weights.values());
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    return average * 0.75; // 75% of average weight
  }

  private matchesCondition(
    condition: string,
    command: string,
    context: ExecutionContext
  ): boolean {
    // Check various veto conditions
    switch (condition) {
      case 'unsafe_operations':
        return command.includes('--skip-validation') || 
               command.includes('--force');
               
      case 'skip_validation':
        return command.includes('--skip-validation') || 
               context.flags?.skipValidation === true;
               
      case 'credential_exposure':
        return context.targetFiles?.some(
          f => f.includes('credentials') || f.includes('secrets')
        ) || false;
        
      case 'production_changes':
        return context.environment === 'production';
        
      default:
        return false;
    }
  }
}