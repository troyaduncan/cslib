import { XmlRpcClient, XmlRpcClientConfig } from './XmlRpcClient';
import { getLogger } from '../utils/logger';
import { config } from '../config';
import { INResourceDefinitions } from '../defs';
import {
  UCIPRequest,
  UCIPResponse,
  GetBalanceRequest,
  RefillRequest,
  UpdateBalanceRequest,
  GetAccountDetailsRequest,
  SubscriberInfo,
  TransactionStats,
  RoutingDestination,
} from './types';

const logger = getLogger('AIRService');

/**
 * Singleton service for AIR (Account Information & Refill) operations
 * Manages XML-RPC connections, routing, and transaction statistics
 */
export class AIRService {
  private static instance: AIRService;
  private clients: Map<string, XmlRpcClient> = new Map();
  private routingTable: Map<string, RoutingDestination[]> = new Map();
  private roundRobinIndexes: Map<string, number> = new Map();
  private stats: TransactionStats;
  private statsInterval?: NodeJS.Timeout;
  private initialized: boolean = false;

  private constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResetTime: new Date(),
    };
  }

  public static getInstance(): AIRService {
    if (!AIRService.instance) {
      AIRService.instance = new AIRService();
    }
    return AIRService.instance;
  }

  /**
   * Initialize AIR service with node configurations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('AIR service already initialized');
      return;
    }

    try {
      logger.info('Initializing AIR service...');

      // Get AIR node configurations from definitions
      const inDefs = INResourceDefinitions.getInstance();
      const airNodes = inDefs.getAirNodesByEnvironment(config.environment);

      if (airNodes.length === 0) {
        throw new Error(`No AIR nodes configured for environment: ${config.environment}`);
      }

      // Create XML-RPC clients for each node
      for (const node of airNodes) {
        const clientConfig: XmlRpcClientConfig = {
          host: node.host,
          port: node.port,
          path: '/Air',
          timeout: config.air.requestTimeout,
          maxConnections: config.air.maxConnectionsPerRoute,
        };

        const client = new XmlRpcClient(clientConfig);
        this.clients.set(node.nodeId, client);

        logger.info(`Created AIR client for node: ${node.nodeId} at ${node.host}:${node.port}`);

        // Build routing table by AF type
        if (node.afType) {
          if (!this.routingTable.has(node.afType)) {
            this.routingTable.set(node.afType, []);
            this.roundRobinIndexes.set(node.afType, 0);
          }

          const destination: RoutingDestination = {
            nodeId: node.nodeId,
            host: node.host,
            port: node.port,
            url: `http://${node.host}:${node.port}/Air`,
            active: node.active,
          };

          this.routingTable.get(node.afType)!.push(destination);
        }
      }

      // Start statistics reporting
      this.startStatsReporting();

      this.initialized = true;
      logger.info('AIR service initialized successfully');
    } catch (error) {
      logger.error('Error initializing AIR service', error);
      throw error;
    }
  }

  /**
   * Get client for a specific node or route to appropriate node
   */
  private getClient(nodeId?: string, afType?: string): XmlRpcClient {
    if (nodeId) {
      const client = this.clients.get(nodeId);
      if (!client) {
        throw new Error(`AIR client not found for node: ${nodeId}`);
      }
      return client;
    }

    if (afType) {
      const destinations = this.routingTable.get(afType);
      if (!destinations || destinations.length === 0) {
        throw new Error(`No destinations found for AF type: ${afType}`);
      }

      // Round-robin load balancing
      const index = this.roundRobinIndexes.get(afType) || 0;
      const destination = destinations[index % destinations.length];
      this.roundRobinIndexes.set(afType, (index + 1) % destinations.length);

      const client = this.clients.get(destination.nodeId);
      if (!client) {
        throw new Error(`AIR client not found for node: ${destination.nodeId}`);
      }

      return client;
    }

    // Default: use first available client
    const firstClient = this.clients.values().next().value;
    if (!firstClient) {
      throw new Error('No AIR clients available');
    }
    return firstClient;
  }

  /**
   * Execute UCIP request
   */
  async executeRequest(request: UCIPRequest, nodeId?: string, afType?: string): Promise<UCIPResponse> {
    if (!this.initialized) {
      throw new Error('AIR service not initialized');
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const client = this.getClient(nodeId, afType);
      const response = await client.call(request);

      const responseTime = Date.now() - startTime;
      this.updateStats(true, responseTime);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(false, responseTime);
      logger.error('Error executing UCIP request', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(request: GetBalanceRequest, afType?: string): Promise<UCIPResponse> {
    const ucipRequest: UCIPRequest = {
      methodName: 'GetBalanceAndDate',
      params: [
        {
          subscriberNumber: request.subscriberNumber,
          requestedInformationFlags: request.requestedInformationFlags || 0,
        },
      ],
    };

    return await this.executeRequest(ucipRequest, undefined, afType);
  }

  /**
   * Refill account
   */
  async refill(request: RefillRequest, afType?: string): Promise<UCIPResponse> {
    const ucipRequest: UCIPRequest = {
      methodName: 'Refill',
      params: [
        {
          subscriberNumber: request.subscriberNumber,
          refillAmount: request.refillAmount,
          transactionId: request.transactionId || this.generateTransactionId(),
          transactionCurrency: request.transactionCurrency || 'USD',
          profileId: request.profileId || '',
        },
      ],
    };

    return await this.executeRequest(ucipRequest, undefined, afType);
  }

  /**
   * Update balance
   */
  async updateBalance(request: UpdateBalanceRequest, afType?: string): Promise<UCIPResponse> {
    const ucipRequest: UCIPRequest = {
      methodName: 'UpdateBalanceAndDate',
      params: [
        {
          subscriberNumber: request.subscriberNumber,
          adjustmentAmount: request.adjustmentAmount,
          transactionId: request.transactionId || this.generateTransactionId(),
          transactionType: request.transactionType || 'ADJUSTMENT',
        },
      ],
    };

    return await this.executeRequest(ucipRequest, undefined, afType);
  }

  /**
   * Get account details
   */
  async getAccountDetails(request: GetAccountDetailsRequest, afType?: string): Promise<UCIPResponse> {
    const ucipRequest: UCIPRequest = {
      methodName: 'GetAccountDetails',
      params: [
        {
          subscriberNumber: request.subscriberNumber,
          requestedInformationFlags: request.requestedInformationFlags || 0xFFFFFFFF,
        },
      ],
    };

    return await this.executeRequest(ucipRequest, undefined, afType);
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `TXN${Date.now()}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;
  }

  /**
   * Update transaction statistics
   */
  private updateStats(success: boolean, responseTime: number): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time (moving average)
    const alpha = 0.1; // Smoothing factor
    this.stats.averageResponseTime =
      alpha * responseTime + (1 - alpha) * this.stats.averageResponseTime;
  }

  /**
   * Get current statistics
   */
  getStats(): TransactionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResetTime: new Date(),
    };
    logger.info('Transaction statistics reset');
  }

  /**
   * Start periodic statistics reporting
   */
  private startStatsReporting(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(() => {
      const stats = this.getStats();
      const successRate =
        stats.totalRequests > 0 ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) : '0.00';

      logger.info(
        `AIR Stats - Total: ${stats.totalRequests}, Success: ${stats.successfulRequests}, ` +
          `Failed: ${stats.failedRequests}, Success Rate: ${successRate}%, ` +
          `Avg Response Time: ${stats.averageResponseTime.toFixed(2)}ms`
      );
    }, config.air.statsInterval);
  }

  /**
   * Stop statistics reporting
   */
  private stopStatsReporting(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = undefined;
    }
  }

  /**
   * Shutdown AIR service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down AIR service...');
    this.stopStatsReporting();
    this.clients.clear();
    this.routingTable.clear();
    this.initialized = false;
    logger.info('AIR service shut down');
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default AIRService;
