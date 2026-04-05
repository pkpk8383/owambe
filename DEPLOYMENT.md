# Owambe Deployment Guide

Complete step-by-step guide to deploy Owambe to production.

---

## Prerequisites

- GitHub repo: `github.com/mottainaisurvey/owambe`
- Domain: `owambe.com` (Vercel) + `api.owambe.com` (Railway)
- Accounts: Railway, Vercel, Paystack, OpenAI, AWS, SendGrid

---

## Step 1 — Push Code to GitHub

```bash
# From the unzipped owambe folder
git init
git remote add origin https://github.com/mottainaisurvey/owambe.git
git add .
git commit -m "feat: initial production build"
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy API to Railway

### 2a. Create Railway project
1. Go to railway.app → New Project → Deploy from GitHub
2. Select `mottainaisurvey/owambe` repo
3. Set root directory to `apps/api`

### 2b. Add PostgreSQL addon
Railway dashboard → Add Service → PostgreSQL
- Copy the `DATABASE_URL` from the Postgres service

### 2c. Enable PostGIS
```sql
-- Connect to Railway Postgres and run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid_ossp;
```

### 2d. Add Redis addon
Railway dashboard → Add Service → Redis
- Copy the `REDIS_URL`

### 2e. Set environment variables in Railway
```
DATABASE_URL=             (from Railway Postgres)
REDIS_URL=                (from Railway Redis)
JWT_SECRET=               (generate: openssl rand -base64 32)
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=  (from Paystack dashboard)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=owambe-media
AWS_REGION=af-south-1
SENDGRID_API_KEY=SG....
EMAIL_FROM=noreply@owambe.com
EMAIL_FROM_NAME=Owambe
NEXT_PUBLIC_APP_URL=https://owambe.com
NODE_ENV=production
API_PORT=4000
```

### 2f. Set custom domain
Railway → Settings → Domains → Add `api.owambe.com`
Point DNS: CNAME `api.owambe.com` → Railway URL

### 2g. Seed the database
```bash
# From Railway CLI or shell
railway run npm run db:seed
```

---

## Step 3 — Deploy Web to Vercel

### 3a. Import project
1. Vercel dashboard → New Project → Import from GitHub
2. Select `mottainaisurvey/owambe`
3. Framework: Next.js
4. Root directory: `apps/web`
5. Build command: `npm run build`

### 3b. Set environment variables in Vercel
```
NEXT_PUBLIC_API_URL=https://api.owambe.com/api
NEXT_PUBLIC_APP_URL=https://owambe.com
NEXT_PUBLIC_GOOGLE_MAPS_KEY=  (optional)
```

### 3c. Set custom domain
Vercel → Settings → Domains → Add `owambe.com`
Vercel will guide you to update DNS records

---

## Step 4 — Configure Paystack

### 4a. Webhook URL
Paystack Dashboard → Settings → API Keys & Webhooks
Add webhook URL: `https://api.owambe.com/api/payments/webhook/paystack`

Enable events:
- `charge.success`
- `transfer.success`
- `refund.processed`

Copy the webhook secret → paste into Railway env as `PAYSTACK_WEBHOOK_SECRET`

### 4b. Test with Paystack test keys first
Use `sk_test_...` and `pk_test_...` until you're ready for live payments.

---

## Step 5 — Configure GitHub Actions Secrets

Go to `github.com/mottainaisurvey/owambe/settings/secrets/actions`

Add these secrets:
```
RAILWAY_TOKEN=        (railway.app → Account → Tokens)
VERCEL_TOKEN=         (vercel.com → Settings → Tokens)
VERCEL_ORG_ID=        (vercel.com → Settings → General)
VERCEL_PROJECT_ID=    (Vercel project → Settings → General)
NEXT_PUBLIC_API_URL=https://api.owambe.com/api
NEXT_PUBLIC_APP_URL=https://owambe.com
```

---

## Step 6 — Configure AWS S3

### 6a. Create S3 bucket
```
Bucket name: owambe-media
Region: af-south-1 (Cape Town — closest to Lagos)
```

### 6b. Bucket policy (public read for images)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::owambe-media/*"
  }]
}
```

### 6c. CORS configuration
```json
[{
  "AllowedOrigins": ["https://owambe.com"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"]
}]
```

---

## Step 7 — Verify Deployment

Run this checklist after deployment:

```bash
# 1. Health check
curl https://api.owambe.com/health
# Expected: {"status":"ok","service":"owambe-api"}

# 2. Register test user
curl -X POST https://api.owambe.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@owambe.com","password":"Test1234!","firstName":"Test","lastName":"User","role":"PLANNER"}'

# 3. Login
curl -X POST https://api.owambe.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@owambe.com","password":"Test1234!"}'

# 4. Check web app
curl -I https://owambe.com
# Expected: HTTP 200

# 5. Test webhook
curl -X POST https://api.owambe.com/api/payments/webhook/paystack \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{}}' 
# Expected: HTTP 200
```

---

## Step 8 — Post-Launch

### Onboard Lagos vendors (target: 50 before public launch)
1. Use admin panel at `owambe.com/admin` (admin@owambe.com)
2. Reach out to target vendors: Eko Hotel, Balmoral, caterers, photographers
3. Walk them through vendor signup at `owambe.com/register`
4. Verify their profiles in the admin dashboard

### Monitoring
- Uptime: Set up Better Uptime → monitor `api.owambe.com/health`
- Errors: Sentry (add `SENTRY_DSN` to env vars)
- Logs: Railway built-in logging
- DB: Railway Postgres metrics dashboard

---

## Common Issues

| Issue | Fix |
|---|---|
| `DATABASE_URL` connection failed | Check Railway Postgres is running; verify connection string format |
| Paystack webhook 400 | Check `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard |
| Image uploads failing | Verify AWS credentials and S3 bucket CORS policy |
| AI generation failing | Check OpenAI API key has credits and `gpt-4o` access |
| JWT errors | Ensure `JWT_SECRET` is at least 32 characters |
| PostGIS not found | Run `CREATE EXTENSION IF NOT EXISTS postgis` on Railway Postgres |

---

## Step 9 — Contract & E-Signature System

### Run the contracts migration
After running `prisma migrate deploy`, also run the manual migration for contracts + tenants (white-label):

```bash
# Connect to Railway Postgres
railway run psql $DATABASE_URL -f apps/api/prisma/migrations/add_contracts_and_tenants.sql
```

This creates:
- `contracts` table — stores contract templates, status, PDF URL
- `contract_signatures` table — per-signer with unique token, IP, timestamp
- `tenants` table — white-label portal config (if not already created by Prisma)

### Signing link URL
Signing links are emailed as:
```
https://owambe.com/contracts/sign/{token}
```
Ensure `NEXT_PUBLIC_APP_URL=https://owambe.com` is set on Vercel.

### PDF generation
PDFs are generated server-side using `pdf-lib` (no external service). On full execution (both parties signed), the PDF is generated and emailed. To also store in S3, uncomment the upload block in `routes/contracts.ts → generateAndStorePdf()`.

### Contract flow
1. Planner creates from `/dashboard/contracts/new` or auto-generates from a confirmed booking
2. Click "Send" — unique signing tokens emailed to both parties
3. Each party opens their link at `/contracts/sign/{token}` — no login required
4. Draws or types signature → agrees → submits
5. On full execution: PDF generated, emailed to both parties, status → FULLY_SIGNED

---

## Step 10 — White-label Portal

### Deploy whitelabel app separately
```bash
cd apps/whitelabel
vercel --prod
```

### Add wildcard domain in Vercel
In Vercel Dashboard → your whitelabel project → Settings → Domains:
```
*.owambe.com
```

### Promote a planner to Scale plan
```sql
UPDATE planners SET plan = 'SCALE' WHERE id = '<planner-uuid>';
```

### Custom domain setup (for agency clients)
They add a CNAME at their DNS:
```
Type: CNAME   Name: events   Value: techfest.owambe.com
```
Then update their portal: `PUT /api/tenants/me { customDomain: "events.techlagos.com" }`

---

## Common Issues (updated)

| Issue | Fix |
|---|---|
| `DATABASE_URL` connection failed | Check Railway Postgres; verify connection string format |
| Paystack webhook 400 | Check `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard |
| Image uploads failing | Verify AWS credentials and S3 bucket CORS policy |
| AI generation failing | Check OpenAI API key has credits and `gpt-4o` access |
| JWT errors | Ensure `JWT_SECRET` is at least 32 characters |
| PostGIS not found | Run `CREATE EXTENSION IF NOT EXISTS postgis` on Railway Postgres |
| Contract signing 404 | Check `NEXT_PUBLIC_APP_URL` is set; signing links use this base URL |
| PDF blank/corrupt | Ensure `pdf-lib@^1.17.1` is installed in `apps/api` |
| White-label portal 404 | Wildcard `*.owambe.com` must be added in Vercel dashboard |
| Scale plan gate | `UPDATE planners SET plan = 'SCALE' WHERE id = '...'` in Railway Postgres |
