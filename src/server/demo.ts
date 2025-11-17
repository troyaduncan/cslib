#!/usr/bin/env node
/**
 * Demo server that runs without database
 * For testing the API structure and endpoints
 */
import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { config } from '../config';

const app: Application = express();

// Security middleware - disable CSP for demo
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint - redirect to GUI
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    mode: 'demo',
    timestamp: new Date().toISOString(),
  });
});

// Mock AIR endpoints
app.post('/api/air/balance', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      responseCode: 0,
      data: {
        subscriberNumber: req.body.subscriberNumber || '1234567890',
        balance: 10000,
        currency: 'USD',
        accountId: 'ACC123456',
      },
      message: 'DEMO: Mock balance response',
    },
  });
});

app.post('/api/air/refill', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      responseCode: 0,
      data: {
        subscriberNumber: req.body.subscriberNumber || '1234567890',
        refillAmount: req.body.refillAmount || 0,
        newBalance: 15000,
        transactionId: `TXN${Date.now()}`,
      },
      message: 'DEMO: Mock refill response',
    },
  });
});

app.post('/api/air/account-details', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      responseCode: 0,
      data: {
        subscriberNumber: req.body.subscriberNumber || '1234567890',
        accountId: 'ACC123456',
        serviceClassId: 'SC001',
        balance: 10000,
        offers: [
          { offerId: 1, offerType: 'DATA', expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        ],
        dedicatedAccounts: [
          { accountId: 1, accountValue: 5000, unitType: 1 },
        ],
      },
      message: 'DEMO: Mock account details response',
    },
  });
});

app.post('/api/air/update-balance', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      responseCode: 0,
      data: {
        subscriberNumber: req.body.subscriberNumber || '1234567890',
        adjustmentAmount: req.body.adjustmentAmount || 0,
        newBalance: 10500,
        transactionId: `TXN${Date.now()}`,
      },
      message: 'DEMO: Mock balance update response',
    },
  });
});

app.get('/api/air/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalRequests: 42,
      successfulRequests: 40,
      failedRequests: 2,
      averageResponseTime: 125.5,
      lastResetTime: new Date(Date.now() - 3600000),
      message: 'DEMO: Mock statistics',
    },
  });
});

// Mock Account Finder endpoints
app.post('/api/account/locate', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      found: true,
      sdpId: 'SDP001',
      ipAddress: '10.0.0.1',
      msisdn: req.body.msisdn || '1234567890',
      message: 'DEMO: Mock account location',
    },
  });
});

app.post('/api/account/locate-batch', (req: Request, res: Response) => {
  const msisdns = req.body.msisdns || ['1234567890'];
  const result: any = {};
  msisdns.forEach((msisdn: string, index: number) => {
    result[msisdn] = {
      found: true,
      sdpId: `SDP00${index + 1}`,
      ipAddress: `10.0.0.${index + 1}`,
    };
  });

  res.json({
    success: true,
    data: result,
    message: 'DEMO: Mock batch location',
  });
});

// Mock Definitions endpoints
app.get('/api/definitions/offers', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        offerId: 'OFFER001',
        offerName: 'Basic Data Plan',
        description: '5GB monthly data',
        active: true,
        priority: 1,
      },
      {
        offerId: 'OFFER002',
        offerName: 'Premium Data Plan',
        description: '20GB monthly data',
        active: true,
        priority: 2,
      },
    ],
    message: 'DEMO: Mock offers',
  });
});

app.get('/api/definitions/counters', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        counterId: 'CTR001',
        counterName: 'Data Usage Counter',
        counterType: 'DATA',
        unitType: 'BYTES',
        active: true,
      },
    ],
    message: 'DEMO: Mock counters',
  });
});

app.get('/api/definitions/air-nodes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        nodeId: 'NODE001',
        nodeName: 'AIR Node 1',
        host: '10.1.1.1',
        port: 8080,
        environment: 'lab',
        active: true,
      },
      {
        nodeId: 'NODE002',
        nodeName: 'AIR Node 2',
        host: '10.1.1.2',
        port: 8080,
        environment: 'lab',
        active: true,
      },
    ],
    message: 'DEMO: Mock AIR nodes',
  });
});

app.get('/api/definitions/service-classes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        serviceClassId: 'SC001',
        serviceClassName: 'Premium Service',
        description: 'Premium tier service class',
        priority: 1,
        active: true,
      },
      {
        serviceClassId: 'SC002',
        serviceClassName: 'Standard Service',
        description: 'Standard tier service class',
        priority: 2,
        active: true,
      },
    ],
    message: 'DEMO: Mock service classes',
  });
});

app.get('/api/definitions/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      offers: 10,
      counters: 5,
      serviceClasses: 3,
      airNodes: 2,
      loaded: true,
      message: 'DEMO: Mock definition stats',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.originalUrl}`,
      statusCode: 404,
    },
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      statusCode: 500,
    },
  });
});

// Start server
const PORT = config.node.port;
const HOST = config.node.host;

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         CSLib API Server - DEMO MODE                       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Status: Running                                           ║`);
  console.log(`║  URL: http://${HOST}:${PORT.toString().padEnd(45)}║`);
  console.log(`║  GUI Dashboard: http://${HOST}:${PORT.toString().padEnd(33)}║`);
  console.log(`║  Environment: ${config.environment.padEnd(45)}║`);
  console.log(`║  Mode: DEMO (No database required)                         ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  🎨 Open your browser to test all API functionality!       ║');
  console.log('║                                                            ║');
  console.log('║  Available Endpoints:                                      ║');
  console.log('║    GET  /                     - Testing Dashboard (GUI)    ║');
  console.log('║    GET  /api/health           - Health check               ║');
  console.log('║    POST /api/air/balance      - Get balance (mock)         ║');
  console.log('║    POST /api/air/refill       - Refill (mock)              ║');
  console.log('║    POST /api/air/update-balance - Update balance (mock)    ║');
  console.log('║    POST /api/air/account-details - Account details (mock)  ║');
  console.log('║    GET  /api/air/stats        - AIR stats (mock)           ║');
  console.log('║    POST /api/account/locate   - Locate account (mock)      ║');
  console.log('║    GET  /api/definitions/*    - Get definitions (mock)     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
