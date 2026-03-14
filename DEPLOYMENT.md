# Weber CRM — Vercel Deployment Guide

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier works)
- A [GitHub](https://github.com) / GitLab / Bitbucket repo with this project pushed
- A PostgreSQL database (Vercel Postgres, Neon, Supabase, or any cloud-hosted Postgres)

---

## Step 1 — Push to Git

Make sure your code is committed and pushed to a Git repository:

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

> **Important:** The `.env.local` file is gitignored and will NOT be pushed. Environment variables are set in the Vercel dashboard instead.

---

## Step 2 — Create a Vercel Project

### Option A: Via Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your repo
3. Vercel will auto-detect **Next.js** as the framework
4. Leave all build settings at their defaults:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
5. **Don't deploy yet** — add environment variables first (Step 3)

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # follow the prompts to link to your repo
```

---

## Step 3 — Set Up the Database

### Option A: Vercel Postgres (easiest)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database → Postgres**
3. Choose a region (select **Washington, D.C. (iad1)** to match the function region in `vercel.json`)
4. Click **Create**
5. Vercel will **automatically** inject these env vars into your project:
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

### Option B: External Database (Neon, Supabase, Railway, etc.)

1. Create a Postgres database on your provider
2. Copy the connection string (looks like `postgresql://user:pass@host:5432/dbname?sslmode=require`)
3. Add it as `DATABASE_URL` in Vercel environment variables (Step 4)

---

## Step 4 — Configure Environment Variables

In your Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Your Postgres connection string | ✅ (unless using Vercel Postgres) |
| `JWT_SECRET` | A random 32+ character string | ✅ |
| `JWT_EXPIRY` | `24h` | Optional (defaults to 24h) |
| `LOG_LEVEL` | `warn` | Optional (defaults to warn) |

### Generate a JWT secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `JWT_SECRET` value.

> **Tip:** Set variables for all three environments (Production, Preview, Development) or just Production depending on your needs.

---

## Step 5 — Initialize the Database

The database tables need to be created before the app can work. Run the init script **locally** pointing at your production database:

```bash
# Create a temporary .env.local with your production DATABASE_URL
echo 'DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require' > .env.local

# Initialize tables and roles
node --experimental-modules scripts/init-db.js

# Seed test users (optional — gives you 5 default logins)
node --experimental-modules scripts/seed-users.js
```

This creates all tables (`users`, `roles`, `departments`, `sessions`, `audit_logs`, `work_assignments`, `work_submissions`, `evaluations`) and inserts the 5 default roles.

### Default Test Users (after seeding)

| Username | Password | Role |
|---|---|---|
| `ceo_weber` | `ceo_password_2026` | CEO |
| `coo_weber` | `coo_password_2026` | COO |
| `depthead_weber` | `depthead_password_2026` | Departmental Head |
| `senior_weber` | `senior_password_2026` | Senior Associate |
| `associate_weber` | `associate_password_2026` | Associate |

> ⚠️ **Change these passwords** immediately after first login via the Profile page.

---

## Step 6 — Deploy

### First Deploy

If you skipped deployment in Step 2, click **Deploy** in the Vercel dashboard, or:

```bash
vercel --prod
```

### Subsequent Deploys

Every push to your `main` branch will auto-deploy to production. Pushes to other branches create Preview deployments with unique URLs.

---

## Step 7 — Verify

1. Open your deployment URL (shown in the Vercel dashboard, e.g. `https://weber-crm-xxx.vercel.app`)
2. You should see the login page
3. Log in with one of the test user credentials
4. Check that the dashboard loads and data displays correctly

---

## Project Configuration Reference

These files are already configured and don't need changes:

### `vercel.json`
- **Region:** `iad1` (US East) — change to match your database region
- **Function timeout:** 15 seconds for all API routes
- **Headers:** API routes are set to `no-store`, static assets get CDN caching

### `next.config.ts`
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- `poweredByHeader: false`
- Server Actions allowed from Vercel deployment URLs

### Database Pool (`src/lib/db/pool.ts`)
- Max 3 connections in production (serverless-safe)
- 10s idle timeout, `allowExitOnIdle: true`
- Pool cached on `globalThis` to reuse across warm invocations

---

## Troubleshooting

### "Internal Server Error" on API routes
- Check **Vercel Logs** (Dashboard → your project → Logs tab)
- Most likely cause: missing `DATABASE_URL` or `JWT_SECRET` env vars
- The app logs `❌ Missing required environment variables` if they're absent

### "Could not connect to database"
- Verify your `DATABASE_URL` is correct and the database is accessible
- If using Vercel Postgres, make sure the Storage is linked to your project
- Check that your DB region matches the function region (`iad1`)

### Login doesn't work
- Make sure you ran `scripts/init-db.js` and `scripts/seed-users.js` against your production database
- Check that the `roles` table has the 5 default roles

### Slow cold starts
- This is normal for serverless. First request after idle may take 1-3 seconds.
- Subsequent requests within the same warm period are fast.
- Keep the function region close to your database region to minimize latency.

### WebSocket features not working
- Vercel serverless does **not** support native WebSockets
- Real-time features are silently disabled in production
- If you need real-time, deploy a separate WebSocket server and set `NEXT_PUBLIC_WS_URL` in env vars

---

## Custom Domain (Optional)

1. Go to **Settings** → **Domains** in your Vercel project
2. Add your domain (e.g. `crm.yourcompany.com`)
3. Update DNS records as instructed by Vercel
4. SSL is provisioned automatically

---

## Environment Summary

| Environment | URL | Branch | Auto-deploy |
|---|---|---|---|
| Production | `your-project.vercel.app` | `main` | ✅ on push |
| Preview | `your-project-git-branch.vercel.app` | any other | ✅ on push |
| Local | `localhost:3000` | — | `npm run dev` |
