# Railway Deployment Guide

This guide covers deploying your boilerplate application to Railway for testing and production use.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing (Before Railway)](#local-testing-before-railway)
3. [Initial Railway Setup](#initial-railway-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Testing Your Deployment](#testing-your-deployment)
8. [Custom Domain Setup](#custom-domain-setup-optional)
9. [Staging + Production Workflow](#staging--production-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Cost Management](#cost-management)

---

## Prerequisites

- ✅ Git repository on GitHub
- ✅ Railway account (sign up at https://railway.app)
- ✅ All code changes from Railway setup committed

---

## Local Testing (Before Railway)

**IMPORTANT:** Always test your production build locally before deploying to Railway!

### Step 1: Build Everything

```bash
# From project root
npm run build

# This will:
# 1. Install client dependencies
# 2. Install server dependencies
# 3. Build React app (client/dist)
# 4. Compile TypeScript (server/dist)
```

### Step 2: Set Up Local Environment

```bash
# Make sure Docker Compose is running (for PostgreSQL)
docker-compose up -d

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boilerplate
export JWT_ACCESS_SECRET=test_secret_xxx
export JWT_REFRESH_SECRET=test_secret_yyy
export JWT_EMAIL_SECRET=test_secret_zzz
export GMAIL_USER=test@gmail.com
export GMAIL_PWD=test_password
export CLIENT_URL=http://localhost:5000
export PORT=5000
```

### Step 3: Run Production Server

```bash
# From project root
npm start

# Server should start on http://localhost:5000
```

### Step 4: Verify Everything Works

Open your browser and test:

- ✅ http://localhost:5000 - React app loads
- ✅ http://localhost:5000/health - Returns `{"status":"healthy"}`
- ✅ Static files load (check Network tab for JS/CSS)
- ✅ API endpoints work
- ✅ No console errors

**If local testing fails, DO NOT deploy to Railway yet!** Fix issues locally first.

---

## Initial Railway Setup

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Sign up"
3. Sign up with GitHub (recommended)
4. Verify your email
5. You'll receive $5 in trial credits

### Step 2: Create New Project

1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select your boilerplate repository
5. Railway will start building automatically

**Initial build might fail** - that's expected! We haven't set up environment variables yet.

### Step 3: Watch Build Logs

1. Click on your service in Railway dashboard
2. Go to "Deployments" tab
3. Click on the active deployment
4. Watch the logs to see what's happening

**Common first-time issues:**

- ❌ Missing environment variables (expected)
- ❌ Database connection failed (expected)
- ⚠️ Build succeeded but app crashes (need env vars)

---

## Database Configuration

### Step 1: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database"
3. Select "PostgreSQL"
4. Wait ~1 minute for provisioning

### Step 2: Verify DATABASE_URL

1. Click on the PostgreSQL service
2. Go to "Variables" tab
3. You'll see `DATABASE_URL` is automatically created
4. This variable is automatically shared with your app service

**You don't need to copy/paste DATABASE_URL!** Railway handles this automatically.

---

## Environment Variables

### Step 1: Generate Secure Secrets

**CRITICAL:** Don't use the example secrets in production!

Generate new secrets on your local machine:

```bash
# Generate JWT secrets
openssl rand -base64 32  # Use for JWT_ACCESS_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
openssl rand -base64 32  # Use for JWT_EMAIL_SECRET
```

### Step 2: Set Up Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Create a new app password named "Railway App"
3. Copy the generated 16-character password
4. Use this as `GMAIL_PWD` (NOT your regular Gmail password)

### Step 3: Add Variables in Railway Dashboard

1. Click on your app service (not the database)
2. Go to "Variables" tab
3. Click "New Variable"
4. Add each variable one by one:

```bash
# Required Variables
NODE_ENV=production
JWT_ACCESS_SECRET=<paste generated secret>
JWT_REFRESH_SECRET=<paste generated secret>
JWT_EMAIL_SECRET=<paste generated secret>
GMAIL_USER=your.email@gmail.com
GMAIL_PWD=<paste Gmail app password>
CLIENT_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
```

**Note:** `${{ RAILWAY_PUBLIC_DOMAIN }}` is a Railway template variable that auto-fills with your app's URL.

### Step 4: Trigger Redeploy

After adding all variables:

1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Or just push a new commit to trigger deployment

---

## Database Migrations

After your app deploys successfully, you need to run database migrations.

### Option 1: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
cd /path/to/your/project
railway link
# Select your project from the list

# Run migrations
railway run npm run db:migrate --prefix server

# Or if using Drizzle push:
railway run npm run db:push --prefix server
```

### Option 2: Using Railway Dashboard

1. Go to your project in Railway dashboard
2. Click on your app service
3. Go to "Settings" tab
4. Scroll to "Deploy Lifecycle"
5. Under "Start Command", temporarily change to:
    ```
    cd server && npm run db:migrate && node dist/index.js
    ```
6. Redeploy
7. After first successful deploy, change back to:
    ```
    cd server && node dist/index.js
    ```

**Warning:** Option 2 runs migrations on every deploy, which can be risky. Use Option 1 for production.

### Verify Migrations

Check the deployment logs to confirm migrations ran:

```
✅ Migrations completed successfully
✅ Server started on port XXXX
```

---

## Testing Your Deployment

### Step 1: Get Your Railway URL

1. In Railway dashboard, click on your app service
2. Go to "Settings" tab
3. Look for "Domains" section
4. You'll see something like: `your-app-production.up.railway.app`
5. Copy this URL

### Step 2: Test the Deployment

Open your Railway URL in a browser:

**Basic Tests:**

- ✅ https://your-app.railway.app - React app loads
- ✅ https://your-app.railway.app/health - Health check returns OK
- ✅ No console errors (F12 → Console)
- ✅ Static files load (F12 → Network tab)

**Feature Tests:**

- ✅ Register a new user
- ✅ Login works
- ✅ JWT tokens are issued
- ✅ Protected routes work
- ✅ Email verification (if applicable)

### Step 3: Monitor Logs

Keep the deployment logs open to watch for errors:

1. Railway dashboard → Your service → "Deployments"
2. Click on active deployment
3. Watch real-time logs

**Look for:**

- ✅ "Server running on port XXXX"
- ✅ "Database connected"
- ❌ Any error messages
- ⚠️ Warning messages

---

## Custom Domain Setup (Optional)

### Step 1: Generate Railway Domain

1. Railway dashboard → Your service → "Settings"
2. Scroll to "Domains"
3. Click "Generate Domain"
4. You'll get a better subdomain like: `your-app.up.railway.app`

### Step 2: Add Custom Domain

1. In "Domains" section, click "Custom Domain"
2. Enter your domain: `yourdomain.com` or `app.yourdomain.com`
3. Railway will show DNS records to add

### Step 3: Configure DNS

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add the CNAME record Railway provides:
    ```
    Type: CNAME
    Name: app (or @ for root domain)
    Value: <provided by Railway>
    TTL: 3600
    ```
3. Save changes

### Step 4: Wait for Propagation

- DNS propagation takes 5 minutes to 48 hours (usually ~1 hour)
- Railway auto-provisions SSL certificate via Let's Encrypt
- Once propagated, your site will be accessible at your custom domain

### Step 5: Update CLIENT_URL

1. Go back to Railway dashboard
2. Update the `CLIENT_URL` variable to your custom domain:
    ```
    CLIENT_URL=https://yourdomain.com
    ```
3. Redeploy

---

## Staging + Production Workflow

For serious projects, set up separate environments for testing before production.

### Step 1: Create Staging Branch

```bash
git checkout -b staging
git push origin staging
```

### Step 2: Create Staging Environment in Railway

1. In your Railway project, click "New Environment"
2. Name it "staging"
3. Go to environment settings
4. Change the branch to "staging"
5. Add a new PostgreSQL database for staging
6. Set environment variables (use different JWT secrets!)
7. Update `CLIENT_URL` to staging domain

### Step 3: Development Workflow

```bash
# Feature development
git checkout -b feature/new-thing
# ... make changes ...
git commit -am "Add new feature"
git push origin feature/new-thing

# Create PR to staging
# Railway auto-creates preview environment

# Merge to staging
git checkout staging
git merge feature/new-thing
git push origin staging
# → Railway deploys to staging automatically

# Test on staging for a day

# Deploy to production
git checkout main
git merge staging
git push origin main
# → Railway deploys to production automatically
```

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'xyz'"**

Solution:

```bash
# Make sure package.json exists in both client/ and server/
# Verify dependencies are listed correctly
cd client && npm ci
cd ../server && npm ci
```

**Error: "TypeScript compilation failed"**

Solution:

```bash
# Check tsconfig.json is correct
# Verify all TypeScript files compile locally
cd server && npm run build
```

### Deployment Succeeds But App Crashes

**Error: "Application failed to respond"**

Check logs for:

```
❌ DATABASE_URL not set
❌ JWT_ACCESS_SECRET not set
❌ Port binding error
```

Solution:

1. Verify all environment variables are set
2. Check health check endpoint exists: `/health`
3. Ensure server binds to `process.env.PORT` (Railway provides this)

### Static Files Not Loading

**Error: 404 on JS/CSS files**

Solution:

1. Verify `client/dist` folder exists after build
2. Check static file path in `server/src/index.ts` (see server-index-changes.ts)
3. Make sure production mode is enabled: `NODE_ENV=production`

### Database Connection Fails

**Error: "Connection refused" or "timeout"**

Solution:

1. Verify PostgreSQL addon is running
2. Check DATABASE_URL is set (Railway does this automatically)
3. Run migrations: `railway run npm run db:migrate --prefix server`

### CORS Errors

**Error: "Access-Control-Allow-Origin"**

Solution:

1. Check `CLIENT_URL` matches your Railway domain
2. Update CORS configuration in server to allow Railway domain
3. For monolith (serving React from Express), you shouldn't have CORS issues

### Health Check Failing

**Error: "Health check timeout"**

Solution:

1. Verify `/health` endpoint exists and responds quickly
2. Check server is binding to correct port: `process.env.PORT`
3. Ensure health check doesn't require authentication

---

## Cost Management

### Understanding Railway Pricing

**Trial Period:**

- $5 free credit when you sign up
- No credit card required initially
- Enough for 1-2 weeks of testing

**Hobby Plan:**

- $5/month subscription
- Includes $5 usage credit
- Pay-as-you-go beyond credit
- Most small apps stay within $5 credit

**Usage Costs:**

```
RAM:  $0.000231 per GB-hour
vCPU: $0.000463 per vCPU-hour
```

**Example Monthly Costs:**

```
Small App (512MB RAM, 0.5 vCPU, always running):
RAM:  512MB × 730 hours × $0.000231 ≈ $0.09
vCPU: 0.5 × 730 hours × $0.000463 ≈ $0.17
Database: Similar usage ≈ $0.20
Total: ~$0.50/month
```

### For Testing This Boilerplate

Since this is a boilerplate/template:

1. ✅ Deploy with trial credit ($5 free)
2. ✅ Test thoroughly for 1-2 days (costs ~$0.50)
3. ✅ Document everything
4. ✅ Take screenshots
5. ✅ **Delete the project** (stops all charges)
6. ✅ Share deployment instructions with users
7. ✅ Users deploy their own instances

### Deleting a Railway Project

When you're done testing:

1. Go to Railway dashboard
2. Click on your project
3. Go to "Settings" tab
4. Scroll to "Danger Zone"
5. Click "Delete Project"
6. Type project name to confirm
7. Click "Delete"

**Result:**

- ✅ All containers stopped immediately
- ✅ Database deleted
- ✅ URLs deactivated
- ✅ No more charges
- ✅ Remaining credits saved for future projects

### Monitoring Usage

Check your usage:

1. Railway dashboard → Your profile (top right)
2. Click "Usage"
3. See current billing period usage
4. Set up usage alerts if needed

---

## Deploy Button for Users (Optional)

After testing, you can create a "Deploy to Railway" button for your boilerplate users:

### Step 1: Create Railway Template

1. Go to your Railway project
2. Settings → "Create Template"
3. Configure template settings
4. Get template URL

### Step 2: Add Button to README

```markdown
## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

Click the button above to deploy your own instance to Railway!
```

**Benefits:**

- ✅ One-click deployment for users
- ✅ Railway auto-configures environment
- ✅ Users pay for their own usage
- ✅ Perfect for boilerplates and templates

---

## Support

### Railway Resources

- Documentation: https://docs.railway.app
- Discord Community: https://discord.gg/railway
- Status Page: https://status.railway.app
- Help Center: https://help.railway.app

### Project Issues

For issues specific to this boilerplate:

- Check GitHub Issues
- Review deployment logs
- Test production build locally first

---

## Summary Checklist

### Pre-Deployment

- [ ] Test production build locally
- [ ] All environment variables documented
- [ ] Health check endpoint exists
- [ ] Database migrations ready
- [ ] Git repository up to date

### Railway Setup

- [ ] Railway account created
- [ ] Project connected to GitHub
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] Initial deployment successful

### Post-Deployment

- [ ] Database migrations run
- [ ] Health check passing
- [ ] React app loads correctly
- [ ] API endpoints working
- [ ] Authentication tested
- [ ] Custom domain configured (if applicable)

### Cleanup (For Boilerplate Testing)

- [ ] Deployment verified and documented
- [ ] Screenshots taken
- [ ] Railway project deleted
- [ ] Documentation updated for users

---

**Estimated Setup Time:** 15-30 minutes
**Estimated Monthly Cost:** $0.50-$2 for basic usage (within $5 credit)

**Good luck with your deployment!** 🚀
