# Deployment guide

## Prerequisites

- Node.js 20.9 or newer, matching the installed Next.js requirements.
- A Neon PostgreSQL project with a pooled runtime connection and a direct connection for migrations.
- A private GitHub repository and a hosting platform that supports the required Node.js version and environment variables.
- A deployment process that runs migrations before routing traffic to a new release.

## Production environment

Configure these server-side environment-variable names in the hosting platform. Do not prefix secrets with `NEXT_PUBLIC_`.

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `DOCUMENT_ENCRYPTION_KEY`
- `QR_SIGNING_SECRET`
- `APP_BASE_URL`
- `STORAGE_PROVIDER`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `BLOB_STORE_ID` (injected by the connected private Blob store; OIDC auth)
- `BLOB_PUBLIC__STORE_ID` (injected by the connected public Blob store; OIDC auth)
- `BLOB_READ_WRITE_TOKEN` (optional; long-lived token alternative, mainly for local development)
- `BLOB_PUBLIC_READ_WRITE_TOKEN` (optional; long-lived token alternative for the public store)
- `RATE_LIMIT_PROVIDER`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NODE_ENV`

The production server validates configuration at startup, fails closed, and reports only invalid or missing variable names—never their values. Secrets must be strong and unique for this application. `APP_BASE_URL` must use HTTPS. Do not put real values in source control or deployment logs.

Use `STORAGE_PROVIDER=vercel-blob` with two Vercel Blob stores: a **private** store for documents, ID-card templates, QR codes, and member photos (only readable through the SDK), and a **public** store for Mukhya Vyakti portrait images that must render on public pages. With Vercel's OIDC-based Blob authentication (the default), connecting the stores to the project injects `BLOB_STORE_ID` and `BLOB_PUBLIC__STORE_ID`, and Vercel injects `VERCEL_OIDC_TOKEN` automatically—no long-lived tokens are required. Where the UI still provides read-write tokens, `BLOB_READ_WRITE_TOKEN` and `BLOB_PUBLIC_READ_WRITE_TOKEN` may be set instead; when present they take priority over OIDC (useful for local development). Alternatively, `STORAGE_PROVIDER=supabase` with `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET` remains supported with a private Supabase Storage bucket. Use `RATE_LIMIT_PROVIDER=upstash` with the Upstash REST credentials for shared production rate limiting. Do not make the private bucket or private object URLs public.

## Pending additive migration

Both migrations below are pending and must be reviewed and applied in timestamp order from a controlled release environment. Do not use `prisma migrate dev` against production. Application code is not a substitute for these migrations; the affected routes require the schema to be deployed first.

- `20261004170000_add_karyakarta_directory_and_official_links` adds Karyakarta directory and registration fields, official links, verification logs, and Admin territory assignments. It preserves each existing Karyakarta row. The slug backfill uses the normalized registration number or the nonblank fallback `karyakarta`, followed by the hex-encoded full Karyakarta ID so slugs are deterministic and unique even when registration values normalize identically or IDs share a six-character prefix. Missing or whitespace-only legacy registration numbers receive a deterministic `LEGACY-MISSING-<hex-id>` registration-card number with `PENDING` status; they are never promoted to active. Duplicate nonblank legacy registration numbers or a placeholder collision stop the migration with an explicit error.
- `20261004191000_expand_portal_content_and_certificates` adds News, Ground Activity, site-logo settings, joining certificates, certificate verification logs, and appointment/emergency-visibility fields. It contains additive table/column/index/constraint creation only.

Before applying the first migration, run this read-only PostgreSQL preflight against the target database. It reports missing/blank registration values, exact duplicate registration numbers, values that normalize to a blank slug component, duplicates of the old exact slug expression, and IDs sharing the same first six characters. Review any duplicate nonblank registration number before proceeding; the migration intentionally stops rather than choosing which legacy number to preserve.

```sql
WITH source AS (
  SELECT
    "id",
    "regNo",
    trim(both '-' from regexp_replace(lower("regNo"), '[^a-z0-9]+', '-', 'g')) AS normalized_reg_no,
    trim(both '-' from regexp_replace(lower("regNo"), '[^a-z0-9]+', '-', 'g'))
      || '-' || left("id", 6) AS old_generated_slug
  FROM "Karyakarta"
),
issues AS (
  SELECT 'NULL registration number' AS issue, '<NULL>' AS value, count(*) AS affected_rows
  FROM source
  WHERE "regNo" IS NULL
  HAVING count(*) > 0

  UNION ALL

  SELECT 'Blank/whitespace registration number', '<blank>', count(*)
  FROM source
  WHERE "regNo" IS NOT NULL
    AND regexp_replace("regNo", '[[:space:]]', '', 'g') = ''
  HAVING count(*) > 0

  UNION ALL

  SELECT 'Duplicate registration number', "regNo", count(*)
  FROM source
  WHERE "regNo" IS NOT NULL
    AND regexp_replace("regNo", '[[:space:]]', '', 'g') <> ''
  GROUP BY "regNo"
  HAVING count(*) > 1

  UNION ALL

  SELECT 'Registration number normalizes to blank slug component', "regNo", count(*)
  FROM source
  WHERE "regNo" IS NOT NULL AND normalized_reg_no = ''
  GROUP BY "regNo"

  UNION ALL

  SELECT 'Duplicate old generated slug expression',
    COALESCE(old_generated_slug, '<NULL>'), count(*)
  FROM source
  GROUP BY old_generated_slug
  HAVING count(*) > 1

  UNION ALL

  SELECT 'Karyakarta IDs share their first six characters', left("id", 6), count(*)
  FROM source
  GROUP BY left("id", 6)
  HAVING count(*) > 1
)
SELECT issue, value, affected_rows
FROM issues
ORDER BY issue, value;
```

An empty result means none of the listed conditions were found. The first migration handles missing/blank registration numbers without deleting Karyakartas or creating active cards for placeholder numbers. It aborts if duplicate nonblank registration numbers exist, so correct those records under an approved data-maintenance plan and rerun the preflight before migration.

Review the complete SQL for both migrations and approve it before running `npx prisma migrate deploy`. Apply neither migration until preflight results and the migration SQL are reviewed.

Joining certificates use the Noto Sans Devanagari font package, embed the font in generated PDFs, and store PDFs encrypted in the configured private storage provider. Certificate download is restricted to authorized administrators until member authentication is implemented.

## Deploy

From a clean checkout:

```powershell
npm ci
npx prisma migrate deploy
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npx prisma validate
npm run build
npm run start
```

Apply migrations using the direct database connection configured for deployment. Confirm the health endpoint reports service and database availability before directing traffic.
Terminate TLS at a trusted hosting proxy and configure it to overwrite (not pass through client-supplied) `X-Forwarded-Proto`; HSTS is emitted only in production when that header is `https`.

## Private files and rate limiting

Encrypted local filesystem storage is for development only. Production private-file uploads and reads require the configured Vercel Blob private store (`STORAGE_PROVIDER=vercel-blob`, authenticated via OIDC with `BLOB_STORE_ID` or with `BLOB_READ_WRITE_TOKEN`) or the Supabase provider and a private bucket; local or missing storage configuration is not a safe production substitute. Verify object privacy, key access, backup/retention policy, and successful encrypted upload/read/delete tests before accepting real documents.

The in-memory rate limiter is development-only. It cannot coordinate counters across processes or hosting instances. Production rate-limited endpoints require the shared Upstash provider; they fail closed when it is missing or unavailable.

The next storage implementation must keep objects private, encrypt at rest and in transit, enforce least-privilege access, support safe retention/deletion, and serve files only through authenticated application endpoints. Do not make the bucket or object URLs public.

## Database backup and restore

- Enable and review Neon backup/PITR retention appropriate to the organization’s recovery objectives.
- Restrict database access and periodically test restoring a backup into a separate environment.
- Before restoring production, stop writes or coordinate a maintenance window; validate restored schema and application data before reopening traffic.
- Keep backup access and restore credentials outside source control and application logs.

## Incident response and key rotation

If a signing or encryption secret may be exposed, restrict access and preserve relevant operational evidence without copying secrets or applicant files into tickets.

- Rotate `AUTH_SECRET` to invalidate existing admin sessions; require admins to sign in again.
- Rotate `QR_SIGNING_SECRET` and assess/reissue affected ID cards and QR codes. Previously signed QR codes may no longer validate.
- Rotation of `DOCUMENT_ENCRYPTION_KEY` requires a planned decrypt-and-re-encrypt migration while the old key is still available. Do not discard the old key until all retained files have been migrated and verified.
- Review audit activity, restrict compromised accounts, and follow organizational privacy/breach notification procedures.

## Before accepting real Aadhaar documents or photos

- [ ] Complete security and privacy review, including retention, deletion, access, and breach-response procedures.
- [ ] Deploy and test a private production object-storage provider; confirm local storage remains disabled.
- [ ] Configure and test shared production rate limiting.
- [ ] Review and apply the approved additive Prisma migration from a controlled release environment.
- [ ] Verify Hindi certificate PDF font rendering, Admin-only download, reissue/revocation history, and public verification using synthetic member data.
- [ ] Verify emergency-hidden Karyakarta profiles, photos, IDs, and certificates are not exposed in public routes.
- [ ] Validate TLS, production headers, backup restoration, and alerting.
- [ ] Verify admin roles, session invalidation, audit visibility, and least-privilege database/storage access.
- [ ] Test upload size/type/signature validation and authenticated file previews with synthetic documents.
- [ ] Confirm sensitive values, documents, storage locations, and credentials do not appear in logs, client responses, or source control.
- [ ] Obtain required organizational and legal approvals before processing real applicant data.
