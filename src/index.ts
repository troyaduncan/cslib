/**
 * CSLib - T-Mobile Charging System Integration Library for Node.js
 *
 * A comprehensive library for integrating with T-Mobile's backend telecom systems
 * including AIR (Ericsson charging system), SDP (Service Data Point), and account management.
 */

// Configuration
export { config, AppConfig } from './config';
export { initializeDatabase, closeDatabase, AppDataSource } from './config/database';

// Utilities
export * from './utils';

// Entities
export * from './entities';

// Data Access Layer
export * from './dao';

// IN Resource Definitions
export { INResourceDefinitions } from './defs';

// AIR Module
export * from './air';

// SDP Module
export * from './sdp';

// Account Finder Module
export * from './af';

/**
 * Initialize the entire CSLib library
 */
export async function initializeCSLib(): Promise<void> {
  const { getLogger } = await import('./utils/logger');
  const logger = getLogger('CSLib');

  try {
    logger.info('Initializing CSLib...');

    // Initialize database
    const { initializeDatabase } = await import('./config/database');
    await initializeDatabase();

    // Load IN resource definitions
    const { INResourceDefinitions } = await import('./defs');
    const inDefs = INResourceDefinitions.getInstance();
    await inDefs.loadDefinitions();

    // Initialize AIR service
    const { AIRService } = await import('./air');
    const airService = AIRService.getInstance();
    await airService.initialize();

    logger.info('CSLib initialized successfully');
  } catch (error) {
    logger.error('Error initializing CSLib', error);
    throw error;
  }
}

/**
 * Shutdown the entire CSLib library
 */
export async function shutdownCSLib(): Promise<void> {
  const { getLogger } = await import('./utils/logger');
  const logger = getLogger('CSLib');

  try {
    logger.info('Shutting down CSLib...');

    // Shutdown AIR service
    const { AIRService } = await import('./air');
    const airService = AIRService.getInstance();
    await airService.shutdown();

    // Close database
    const { closeDatabase } = await import('./config/database');
    await closeDatabase();

    logger.info('CSLib shut down successfully');
  } catch (error) {
    logger.error('Error shutting down CSLib', error);
    throw error;
  }
}

// Version
export const version = '1.0.0';
