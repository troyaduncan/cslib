import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { getLogger } from '../utils/logger';
import { UCIPRequest, UCIPResponse } from './types';

const logger = getLogger('XmlRpcClient');

export interface XmlRpcClientConfig {
  host: string;
  port: number;
  path?: string;
  timeout?: number;
  maxConnections?: number;
}

/**
 * XML-RPC Client for AIR/UCIP communication
 */
export class XmlRpcClient {
  private client: AxiosInstance;
  private config: XmlRpcClientConfig;
  private parser: XMLParser;
  private builder: XMLBuilder;
  private url: string;

  constructor(config: XmlRpcClientConfig) {
    this.config = {
      ...config,
      path: config.path || '/Air',
      timeout: config.timeout || 30000,
      maxConnections: config.maxConnections || 20,
    };

    this.url = `http://${this.config.host}:${this.config.port}${this.config.path}`;

    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'text/xml',
        'User-Agent': 'CSLib-NodeJS/1.0',
      },
      maxRedirects: 0,
      validateStatus: () => true, // Handle all status codes manually
    });

    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
    });
  }

  /**
   * Build XML-RPC request body
   */
  private buildXmlRpcRequest(request: UCIPRequest): string {
    const methodCall = {
      methodCall: {
        methodName: request.methodName,
        params: {
          param: request.params.map(param => ({
            value: this.buildValue(param),
          })),
        },
      },
    };

    return this.builder.build(methodCall);
  }

  /**
   * Build XML-RPC value element based on type
   */
  private buildValue(value: any): any {
    if (typeof value === 'string') {
      return { string: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { int: value };
      } else {
        return { double: value };
      }
    } else if (typeof value === 'boolean') {
      return { boolean: value ? 1 : 0 };
    } else if (value instanceof Date) {
      return { 'dateTime.iso8601': value.toISOString() };
    } else if (Array.isArray(value)) {
      return {
        array: {
          data: {
            value: value.map(item => this.buildValue(item)),
          },
        },
      };
    } else if (typeof value === 'object' && value !== null) {
      return {
        struct: {
          member: Object.entries(value).map(([name, val]) => ({
            name,
            value: this.buildValue(val),
          })),
        },
      };
    }
    return { string: String(value) };
  }

  /**
   * Parse XML-RPC response
   */
  private parseXmlRpcResponse(xml: string): UCIPResponse {
    try {
      const parsed = this.parser.parse(xml);

      if (parsed.methodResponse?.fault) {
        const fault = this.extractValue(parsed.methodResponse.fault.value);
        return {
          responseCode: fault.faultCode || -1,
          responseMessage: fault.faultString || 'Unknown fault',
        };
      }

      if (parsed.methodResponse?.params) {
        const params = parsed.methodResponse.params.param;
        const paramArray = Array.isArray(params) ? params : [params];
        const data = paramArray.map(param => this.extractValue(param.value));

        return {
          responseCode: 0,
          data: data.length === 1 ? data[0] : data,
        };
      }

      throw new Error('Invalid XML-RPC response format');
    } catch (error) {
      logger.error('Error parsing XML-RPC response', error);
      throw error;
    }
  }

  /**
   * Extract value from XML-RPC value element
   */
  private extractValue(valueNode: any): any {
    if (!valueNode) return null;

    if (valueNode.string !== undefined) return valueNode.string;
    if (valueNode.int !== undefined) return parseInt(valueNode.int, 10);
    if (valueNode.i4 !== undefined) return parseInt(valueNode.i4, 10);
    if (valueNode.double !== undefined) return parseFloat(valueNode.double);
    if (valueNode.boolean !== undefined) return Boolean(valueNode.boolean);
    if (valueNode['dateTime.iso8601'] !== undefined) return new Date(valueNode['dateTime.iso8601']);

    if (valueNode.array) {
      const data = valueNode.array.data;
      if (!data || !data.value) return [];
      const values = Array.isArray(data.value) ? data.value : [data.value];
      return values.map(v => this.extractValue(v));
    }

    if (valueNode.struct) {
      const members = Array.isArray(valueNode.struct.member)
        ? valueNode.struct.member
        : [valueNode.struct.member];
      const result: any = {};
      members.forEach((member: any) => {
        result[member.name] = this.extractValue(member.value);
      });
      return result;
    }

    return null;
  }

  /**
   * Execute XML-RPC method call
   */
  async call(request: UCIPRequest): Promise<UCIPResponse> {
    const startTime = Date.now();

    try {
      logger.debug(`Calling XML-RPC method: ${request.methodName} to ${this.url}`);

      const requestBody = this.buildXmlRpcRequest(request);
      logger.debug(`Request XML: ${requestBody}`);

      const response = await this.client.post(this.url, requestBody);

      const responseTime = Date.now() - startTime;
      logger.debug(`Response received in ${responseTime}ms, status: ${response.status}`);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ucipResponse = this.parseXmlRpcResponse(response.data);
      logger.debug(`UCIP Response Code: ${ucipResponse.responseCode}`);

      return ucipResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`XML-RPC call failed after ${responseTime}ms`, error);
      throw error;
    }
  }

  /**
   * Get client URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Get client configuration
   */
  getConfig(): XmlRpcClientConfig {
    return { ...this.config };
  }
}

export default XmlRpcClient;
