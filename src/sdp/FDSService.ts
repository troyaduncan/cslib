import axios, { AxiosInstance } from 'axios';
import { getLogger } from '../utils/logger';
import { config } from '../config';
import { SDPConfig, FDSSession, FDSRequest, FDSResponse } from './types';

const logger = getLogger('FDSService');

/**
 * FDS (Fault Detection System) Service for SDP
 * Manages connections and sessions with SDP FDS interface
 */
export class FDSService {
  private client: AxiosInstance;
  private config: SDPConfig;
  private session?: FDSSession;

  constructor(sdpConfig: SDPConfig) {
    this.config = {
      ...sdpConfig,
      timeout: sdpConfig.timeout || config.sdp.fdsTimeout,
    };

    this.client = axios.create({
      baseURL: `http://${this.config.host}:${this.config.port}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CSLib-NodeJS/1.0',
      },
    });
  }

  /**
   * Login to FDS service
   */
  async login(): Promise<void> {
    try {
      logger.info(`Logging in to FDS at ${this.config.host}:${this.config.port}`);

      const request: FDSRequest = {
        command: 'login',
        params: {
          username: this.config.username || 'admin',
          password: this.config.password || 'admin',
        },
      };

      const response = await this.client.post('/fds/login', request);

      if (response.data && response.data.sessionId) {
        this.session = {
          sessionId: response.data.sessionId,
          sdpId: response.data.sdpId || 'unknown',
          connected: true,
          loginTime: new Date(),
          lastActivityTime: new Date(),
        };

        logger.info(`FDS login successful, session: ${this.session.sessionId}`);
      } else {
        throw new Error('Login failed: No session ID returned');
      }
    } catch (error) {
      logger.error('FDS login failed', error);
      throw error;
    }
  }

  /**
   * Logout from FDS service
   */
  async logout(): Promise<void> {
    if (!this.session) {
      logger.warn('No active FDS session to logout');
      return;
    }

    try {
      const request: FDSRequest = {
        command: 'logout',
        params: {
          sessionId: this.session.sessionId,
        },
      };

      await this.client.post('/fds/logout', request);
      logger.info('FDS logout successful');

      this.session = undefined;
    } catch (error) {
      logger.error('FDS logout failed', error);
      throw error;
    }
  }

  /**
   * Execute FDS command
   */
  async executeCommand(command: string, params?: Record<string, any>): Promise<FDSResponse> {
    if (!this.session) {
      await this.login();
    }

    try {
      const request: FDSRequest = {
        command,
        params: {
          sessionId: this.session!.sessionId,
          ...params,
        },
      };

      const response = await this.client.post('/fds/command', request);
      this.session!.lastActivityTime = new Date();

      return {
        success: response.data.success !== false,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      logger.error(`FDS command execution failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Check if session is active
   */
  isConnected(): boolean {
    if (!this.session) return false;

    // Check if session has timed out
    const now = Date.now();
    const lastActivity = this.session.lastActivityTime.getTime();
    const timeout = config.sdp.sessionTimeout;

    if (now - lastActivity > timeout) {
      logger.warn('FDS session timed out');
      this.session = undefined;
      return false;
    }

    return this.session.connected;
  }

  /**
   * Get current session
   */
  getSession(): FDSSession | undefined {
    return this.session ? { ...this.session } : undefined;
  }

  /**
   * Get SDP configuration
   */
  getConfig(): SDPConfig {
    return { ...this.config };
  }
}

export default FDSService;
