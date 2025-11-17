import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from './index';
import { getLogger } from '../utils/logger';
import * as entities from '../entities';

const logger = getLogger('Database');

// TypeORM configuration
const dataSourceOptions: DataSourceOptions = {
  type: config.database.type,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: Object.values(entities),
  migrations: [],
  subscribers: [],
  poolSize: 10,
  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// Create DataSource instance
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize database connection
export async function initializeDatabase(): Promise<DataSource> {
  try {
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection initialized successfully');
    return AppDataSource;
  } catch (error) {
    logger.error('Error initializing database connection', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection', error);
    throw error;
  }
}

export default AppDataSource;
