#!/usr/bin/env node
import 'reflect-metadata';
import { createApp } from './app';
import { config } from '../config';
import { getLogger } from '../utils/logger';
import { initializeCSLib, shutdownCSLib } from '../index';

const logger = getLogger('Server');

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting CSLib API Server...');

    // Try to initialize CSLib (database and services)
    let initSuccess = false;
    try {
      await initializeCSLib();
      initSuccess = true;
      logger.info('CSLib initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CSLib (database may not be available)', error);
      logger.warn('Server will start in degraded mode without database');
    }

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.node.port, config.node.host, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║         CSLib API Server                                   ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log(`║  Status: Running                                           ║`);
      console.log(`║  URL: http://${config.node.host}:${config.node.port.toString().padEnd(45)}║`);
      console.log(`║  Environment: ${config.node.env.padEnd(45)}║`);
      console.log(`║  Database: ${(initSuccess ? 'Connected' : 'Not Connected').padEnd(45)}║`);
      if (!initSuccess) {
        console.log('║  Mode: DEGRADED (some features may not work)              ║');
      }
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('║  Endpoints: See README.md for full API documentation       ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      logger.info(`Server running on http://${config.node.host}:${config.node.port}`);
      logger.info(`Environment: ${config.node.env}`);
      logger.info(`API endpoint: http://${config.node.host}:${config.node.port}/api`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        if (initSuccess) {
          try {
            await shutdownCSLib();
            logger.info('Server shut down successfully');
          } catch (error) {
            logger.error('Error during shutdown', error);
          }
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', { promise, reason });
      shutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
