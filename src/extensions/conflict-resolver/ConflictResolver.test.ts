import { jest } from '@jest/globals';
import { ConflictResolver } from './ConflictResolver.js';
import { ConflictType, ResolutionStrategy } from './types.js';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    resolver = new ConflictResolver(mockLogger);
  });

  describe('Basic Resolution', () => {
    it('should return unchanged context for single persona', async () => {
      const result = await resolver.resolve(
        '/sc:analyze',
        [{ name: 'security' }],
        { command: '/sc:analyze' }
      );

      expect(result.personas).toHaveLength(1);
      expect(result.personas![0].name).toBe('security');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle empty personas array', async () => {
      const result = await resolver.resolve(
        '/sc:analyze',
        [],
        { command: '/sc:analyze' }
      );

      expect(result.personas).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Priority-based Resolution', () => {
    it('should resolve security vs performance conflict', async () => {
      const personas = [
        { name: 'security' },
        { name: 'performance' }
      ];

      const result = await resolver.resolve(
        '/sc:analyze',
        personas,
        { command: '/sc:analyze' }
      );

      // Security should have priority
      expect(result.personas![0].name).toBe('security');
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should handle architect vs frontend conflict', async () => {
      const personas = [
        { name: 'frontend' },
        { name: 'architect' }
      ];

      const result = await resolver.resolve(
        '/sc:design',
        personas,
        { command: '/sc:design' }
      );

      // Architect should have priority
      expect(result.personas![0].name).toBe('architect');
    });
  });

  describe('Veto Conditions', () => {
    it('should apply security veto on unsafe operations', async () => {
      const personas = [
        { name: 'security' },
        { name: 'performance' }
      ];

      const context = {
        command: '/sc:deploy --skip-validation',
        flags: { skipValidation: true }
      };

      const result = await resolver.resolve(
        context.command,
        personas,
        context
      );

      // Debug output
      console.log('Conflicts found:', result.conflicts);
      console.log('Strategy selected:', result.strategy);

      expect(result.strategy).toBe(ResolutionStrategy.VETO_OVERRIDE);
      expect(result.personas).toHaveLength(1);
      expect(result.personas![0].name).toBe('security');
    });
  });

  describe('Negotiation Scenarios', () => {
    it('should negotiate between similar priority personas', async () => {
      const personas = [
        { name: 'qa' },
        { name: 'performance' }
      ];

      const result = await resolver.resolve(
        '/sc:test',
        personas,
        { command: '/sc:test' }
      );

      // Both should be included as they have similar priorities
      expect(result.personas).toHaveLength(2);
      expect(result.strategy).toBeDefined();
    });
  });

  describe('Resource Conflicts', () => {
    it('should detect resource conflicts', async () => {
      const personas = [
        { name: 'backend' },
        { name: 'frontend' }
      ];

      const context = {
        command: '/sc:implement',
        targetFiles: ['api/auth.js', 'ui/login.js']
      };

      const result = await resolver.resolve(
        context.command,
        personas,
        context
      );

      expect(result.conflicts).toBeDefined();
      const resourceConflicts = result.conflicts.filter(
        c => c.type === ConflictType.RESOURCE
      );
      expect(resourceConflicts.length).toBeGreaterThan(0);
    });
  });

  describe('Context-aware Resolution', () => {
    it('should adjust priorities based on context', async () => {
      const personas = [
        { name: 'security' },
        { name: 'performance' }
      ];

      const prodContext = {
        command: '/sc:deploy',
        environment: 'production'
      };

      const result = await resolver.resolve(
        prodContext.command,
        personas,
        prodContext
      );

      // In production, security should have even higher priority
      expect(result.personas![0].name).toBe('security');
      expect(result.priorityScores).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should fallback to highest priority on error', async () => {
      // Mock an error in conflict detection
      jest.spyOn(resolver as any, 'detectConflicts').mockRejectedValue(
        new Error('Test error')
      );

      const personas = [
        { name: 'frontend' },
        { name: 'security' },
        { name: 'backend' }
      ];

      const result = await resolver.resolve(
        '/sc:analyze',
        personas,
        { command: '/sc:analyze' }
      );

      expect(result.personas).toHaveLength(1);
      expect(result.personas![0].name).toBe('security'); // Highest priority
      expect(result.error).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple simultaneous conflicts', async () => {
      const personas = [
        { name: 'security' },
        { name: 'performance' },
        { name: 'frontend' },
        { name: 'backend' }
      ];

      const context = {
        command: '/sc:implement auth-flow',
        targetFiles: ['api/auth.js', 'ui/login.js'],
        flags: { optimize: true }
      };

      const result = await resolver.resolve(
        context.command,
        personas,
        context
      );

      expect(result.conflicts.length).toBeGreaterThan(1);
      expect(result.personas).toBeDefined();
      expect(result.resolutionLog).toBeDefined();
    });

    it('should respect persona negotiation rules', async () => {
      const personas = [
        { name: 'architect' },
        { name: 'security' }
      ];

      const result = await resolver.resolve(
        '/sc:design',
        personas,
        { command: '/sc:design payment-system' }
      );

      // These personas should negotiate, not override
      expect(result.strategy).not.toBe(ResolutionStrategy.PRIORITY_BASED);
      expect(result.personas!.length).toBeGreaterThan(1);
    });
  });
});