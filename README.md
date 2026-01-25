# Microservices Order Management System

A comprehensive microservices-based order management system built with TypeScript, demonstrating modern distributed systems patterns.

## Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Web Browser   │
                                    │ (Micro-frontend)│
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │     NGINX       │
                                    │  Load Balancer  │
                                    └────────┬────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         ▼                   ▼                   │
                ┌─────────────────┐ ┌─────────────────┐          │
                │  API Gateway 1  │ │  API Gateway 2  │          │
                │   (REST + JWT)  │ │   (REST + JWT)  │          │
                └────────┬────────┘ └────────┬────────┘          │
                         │                   │                   │
                         └─────────┬─────────┘                   │
                                   │                             │
              ┌────────────────────┼────────────────────┐        │
              │                    │                    │        │
              ▼                    ▼                    ▼        │
     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │  Order Service  │  │  Notification   │  │   Analytics     │
     │   (PostgreSQL)  │  │    Service      │  │    Service      │
     └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
              │                    │                    │
              │    RabbitMQ        │      Redis         │
              │◄──────────────────►│◄──────────────────►│
              │                    │                    │
              │         Kafka                           │
              │◄───────────────────────────────────────►│
              │                                         
              ▼                                         
     ┌─────────────────┐      ┌─────────────────┐
     │  FaaS Connector │─────►│  Email Function │
     │   (RabbitMQ)    │      │   (OpenFaaS)    │
     └─────────────────┘      └─────────────────┘
```

## Features

| Requirement | Implementation |
|-------------|----------------|
| Secured REST API | JWT authentication with role-based access control |
| Load Balancer | NGINX with least-conn algorithm, 2 API Gateway instances |
| Scalable WebSockets | Socket.IO with Redis adapter for cross-instance communication |
| Message Broker | RabbitMQ for async service communication |
| Event Streaming | Apache Kafka for order analytics events |
| FaaS | OpenFaaS with of-watchdog, scales 0-10 instances |
| Micro-frontend | React-based modular frontend (Shell, Orders, Analytics, Notifications) |
| Containers | Docker & Docker Compose orchestration |

## Services

| Service | Port | Description |
|---------|------|-------------|
| NGINX | 80 | Load balancer & reverse proxy |
| API Gateway (x2) | 3000 | REST API, JWT auth, WebSocket |
| Order Service | 3001 | Order CRUD, PostgreSQL |
| Notification Service | 3002 | Real-time notifications, Redis pub/sub |
| Analytics Service | 3003 | Kafka consumer, aggregations |
| Email Function | 8082 | OpenFaaS serverless function |
| FaaS Connector | - | RabbitMQ to OpenFaaS bridge |
| Web App | 8080 | React micro-frontend |
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | WebSocket scaling, caching |
| RabbitMQ | 5672/15672 | Message broker |
| Kafka | 9092 | Event streaming |
| OpenFaaS Gateway | 8081 | FaaS management |
| NATS | 4222 | OpenFaaS messaging |

## Quick Start

```bash
cd microservices-project

docker-compose up --build -d

docker-compose ps

docker-compose logs -f
```

Services will start in order based on health checks. Allow 1-2 minutes for everything to be ready.

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:8080 | - |
| API | http://localhost/api | - |
| RabbitMQ UI | http://localhost:15672 | admin / admin123 |
| OpenFaaS Gateway | http://localhost:8081 | - |
| Email Function | http://localhost:8082 | - |

## Demo Credentials

- **Admin**: admin@example.com / admin123
- **Or register a new user**

## API Endpoints

### Authentication
```
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login and get JWT token
GET  /api/auth/me        - Get current user info
```

### Orders (Protected)
```
GET    /api/orders       - List user's orders
POST   /api/orders       - Create new order
GET    /api/orders/:id   - Get order details
PUT    /api/orders/:id   - Update order status
DELETE /api/orders/:id   - Cancel order
```

### Analytics (Admin only)
```
GET /api/analytics/dashboard  - Get analytics dashboard
```

## FaaS (Function as a Service)

The email function uses OpenFaaS with of-watchdog:

**How it works:**
1. Order is created via API Gateway
2. API Gateway publishes email request to RabbitMQ
3. FaaS Connector consumes message from queue
4. FaaS Connector invokes Email Function via HTTP
5. Email Function processes request and returns result

**Scaling:**
- Minimum instances: 0 (scales to zero when idle)
- Maximum instances: 10
- Automatic scaling based on load

**Test the function directly:**
```bash
curl -X POST http://localhost:8082 \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello","userId":"123"}'
```

## Project Structure

```
microservices-project/
├── api-gateway/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── types/
├── order-service/
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── services/
│       └── types/
├── notification-service/
│   └── src/
│       ├── config/
│       ├── services/
│       └── types/
├── analytics-service/
│   └── src/
│       ├── config/
│       ├── services/
│       └── types/
├── email-faas/
│   └── function/
│       └── handler.js
├── faas-connector/
│   └── src/
├── web-app/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── micro-frontends/
│       │   ├── shell/
│       │   ├── orders/
│       │   ├── analytics/
│       │   └── notifications/
│       ├── services/
│       └── types/
├── nginx/
├── shared/
└── docker-compose.yml
```

## Technology Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript 5
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Broker**: RabbitMQ 3
- **Event Streaming**: Apache Kafka
- **FaaS**: OpenFaaS with of-watchdog
- **Load Balancer**: NGINX
- **Frontend**: React 18 + Vite
- **Containerization**: Docker

## Stopping the Project

```bash
docker-compose down

docker-compose down -v
```

## Troubleshooting

**Services not starting:**
```bash
docker-compose logs api-gateway-1
docker-compose logs order-service
```

**Database connection issues:**
```bash
docker-compose ps postgres
```

**Kafka not ready:**
```bash
docker-compose logs kafka
```

**OpenFaaS function not responding:**
```bash
docker-compose logs send-email
docker-compose logs faas-connector
```