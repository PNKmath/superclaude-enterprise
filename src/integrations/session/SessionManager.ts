/**
 * Session Manager for Multi-turn Conversations
 * Maintains context continuity across MCP server interactions
 */

export interface ConversationTurn {
  input: string;
  command: string;
  result: any;
  timestamp: Date;
  context: any;
  geminiStrategy?: any;
}

export interface SessionContext {
  currentPersonas: string[];
  currentTarget?: string;
  currentFlags: Map<string, any>;
  history: string[];
  insights: Map<string, any>;
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  turns: ConversationTurn[];
  context: SessionContext;
  geminiStrategy?: any;
  metadata: Map<string, any>;
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private cleanupTimers = new Map<string, NodeJS.Timeout>();
  
  /**
   * Create a new session
   */
  async createSession(userId: string, initialContext?: any): Promise<Session> {
    const sessionId = this.generateSessionId(userId);
    
    const session: Session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      turns: [],
      context: this.initializeContext(initialContext),
      metadata: new Map()
    };
    
    this.sessions.set(sessionId, session);
    this.scheduleCleanup(sessionId);
    
    return session;
  }

  /**
   * Get existing session or create new one
   */
  async getOrCreateSession(userId: string, sessionId?: string): Promise<Session> {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();
      return session;
    }
    
    return this.createSession(userId);
  }

  /**
   * Add a conversation turn to session
   */
  async addTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Add turn
    session.turns.push(turn);
    session.lastActivity = new Date();
    
    // Update context
    this.updateSessionContext(session, turn);
    
    // Update Gemini strategy if provided
    if (turn.geminiStrategy) {
      session.geminiStrategy = this.mergeStrategies(
        session.geminiStrategy,
        turn.geminiStrategy
      );
    }
    
    // Limit session history to last 20 turns
    if (session.turns.length > 20) {
      session.turns = session.turns.slice(-20);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  /**
   * Get recent turns for context
   */
  getRecentTurns(sessionId: string, count: number = 3): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    
    return session.turns.slice(-count);
  }

  /**
   * Get session context for Gemini
   */
  getGeminiContext(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    const recentTurns = this.getRecentTurns(sessionId, 5);
    
    return {
      sessionId,
      turnCount: session.turns.length,
      currentContext: {
        personas: Array.from(session.context.currentPersonas),
        target: session.context.currentTarget,
        flags: Object.fromEntries(session.context.currentFlags),
        recentCommands: recentTurns.map(t => t.command),
        recentTopics: this.extractTopics(recentTurns)
      },
      continuityHints: this.generateContinuityHints(session),
      geminiStrategy: session.geminiStrategy
    };
  }

  /**
   * Clear session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    
    // Clear the cleanup timer
    const timer = this.cleanupTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(sessionId);
    }
  }

  /**
   * Initialize session context
   */
  private initializeContext(initial?: any): SessionContext {
    return {
      currentPersonas: initial?.personas || [],
      currentTarget: initial?.target,
      currentFlags: new Map(Object.entries(initial?.flags || {})),
      history: [],
      insights: new Map()
    };
  }

  /**
   * Update session context based on turn
   */
  private updateSessionContext(session: Session, turn: ConversationTurn): void {
    const context = session.context;
    
    // Update personas
    if (turn.context.personas?.length > 0) {
      context.currentPersonas = turn.context.personas;
    }
    
    // Update target
    if (turn.context.target) {
      context.currentTarget = turn.context.target;
    }
    
    // Update flags
    if (turn.context.flags) {
      for (const [key, value] of Object.entries(turn.context.flags)) {
        context.currentFlags.set(key, value);
      }
    }
    
    // Add to history
    context.history.push(turn.command);
    if (context.history.length > 10) {
      context.history = context.history.slice(-10);
    }
    
    // Extract insights
    this.extractInsights(session, turn);
  }

  /**
   * Extract insights from conversation
   */
  private extractInsights(session: Session, turn: ConversationTurn): void {
    const insights = session.context.insights;
    
    // Track command patterns
    const commandType = turn.command.split(' ')[0];
    insights.set('lastCommand', commandType);
    
    // Track error patterns
    if (turn.result?.error) {
      const errors = insights.get('errors') || [];
      errors.push({ command: turn.command, error: turn.result.error });
      insights.set('errors', errors);
    }
    
    // Track successful patterns
    if (turn.result?.success) {
      const successes = insights.get('successes') || [];
      successes.push(turn.command);
      insights.set('successes', successes);
    }
  }

  /**
   * Generate continuity hints for Gemini
   */
  private generateContinuityHints(session: Session): string[] {
    const hints: string[] = [];
    
    // Add recent focus areas
    if (session.context.currentTarget) {
      hints.push(`Currently working on: ${session.context.currentTarget}`);
    }
    
    // Add active personas
    if (session.context.currentPersonas.length > 0) {
      hints.push(`Active personas: ${session.context.currentPersonas.join(', ')}`);
    }
    
    // Add recent patterns
    const recentCommands = session.turns.slice(-3).map(t => t.command);
    if (recentCommands.length > 0) {
      hints.push(`Recent focus: ${this.summarizeCommands(recentCommands)}`);
    }
    
    return hints;
  }

  /**
   * Extract topics from recent turns
   */
  private extractTopics(turns: ConversationTurn[]): string[] {
    const topics = new Set<string>();
    
    for (const turn of turns) {
      // Extract from command
      if (turn.command.includes('security')) topics.add('security');
      if (turn.command.includes('performance')) topics.add('performance');
      if (turn.command.includes('test')) topics.add('testing');
      
      // Extract from context
      if (turn.context.target) {
        topics.add(`file:${turn.context.target}`);
      }
    }
    
    return Array.from(topics);
  }

  /**
   * Merge Gemini strategies
   */
  private mergeStrategies(existing: any, newStrategy: any): any {
    if (!existing) return newStrategy;
    
    return {
      mode: newStrategy.mode || existing.mode,
      contextLevel: this.selectHigherContextLevel(
        existing.contextLevel,
        newStrategy.contextLevel
      ),
      sessionContinuity: {
        enabled: true,
        depth: Math.max(
          existing.sessionContinuity?.depth || 0,
          newStrategy.sessionContinuity?.depth || 0
        )
      },
      preservationRules: [
        ...(existing.preservationRules || []),
        ...(newStrategy.preservationRules || [])
      ].filter((v, i, a) => a.indexOf(v) === i) // unique
    };
  }

  /**
   * Select higher context level
   */
  private selectHigherContextLevel(level1?: string, level2?: string): string {
    const levels = ['minimal', 'standard', 'detailed'];
    const index1 = levels.indexOf(level1 || 'standard');
    const index2 = levels.indexOf(level2 || 'standard');
    return levels[Math.max(index1, index2)];
  }

  /**
   * Summarize recent commands
   */
  private summarizeCommands(commands: string[]): string {
    const types = commands.map(cmd => cmd.split(' ')[0].replace('/sc:', ''));
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.join(', ');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(userId: string): string {
    return `mcp-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Schedule session cleanup
   */
  private scheduleCleanup(sessionId: string): void {
    // Clear any existing timer
    const existingTimer = this.cleanupTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Create new timer with unref() to not keep process alive
    const timer = setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        const inactiveTime = Date.now() - session.lastActivity.getTime();
        if (inactiveTime > this.sessionTimeout) {
          this.clearSession(sessionId);
        } else {
          // Reschedule
          this.scheduleCleanup(sessionId);
        }
      }
    }, this.sessionTimeout);
    
    // Don't keep the process alive just for this timer
    timer.unref();
    
    // Store the timer
    this.cleanupTimers.set(sessionId, timer);
  }
  
  /**
   * Clean up all sessions and timers
   */
  async cleanup(): Promise<void> {
    // Clear all timers
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
    
    // Clear all sessions
    this.sessions.clear();
  }
}