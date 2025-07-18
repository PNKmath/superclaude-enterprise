import { Logger } from 'pino';
import { Conflict, ExecutionContext, Persona } from './types.js';

export interface NegotiationResult {
  agreedPersonas: Persona[];
  explanation: string;
  compromises: any[];
  satisfactionScores: Record<string, number>;
}

export class NegotiationEngine {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async negotiate(
    conflicts: Conflict[],
    context: ExecutionContext,
    contextWeights: Map<string, number>
  ): Promise<NegotiationResult> {
    this.logger.info({ conflicts }, 'Starting negotiation');

    // Extract all personas involved in negotiation
    const involvedPersonas = new Set<string>();
    conflicts.forEach(conflict => {
      conflict.personas.forEach(p => involvedPersonas.add(p));
    });

    // Build negotiation proposals
    const proposals = await this.buildProposals(
      Array.from(involvedPersonas),
      context,
      contextWeights
    );

    // Find consensus
    const consensus = await this.findConsensus(proposals, conflicts);

    // Calculate satisfaction scores
    const satisfactionScores = this.calculateSatisfaction(
      consensus,
      Array.from(involvedPersonas)
    );

    return {
      agreedPersonas: consensus.personas,
      explanation: consensus.explanation,
      compromises: consensus.compromises,
      satisfactionScores
    };
  }

  private async buildProposals(
    personas: string[],
    context: ExecutionContext,
    weights: Map<string, number>
  ): Promise<Map<string, any>> {
    const proposals = new Map();

    for (const persona of personas) {
      const weight = weights.get(persona) || 1.0;
      const proposal = {
        persona,
        weight,
        requirements: this.getPersonaRequirements(persona, context),
        flexibility: this.getFlexibilityScore(persona)
      };
      proposals.set(persona, proposal);
    }

    return proposals;
  }

  private async findConsensus(
    proposals: Map<string, any>,
    conflicts: Conflict[]
  ): Promise<any> {
    // Start with all personas
    const allPersonas = Array.from(proposals.keys()).map(name => ({ name }));

    // Apply compromise strategies
    const compromises: any[] = [];

    // Strategy 1: Time-based sequencing
    if (this.canUseTimeSequencing(conflicts)) {
      compromises.push({
        type: 'time_sequence',
        description: 'Execute persona actions in sequence',
        order: this.determineSequence(proposals)
      });
    }

    // Strategy 2: Feature splitting
    if (this.canUseFeatureSplitting(conflicts)) {
      compromises.push({
        type: 'feature_split',
        description: 'Split responsibilities by feature area',
        assignments: this.splitFeatures(proposals)
      });
    }

    // Strategy 3: Conditional execution
    if (this.canUseConditionalExecution(conflicts)) {
      compromises.push({
        type: 'conditional',
        description: 'Apply different personas based on conditions',
        conditions: this.defineConditions(proposals)
      });
    }

    return {
      personas: allPersonas,
      explanation: this.generateExplanation(compromises),
      compromises
    };
  }

  private calculateSatisfaction(
    consensus: any,
    personas: string[]
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const persona of personas) {
      // Base satisfaction from being included
      let score = 0.5;

      // Bonus for compromise acceptance
      consensus.compromises.forEach((compromise: any) => {
        if (this.benefitsFromCompromise(persona, compromise)) {
          score += 0.2;
        }
      });

      // Cap at 1.0
      scores[persona] = Math.min(score, 1.0);
    }

    return scores;
  }

  private getPersonaRequirements(persona: string, _context: ExecutionContext): any {
    // Define what each persona needs from the execution
    const requirements: Record<string, any> = {
      security: {
        validation: true,
        authentication: true,
        encryption: true
      },
      performance: {
        optimization: true,
        caching: true,
        minimal_overhead: true
      },
      frontend: {
        user_experience: true,
        responsiveness: true,
        accessibility: true
      },
      backend: {
        data_integrity: true,
        scalability: true,
        api_design: true
      },
      architect: {
        patterns: true,
        maintainability: true,
        documentation: true
      }
    };

    return requirements[persona] || {};
  }

  private getFlexibilityScore(persona: string): number {
    // How flexible each persona is in negotiations
    const flexibility: Record<string, number> = {
      mentor: 0.9,
      scribe: 0.9,
      analyzer: 0.8,
      refactorer: 0.7,
      devops: 0.6,
      frontend: 0.6,
      backend: 0.6,
      performance: 0.5,
      qa: 0.4,
      architect: 0.3,
      security: 0.1 // Least flexible
    };

    return flexibility[persona] || 0.5;
  }

  private canUseTimeSequencing(conflicts: Conflict[]): boolean {
    return conflicts.some(c => c.type === 'resource');
  }

  private canUseFeatureSplitting(conflicts: Conflict[]): boolean {
    return conflicts.some(c => c.type === 'goal' && c.goals);
  }

  private canUseConditionalExecution(conflicts: Conflict[]): boolean {
    return conflicts.length > 2;
  }

  private determineSequence(proposals: Map<string, any>): string[] {
    // Order by weight and flexibility
    return Array.from(proposals.entries())
      .sort((a, b) => {
        const scoreA = a[1].weight * (1 - a[1].flexibility);
        const scoreB = b[1].weight * (1 - b[1].flexibility);
        return scoreB - scoreA;
      })
      .map(([persona]) => persona);
  }

  private splitFeatures(_proposals: Map<string, any>): Record<string, string[]> {
    // Assign feature areas to personas
    return {
      security: ['authentication', 'authorization', 'encryption'],
      frontend: ['ui_components', 'user_interaction', 'styling'],
      backend: ['api_endpoints', 'data_processing', 'database'],
      performance: ['optimization', 'caching', 'monitoring']
    };
  }

  private defineConditions(_proposals: Map<string, any>): any[] {
    return [
      {
        condition: 'if (environment === "production")',
        persona: 'security',
        priority: 'highest'
      },
      {
        condition: 'if (userCount > 1000)',
        persona: 'performance',
        priority: 'high'
      },
      {
        condition: 'if (feature === "user_facing")',
        persona: 'frontend',
        priority: 'high'
      }
    ];
  }

  private benefitsFromCompromise(persona: string, compromise: any): boolean {
    // Check if persona benefits from the compromise
    if (compromise.type === 'time_sequence') {
      const order = compromise.order as string[];
      return order.indexOf(persona) < order.length / 2; // Benefits if in first half
    }

    if (compromise.type === 'feature_split') {
      return compromise.assignments[persona]?.length > 0;
    }

    if (compromise.type === 'conditional') {
      return compromise.conditions.some((c: any) => c.persona === persona);
    }

    return false;
  }

  private generateExplanation(compromises: any[]): string {
    const explanations = compromises.map(c => {
      switch (c.type) {
        case 'time_sequence':
          return `Actions will be executed in sequence: ${c.order.join(' → ')}`;
        case 'feature_split':
          return 'Responsibilities divided by feature area';
        case 'conditional':
          return 'Personas applied conditionally based on context';
        default:
          return 'Custom compromise applied';
      }
    });

    return explanations.join('. ');
  }
}