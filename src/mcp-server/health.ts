/**
 * Health check for MCP server
 * Ensures the server stays responsive and can handle reconnections
 */

export class HealthCheck {
  private lastPing: number = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly TIMEOUT = 30000; // 30 seconds

  start(): void {
    // Update last ping on any activity
    this.updateLastPing();
    
    // Start periodic checks
    this.checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastPing;
      
      if (elapsed > this.TIMEOUT) {
        console.error(`Health check failed: No activity for ${elapsed}ms`);
        // Force restart
        process.exit(1);
      }
    }, 10000); // Check every 10 seconds
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  updateLastPing(): void {
    this.lastPing = Date.now();
  }

  // Call this on any server activity
  ping(): void {
    this.updateLastPing();
  }
}