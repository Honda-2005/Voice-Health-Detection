# Pre-Deployment Security & Cleanup Guide

> **⚠️ CRITICAL:** Complete ALL steps in this guide before deploying to production!

---

## Part 1: MongoDB Credential Rotation

### Why This Is Critical
Your MongoDB credentials were committed to Git in the `.env` file. Even though we've now excluded it, the credentials are still in Git history and potentially accessible to anyone with repository access.

### Step-by-Step Process

#### 1. Rotate Credentials in MongoDB Atlas

1. **Log in to MongoDB Atlas:**
   - Go to https://cloud.mongodb.com
   - Sign in with your account

2. **Navigate to Database Access:**
   - Select your project
   - Click "Database Access" in the left sidebar

3. **Create New Database User:**
   ```
   Username: voice_health_prod_user
   Password: [Generate strong password - save in password manager]
   Privileges: Read and write to any database
   ```
   - Click "Add User"

4. **Update Connection String:**
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy new connection string with new credentials
   - Save to `.env` file (local only, not committed!)

5. **Delete Old User:**
   - Find the old user (`mohaned2308326_db_user`)
   - Click "Delete" to revoke access
   - Confirm deletion

6. **Test New Connection:**
   ```bash
   # Update .env with new credentials
   npm run dev
   # Should connect successfully
   ```

---

## Part 2: Purge .env from Git History

### Why This Is Critical
The `.env` file with exposed credentials is in Git history. Anyone who clones the repository can see old commits with the credentials.

### Option A: Using git-filter-repo (Recommended)

**Install git-filter-repo:**
```bash
# Windows (with Python)
pip install git-filter-repo

# macOS
brew install git-filter-repo

# Linux
sudo apt-get install git-filter-repo
```

**Purge .env from history:**
```bash
# IMPORTANT: Make backup first!
git clone . ../voice-health-backup

# Remove .env from all commits
git filter-repo --path .env --invert-paths

# Force push to remote (DANGEROUS - warns collaborators first!)
git push origin --force --all
git push origin --force --tags
```

### Option B: Using BFG Repo-Cleaner (Faster for large repos)

**Download BFG:**
```bash
# Download from https://rtyley.github.io/bfg-repo-cleaner/
# Or use:
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

**Clean repository:**
```bash
# Make backup
git clone . ../voice-health-backup

# Remove .env
java -jar bfg-1.14.0.jar --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### Verification

```bash
# Search for any remaining .env references
git log --all --full-history --source -- .env
# Should return nothing

# Search for credential string
git log --all -p | grep "mongodb+srv://mohaned2308326"
# Should return nothing after successful cleanup
```

---

## Part 3: Medical Disclaimer Review

### Legal Checklist

**Before deploying, ensure:**

- [ ] Disclaimer page (`frontend/views/disclaimer.html`) reviewed by legal counsel
- [ ] User must accept 3 checkboxes before accessing system
- [ ] Disclaimer stored in database with timestamp
- [ ] "NOT A MEDICAL DEVICE" warning on every prediction page
- [ ] Terms of Service and Privacy Policy created (if needed)

**Recommended Additions:**

Create `frontend/views/terms.html` and `frontend/views/privacy.html` with:
- Terms of Service
- Privacy Policy
- Data retention policy
- User rights (GDPR/CCPA compliance)

---

## Part 4: Manual API Testing

### Critical Endpoint Tests

**1. Health Checks:**
```bash
# Backend health
curl http://localhost:5000/api/health
# Expected: {"status":"healthy","mongodb":"connected"}

# ML Service health  
curl http://localhost:5001/ml/health
# Expected: {"status":"healthy","model_loaded":true/false}
```

**2. Authentication Flow:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'

# Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.data.tokens.accessToken')

# Verify token works
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

**3. Upload & Prediction:**
```bash
# Upload audio (need actual .wav file)
curl -X POST http://localhost:5000/api/recordings/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@test.wav" \
  -F "filename=test_recording" \
  -F "duration=10"

# Get recording ID from response, then analyze
RECORDING_ID="<id_from_upload>"

curl -X POST http://localhost:5000/api/predictions/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"recordingId\":\"$RECORDING_ID\"}"
```

**4. Rate Limiting Test:**
```bash
# Should get rate limited after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@test.com","password":"wrong"}'
  echo "Attempt $i"
done
# Expected: 429 Too Many Requests after 5 attempts
```

---

## Part 5: Production Environment Setup

### Environment Variables

**Create `.env.production`:**
```bash
NODE_ENV=production
PORT=5000

# New rotated credentials
MONGODB_URL=mongodb+srv://NEW_USER:NEW_PASSWORD@cluster0.xxxxx.mongodb.net/
MONGODB_DB_NAME=voice_health_production

# Strong production secrets (generate new ones!)
SECRET_KEY=<use: openssl rand -base64 64>
JWT_SECRET_KEY=<use: openssl rand -base64 64>
JWT_SECRET=<use: openssl rand -base64 32>

# Production URLs
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email service (configure one)
SENDGRID_API_KEY=SG.your_production_key
EMAIL_FROM=noreply@yourdomain.com
SKIP_EMAIL_VERIFICATION=false

# Logging
LOG_LEVEL=warn

# ML Service
ML_SERVICE_URL=http://ml-service:5001
```

### SSL/TLS Certificates

**Option 1: Let's Encrypt (Free, Recommended)**
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Option 2: Cloud Provider (AWS/GCP/Azure)**
- Use managed SSL through load balancer
- AWS: Application Load Balancer + ACM
- GCP: Load Balancer + Managed SSL
- Azure: Application Gateway + SSL

---

## Part 6: Database Backup Strategy

### Automated Backups (MongoDB Atlas)

1. **Enable Point-in-Time Restore:**
   - MongoDB Atlas Dashboard → Backup
   - Enable "Continuous Cloud Backup"
   - Retention: 7 days minimum

2. **Schedule Snapshots:**
   ```
   Frequency: Daily at 2 AM UTC
   Retention: 30 days
   ```

3. **Test Restore Process:**
   ```bash
   # Monthly drill: Download and restore test snapshot
   # Document restore time (RTO target: <1 hour)
   ```

### Manual Backup Script

**Create `scripts/backup-db.sh`:**
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_NAME="voice_health_production"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URL" \
  --db=$DB_NAME \
  --out="$BACKUP_DIR/backup_$TIMESTAMP"

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

---

## Part 7: Monitoring & Alerting

### Application Monitoring

**Winston Logs - Already Configured:**
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Rotation: 5MB per file, keep 5 files

**Set Up External Monitoring (Choose One):**

**Option A: PM2 (Simple, Free)**
```bash
npm install -g pm2

# Start with monitoring
pm2 start server.js --name voice-health-api
pm2 monit  # Real-time monitoring
```

**Option B: Prometheus + Grafana (Advanced)**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

**Option C: Cloud Monitoring**
- AWS: CloudWatch
- GCP: Cloud Monitoring
- Azure: Application Insights

### Health Check Endpoints

Already implemented:
- `GET /api/health` - Backend health
- `GET /ml/health` - ML service health

Set up uptime monitoring (e.g., UptimeRobot, Pingdom):
```
URL: https://yourdomain.com/api/health
Interval: 5 minutes
Alert: Email/SMS on failure
```

---

## Part 8: Security Hardening Checklist

### Pre-Deployment Security Audit

- [x] `.env` excluded from Git
- [ ] `.env` purged from Git history
- [ ] MongoDB credentials rotated
- [ ] All secrets use strong random values
- [x] Rate limiting configured
- [x] CORS whitelist configured
- [x] Helmet.js security headers enabled
- [ ] HTTPS/SSL configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (N/A - using MongoDB)
- [ ] XSS protection in frontend
- [ ] CSRF protection (if using cookies)
- [ ] Dependency vulnerability scan: `npm audit`
- [ ] Regular security updates scheduled

### Run Security Scan

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Review remaining issues
npm audit --production
```

---

## Deployment Completion Checklist

### Before First Deploy

- [ ] All environment variables configured in `.env.production`
- [ ] MongoDB credentials rotated and tested
- [ ] `.env` purged from Git history
- [ ] SSL/TLS certificates installed
- [ ] Medical disclaimers reviewed by legal
- [ ] All API endpoints tested manually
- [ ] Database backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Security audit completed
- [ ] `npm audit` shows no critical vulnerabilities

### After First Deploy

- [ ] Verify all health checks pass
- [ ] Test one complete user flow (register → upload → predict)
- [ ] Verify rate limiting works
- [ ] Check logs for errors
- [ ] Verify backup system running
- [ ] Set up monitoring dashboards
- [ ] Document rollback procedure
- [ ] Share access credentials with team securely (password manager)

---

## Emergency Rollback Procedure

If deployment fails:

```bash
# 1. SSH to server
ssh user@your-server

# 2. Stop service
pm2 stop voice-health-api  # or docker-compose down

# 3. Restore previous version
git checkout <previous-commit-hash>
npm install

# 4. Restart
pm2 restart voice-health-api  # or docker-compose up -d

# 5. Verify health
curl http://localhost:5000/api/health
```

---

## Support Contacts

**In case of deployment issues:**

1. Check logs: `logs/error.log`
2. Review this checklist
3. Check MongoDB Atlas status
4. Verify environment variables
5. Test health endpoints

---

**Good luck with your deployment!** 🚀

*Last Updated: January 25, 2026*
