# Architecture

This project is opinionated towards [Bun](https://bun.sh/) and follows a modern SSR architecture using TanStack Start and Nitro.

## Core Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) — full-stack React with TanStack Router, server functions, and SSR.
- **Server**: [Nitro](https://nitro.unjs.io/) — handles server-side logic and deployment presets.
- **ORM & Database**: [Drizzle ORM](https://orm.drizzle.team/) with Bun's native SQL driver (`bun:sql` / `drizzle-orm/bun-sql`) — high-performance, zero-dependency PostgreSQL access.
- **Auth**: [Better Auth](https://better-auth.com/) — email OTP, passkeys, and optional Google OAuth. Rate limited at the Better Auth layer (20 req/60 s).
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) — class-based theme management on `html` with a mounted client toggle.

## Directory Structure

```
.
├── docs/
│   ├── ARCHITECTURE.md   # This file
│   ├── CHANGELOG.md      # Release history
│   ├── DESIGN.md         # Visual system notes
│   ├── CONTRIBUTING.md   # Branch, commit, and test conventions
│   └── DEPLOYMENT.md     # Hosting options and platform config
├── AGENTS.md             # Developer guide for agents (also CLAUDE.md)
├── CLAUDE.md             # Claude Code entry point — includes AGENTS.md
├── src/
│   ├── components/
│   │   ├── layout/       # Header and shell layout
│   │   ├── pages/        # Route-level page compositions
│   │   ├── providers/    # Client providers (theme)
│   │   └── ui/           # Reusable UI primitives
│   ├── db/               # Drizzle schema and client
│   │   ├── schema.ts     # notes table (with userId FK)
│   │   └── auth-schema.ts# Better Auth tables
│   ├── features/
│   │   ├── auth/         # Session logic, route guards, settings model, login/signup/OTP forms
│   │   ├── emails/       # Email templates, schema, send guard
│   │   └── notes/        # Notes server functions and model
│   ├── lib/              # Shared integrations and utilities
│   │   ├── auth.ts       # Better Auth server config
│   │   ├── auth-client.ts# Better Auth React client
│   │   ├── logger.ts     # LogTape app logger and sink config
│   │   ├── mailer.ts     # Resend email sender (lazy init, optional)
│   │   ├── redis.ts      # Bun-native Redis client (optional)
│   │   ├── seo.ts        # SEO metadata, OpenGraph, structured data, crawler formats
│   │   ├── storage.ts    # Bun-native S3-compatible upload client (optional)
│   │   ├── query-client.tsx
│   │   └── utils.ts
│   ├── routes/           # TanStack Router routes and API handlers
│   │   ├── __root.tsx    # App shell
│   │   ├── index.tsx     # Landing page
│   │   ├── login.tsx     # Auth route — redirects signed-in users
│   │   ├── signup.tsx    # Auth route — redirects signed-in users
│   │   ├── verify-otp.tsx
│   │   ├── dashboard.tsx # Protected route — notes CRUD, upload widget
│   │   ├── settings.tsx  # Protected route — profile, providers, passkeys, delete account
│   │   ├── sentry-example.tsx # Dev only
│   │   ├── robots[.]txt.ts   # Plain text crawler directives
│   │   ├── sitemap[.]xml.ts  # XML sitemap
│   │   └── api/
│   │       ├── auth/$.ts    # Better Auth handler
│   │       ├── health.ts
│   │       ├── send-email.ts# Auth-guarded email dispatch
│   │       ├── upload-url.ts# Auth-guarded presigned PUT URL
│   │       └── sentry-example.ts # Dev only
│   └── globals.css       # Global styles (Tailwind CSS v4)
├── tests/                # Vitest and Playwright suites
├── instrument.server.mjs # Server bootstrap — Sentry init and logging
├── components.json       # shadcn/ui configuration
├── Dockerfile
├── drizzle.config.ts
└── package.json
```

## Data Flow

1. **Routing**: Managed by TanStack Router. `src/routes/__root.tsx` composes the shell, theme provider, header, and page outlet.
2. **SSR**: TanStack Start handles the initial HTML render on the server via Nitro.
3. **Protected routes**: `dashboard.tsx` and `settings.tsx` call `getCurrentUser()` in `beforeLoad`. Unauthenticated requests redirect to `/login`. Auth routes (`/login`, `/signup`) redirect already-signed-in users to `/dashboard`.
4. **Server functions**: `src/features/notes/notes-fns.ts` exposes `listNotes`, `createNote`, and `deleteNote` via `createServerFn`. Each function re-checks the session server-side.
5. **Auth flow**: Forms in `src/features/auth/components/*` call `src/lib/auth-client.ts`. `/login` supports email OTP, passkeys, and Google OAuth (when configured). `/signup` sends an OTP; `/verify-otp` confirms it and offers passkey enrollment.
6. **Email dispatch**: `src/routes/api/send-email.ts` requires either an authenticated session or a valid `x-email-secret` header. Dispatch itself goes through `src/lib/mailer.ts`, which throws a clear error when `RESEND_API_KEY` is not set.
7. **File uploads**: `src/routes/api/upload-url.ts` generates a presigned PUT URL (S3-compatible). The client uploads directly to storage; the server never proxies file bytes.

## Authentication

Handled by **Better Auth**. Supported flows:

- **Email OTP** — sign in and sign up via one-time code. Always available.
- **Passkeys** — register and authenticate with a device credential. Always available.
- **Google OAuth** — enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. The app boots and functions without them.

Rate limiting is configured at 20 requests per 60-second window using Better Auth's built-in `rateLimit` option.

## Styling

**Tailwind CSS v4** is integrated via `@tailwindcss/vite`. Theme switching is class-based on the `html` element through `next-themes`.

## Observability

### LogTape + Sentry

LogTape provides the app logger in `src/lib/logger.ts`. The server bootstrap (`instrument.server.mjs`) initialises Sentry with:

- `sendDefaultPii: false` — PII is not forwarded by default.
- `tracesSampleRate: 0.1` — 10% of server traces are sampled to control cost.

Enable `sendDefaultPii: true` and raise `tracesSampleRate` only intentionally, after reviewing your data-handling obligations.
