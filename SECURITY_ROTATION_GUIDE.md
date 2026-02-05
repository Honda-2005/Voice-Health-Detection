# 🔐 Security Credentials Rotation Guide

**CRITICAL:** Execute these steps immediately to secure your production deployment.

---

## Step 1: Rotate MongoDB Credentials

### 1.1 Create New Database User in MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster → **Database Access**
3. Click **Add New Database User**
4. Create credentials:
   - **Username:** `voice_health_prod_user` (or similar)
   - **Password:** Generate strong password (MongoDB can auto-generate)
   - **Database User Privileges:** Select "Read and write to any database"
5. Click **Add User**

### 1.2 Get New Connection String

1. In MongoDB Atlas, go to **Databases** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
4. Replace `<username>` and `<password>` with your new credentials

### 1.3 Update .env File

```env
MONGODB_URL=mongodb+srv://NEW_USERNAME:NEW_PASSWORD@cluster0.xxxxx.mongodb.net/voice_health
```

### 1.4 Delete Old Credentials

1. In MongoDB Atlas → **Database Access**
2. Find the old user: `mohaned2308326_db_user`
3. Click **...** (three dots) → **Delete**
4. Confirm deletion

---

## Step 2: Rotate JWT Secrets

### 2.1 Generate New Secret

Run this command in your project directory:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Example output:**
```
Kp3vN8Xq9Yw2Bf5Hj7Rt4Gu1Za6Cd8Ef0Lm2Oi5Pq3Sx7Tu9Vw1Yz4Ab6Dc8Ge0Hi2Kj4Mn6Pq8St0Vx2Zy==
```

### 2.2 Update .env File

```env
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
```

Replace the entire value with your newly generated secret (minimum 64 characters base64).

### 2.3 Invalidate Old Sessions

⚠️ **Important:** All existing user sessions will be invalidated. Users will need to log in again.

---

## Step 3: Verify Configuration

### 3.1 Check .env File

Your `.env` should look like this (with YOUR values filled in):

```env
# MongoDB
MONGODB_URL=mongodb+srv://NEW_USER:NEW_PASS@cluster0.xxxxx.mongodb.net/voice_health
MONGODB_DB_NAME=voice_health_detection

# JWT
JWT_SECRET=Kp3vN8Xq9Yw2Bf5... (your 64+ char secret)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# App
NODE_ENV=development
PORT=5000
ML_SERVICE_URL=http://localhost:5001

# Security
BCRYPT_ROUNDS=12
```

### 3.2 Test Validation

Start the server to verify configuration:

```bash
npm run dev
```

You should see:
```
✅ Configuration validated successfully
✓ MongoDB connected successfully
Server running on port 5000
```

If you see errors, review your `.env` file for typos or missing values.

---

## Step 4: Remove .env from Git History (If Committed)

### 4.1 Verify .gitignore

Ensure `.env` is in `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env
```

If not listed, add it:

```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

### 4.2 Remove from Git History (Optional but Recommended)

**⚠️ WARNING:** This rewrites Git history. Coordinate with your team!

#### Option A: Using BFG Repo-Cleaner (Recommended)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
   ```bash
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

#### Option B: Using git filter-branch

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

---

## Step 5: Security Checklist

Before going live, verify:

- [ ] MongoDB old user deleted from Atlas
- [ ] New MongoDB credentials in `.env`
- [ ] New JWT secret generated and set
- [ ] `.env` file in `.gitignore`
- [ ] `.env` removed from Git history
- [ ] Server starts without errors
- [ ] All tests passing
- [ ] ML model trained and loaded

---

## Emergency: What if Credentials are Exposed?

### Immediate Actions:

1. **Rotate ALL credentials immediately** (follow steps above)
2. **Check MongoDB Atlas Activity Log** for unauthorized access
3. **Review application logs** for suspicious activity
4. **Notify your team and users** if data may be compromised
5. **Reset all user passwords** as a precaution

### Prevention:

- Never commit `.env`, `secrets/`, or credential files
- Use environment-specific configs (`.env.development`, `.env.production`)
- Consider using secret management tools (AWS Secrets Manager, HashiCorp Vault)
- Enable MongoDB Atlas IP whitelisting
- Enable 2FA on MongoDB Atlas account

---

## Support

If you encounter issues:
1. Check server logs for specific error messages
2. Verify MongoDB Atlas network access allows your IP
3. Ensure `.env` file has no trailing spaces or quotes
4. Test MongoDB connection using MongoDB Compass

**Security is critical - don't skip these steps!**
