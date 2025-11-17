import { Client, ConnectConfig, ClientChannel } from 'ssh2';
import { getLogger } from './logger';

const logger = getLogger('SSHClient');

export interface SSHConfig extends ConnectConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: Buffer | string;
}

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * SSH Client wrapper for executing remote commands
 */
export class SSHClient {
  private client: Client;
  private config: SSHConfig;
  private connected: boolean = false;

  constructor(config: SSHConfig) {
    this.config = {
      ...config,
      port: config.port || 22,
    };
    this.client = new Client();
  }

  /**
   * Connect to SSH server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client
        .on('ready', () => {
          logger.info(`SSH connection established to ${this.config.host}`);
          this.connected = true;
          resolve();
        })
        .on('error', (err) => {
          logger.error('SSH connection error', err);
          this.connected = false;
          reject(err);
        })
        .on('close', () => {
          logger.info('SSH connection closed');
          this.connected = false;
        })
        .connect(this.config);
    });
  }

  /**
   * Execute command on remote server
   */
  async executeCommand(command: string, timeout: number = 30000): Promise<SSHCommandResult> {
    if (!this.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      let timeoutHandle: NodeJS.Timeout;

      this.client.exec(command, (err, stream: ClientChannel) => {
        if (err) {
          logger.error(`Failed to execute command: ${command}`, err);
          reject(err);
          return;
        }

        // Set timeout
        timeoutHandle = setTimeout(() => {
          stream.close();
          reject(new Error(`Command execution timeout after ${timeout}ms`));
        }, timeout);

        stream
          .on('close', (code: number) => {
            clearTimeout(timeoutHandle);
            exitCode = code;
            logger.debug(`Command executed with exit code ${exitCode}`);
            resolve({ stdout, stderr, exitCode });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeCommands(commands: string[], timeout: number = 30000): Promise<SSHCommandResult[]> {
    const results: SSHCommandResult[] = [];
    for (const command of commands) {
      const result = await this.executeCommand(command, timeout);
      results.push(result);
    }
    return results;
  }

  /**
   * Disconnect from SSH server
   */
  disconnect(): void {
    if (this.connected) {
      this.client.end();
      this.connected = false;
      logger.info('SSH connection disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

export default SSHClient;
