# Scaling Guide - Voice Health Detection System

## Current Capacity

**Baseline Configuration:**
- **Backend:** 2 instances (1 CPU, 512MB each)
- **ML Service:** 1 instance (2 CPU, 1GB)
- **MongoDB:** Single instance
- **Redis:** Single instance
- **Expected Load:** ~100 concurrent users, ~500 predictions/day

---

## Scaling Triggers

### When to Scale

**Horizontal Scaling Needed:**
- CPU utilization > 70% sustained
- Response time > 2s for 95th percentile
- Error rate > 1%
- Queue backlog > 100 jobs

**Vertical Scaling Needed:**
- Memory utilization > 85%
- Database storage > 80% full
- Redis memory evictions increasing

### Monitoring Metrics

```bash
# CPU & Memory
docker stats

# Queue backlog
redis-cli -a $REDIS_PASSWORD LLEN bull:audio-analysis:wait

# Response times
# Check Sentry performance monitoring

# Database size
mongo --eval "db.stats()"
```

---

## Horizontal Scaling Strategies

### 1. Backend API Scaling

**Scale from 2 → 4 instances:**

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 4  # Increase from 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

**Benefits:**
- 2x request handling capacity
- Better fault tolerance
- Load distributed across instances

**Considerations:**
- Ensure session data in Redis (not in-memory)
- WebSocket connections distributed
- Shared token blacklist via Redis

### 2. ML Service Scaling

**Add ML Service Replicas:**

```yaml
# docker-compose.yml
services:
  ml-service:
    deploy:
      replicas: 3  # Add more ML workers
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

**Benefits:**
- Parallel prediction processing
- Reduced queue wait time
- Better ML throughput

**Configuration:**
```javascript
// Increase BullMQ worker concurrency
export const analysisWorker = new Worker(
  'audio-analysis',
  async (job) => { /* ... */ },
  {
    connection: redisConnection,
    concurrency: 5,  // Process 5 jobs per worker
  }
);
```

### 3. BullMQ Worker Scaling

**Separate Worker Service:**

```yaml
# docker-compose.yml
services:
  worker:
    build:
      context: .
      target: backend
    command: node jobs/worker.js
    deploy:
      replicas: 3
    environment:
      WORKER_MODE: true
      REDIS_HOST: redis
```

**Worker Startup Script:**
```javascript
// jobs/worker.js
import { analysisWorker } from './audioAnalysisQueue.js';

console.log('Worker started, waiting for jobs...');

process.on('SIGTERM', async () => {
  await analysisWorker.close();
  process.exit(0);
});
```

---

## Vertical Scaling

### MongoDB Scaling

**Increase Resources:**
```yaml
# docker-compose.yml
services:
  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'      # from 1
          memory: 2G     # from 1G
```

**Optimize Configuration:**
```javascript
// Mongoose connection options
mongoose.connect(mongoUri, {
  maxPoolSize: 20,        // Increase from 10
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Redis Scaling

**Increase Memory:**
```yaml
# docker-compose.yml
services:
  redis:
    command: redis-server --maxmemory 2gb  # from 512mb
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## Database Sharding (Advanced)

### MongoDB Replica Set

**For High Availability:**

```yaml
# docker-compose.yml
services:
  mongo-primary:
    image: mongo:6.0
    command: mongod --replSet rs0 --port 27017

  mongo-secondary1:
    image: mongo:6.0
    command: mongod --replSet rs0 --port 27018

  mongo-secondary2:
    image: mongo:6.0
    command: mongod --replSet rs0 --port 27019
```

**Initialize Replica Set:**
```bash
mongo --eval "
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo-primary:27017' },
      { _id: 1, host: 'mongo-secondary1:27018' },
      { _id: 2, host: 'mongo-secondary2:27019' }
    ]
  })
"
```

---

## Load Balancing

### Nginx Configuration

**Round-Robin Load Balancing:**

```nginx
# nginx/nginx.conf
upstream backend {
    least_conn;  # Route to least busy instance
    server backend-1:5000 weight=1;
    server backend-2:5000 weight=1;
    server backend-3:5000 weight=1;
    server backend-4:5000 weight=1;

    # Health checks
    keepalive 32;
}

upstream ml-service {
    server ml-service-1:5001;
    server ml-service-2:5001;
    server ml-service-3:5001;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Caching Strategy

### Redis Caching Tiers

**1. Hot Data (TTL: 5 minutes)**
- User sessions
- Prediction results (by audio hash)

**2. Warm Data (TTL: 1 hour)**
- User profiles
- Prediction statistics

**3. Cold Data (TTL: 24 hours)**
- Historical data
- Public statistics

**Implementation:**
```javascript
// Different TTLs based on data type
await cacheUtil.setCache(`prediction:${hash}`, result, 300);    // 5 min
await cacheUtil.setCache(`user:${id}`, userData, 3600);         // 1 hour
await cacheUtil.setCache(`stats:global`, stats, 86400);         // 24 hours
```

---

## Cost Optimization

### Resource Allocation

| Component | Small (100 users) | Medium (500 users) | Large (2000 users) |
|-----------|-------------------|--------------------|--------------------|
| **Backend** | 2 x 512MB | 4 x 512MB | 8 x 1GB |
| **ML Service** | 1 x 1GB | 3 x 1GB | 6 x 2GB |
| **MongoDB** | 1 x 1GB | 1 x 2GB | 3 x 4GB (replica) |
| **Redis** | 1 x 512MB | 1 x 1GB | 1 x 2GB |
| **Workers** | Included in backend | 2 x 512MB | 4 x 512MB |

### Auto-Scaling Rules

**Kubernetes HPA (if using K8s):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: "http://localhost"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Prediction flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "Test123!"
          capture:
            json: "$.data.tokens.accessToken"
            as: "token"
      - post:
          url: "/api/v1/predictions"
          headers:
            Authorization: "Bearer {{ token }}"
          beforeRequest: "uploadAudio"
```

**Run Test:**
```bash
artillery run load-test.yml
```

---

## Disaster Recovery

### Backup Strategy

**MongoDB Backups:**
```bash
# Daily backups
0 2 * * * docker exec voice-health-db mongodump --out /backup/$(date +\%Y-\%m-\%d)

# Restore
docker exec voice-health-db mongorestore /backup/2026-02-05
```

**Redis Persistence:**
```yaml
# docker-compose.yml
services:
  redis:
    command: redis-server --appendonly yes --save 900 1
```

### Failover Plan

1. **Database Failure:** Switch to replica (if using replica set)
2. **Backend Failure:** Load balancer routes to healthy instances
3. **ML Service Failure:** Queue retries automatically
4. **Complete Failure:** Restore from backups

---

## Monitoring Scaling Effectiveness

### Key Metrics

**Before Scaling:**
- Response time (p95): X ms
- Error rate: Y%
- Queue depth: Z jobs

**After Scaling:**
- Response time improved by: ____%
- Error rate reduced to: ____%
- Queue depth reduced to: ___

**Track in Sentry/Monitoring:**
- Request throughput (req/s)
- CPU/Memory utilization
- Queue processing time
- Error rates by endpoint

---

## Quick Reference Commands

```bash
# Scale backend to 4 instances
docker-compose up -d --scale backend=4

# Scale ML service to 3 instances
docker-compose up -d --scale ml-service=3

# Check current scaling
docker-compose ps

# View resource usage
docker stats

# Check queue depth
redis-cli -a $REDIS_PASSWORD LLEN bull:audio-analysis:wait

# Monitor logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend
```

---

## Next Steps

1. **Implement monitoring dashboards** (Grafana recommended)
2. **Set up auto-scaling** triggers
3. **Load test** with target user count
4. **Optimize** based on bottlenecks identified
5. **Document** your specific scaling thresholds
