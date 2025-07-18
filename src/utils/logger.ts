import pino from 'pino';

export const createLogger = (name: string, options?: any) => {
  // Allow custom transport configuration
  if (options?.transport) {
    return pino({
      name,
      level: process.env.LOG_LEVEL || 'info',
      ...options
    });
  }
  
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    } : undefined
  });
};

export const logger = createLogger('superclaude-enterprise');