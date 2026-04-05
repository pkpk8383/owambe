# Owambe White-label Portal

The white-label system lets Scale plan agencies run a fully branded event portal on their own subdomain or custom domain.

## How it works

```
techfest.owambe.com  →  Whitelabel Next.js app
                         ↓ edge middleware extracts subdomain
                         ↓ GET /api/tenants/resolve?subdomain=techfest
                         ↓ API returns branding config
                         ↓ CSS vars injected into layout
                         ↓ Events fetched for that planner
                         ↓ Branded portal rendered
```

## Architecture

```
apps/whitelabel/
├── middleware.ts              # Edge: extracts subdomain → x-owambe-subdomain header
├── src/
│   ├── lib/tenant.ts          # Server: resolves tenant, builds CSS vars
│   ├── app/
│   │   ├── layout.tsx         # Root layout: injects CSS vars, meta, fonts
│   │   ├── globals.css        # Base styles using CSS vars
│   │   ├── page.tsx           # Event listings homepage
│   │   ├── not-found.tsx      # 404 page
│   │   └── events/[slug]/
│   │       ├── page.tsx       # Individual event page
│   │       └── RegisterForm.tsx  # Client: registration form
```

## Tenant branding config

Every portal has:

| Field | Description |
|-------|-------------|
| `subdomain` | `techfest` → `techfest.owambe.com` (permanent) |
| `customDomain` | `events.techlagos.com` (optional, CNAME required) |
| `primaryColor` | Navbar, buttons, links |
| `accentColor` | CTA buttons, highlights |
| `bgColor` | Page background |
| `fontFamily` | Google Fonts — loaded automatically |
| `logoUrl` | Shown in navbar |
| `customCss` | Arbitrary CSS override |

## Deploy white-label app to Vercel

### 1. Create a new Vercel project
```bash
cd apps/whitelabel
vercel --prod
```

### 2. Configure wildcard subdomain in Vercel
Vercel Dashboard → Project → Settings → Domains → Add:
```
*.owambe.com
```

This lets all subdomain requests hit the same Next.js deployment.

### 3. Set environment variables
```
OWAMBE_API_URL=https://api.owambe.com/api
NEXT_PUBLIC_API_URL=https://api.owambe.com/api
```

### 4. Custom domain setup (for agency clients)
When an agency adds `events.techlagos.com`:

1. They add a CNAME: `events` → `techfest.owambe.com`
2. They update their tenant record: `customDomain = events.techlagos.com`
3. Vercel auto-provisions SSL via Let's Encrypt
4. The edge middleware detects the non-owambe host and sets `x-owambe-custom-domain`
5. `getTenant()` resolves by custom domain instead of subdomain

### 5. DNS record for custom domain (agency side)
```
Type    Name      Value
CNAME   events    techfest.owambe.com
```

## API endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/tenants/resolve?subdomain=x` | Public | Resolve tenant by subdomain (used by whitelabel app) |
| `GET /api/tenants/resolve?domain=x` | Public | Resolve tenant by custom domain |
| `GET /api/tenants/me` | Planner | Get own tenant config |
| `POST /api/tenants` | Scale Planner | Create portal (one per planner) |
| `PUT /api/tenants/me` | Scale Planner | Update branding |
| `GET /api/tenants/:subdomain/events` | Public | List published events for portal |
| `GET /api/tenants` | Admin | List all tenants |
| `PATCH /api/tenants/:id/toggle` | Admin | Enable/disable portal |

## Prisma schema additions

```prisma
model Tenant {
  id              String   @id
  plannerId       String   // FK to Planner (Scale plan only)
  subdomain       String   @unique
  customDomain    String?  @unique
  name            String
  primaryColor    String   @default("#2D6A4F")
  accentColor     String   @default("#E76F2A")
  bgColor         String   @default("#FDFAF4")
  fontFamily      String   @default("Inter")
  logoUrl         String?
  faviconUrl      String?
  tagline         String?
  footerText      String?
  socialLinks     Json?
  customCss       String?
  allowPublicReg  Boolean  @default(true)
  requireApproval Boolean  @default(false)
  isActive        Boolean  @default(true)
  ...
}
```

## Caching

Tenant configs are cached in Redis for 5 minutes (`tenant:sub:{subdomain}` and `tenant:domain:{domain}`). The cache is invalidated on every `PUT /api/tenants/me` and `PATCH /api/tenants/:id/toggle`.

## Feature matrix

| Feature | Starter | Growth | Scale |
|---------|---------|--------|-------|
| Owambe-hosted reg page | ✓ | ✓ | ✓ |
| White-label subdomain | ✗ | ✗ | ✓ |
| Custom domain | ✗ | ✗ | ✓ |
| Full branding (logo, colours, font) | ✗ | ✗ | ✓ |
| Custom CSS | ✗ | ✗ | ✓ |
| SEO meta tags | ✗ | ✗ | ✓ |
| Social links in footer | ✗ | ✗ | ✓ |
