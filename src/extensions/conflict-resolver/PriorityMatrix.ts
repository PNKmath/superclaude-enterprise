import { PersonaPriority } from './types';

export class PriorityMatrix {
  private matrix: Map<string, PersonaPriority>;

  constructor() {
    this.matrix = new Map();
    this.initializeMatrix();
  }

  private initializeMatrix(): void {
    // Define persona priorities and relationships
    this.matrix.set('security', {
      priority: 10,
      overrides: ['performance', 'frontend'],
      negotiates: ['architect'],
      veto: ['unsafe_operations', 'credential_exposure', 'skip_validation']
    });

    this.matrix.set('architect', {
      priority: 8,
      overrides: ['frontend', 'backend'],
      negotiates: ['security', 'performance'],
      veto: []
    });

    this.matrix.set('performance', {
      priority: 7,
      overrides: [],
      negotiates: ['security', 'qa'],
      veto: []
    });

    this.matrix.set('qa', {
      priority: 7,
      overrides: [],
      negotiates: ['performance', 'devops'],
      veto: ['broken_tests', 'no_coverage']
    });

    this.matrix.set('backend', {
      priority: 6,
      overrides: [],
      negotiates: ['frontend', 'devops'],
      veto: []
    });

    this.matrix.set('frontend', {
      priority: 6,
      overrides: [],
      negotiates: ['backend', 'ux'],
      veto: []
    });

    this.matrix.set('devops', {
      priority: 5,
      overrides: [],
      negotiates: ['backend', 'qa'],
      veto: []
    });

    this.matrix.set('refactorer', {
      priority: 5,
      overrides: [],
      negotiates: ['all'],
      veto: []
    });

    this.matrix.set('analyzer', {
      priority: 4,
      overrides: [],
      negotiates: ['all'],
      veto: []
    });

    this.matrix.set('mentor', {
      priority: 3,
      overrides: [],
      negotiates: ['all'],
      veto: []
    });

    this.matrix.set('scribe', {
      priority: 2,
      overrides: [],
      negotiates: ['all'],
      veto: []
    });
  }

  getPriority(persona: string): number {
    return this.matrix.get(persona)?.priority || 0;
  }

  canOverride(persona1: string, persona2: string): boolean {
    const p1 = this.matrix.get(persona1);
    return p1?.overrides.includes(persona2) || false;
  }

  needsNegotiation(persona1: string, persona2: string): boolean {
    const p1 = this.matrix.get(persona1);
    const p2 = this.matrix.get(persona2);

    return (
      p1?.negotiates.includes(persona2) ||
      p1?.negotiates.includes('all') ||
      p2?.negotiates.includes(persona1) ||
      p2?.negotiates.includes('all') ||
      false
    );
  }

  hasVeto(persona: string, operation: string): boolean {
    const p = this.matrix.get(persona);
    return p?.veto.includes(operation) || false;
  }

  getVetoConditions(persona: string): string[] {
    return this.matrix.get(persona)?.veto || [];
  }

  getAllPersonas(): string[] {
    return Array.from(this.matrix.keys());
  }

  getPersonaInfo(persona: string): PersonaPriority | undefined {
    return this.matrix.get(persona);
  }
}