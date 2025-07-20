import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../integrations/session/SessionManager.js';
import { ClaudeCodeBridge } from '../integration/enhanced-claude-code-bridge.js';

describe('Session Management Integration', () => {
  let sessionManager1: SessionManager;
  let sessionManager2: SessionManager;
  let claudeCodeBridge: ClaudeCodeBridge;
  
  beforeEach(() => {
    // Reset singleton instance before each test
    SessionManager.resetInstance();
    sessionManager1 = new SessionManager();
    sessionManager2 = new SessionManager();
    claudeCodeBridge = new ClaudeCodeBridge();
  });

  afterEach(() => {
    // Clean up after each test
    SessionManager.resetInstance();
  });

  it('Should reproduce session not found error with different SessionManager instances', async () => {
    // Create session in first instance
    const session = await sessionManager1.createSession('test-user');
    
    // Try to add turn using second instance - should throw error
    await expect(
      sessionManager2.addTurn(session.id, {
        input: 'test input',
        command: 'test command',
        result: {},
        timestamp: new Date(),
        context: {}
      })
    ).rejects.toThrow(`Session ${session.id} not found`);
  });

  it('Should handle session operations when using same SessionManager instance', async () => {
    const session = await sessionManager1.createSession('test-user');
    
    // Add turn using same instance - should work
    await expect(
      sessionManager1.addTurn(session.id, {
        input: 'test input',
        command: 'test command', 
        result: {},
        timestamp: new Date(),
        context: {}
      })
    ).resolves.not.toThrow();
    
    const updatedSession = sessionManager1.getSession(session.id);
    expect(updatedSession?.turns).toHaveLength(1);
  });

  it('ClaudeCodeBridge should use shared SessionManager instance', async () => {
    // Get singleton instance
    const sharedSessionManager = SessionManager.getInstance();
    
    // Create session in shared instance
    const session = await sharedSessionManager.createSession('test-user');
    
    // ClaudeCodeBridge now uses the same singleton instance
    const result = await claudeCodeBridge.convertNaturalLanguage('보안 분석을 실행해줘', {
      sessionId: session.id
    });
    
    // This should now work because they share the same SessionManager
    expect(result.success).toBe(true);
    
    // Verify session was updated
    const updatedSession = sharedSessionManager.getSession(session.id);
    expect(updatedSession?.turns).toHaveLength(1);
  });

  it('Should verify singleton SessionManager pattern', async () => {
    // Create two ClaudeCodeBridge instances
    const bridge1 = new ClaudeCodeBridge();
    const bridge2 = new ClaudeCodeBridge();
    
    // They should now share the same SessionManager singleton
    expect(bridge1['sessionManager']).toBe(bridge2['sessionManager']);
    
    // Verify they are the same as getInstance()
    expect(bridge1['sessionManager']).toBe(SessionManager.getInstance());
  });
});