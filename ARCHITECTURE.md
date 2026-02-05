# Voice Health Detection - System Architecture

## Overview

The Voice Health Detection system utilizes a microservices architecture with clear separation of concerns, asynchronous processing, and comprehensive security layers.

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[Frontend SPA<br/>HTML/CSS/JS]
    end

    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy<br/>Rate Limiting & SSL]
    end

    subgraph "Application Layer"
        API[Node.js Backend<br/>Express + Socket.IO]
        WORKER[BullMQ Workers<br/>Async Processing]
    end

    subgraph "ML Service"
        ML[Python ML Service<br/>Flask + librosa]
        MODEL[(ML Models<br/>Joblib)]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>User & Prediction Data)]
        REDIS[(Redis<br/>Cache & Queue)]
        GRID[(GridFS<br/>Audio Storage)]
    end

    FE -->|HTTP/WebSocket| NGINX
    NGINX -->|Proxy| API
    API -->|Enqueue Job| REDIS
    REDIS -->|Process| WORKER
    WORKER -->|HTTP| ML
    ML -->|Load| MODEL
    API -->|CRUD| MONGO
    API -->|Cache| REDIS
    API -->|Store Audio| GRID
    WORKER -->|Update Status| MONGO
    ML -->|Extract Features| MODEL

    style FE fill:#e1f5ff
    style API fill:#ffe1e1
    style ML fill:#e1ffe1
    style MONGO fill:#fff9e1
    style REDIS fill:#f0e1ff
```

## Component Details

### 1. Frontend Layer
- **Tech Stack:** Vanilla JS, HTML5, CSS3
- **Responsibilities:**
  - User interface rendering
  - Form validation (XSS-protected)
  - WebSocket real-time updates
  - Audio recording & upload

### 2. Backend API (Node.js)
- **Tech Stack:** Express.js, Socket.IO, Mongoose
- **Responsibilities:**
  - User authentication (JWT)
  - Request validation & sanitization
  - Rate limiting
  - Job queue management
  - WebSocket server

**Key Modules:**
- `services/`: Business logic layer
  - `authService.js`: Authentication operations
  - `predictionService.js`: Prediction management
  - `mlService.js`: ML communication client
- `middleware/`: Request processing
  - `authMiddleware.js`: JWT & role verification
  - `rateLimiter.js`: Rate limiting configs
  - `securityMiddleware.js`: NoSQL/XSS protection
- `jobs/`: Async workers
  - `audioAnalysisQueue.js`: BullMQ job queue

### 3. ML Service (Python)
- **Tech Stack:** Flask, librosa, scikit-learn, numpy
- **Responsibilities:**
  - Audio feature extraction
  - ML model inference
  - Model training endpoints

**Features:**
- Audio validation (duration, silence, format)
- Feature extraction (MFCCs, chroma, spectral)
- NaN/Inf protection
- Model health checking

### 4. Data Layer

#### MongoDB
- **Collections:**
  - `users`: User accounts & profiles
  - `predictions`: Prediction results & history
  - `recordings`: Audio metadata

**Indexes:**
- Users: `email` (unique), `role`, `createdAt`
- Predictions: `userId+createdAt`, `recordingId`, `status`
- Compound: `userId+condition+createdAt`

#### Redis
- **Use Cases:**
  - Job queue (BullMQ)
  - Session caching
  - Prediction result caching
  - Token blacklist

#### GridFS
- **Purpose:** Large file storage (audio recordings)
- **Features:** Streaming upload/download

## Security Layers

```mermaid
graph LR
    REQ[Client Request] --> RL[Rate Limiter]
    RL --> CORS[CORS Check]
    CORS --> SANITIZE[Input Sanitize<br/>NoSQL Protection]
    SANITIZE --> XSS[XSS Protection]
    XSS --> CSP[CSP Headers]
    CSP --> AUTH[JWT Verify]
    AUTH --> RBAC[Role Check]
    RBAC --> APP[Application Logic]

    style RL fill:#ffe1e1
    style AUTH fill:#e1ffe1
    style SANITIZE fill:#fff9e1
```

### Security Features
1. **Input Sanitization:** express-mongo-sanitize
2. **Rate Limiting:** Endpoint-specific limits
3. **JWT Authentication:** Access + refresh tokens
4. **WebSocket Auth:** Token-based connection
5. **XSS Protection:** CSP headers + sanitization
6. **Token Blacklist:** Redis-backed revocation

## Data Flow - Prediction

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant Q as Redis Queue
    participant W as Worker
    participant ML as ML Service
    participant DB as MongoDB

    U->>F: Upload Audio
    F->>API: POST /recordings/upload
    API->>DB: Save metadata
    API-->>F: recordingId

    F->>API: POST /predictions (recordingId)
    API->>DB: Create prediction (status: pending)
    API->>Q: Enqueue analysis job
    API-->>F: predictionId (pending)

    W->>Q: Poll for jobs
    Q-->>W: Job data
    W->>ML: POST /predict (audio)
    ML-->>ML: Extract features
    ML-->>ML: Run inference
    ML-->>W: Prediction result

    W->>DB: Update prediction (status: complete)
    W->>F: WebSocket: prediction:update
    F-->>U: Show result
```

## Scaling Strategy

### Horizontal Scaling
- **Backend:** Multiple instances behind Nginx load balancer
- **Workers:** Scale BullMQ workers independently
- **ML Service:** Load balancer across ML instances

### Vertical Scaling
- **MongoDB:** Increase resources for data growth
- **Redis:** Add memory for larger cache/queue

### Performance Optimization
1. **Caching:** Redis for frequent queries
2. **Database:** Compound indexes, aggregation pipelines
3. **Async Processing:** Job queue for ML tasks
4. **CDN:** Static assets delivery

## Monitoring & Observability

```merm aid
graph TB
    APP[Application] --> SENTRY[Sentry<br/>Error Tracking]
    APP --> LOGS[Application Logs]
    APP --> METRICS[Performance Metrics]
    
    SENTRY --> ALERT[Alert System]
    LOGS --> DASHBOARD[Monitoring Dashboard]
    METRICS --> DASHBOARD

    style SENTRY fill:#ffe1e1
    style DASHBOARD fill:#e1f5ff
```

### Monitoring Stack
- **Error Tracking:** Sentry
- **Request Tracing:** X-Trace-ID headers
- **Health Checks:** `/api/health` endpoints
- **Performance:** Execution time tracking

## Deployment Architecture

### Docker Containers
- `voice-health-backend` (x2 replicas)
- `voice-health-ml`
- `voice-health-db` (MongoDB)
- `voice-health-redis`
- `voice-health-proxy` (Nginx)

### Network
- Internal bridge network
- Only Nginx exposed externally (ports 80/443)

### Volumes
- `mongodb_data`: Persistent database
- `redis_data`: Queue persistence
- `ml_models`: ML model files
- `nginx_logs`: Access logs

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Vanilla JS | ES6+ | UI/UX |
| **Backend** | Node.js + Express | 18+ / 4.x | API Server |
| **ML Service** | Python + Flask | 3.9+ / 2.x | ML Inference |
| **Database** | MongoDB | 6.0 | Data Storage |
| **Cache/Queue** | Redis | 7.x | Caching & Jobs |
| **Proxy** | Nginx | 1.24+ | Load Balancer |
| **Queue** | BullMQ | 4.x | Job Processing |
| **Auth** | JWT | - | Authentication |
| **Monitoring** | Sentry | Latest | Error Tracking |

## Key Design Decisions

1. **Microservices:** Separation allows independent scaling
2. **Async Processing:** Queue prevents blocking on slow ML operations
3. **Service Layer:** Business logic separated from routes
4. **Redis Caching:** Reduces database load for frequent queries
5. **MongoDB Aggregation:** Solves N+1 query problem
6. **Multi-stage Docker:** Minimal production images
7. **Health Checks:** Automated recovery and monitoring
