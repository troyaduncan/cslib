import { getLogger } from '../utils/logger';
import { FDSService } from './FDSService';
import { TraceConfig, TraceLog, TraceLine, TraceLevel, FDSResponse } from './types';

const logger = getLogger('TraceLogUtility');

/**
 * Trace log utility for SDP subscriber tracing
 */
export class TraceLogUtility {
  private fdsService: FDSService;
  private activeTraces: Map<string, TraceConfig> = new Map();

  constructor(fdsService: FDSService) {
    this.fdsService = fdsService;
  }

  /**
   * Add MSISDN to trace
   */
  async addTrace(config: TraceConfig): Promise<boolean> {
    try {
      logger.info(`Adding trace for MSISDN: ${config.msisdn}, level: ${config.traceLevel}`);

      const response = await this.fdsService.executeCommand('addTrace', {
        msisdn: config.msisdn,
        traceLevel: config.traceLevel,
        duration: config.duration || 3600,
        filters: config.filters || [],
      });

      if (response.success) {
        this.activeTraces.set(config.msisdn, config);
        logger.info(`Trace added successfully for ${config.msisdn}`);
        return true;
      } else {
        logger.error(`Failed to add trace for ${config.msisdn}: ${response.message}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error adding trace for ${config.msisdn}`, error);
      throw error;
    }
  }

  /**
   * Remove MSISDN from trace
   */
  async removeTrace(msisdn: string): Promise<boolean> {
    try {
      logger.info(`Removing trace for MSISDN: ${msisdn}`);

      const response = await this.fdsService.executeCommand('removeTrace', {
        msisdn,
      });

      if (response.success) {
        this.activeTraces.delete(msisdn);
        logger.info(`Trace removed successfully for ${msisdn}`);
        return true;
      } else {
        logger.error(`Failed to remove trace for ${msisdn}: ${response.message}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error removing trace for ${msisdn}`, error);
      throw error;
    }
  }

  /**
   * Get trace log for MSISDN
   */
  async getTraceLog(msisdn: string, maxLines: number = 1000): Promise<TraceLog | null> {
    try {
      logger.debug(`Getting trace log for MSISDN: ${msisdn}`);

      const response = await this.fdsService.executeCommand('getTraceLog', {
        msisdn,
        maxLines,
      });

      if (response.success && response.data) {
        const traceLog: TraceLog = {
          msisdn,
          traceLevel: response.data.traceLevel || 0,
          startTime: new Date(response.data.startTime),
          duration: response.data.duration || 0,
          lines: this.parseTraceLines(response.data.lines || []),
        };

        return traceLog;
      }

      return null;
    } catch (error) {
      logger.error(`Error getting trace log for ${msisdn}`, error);
      throw error;
    }
  }

  /**
   * Parse trace lines from response
   */
  private parseTraceLines(lines: any[]): TraceLine[] {
    return lines.map(line => ({
      timestamp: new Date(line.timestamp),
      level: line.level || 'INFO',
      message: line.message || '',
      source: line.source,
    }));
  }

  /**
   * List active traces
   */
  getActiveTraces(): TraceConfig[] {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Check if MSISDN is being traced
   */
  isTraced(msisdn: string): boolean {
    return this.activeTraces.has(msisdn);
  }

  /**
   * Get trace configuration for MSISDN
   */
  getTraceConfig(msisdn: string): TraceConfig | undefined {
    return this.activeTraces.get(msisdn);
  }

  /**
   * Clear all traces
   */
  async clearAllTraces(): Promise<void> {
    const msisdns = Array.from(this.activeTraces.keys());

    for (const msisdn of msisdns) {
      try {
        await this.removeTrace(msisdn);
      } catch (error) {
        logger.error(`Error removing trace for ${msisdn}`, error);
      }
    }

    this.activeTraces.clear();
    logger.info('All traces cleared');
  }

  /**
   * Update trace level for MSISDN
   */
  async updateTraceLevel(msisdn: string, traceLevel: TraceLevel): Promise<boolean> {
    try {
      logger.info(`Updating trace level for ${msisdn} to ${traceLevel}`);

      const response = await this.fdsService.executeCommand('updateTraceLevel', {
        msisdn,
        traceLevel,
      });

      if (response.success) {
        const config = this.activeTraces.get(msisdn);
        if (config) {
          config.traceLevel = traceLevel;
          this.activeTraces.set(msisdn, config);
        }
        logger.info(`Trace level updated successfully for ${msisdn}`);
        return true;
      } else {
        logger.error(`Failed to update trace level for ${msisdn}: ${response.message}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error updating trace level for ${msisdn}`, error);
      throw error;
    }
  }

  /**
   * Export trace log to file
   */
  exportTraceLog(traceLog: TraceLog): string {
    const lines: string[] = [];

    lines.push(`Trace Log for ${traceLog.msisdn}`);
    lines.push(`Trace Level: ${traceLog.traceLevel}`);
    lines.push(`Start Time: ${traceLog.startTime.toISOString()}`);
    lines.push(`Duration: ${traceLog.duration}s`);
    lines.push('');
    lines.push('--- Trace Lines ---');

    for (const line of traceLog.lines) {
      const timestamp = line.timestamp.toISOString();
      const source = line.source ? `[${line.source}]` : '';
      lines.push(`${timestamp} [${line.level}] ${source} ${line.message}`);
    }

    return lines.join('\n');
  }
}

export default TraceLogUtility;
