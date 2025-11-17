/**
 * SDP (Service Data Point) Types and Interfaces
 */

export interface TraceLog {
  msisdn: string;
  traceLevel: number;
  startTime: Date;
  duration: number;
  lines: TraceLine[];
}

export interface TraceLine {
  timestamp: Date;
  level: string;
  message: string;
  source?: string;
}

export interface TraceConfig {
  msisdn: string;
  traceLevel: number;
  duration?: number; // in seconds
  filters?: string[];
}

export interface FDSSession {
  sessionId: string;
  sdpId: string;
  connected: boolean;
  loginTime: Date;
  lastActivityTime: Date;
}

export interface FDSRequest {
  command: string;
  params?: Record<string, any>;
}

export interface FDSResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export enum TraceLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

export interface SDPConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  timeout?: number;
}
