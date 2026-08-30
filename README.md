# TanStack Start Template

A production-ready template for building modern full-stack web applications with TanStack Start, Better Auth, Drizzle ORM, and a complete authenticated app loop out of the box.

## Features

- **SSR & Routing**: [TanStack Start](https://tanstack.com/start) with file-based routes and type-safe navigation.
- **Server Engine**: [Nitro](https://nitro.unjs.io/) for high-performance server-side logic.
- **Authentication**: [Better Auth](https://better-auth.com/) — email OTP, passkeys, and optional Google OAuth. Rate limited (20 req/60 s). Session-guarded protected routes and redirect logic included.
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL. Notes CRUD example ships with the template to demonstrate the full server-function data boundary.
- **Account management**: `/settings` route — profile, linked providers, passkeys, and account deletion via Better Auth.
- **File uploads**: Presigned PUT upload via S3-compatible storage (MinIO locally; swap to AWS S3, Cloudflare R2, or Supabase Storage with an env var change).
- **Email**: Transactional email with [Resend](https://resend.com/) and [React Email](https://react.email/). OTP and verification templates included. Auth-guarded dispatch endpoint.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a hyper-minimalist dark-first design system.
- **Theme System**: Class-based light/dark switching via [next-themes](https://github.com/pacocoursey/next-themes).
- **Observability**: LogTape structured logging with a [Sentry](https://sentry.io/) sink. PII off by default, conservative sample rate. Debug routes gated to development.
- **Architecture**: Feature-based structure (`src/features`) with clear server-function data boundaries.
- **Developer Experience**:
  - [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) & [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for fast linting and formatting.
  - [Playwright](https://playwright.dev/) for E2E tests in `tests/e2e/`.
  - [Vitest](https://vitest.dev/) for unit tests in `tests/unit/`.
  - [Lefthook](https://github.com/evilmartians/lefthook) for git hooks.
  - CI on GitHub Actions: lint, typecheck, format, unit tests, E2E, and build.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3.14 or later
- [Docker](https://www.docker.com/) for local services (Postgres, MinIO, Maildev)

### Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in the required values. See [Required vs optional env vars](#environment-variables) below.

3. **Start local services**

   ```bash
   docker compose up -d
   ```

4. **Push the database schema**

   ```bash
   bun run db:push
   ```

5. **Start the dev server**

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, sign in, and land on the protected dashboard.

## Environment Variables

| Variable                   | Required | Description                                                                                                                                              |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | ✅       | PostgreSQL connection string                                                                                                                             |
| `BETTER_AUTH_SECRET`       | ✅       | 32+ character secret for session signing                                                                                                                 |
| `BETTER_AUTH_URL`          | ✅       | App origin (default: `http://localhost:3000`)                                                                                                            |
| `SERVER_URL`               | Optional | Canonical public application URL                                                                                                                         |
| `GOOGLE_CLIENT_ID`         | Optional | Enables Google OAuth when set together with secret                                                                                                       |
| `GOOGLE_CLIENT_SECRET`     | Optional | Enables Google OAuth when set together with ID                                                                                                           |
| `RESEND_API_KEY`           | Optional | Required to send email. App boots without it; email calls throw a clear error                                                                            |
| `EMAIL_FROM`               | Optional | Sender address (default: `onboarding@resend.dev`)                                                                                                        |
| `EMAIL_API_SECRET`         | Optional | 16+ char secret for server-to-server email dispatch via `x-email-secret` header                                                                          |
| `MINIO_ENDPOINT`           | Optional | S3-compatible endpoint — enables file uploads. Accepts MinIO, AWS S3, Cloudflare R2, or Supabase Storage (`https://<project>.supabase.co/storage/v1/s3`) |
| `MINIO_BUCKET`             | Optional | Bucket name (default: `app`)                                                                                                                             |
| `MINIO_ACCESS_KEY`         | Optional | Storage access key (default: `admin`)                                                                                                                    |
| `MINIO_SECRET_KEY`         | Optional | Storage secret key (default: `password`)                                                                                                                 |
| `UPSTASH_REDIS_REST_URL`   | Optional | Enables Redis-backed session cache for multi-instance deployments (Upstash or local SRH proxy)                                                           |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST API token                                                                                                                             |
| `SENTRY_AUTH_TOKEN`        | Optional | Auth token for Sentry source map uploads at build time                                                                                                   |
| `VITE_APP_TITLE`           | Optional | Application title displayed in UI branding                                                                                                               |
| `VITE_SENTRY_DSN`          | Optional | Enables Sentry error tracking                                                                                                                            |
| `VITE_SENTRY_ORG`          | Optional | Sentry organization slug                                                                                                                                 |
| `VITE_SENTRY_PROJECT`      | Optional | Sentry project slug                                                                                                                                      |

## Testing

```bash
bun run test:unit        # Vitest unit tests (unit project)
bun run test:integration # Vitest integration tests (integration project)
bun run test:e2e         # Playwright E2E tests
bunx playwright test --ui  # Interactive Playwright UI
```

## Scripts

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `bun run dev`              | Start development server            |
| `bun run build`            | Production build                    |
| `bun run build:docker`     | Build production Docker image       |
| `bun run type:check`       | TypeScript check (`tsc --noEmit`)   |
| `bun run lint:check`       | Check linting with Oxlint           |
| `bun run lint:fix`         | Fix lint warnings with Oxlint       |
| `bun run format:check`     | Check formatting with Oxfmt         |
| `bun run format:fix`       | Fix formatting with Oxfmt           |
| `bun run db:push`          | Push schema to local database       |
| `bun run db:generate`      | Generate Drizzle migration files    |
| `bun run db:studio`        | Open Drizzle Studio                 |
| `bun run test`             | Run all Vitest projects             |
| `bun run test:unit`        | Run Vitest unit test project        |
| `bun run test:integration` | Run Vitest integration test project |
| `bun run test:e2e`         | Run Playwright E2E tests            |
| `bun run clean`            | Clean build artifacts and caches    |

## Deployment

The template ships a `Dockerfile` and `docker-compose.yaml` for containerised deployment.

```bash
docker build -t tanstack-start-template .
docker run -p 3000:3000 tanstack-start-template
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — project structure, data flow, auth, and observability.
- [Design System](./docs/DESIGN.md) — aesthetic and design tokens.
- [Agents Guide](./AGENTS.md) — rules for coding agents working in this repo.
- [Deployment](./docs/DEPLOYMENT.md) — hosting options and platform-specific configuration.
- [Changelog](./docs/CHANGELOG.md) — version history.
- [Contributing](./docs/CONTRIBUTING.md) — branch, commit, and test conventions.
