/**
 * UCIP (Unified Customer Interface Protocol) Types and Interfaces
 */

export interface UCIPRequest {
  methodName: string;
  params: any[];
}

export interface UCIPResponse {
  responseCode: number;
  responseMessage?: string;
  data?: any;
}

// Subscriber Data
export interface SubscriberInfo {
  subscriberNumber: string;
  accountId?: string;
  serviceClassId?: string;
  languageId?: string;
  supervisionExpiryDate?: Date;
  serviceRemovalDate?: Date;
  accountFlags?: number;
}

// Account Balance
export interface AccountBalance {
  accountId: string;
  balance: number;
  currency?: string;
  supervisionExpiryDate?: Date;
}

// Dedicated Account
export interface DedicatedAccount {
  accountId: number;
  accountValue: number;
  expiryDate?: Date;
  startDate?: Date;
  unitType?: number;
}

// Offer Information
export interface OfferInfo {
  offerId: number;
  offerType?: number;
  startDate?: Date;
  expiryDate?: Date;
}

// Accumulator Information
export interface AccumulatorInfo {
  accumulatorId: number;
  accumulatorValue: number;
  startDate?: Date;
  expiryDate?: Date;
}

// Refill Request
export interface RefillRequest {
  subscriberNumber: string;
  refillAmount: number;
  transactionId?: string;
  transactionCurrency?: string;
  profileId?: string;
}

// Get Balance Request
export interface GetBalanceRequest {
  subscriberNumber: string;
  requestedInformationFlags?: number;
}

// Update Balance Request
export interface UpdateBalanceRequest {
  subscriberNumber: string;
  adjustmentAmount: number;
  transactionId?: string;
  transactionType?: string;
}

// Get Account Details Request
export interface GetAccountDetailsRequest {
  subscriberNumber: string;
  requestedInformationFlags?: number;
}

// UCIP Response Codes
export enum UCIPResponseCode {
  SUCCESS = 0,
  SUBSCRIBER_NOT_FOUND = 100,
  INSUFFICIENT_BALANCE = 102,
  INVALID_AMOUNT = 103,
  SYSTEM_ERROR = 1,
  TIMEOUT = 2,
  CONNECTION_ERROR = 3,
}

// Transaction Statistics
export interface TransactionStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResetTime: Date;
}

// Routing Destination
export interface RoutingDestination {
  nodeId: string;
  host: string;
  port: number;
  url: string;
  weight?: number;
  active: boolean;
}

// Number Series Route
export interface NumberSeriesRoute {
  prefix: string;
  destinations: RoutingDestination[];
  roundRobinIndex: number;
}
