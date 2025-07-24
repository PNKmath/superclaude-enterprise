import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionManager } from '../../src/utils/session-manager';
import { DocumentSharder } from '../../src/utils/document-sharder';

describe('Session Management', () => {
  const testRoot = path.join(process.cwd(), 'test-session');
  let sessionManager: SessionManager;
  let sharder: DocumentSharder;

  beforeEach(async () => {
    sharder = new DocumentSharder(testRoot);
    sessionManager = new SessionManager(sharder, {
      maxTokens: 15000,
      sessionDurationMinutes: 30
    });
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    vi.clearAllTimers();
  });

  describe('Document Loading Priority', () => {
    it('should load documents according to priority rules', async () => {
      const documents = [
        { id: 'bootstrap', priority: 100, tokens: 500 },
        { id: 'analyze-cmd', priority: 80, tokens: 1000 },
        { id: 'build-cmd', priority: 70, tokens: 1200 },
        { id: 'help-cmd', priority: 20, tokens: 300 }
      ];

      await sessionManager.setPriorityDocuments(documents);
      const loadOrder = await sessionManager.getLoadOrder();
      
      expect(loadOrder[0]).toBe('bootstrap');
      expect(loadOrder[1]).toBe('analyze-cmd');
      expect(loadOrder[2]).toBe('build-cmd');
      expect(loadOrder[3]).toBe('help-cmd');
    });

    it('should update priorities based on usage patterns', async () => {
      await sessionManager.trackUsage('build-cmd');
      await sessionManager.trackUsage('build-cmd');
      await sessionManager.trackUsage('help-cmd');

      const priorities = await sessionManager.getUsageBasedPriorities();
      
      expect(priorities['build-cmd']).toBeGreaterThan(priorities['help-cmd']);
    });

    it('should load frequently used documents first', async () => {
      const usageData = {
        'analyze-cmd': { frequency: 100, lastUsed: new Date() },
        'build-cmd': { frequency: 80, lastUsed: new Date() },
        'test-cmd': { frequency: 120, lastUsed: new Date() }
      };

      await sessionManager.setUsageData(usageData);
      const loadOrder = await sessionManager.getOptimizedLoadOrder();
      
      expect(loadOrder[0]).toBe('test-cmd');
      expect(loadOrder[1]).toBe('analyze-cmd');
      expect(loadOrder[2]).toBe('build-cmd');
    });
  });

  describe('Token Management and Eviction', () => {
    it('should track total token usage', async () => {
      await sessionManager.loadDocument('doc1', 1000);
      await sessionManager.loadDocument('doc2', 2000);
      await sessionManager.loadDocument('doc3', 1500);

      const totalTokens = await sessionManager.getTotalTokens();
      expect(totalTokens).toBe(4500);
    });

    it('should evict documents when approaching token limit', async () => {
      // Set a lower limit for testing
      sessionManager.setMaxTokens(5000);

      await sessionManager.loadDocument('doc1', 2000);
      await sessionManager.loadDocument('doc2', 2000);
      await sessionManager.loadDocument('doc3', 2000); // This should trigger eviction

      const loadedDocs = await sessionManager.getLoadedDocuments();
      expect(loadedDocs).not.toContain('doc1'); // Oldest should be evicted
      expect(loadedDocs).toContain('doc2');
      expect(loadedDocs).toContain('doc3');
    });

    it('should implement LRU eviction strategy', async () => {
      sessionManager.setMaxTokens(4000);

      await sessionManager.loadDocument('doc1', 1000);
      await sessionManager.loadDocument('doc2', 1000);
      await sessionManager.loadDocument('doc3', 1000);
      
      // Access doc1 to make it recently used
      await sessionManager.accessDocument('doc1');
      
      // Load doc4 should evict doc2 (least recently used)
      await sessionManager.loadDocument('doc4', 1500);

      const loadedDocs = await sessionManager.getLoadedDocuments();
      
      expect(loadedDocs).toContain('doc1');
      expect(loadedDocs).not.toContain('doc2');
      expect(loadedDocs).toContain('doc3');
      expect(loadedDocs).toContain('doc4');
    });

    it('should prevent eviction of essential documents', async () => {
      sessionManager.setMaxTokens(3000);

      await sessionManager.loadDocument('bootstrap', 500, { essential: true });
      await sessionManager.loadDocument('doc1', 1000);
      await sessionManager.loadDocument('doc2', 1000);
      await sessionManager.loadDocument('doc3', 1000); // Should evict doc1, not bootstrap

      const loadedDocs = await sessionManager.getLoadedDocuments();
      expect(loadedDocs).toContain('bootstrap');
      expect(loadedDocs).not.toContain('doc1');
    });
  });

  describe('30-Minute Session Constraints', () => {
    it('should respect session time limits', async () => {
      vi.useFakeTimers();
      
      const startTime = await sessionManager.getSessionStartTime();
      
      // Advance time by 25 minutes
      vi.advanceTimersByTime(25 * 60 * 1000);
      
      expect(await sessionManager.isSessionActive()).toBe(true);
      
      // Advance time to 31 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      expect(await sessionManager.isSessionActive()).toBe(false);
    });

    it('should save session state before expiration', async () => {
      vi.useFakeTimers();
      
      await sessionManager.loadDocument('doc1', 1000);
      await sessionManager.loadDocument('doc2', 2000);
      
      // Advance time to trigger save (28 minutes)
      vi.advanceTimersByTime(28 * 60 * 1000);
      
      const savedState = await sessionManager.getSavedSessionState();
      expect(savedState.documents).toContain('doc1');
      expect(savedState.documents).toContain('doc2');
      expect(savedState.timestamp).toBeDefined();
    });

    it('should restore session state on new session', async () => {
      const previousState = {
        documents: ['doc1', 'doc2', 'doc3'],
        priorities: { doc1: 90, doc2: 80, doc3: 70 },
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
      };

      await sessionManager.restoreSession(previousState);
      
      const loadOrder = await sessionManager.getLoadOrder();
      expect(loadOrder[0]).toBe('doc1');
      expect(loadOrder[1]).toBe('doc2');
      expect(loadOrder[2]).toBe('doc3');
    });
  });

  describe('Document Chunking and Loading', () => {
    it('should chunk large documents for efficient loading', async () => {
      const largeDocument = {
        id: 'large-doc',
        content: 'x'.repeat(10000),
        tokens: 8000
      };

      const chunks = await sessionManager.chunkDocument(largeDocument, 2000);
      
      expect(chunks).toHaveLength(4);
      expect(chunks[0].tokens).toBeLessThanOrEqual(2000);
      expect(chunks[0].id).toBe('large-doc-chunk-0');
    });

    it('should load document chunks based on priority', async () => {
      const chunks = [
        { id: 'doc-chunk-0', priority: 100, tokens: 1000 },
        { id: 'doc-chunk-1', priority: 50, tokens: 1000 },
        { id: 'doc-chunk-2', priority: 80, tokens: 1000 }
      ];

      await sessionManager.setChunks(chunks);
      const loadOrder = await sessionManager.getChunkLoadOrder();
      
      expect(loadOrder[0]).toBe('doc-chunk-0');
      expect(loadOrder[1]).toBe('doc-chunk-2');
      expect(loadOrder[2]).toBe('doc-chunk-1');
    });

    it('should align chunking with typical usage patterns', async () => {
      const commandDoc = {
        id: 'analyze-cmd',
        sections: ['description', 'arguments', 'examples', 'auto-activations']
      };

      const chunks = await sessionManager.smartChunk(commandDoc);
      
      // Core sections should be in first chunk
      expect(chunks[0].sections).toContain('description');
      expect(chunks[0].sections).toContain('arguments');
      
      // Examples might be in second chunk
      expect(chunks[1].sections).toContain('examples');
    });
  });

  describe('Usage Pattern Tracking', () => {
    it('should track document access patterns', async () => {
      await sessionManager.accessDocument('analyze-cmd');
      await sessionManager.accessDocument('build-cmd');
      await sessionManager.accessDocument('analyze-cmd');
      await sessionManager.accessDocument('analyze-cmd');

      const patterns = await sessionManager.getAccessPatterns();
      
      expect(patterns['analyze-cmd'].count).toBe(3);
      expect(patterns['build-cmd'].count).toBe(1);
      expect(patterns['analyze-cmd'].lastAccessed).toBeDefined();
    });

    it('should identify document relationships from access patterns', async () => {
      // Simulate accessing related documents together
      await sessionManager.accessDocument('analyze-cmd');
      await sessionManager.accessDocument('--think');
      await sessionManager.accessDocument('--seq');
      
      await sessionManager.accessDocument('build-cmd');
      await sessionManager.accessDocument('--validate');

      const relationships = await sessionManager.analyzeRelationships();
      
      expect(relationships['analyze-cmd']).toBeDefined();
      expect(relationships['analyze-cmd']).toContain('--think');
      expect(relationships['--think']).toBeDefined();
      expect(relationships['--think']).toContain('--seq');
      expect(relationships['build-cmd']).toBeDefined();
      expect(relationships['build-cmd']).toContain('--validate');
    });

    it('should optimize preloading based on relationships', async () => {
      const relationships = {
        'analyze-cmd': ['--think', '--seq', 'analyzer-persona'],
        'build-cmd': ['--validate', 'frontend-persona']
      };

      await sessionManager.setRelationships(relationships);
      
      const preloadList = await sessionManager.getPreloadList('analyze-cmd');
      expect(preloadList).toContain('--think');
      expect(preloadList).toContain('--seq');
      expect(preloadList).toContain('analyzer-persona');
    });
  });

  describe('Memory Pressure Handling', () => {
    it('should detect memory pressure situations', async () => {
      sessionManager.setMaxTokens(10000);
      
      await sessionManager.loadDocument('doc1', 3000);
      await sessionManager.loadDocument('doc2', 3000);
      await sessionManager.loadDocument('doc3', 3000);

      expect(await sessionManager.isUnderMemoryPressure()).toBe(true);
      expect(await sessionManager.getMemoryPressureLevel()).toBeGreaterThan(0.8);
    });

    it('should adjust loading strategy under memory pressure', async () => {
      sessionManager.setMaxTokens(5000);
      
      await sessionManager.loadDocument('doc1', 2000);
      await sessionManager.loadDocument('doc2', 2000);
      
      // Under pressure, should only load essential chunks
      const loadStrategy = await sessionManager.getLoadingStrategy();
      expect(loadStrategy).toBe('essential-only');
      
      // Should reject non-essential loads
      const loaded = await sessionManager.loadDocument('optional-doc', 2000, { essential: false });
      expect(loaded).toBe(false);
    });

    it('should implement progressive loading under constraints', async () => {
      const largeDoc = {
        id: 'large-doc',
        chunks: [
          { id: 'chunk-1', tokens: 1000, priority: 100 },
          { id: 'chunk-2', tokens: 1000, priority: 80 },
          { id: 'chunk-3', tokens: 1000, priority: 60 },
          { id: 'chunk-4', tokens: 1000, priority: 40 }
        ]
      };

      sessionManager.setMaxTokens(3500);
      
      const loadedChunks = await sessionManager.progressiveLoad(largeDoc);
      
      // Should load only high-priority chunks
      expect(loadedChunks).toContain('chunk-1');
      expect(loadedChunks).toContain('chunk-2');
      expect(loadedChunks).toContain('chunk-3');
      expect(loadedChunks).not.toContain('chunk-4');
    });
  });

  describe('Cross-Session Optimization', () => {
    it('should maintain usage statistics across sessions', async () => {
      const stats = {
        'analyze-cmd': { totalUses: 150, sessions: 10 },
        'build-cmd': { totalUses: 120, sessions: 10 },
        'help-cmd': { totalUses: 20, sessions: 5 }
      };

      await sessionManager.updateGlobalStats(stats);
      
      const globalPriorities = await sessionManager.getGlobalPriorities();
      expect(globalPriorities['analyze-cmd']).toBeGreaterThan(globalPriorities['help-cmd']);
    });

    it('should predict document needs based on history', async () => {
      const history = [
        { command: 'analyze', followedBy: ['--think', 'analyzer-persona'] },
        { command: 'analyze', followedBy: ['--think', '--seq'] },
        { command: 'build', followedBy: ['--validate'] }
      ];

      await sessionManager.trainPredictor(history);
      
      const predictions = await sessionManager.predictNeeds('analyze');
      expect(predictions).toContain('--think');
      expect(predictions[0]).toBe('--think'); // Most common
    });

    it('should optimize initial session loading', async () => {
      const sessionHistory = {
        averageTokensUsed: 12000,
        commonDocuments: ['bootstrap', 'analyze-cmd', 'build-cmd', '--think'],
        sessionDuration: 25
      };

      await sessionManager.optimizeFromHistory(sessionHistory);
      
      const initialLoad = await sessionManager.getInitialLoadList();
      expect(initialLoad).toContain('bootstrap');
      expect(initialLoad).toContain('analyze-cmd');
      expect(initialLoad.length).toBeLessThanOrEqual(10); // Don't overload
    });
  });
});