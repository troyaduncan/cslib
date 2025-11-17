import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Ensure log directory exists
const logDir = config.logging.dir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} ${level} ${message} ${metaStr}`;
        })
      ),
    }),
    // File transport - all logs
    new winston.transports.File({
      filename: path.join(logDir, 'cslib.log'),
      maxsize: parseSize(config.logging.maxSize),
      maxFiles: config.logging.maxFiles as any,
      tailable: true,
    }),
    // File transport - error logs only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: parseSize(config.logging.maxSize),
      maxFiles: config.logging.maxFiles as any,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// Helper function to parse size strings like "20m" to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };
  const match = size.match(/^(\d+)([bkmg]?)$/i);
  if (!match) return 20 * 1024 * 1024; // default 20MB
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'b').toLowerCase();
  return value * (units[unit] || 1);
}

// Create logger instance for specific modules
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }

  debug(message: string, ...meta: any[]): void {
    logger.debug(this.formatMessage(message), ...meta);
  }

  info(message: string, ...meta: any[]): void {
    logger.info(this.formatMessage(message), ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    logger.warn(this.formatMessage(message), ...meta);
  }

  error(message: string, error?: Error | any, ...meta: any[]): void {
    if (error instanceof Error) {
      logger.error(this.formatMessage(message), { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(this.formatMessage(message), error, ...meta);
    }
  }

  fatal(message: string, error?: Error | any, ...meta: any[]): void {
    if (error instanceof Error) {
      logger.error(this.formatMessage(`FATAL: ${message}`), { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(this.formatMessage(`FATAL: ${message}`), error, ...meta);
    }
  }
}

// Factory function to create logger instances
export function getLogger(context: string): Logger {
  return new Logger(context);
}

export default logger;
