-- Migration: Add contract and e-signature system
-- Run this after the existing migrations have been applied
-- Required extensions (should already exist): uuid-ossp

-- ─── ENUMS ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM (
    'DRAFT', 'SENT', 'PARTIALLY_SIGNED', 'FULLY_SIGNED', 'VOID', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SignerRole" AS ENUM ('PLANNER', 'VENDOR', 'WITNESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── CONTRACTS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "contracts" (
  "id"              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "reference"       TEXT          NOT NULL,
  "bookingId"       UUID,
  "plannerId"       UUID          NOT NULL,
  "vendorId"        UUID          NOT NULL,
  "title"           TEXT          NOT NULL,
  "templateType"    TEXT          NOT NULL,
  "status"          "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "bodyHtml"        TEXT          NOT NULL,
  "pdfUrl"          TEXT,
  "totalAmount"     DECIMAL(12,2),
  "currency"        TEXT          NOT NULL DEFAULT 'NGN',
  "eventDate"       TIMESTAMPTZ,
  "eventVenue"      TEXT,
  "expiresAt"       TIMESTAMPTZ,
  "voidedAt"        TIMESTAMPTZ,
  "voidReason"      TEXT,
  "sentAt"          TIMESTAMPTZ,
  "fullySignedAt"   TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contracts_reference_key" UNIQUE ("reference"),
  CONSTRAINT "contracts_plannerId_fkey"
    FOREIGN KEY ("plannerId") REFERENCES "planners"("id") ON DELETE CASCADE,
  CONSTRAINT "contracts_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT,
  CONSTRAINT "contracts_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "contracts_plannerId_idx" ON "contracts"("plannerId");
CREATE INDEX IF NOT EXISTS "contracts_vendorId_idx" ON "contracts"("vendorId");
CREATE INDEX IF NOT EXISTS "contracts_bookingId_idx" ON "contracts"("bookingId");
CREATE INDEX IF NOT EXISTS "contracts_status_idx" ON "contracts"("status");

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contracts_updated_at ON "contracts";
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON "contracts"
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();

-- ─── CONTRACT SIGNATURES TABLE ────────────────────────
CREATE TABLE IF NOT EXISTS "contract_signatures" (
  "id"              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "contractId"      UUID          NOT NULL,
  "signerRole"      "SignerRole"  NOT NULL,
  "signerName"      TEXT          NOT NULL,
  "signerEmail"     TEXT          NOT NULL,
  "signedAt"        TIMESTAMPTZ,
  "signingToken"    TEXT          NOT NULL,
  "tokenExpiry"     TIMESTAMPTZ   NOT NULL,
  "ipAddress"       TEXT,
  "userAgent"       TEXT,
  "signatureData"   TEXT,
  "isSigned"        BOOLEAN       NOT NULL DEFAULT FALSE,
  "viewedAt"        TIMESTAMPTZ,
  "reminderSentAt"  TIMESTAMPTZ,

  CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contract_signatures_signingToken_key" UNIQUE ("signingToken"),
  CONSTRAINT "contract_signatures_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "contract_signatures_contractId_idx" ON "contract_signatures"("contractId");
CREATE INDEX IF NOT EXISTS "contract_signatures_token_idx" ON "contract_signatures"("signingToken");

-- ─── ADD TENANTS TABLE (white-label) ──────────────────
-- Only run if not already created by a prior migration

DO $$ BEGIN
  CREATE TYPE "PlanType" AS ENUM ('STARTER', 'GROWTH', 'SCALE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "tenants" (
  "id"              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "plannerId"       UUID          NOT NULL,
  "subdomain"       TEXT          NOT NULL,
  "customDomain"    TEXT,
  "name"            TEXT          NOT NULL,
  "tagline"         TEXT,
  "logoUrl"         TEXT,
  "faviconUrl"      TEXT,
  "primaryColor"    TEXT          NOT NULL DEFAULT '#2D6A4F',
  "accentColor"     TEXT          NOT NULL DEFAULT '#E76F2A',
  "bgColor"         TEXT          NOT NULL DEFAULT '#FDFAF4',
  "fontFamily"      TEXT          NOT NULL DEFAULT 'Inter',
  "footerText"      TEXT,
  "socialLinks"     JSONB,
  "metaTitle"       TEXT,
  "metaDescription" TEXT,
  "metaImage"       TEXT,
  "isActive"        BOOLEAN       NOT NULL DEFAULT TRUE,
  "allowPublicReg"  BOOLEAN       NOT NULL DEFAULT TRUE,
  "requireApproval" BOOLEAN       NOT NULL DEFAULT FALSE,
  "customCss"       TEXT,
  "createdAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain"),
  CONSTRAINT "tenants_customDomain_key" UNIQUE ("customDomain"),
  CONSTRAINT "tenants_plannerId_fkey"
    FOREIGN KEY ("plannerId") REFERENCES "planners"("id") ON DELETE CASCADE
);

-- ─── VERIFY ───────────────────────────────────────────
SELECT 
  'contracts' as table_name, COUNT(*) as rows FROM "contracts"
UNION ALL SELECT 
  'contract_signatures', COUNT(*) FROM "contract_signatures"
UNION ALL SELECT
  'tenants', COUNT(*) FROM "tenants";

-- ─── TICKET TYPE ADDITIONAL FIELDS ────────────────────
ALTER TABLE "ticket_types"
  ADD COLUMN IF NOT EXISTS "salesEndDate" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "minPerOrder"  INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "maxPerOrder"  INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "benefits"     TEXT[] DEFAULT '{}';

-- ─── VENDOR ADDITIONAL FIELDS ──────────────────────────
ALTER TABLE "vendors"
  ADD COLUMN IF NOT EXISTS "phone"            TEXT,
  ADD COLUMN IF NOT EXISTS "isPhoneVerified"  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "website"          TEXT,
  ADD COLUMN IF NOT EXISTS "instagram"        TEXT;

-- ─── BOOKING ADDITIONAL FIELDS ─────────────────────────
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "bookerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "bookerName"  TEXT;

-- ─── CRM INTEGRATION TABLES ────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CrmProvider" AS ENUM ('SALESFORCE', 'HUBSPOT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SyncStatus" AS ENUM ('IDLE','SYNCING','SUCCESS','FAILED','PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SyncDirection" AS ENUM ('PUSH','PULL','BIDIRECTIONAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "crm_connections" (
  "id"                  UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "plannerId"           UUID          NOT NULL,
  "provider"            "CrmProvider" NOT NULL,
  "isActive"            BOOLEAN       NOT NULL DEFAULT TRUE,
  "accessToken"         TEXT          NOT NULL,
  "refreshToken"        TEXT,
  "tokenExpiresAt"      TIMESTAMPTZ,
  "instanceUrl"         TEXT,
  "portalId"            TEXT,
  "syncDirection"       "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
  "syncAttendees"       BOOLEAN       NOT NULL DEFAULT TRUE,
  "syncBookings"        BOOLEAN       NOT NULL DEFAULT TRUE,
  "syncContacts"        BOOLEAN       NOT NULL DEFAULT TRUE,
  "autoSyncEnabled"     BOOLEAN       NOT NULL DEFAULT TRUE,
  "syncIntervalHours"   INT           NOT NULL DEFAULT 6,
  "attendeeFieldMap"    JSONB         NOT NULL DEFAULT '{}',
  "bookingFieldMap"     JSONB         NOT NULL DEFAULT '{}',
  "crmContactOwnerId"   TEXT,
  "crmPipelineId"       TEXT,
  "lastSyncAt"          TIMESTAMPTZ,
  "lastSyncStatus"      "SyncStatus"  NOT NULL DEFAULT 'IDLE',
  "lastSyncError"       TEXT,
  "totalSynced"         INT           NOT NULL DEFAULT 0,
  "totalErrors"         INT           NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "crm_connections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "crm_connections_planner_provider_key" UNIQUE ("plannerId", "provider"),
  CONSTRAINT "crm_connections_plannerId_fkey"
    FOREIGN KEY ("plannerId") REFERENCES "planners"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_connections_plannerId_idx" ON "crm_connections"("plannerId");

CREATE TABLE IF NOT EXISTS "crm_sync_logs" (
  "id"            UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "connectionId"  UUID          NOT NULL,
  "entityType"    TEXT          NOT NULL,
  "entityId"      TEXT          NOT NULL,
  "crmId"         TEXT,
  "direction"     "SyncDirection" NOT NULL,
  "status"        "SyncStatus"  NOT NULL,
  "errorMessage"  TEXT,
  "payload"       JSONB,
  "durationMs"    INT,
  "syncedAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "crm_sync_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "crm_sync_logs_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "crm_connections"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_sync_logs_connectionId_idx" ON "crm_sync_logs"("connectionId");
CREATE INDEX IF NOT EXISTS "crm_sync_logs_entity_idx" ON "crm_sync_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "crm_sync_logs_syncedAt_idx" ON "crm_sync_logs"("syncedAt" DESC);

-- ─── INSTALMENT PAYMENT PLANS ──────────────────────────
DO $$ BEGIN
  CREATE TYPE "InstalmentStatus" AS ENUM (
    'ACTIVE','COMPLETED','DEFAULTED','CANCELLED','PAUSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InstalmentPaymentStatus" AS ENUM (
    'SCHEDULED','PENDING','PROCESSING','PAID','FAILED','WAIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "instalment_plans" (
  "id"                  UUID            NOT NULL DEFAULT uuid_generate_v4(),
  "reference"           TEXT            NOT NULL,
  "bookingId"           UUID            NOT NULL,
  "plannerId"           UUID,
  "consumerId"          UUID,
  "totalAmount"         DECIMAL(12,2)   NOT NULL,
  "instalmentCount"     INT             NOT NULL,
  "instalmentAmount"    DECIMAL(12,2)   NOT NULL,
  "serviceFeeRate"      DECIMAL(5,2)    NOT NULL DEFAULT 3.5,
  "serviceFeeAmount"    DECIMAL(12,2)   NOT NULL,
  "grandTotal"          DECIMAL(12,2)   NOT NULL,
  "currency"            TEXT            NOT NULL DEFAULT 'NGN',
  "paystackAuthCode"    TEXT,
  "paystackCustomerCode" TEXT,
  "paystackEmail"       TEXT,
  "status"              "InstalmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "amountPaid"          DECIMAL(12,2)   NOT NULL DEFAULT 0,
  "nextDueDate"         TIMESTAMPTZ,
  "cancelledAt"         TIMESTAMPTZ,
  "cancelReason"        TEXT,
  "completedAt"         TIMESTAMPTZ,
  "defaultedAt"         TIMESTAMPTZ,
  "failureCount"        INT             NOT NULL DEFAULT 0,
  "startDate"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "createdAt"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "instalment_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instalment_plans_reference_key" UNIQUE ("reference"),
  CONSTRAINT "instalment_plans_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id"),
  CONSTRAINT "instalment_plans_plannerId_fkey"
    FOREIGN KEY ("plannerId") REFERENCES "planners"("id"),
  CONSTRAINT "instalment_plans_consumerId_fkey"
    FOREIGN KEY ("consumerId") REFERENCES "consumers"("id")
);

CREATE INDEX IF NOT EXISTS "instalment_plans_bookingId_idx" ON "instalment_plans"("bookingId");
CREATE INDEX IF NOT EXISTS "instalment_plans_status_idx" ON "instalment_plans"("status");
CREATE INDEX IF NOT EXISTS "instalment_plans_nextDueDate_idx" ON "instalment_plans"("nextDueDate");

CREATE TABLE IF NOT EXISTS "instalment_payments" (
  "id"                  UUID            NOT NULL DEFAULT uuid_generate_v4(),
  "planId"              UUID            NOT NULL,
  "instalmentNumber"    INT             NOT NULL,
  "amount"              DECIMAL(12,2)   NOT NULL,
  "dueDate"             TIMESTAMPTZ     NOT NULL,
  "paidAt"              TIMESTAMPTZ,
  "status"              "InstalmentPaymentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "paystackReference"   TEXT            UNIQUE,
  "paystackChargeId"    TEXT,
  "failureReason"       TEXT,
  "retryCount"          INT             NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "instalment_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instalment_payments_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "instalment_plans"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "instalment_payments_planId_idx" ON "instalment_payments"("planId");
CREATE INDEX IF NOT EXISTS "instalment_payments_dueDate_idx" ON "instalment_payments"("dueDate");
CREATE INDEX IF NOT EXISTS "instalment_payments_status_idx" ON "instalment_payments"("status");
