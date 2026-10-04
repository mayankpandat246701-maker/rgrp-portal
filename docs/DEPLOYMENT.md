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
- `NODE_ENV`

The production server validates configuration at startup and fails without printing which secret is missing. Secrets must be strong and unique for this application. `APP_BASE_URL` must use HTTPS. Do not put real values in source control or deployment logs.

## Deploy

From a clean checkout:

```powershell
npm ci
npx prisma migrate deploy
npx prisma generate
npm run lint
npx tsc --noEmit
npx prisma validate
npm run build
npm run start
```

Apply migrations using the direct database connection configured for deployment. Confirm the health endpoint reports service and database availability before directing traffic.
Terminate TLS at a trusted hosting proxy and configure it to overwrite (not pass through client-supplied) `X-Forwarded-Proto`; HSTS is emitted only in production when that header is `https`.

## Private files and rate limiting

Encrypted local filesystem storage is for development only. Production uploads and private-file reads are blocked because ephemeral or instance-local disks can lose sensitive documents, expose files across deployments, and are not shared safely between instances. The application deliberately returns a generic service-unavailable response until a production private object-storage provider is implemented and configured. Do not accept real applicant documents before then.

The current in-memory rate limiter is development-only. It cannot coordinate counters across processes or hosting instances. Before production traffic is enabled, integrate a shared store such as Upstash Redis and configure it behind the existing rate-limiter interface. Until then, rate-limited production endpoints fail closed with a generic response.

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
- [ ] Validate TLS, production headers, backup restoration, and alerting.
- [ ] Verify admin roles, session invalidation, audit visibility, and least-privilege database/storage access.
- [ ] Test upload size/type/signature validation and authenticated file previews with synthetic documents.
- [ ] Confirm sensitive values, documents, storage locations, and credentials do not appear in logs, client responses, or source control.
- [ ] Obtain required organizational and legal approvals before processing real applicant data.
