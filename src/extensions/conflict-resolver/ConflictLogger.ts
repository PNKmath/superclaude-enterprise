import * as fs from 'fs/promises';
import * as path from 'path';

export interface ConflictLogEntry {
  command: string;
  conflicts: any[];
  resolution: any;
  strategy: string;
  timestamp: number;
  resolutionTime: number;
}

export class ConflictLogger {
  private logPath: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private logBuffer: ConflictLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logPath = path.join(
      process.env.HOME || '/tmp',
      '.claude/enterprise/logs/conflicts.json'
    );
    // Only start auto-flush in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      this.startAutoFlush();
    }
  }

  async log(entry: ConflictLogEntry): Promise<void> {
    this.logBuffer.push(entry);

    // Flush immediately if buffer is large
    if (this.logBuffer.length >= 100) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      await this.ensureLogDirectory();
      
      // Read existing logs
      let existingLogs: ConflictLogEntry[] = [];
      try {
        const content = await fs.readFile(this.logPath, 'utf-8');
        existingLogs = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is corrupted, start fresh
      }

      // Append new logs
      const allLogs = [...existingLogs, ...this.logBuffer];

      // Rotate if too large
      if (JSON.stringify(allLogs).length > this.maxLogSize) {
        // Keep only recent logs
        const recentLogs = allLogs.slice(-1000);
        await fs.writeFile(this.logPath, JSON.stringify(recentLogs, null, 2));
      } else {
        await fs.writeFile(this.logPath, JSON.stringify(allLogs, null, 2));
      }

      // Clear buffer
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush conflict logs:', error);
    }
  }

  async getRecentConflicts(count: number = 100): Promise<ConflictLogEntry[]> {
    try {
      const content = await fs.readFile(this.logPath, 'utf-8');
      const logs: ConflictLogEntry[] = JSON.parse(content);
      return logs.slice(-count);
    } catch {
      return [];
    }
  }

  async getConflictStats(): Promise<any> {
    const logs = await this.getRecentConflicts(1000);
    
    const stats = {
      totalConflicts: logs.length,
      averageResolutionTime: 0,
      conflictsByType: {} as Record<string, number>,
      conflictsByStrategy: {} as Record<string, number>,
      mostCommonConflicts: [] as any[]
    };

    if (logs.length === 0) return stats;

    // Calculate average resolution time
    const totalTime = logs.reduce((sum, log) => sum + log.resolutionTime, 0);
    stats.averageResolutionTime = totalTime / logs.length;

    // Count by type and strategy
    logs.forEach(log => {
      // Count strategies
      stats.conflictsByStrategy[log.strategy] = 
        (stats.conflictsByStrategy[log.strategy] || 0) + 1;

      // Count conflict types
      log.conflicts.forEach(conflict => {
        const key = `${conflict.personas.sort().join(' vs ')}`;
        stats.conflictsByType[key] = (stats.conflictsByType[key] || 0) + 1;
      });
    });

    // Find most common conflicts
    stats.mostCommonConflicts = Object.entries(stats.conflictsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([personas, count]) => ({ personas, count }));

    return stats;
  }

  private async ensureLogDirectory(): Promise<void> {
    const dir = path.dirname(this.logPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  private startAutoFlush(): void {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, 30000);
  }

  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}