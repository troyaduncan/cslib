# CSLib - T-Mobile Charging System Integration Library

A comprehensive Node.js + TypeScript library for integrating with T-Mobile's backend telecom systems, including AIR (Ericsson charging system), SDP (Service Data Point), and account management.

## 🎨 GUI Testing Dashboard

A **beautiful web-based GUI** is included for testing all API functionality! Simply run:

```bash
npm run demo
```

Then open your browser to **http://localhost:3000** to access the interactive testing dashboard.

The GUI provides:
- ✅ **Tab-based interface** for different services (AIR, Account Finder, Definitions, Statistics)
- ✅ **Pre-filled test data** for quick testing
- ✅ **Real-time API responses** with formatted JSON
- ✅ **Beautiful gradient design** with responsive layout
- ✅ **No database required** - uses mock data
- ✅ **Live status indicator**

## Features

- **AIR Module**: Integration with Ericsson AIR charging system using UCIP protocol
  - XML-RPC communication with connection pooling
  - Balance inquiries, refills, and account updates
  - Number series-based routing with load balancing
  - Transaction statistics and monitoring

- **SDP Module**: Service Data Point integration
  - FDS (Fault Detection System) service client
  - Subscriber trace logging management
  - Session management

- **Account Finder**: DNS-based account location resolution
  - Locate subscriber accounts across SDP systems
  - Batch lookup support

- **IN Resource Definitions**: Centralized management of Intelligent Network resources
  - Offers, counters, thresholds, service classes
  - Database-backed configuration with caching
  - CRUD operations for all definition types

- **Database Layer**: TypeORM-based data access with PostgreSQL
  - Entity management
  - Repository pattern

- **Utilities**: SSH client, hex dump, logging (Winston)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=cslib

# AIR Configuration
AIR_MAX_CONNECTIONS=200
AIR_MAX_CONNECTIONS_PER_ROUTE=20

# Environment
ENVIRONMENT=lab
```

## Usage

### As a Library

```typescript
import {
  initializeCSLib,
  AIRService,
  AccountLocator,
  INResourceDefinitions
} from '@tmo/cslib';

// Initialize the library
await initializeCSLib();

// Use AIR service
const airService = AIRService.getInstance();
const balanceResponse = await airService.getBalance({
  subscriberNumber: '1234567890',
});

// Use Account Finder
const accountLocator = new AccountLocator();
const location = await accountLocator.locateAccount('1234567890');

// Use IN Resource Definitions
const inDefs = INResourceDefinitions.getInstance();
const offers = inDefs.getAllOffers();
```

### As a Standalone Server

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

### AIR Operations

#### Get Balance
```
POST /api/air/balance
{
  "subscriberNumber": "1234567890",
  "requestedInformationFlags": 0,
  "afType": "lab"
}
```

#### Refill Account
```
POST /api/air/refill
{
  "subscriberNumber": "1234567890",
  "refillAmount": 1000,
  "transactionCurrency": "USD"
}
```

#### Update Balance
```
POST /api/air/update-balance
{
  "subscriberNumber": "1234567890",
  "adjustmentAmount": 500,
  "transactionType": "ADJUSTMENT"
}
```

#### Get Account Details
```
POST /api/air/account-details
{
  "subscriberNumber": "1234567890"
}
```

#### Get Statistics
```
GET /api/air/stats
```

### Account Operations

#### Locate Account
```
POST /api/account/locate
{
  "msisdn": "1234567890"
}
```

#### Batch Locate Accounts
```
POST /api/account/locate-batch
{
  "msisdns": ["1234567890", "0987654321"]
}
```

### IN Resource Definitions

#### Get All Offers
```
GET /api/definitions/offers
```

#### Get Active Offers
```
GET /api/definitions/offers/active
```

#### Get Offer by ID
```
GET /api/definitions/offers/:offerId
```

#### Get All Counters
```
GET /api/definitions/counters
```

#### Get All Service Classes
```
GET /api/definitions/service-classes
```

#### Get All AIR Nodes
```
GET /api/definitions/air-nodes
```

#### Get Cache Statistics
```
GET /api/definitions/stats
```

#### Reload Definitions
```
POST /api/definitions/reload
```

## Project Structure

```
cslib/
├── src/
│   ├── air/                  # AIR module (UCIP/XML-RPC)
│   │   ├── AIRService.ts
│   │   ├── XmlRpcClient.ts
│   │   └── types.ts
│   ├── sdp/                  # SDP module (FDS, trace logging)
│   │   ├── FDSService.ts
│   │   ├── TraceLogUtility.ts
│   │   └── types.ts
│   ├── af/                   # Account Finder (DNS resolution)
│   │   └── AccountLocator.ts
│   ├── defs/                 # IN Resource Definitions
│   │   └── INResourceDefinitions.ts
│   ├── entities/             # TypeORM entities
│   │   ├── OfferDefinition.ts
│   │   ├── CounterDefinition.ts
│   │   ├── ServiceClassDefinition.ts
│   │   └── AirNodeConfig.ts
│   ├── dao/                  # Data Access Layer
│   │   └── OfferRepository.ts
│   ├── config/               # Configuration
│   │   ├── index.ts
│   │   └── database.ts
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── hex-dump.ts
│   │   └── ssh-client.ts
│   ├── server/               # Express server
│   │   ├── app.ts
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── middleware/
│   └── index.ts              # Main library export
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Run Tests

```bash
npm test
```

## Database Setup

The application uses PostgreSQL. Create the database and tables:

```sql
CREATE DATABASE cslib;

-- Create tables for entities
CREATE TABLE offer_definitions (
  offer_id VARCHAR(50) PRIMARY KEY,
  offer_name VARCHAR(255),
  description VARCHAR(500),
  offer_type VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  priority INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE counter_definitions (
  counter_id VARCHAR(50) PRIMARY KEY,
  counter_name VARCHAR(255),
  description VARCHAR(500),
  counter_type VARCHAR(50),
  unit_type VARCHAR(50),
  initial_value BIGINT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_class_definitions (
  service_class_id VARCHAR(50) PRIMARY KEY,
  service_class_name VARCHAR(255),
  description VARCHAR(500),
  priority INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE air_node_configs (
  node_id VARCHAR(50) PRIMARY KEY,
  node_name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER DEFAULT 8080,
  url VARCHAR(500),
  af_type VARCHAR(50),
  environment VARCHAR(50) DEFAULT 'lab',
  active BOOLEAN DEFAULT TRUE,
  max_connections INTEGER DEFAULT 10,
  timeout INTEGER DEFAULT 30000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Architecture

### Singleton Pattern
- `AIRService`: Manages AIR connections and routing
- `INResourceDefinitions`: Centralized resource management

### Repository Pattern
- TypeORM repositories for data access
- Separation of data access logic

### Connection Pooling
- Configurable connection limits per route
- Round-robin load balancing

### Error Handling
- Custom `AppError` class
- Global error handler middleware
- Async error wrapper

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express 4.18
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL
- **HTTP Client**: Axios
- **XML Processing**: fast-xml-parser
- **Logging**: Winston
- **SSH**: ssh2
- **DNS**: dns, dns-packet

## Conversion from Java

This project was converted from a Java Spring + Maven project to Node.js + TypeScript:

| Java | Node.js/TypeScript |
|------|-------------------|
| Spring Framework | Express + Custom DI |
| MyBatis | TypeORM |
| Maven | npm |
| Log4j2 | Winston |
| Apache HttpClient | Axios |
| XStream | fast-xml-parser |
| JSch | ssh2 |
| dnsjava | dns, dns-packet |

## License

UNLICENSED - T-Mobile Internal Use

## Support

For issues and questions, please contact the development team.
