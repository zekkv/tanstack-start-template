# Contributing

## Prerequisites

- [Bun](https://bun.sh) 1.3.14
- Docker (for Postgres, MinIO, and Maildev)

## Setup

```bash
cp .env.example .env
docker compose up -d postgres maildev minio minio_init
bun install
bun run db:migrate # or bun run db:push
bun run dev
```

## Branches

- Base all work off `main`.
- Use short, lowercase, hyphen-separated names: `feat/notes-crud`, `fix/auth-redirect`, `chore/ci-cache`.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add notes CRUD to dashboard
fix: redirect signed-in users away from /login
chore: pin Bun version in CI
```

## Tests

Run the full suite before opening a PR:

```bash
bun run lint:check
bun run type:check
bun run format:check
bun run test:unit
bun run test:integration
bun run test:e2e
```

Unit tests live in `tests/unit/` (run with `bun run test:unit`). They must not start a database container — test pure logic only. Integration tests live in `tests/integration/` (run with `bun run test:integration`) and may use Testcontainers (Postgres). E2E tests live in `tests/e2e/` (run with `bun run test:e2e`) and use Playwright.

New features need at least one unit test covering the core behaviour. New routes need at least one Playwright smoke test verifying the happy path and any redirect guards.

## Database changes

When modifying database schemas (`src/db/schema.ts`, `src/db/auth-schema.ts`):

1. **Always generate migrations**: Run `bun run db:generate` to generate the versioned migration SQL files in `src/db/drizzle/`.
2. **Never handwrite SQL migrations**: Drizzle Kit automatically manages schema snapshots and migration files.
3. **Commit both**: Commit schema changes together with the generated migration files in `src/db/drizzle/`.
4. **Apply migrations**: Run `bun run db:migrate` to verify they apply cleanly against your database (or `bun run db:push` during quick prototyping).

## Adding dependencies

Every runtime dependency added to `package.json` must be used by shipped code. Dev dependencies are fine as long as they stay out of the production bundle.

## Environment variables

All new env vars must be:

1. Added to `src/env.ts` (optional unless truly required for the app to boot).
2. Documented in `.env.example` with a descriptive comment.
3. Mentioned in `README.md` if they change the setup steps.
