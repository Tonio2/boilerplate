# Railway Deployment - Quick Start Checklist

Use this checklist to deploy your boilerplate to Railway for testing.

## 📋 Before You Start

- [ ] Read `/docs/RAILWAY_DEPLOYMENT.md` (full guide)
- [ ] Have a Railway account (or ready to sign up)
- [ ] Have a GitHub repository with all code committed

---

## 🔧 Step 1: Prepare Your Code (10 minutes)

### Files to Add to Your Project Root

Copy these files from the output to your project root:

```
✅ /package.json         → Copy to project root
✅ /nixpacks.toml        → Copy to project root
✅ /railway.json         → Copy to project root
✅ /.env.example         → Replace existing file
✅ /docs/RAILWAY_DEPLOYMENT.md → Add to docs folder
```

### Update server/src/index.ts

Open `server-index-changes.ts` and follow the instructions to:

1. Add static file serving in production
2. Ensure health check endpoint exists
3. Fix path resolution for client/dist

**Key changes needed:**

```typescript
// Add after your API routes, before app.listen()
if (process.env.NODE_ENV === 'production') {
  const isDev = process.env.NODE_ENV !== 'production';
  const clientDistPath = path.resolve(
    __dirname,
    isDev ? '../../client/dist' : '../../../client/dist'
  );

  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
```

---

## ✅ Step 2: Test Locally (15 minutes)

**CRITICAL: Do this before deploying to Railway!**

```bash
# 1. Build everything
npm run build

# 2. Start local postgres
docker-compose up -d

# 3. Set environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boilerplate
export JWT_ACCESS_SECRET=test_xxx
export JWT_REFRESH_SECRET=test_yyy
export JWT_EMAIL_SECRET=test_zzz
export GMAIL_USER=test@gmail.com
export GMAIL_PWD=test_pwd
export CLIENT_URL=http://localhost:5000
export PORT=5000

# 4. Run production server
npm start

# 5. Test in browser
open http://localhost:5000
```

### Verify:
- [ ] React app loads at http://localhost:5000
- [ ] Health check works: http://localhost:5000/health
- [ ] Static files load (check Network tab)
- [ ] No console errors
- [ ] API endpoints work

**If anything fails, FIX IT before deploying to Railway!**

---

## 🚂 Step 3: Deploy to Railway (10 minutes)

### A. Create Project

1. [ ] Go to https://railway.app
2. [ ] Sign up / Login with GitHub
3. [ ] Click "New Project"
4. [ ] Click "Deploy from GitHub repo"
5. [ ] Select your repository
6. [ ] Wait for initial build (will probably fail - that's OK!)

### B. Add PostgreSQL Database

1. [ ] Click "New" in your project
2. [ ] Select "Database" → "PostgreSQL"
3. [ ] Wait ~1 minute for provisioning
4. [ ] ✅ DATABASE_URL is auto-created

### C. Set Environment Variables

Click on your app service → "Variables" tab → Add these:

```bash
NODE_ENV=production
JWT_ACCESS_SECRET=<generate: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate: openssl rand -base64 32>
JWT_EMAIL_SECRET=<generate: openssl rand -base64 32>
GMAIL_USER=your.email@gmail.com
GMAIL_PWD=<Gmail app password from https://myaccount.google.com/apppasswords>
CLIENT_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
```

**IMPORTANT:** Use the template variable `${{ RAILWAY_PUBLIC_DOMAIN }}` for CLIENT_URL

### D. Redeploy

1. [ ] Go to "Deployments" tab
2. [ ] Click "Redeploy" on latest deployment
3. [ ] Watch logs in real-time
4. [ ] Wait for "Deployment successful"

---

## 🗄️ Step 4: Run Database Migrations (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npm run db:migrate --prefix server
# OR
railway run npm run db:push --prefix server

# Check logs to verify migrations completed
```

---

## ✅ Step 5: Test Deployment (5 minutes)

### Get Your URL

Railway dashboard → Your service → Settings → Domains

### Test Everything

- [ ] Visit https://your-app.railway.app
- [ ] React app loads
- [ ] Health check: https://your-app.railway.app/health
- [ ] Register new user
- [ ] Login works
- [ ] API calls work
- [ ] No console errors

### Check Logs

- [ ] Railway dashboard → Deployments → Active deployment
- [ ] Look for "Server running on port XXXX"
- [ ] No error messages

---

## 📸 Step 6: Document & Cleanup (10 minutes)

### For Boilerplate Testing

Since this is a boilerplate, you're testing the deployment process:

- [ ] Take screenshots of successful deployment
- [ ] Note any issues you encountered
- [ ] Update RAILWAY_DEPLOYMENT.md if needed
- [ ] Test for a day or two

### Delete Project (When Done)

**To stop charges:**

1. [ ] Railway dashboard → Project settings
2. [ ] Scroll to "Danger Zone"
3. [ ] Click "Delete Project"
4. [ ] Type project name to confirm
5. [ ] ✅ All resources released, no more charges

**Cost for testing:** ~$0.50 of your $5 trial credit

---

## 🚨 Troubleshooting

### Build Fails

```
❌ "Cannot find module"
→ Check package.json exists in client/ and server/
→ Run: npm ci in both folders

❌ "TypeScript compilation failed"
→ Run: npm run build locally to see errors
→ Fix TypeScript errors before deploying
```

### App Crashes

```
❌ "Application failed to respond"
→ Check all environment variables are set
→ Verify /health endpoint exists
→ Check logs for specific error

❌ "Database connection failed"
→ Verify PostgreSQL addon is running
→ DATABASE_URL should be auto-set by Railway
```

### Static Files 404

```
❌ React app doesn't load
→ Check NODE_ENV=production is set
→ Verify static file path in server/src/index.ts
→ Make sure client/dist exists after build
```

---

## 📚 Resources

- **Full Guide:** `/docs/RAILWAY_DEPLOYMENT.md`
- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app

---

## ⏱️ Time Estimates

- Code preparation: 10 minutes
- Local testing: 15 minutes
- Railway setup: 10 minutes
- Migrations: 5 minutes
- Testing: 5 minutes
- **Total: ~45 minutes** for first deployment

Subsequent deployments: Just `git push` (auto-deploys in ~3 minutes)

---

**Ready? Let's deploy! 🚀**

Start with Step 1 and work through the checklist.
If you get stuck, refer to the full guide in `/docs/RAILWAY_DEPLOYMENT.md`
