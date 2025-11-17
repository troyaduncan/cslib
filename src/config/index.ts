import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export interface AppConfig {
  node: {
    env: string;
    port: number;
    host: string;
  };
  database: {
    type: 'postgres';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean;
  };
  air: {
    maxConnections: number;
    maxConnectionsPerRoute: number;
    connectionTimeout: number;
    requestTimeout: number;
    statsInterval: number;
  };
  sdp: {
    fdsTimeout: number;
    sessionTimeout: number;
  };
  dns: {
    timeout: number;
    retries: number;
  };
  logging: {
    level: string;
    dir: string;
    maxFiles: string;
    maxSize: string;
  };
  environment: 'lab' | 'prod';
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = {
      node: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
      },
      database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'cslib',
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        logging: process.env.DB_LOGGING === 'true',
      },
      air: {
        maxConnections: parseInt(process.env.AIR_MAX_CONNECTIONS || '200', 10),
        maxConnectionsPerRoute: parseInt(process.env.AIR_MAX_CONNECTIONS_PER_ROUTE || '20', 10),
        connectionTimeout: parseInt(process.env.AIR_CONNECTION_TIMEOUT || '30000', 10),
        requestTimeout: parseInt(process.env.AIR_REQUEST_TIMEOUT || '30000', 10),
        statsInterval: parseInt(process.env.AIR_STATS_INTERVAL || '60000', 10),
      },
      sdp: {
        fdsTimeout: parseInt(process.env.SDP_FDS_TIMEOUT || '30000', 10),
        sessionTimeout: parseInt(process.env.SDP_SESSION_TIMEOUT || '3600000', 10),
      },
      dns: {
        timeout: parseInt(process.env.DNS_TIMEOUT || '5000', 10),
        retries: parseInt(process.env.DNS_RETRIES || '3', 10),
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || './logs',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
      },
      environment: (process.env.ENVIRONMENT as 'lab' | 'prod') || 'lab',
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
}

export const config = ConfigManager.getInstance().getConfig();
export default ConfigManager;
