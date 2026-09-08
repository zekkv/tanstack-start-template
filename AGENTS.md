# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Where things are documented

Read these instead of re-deriving; do not duplicate their content here.

- `docs/ARCHITECTURE.md` — stack, directory map, data flow, auth flows, observability config.
- `docs/CONTRIBUTING.md` — branch names, Conventional Commits, dependency and env-var rules.
- `README.md` — setup, environment variables, local services.

## Running a single test

`package.json` only exposes whole-suite scripts; target a single test by passing the path through:

```bash
bun run vitest run tests/unit/auth-session.test.ts            # one file
bun run vitest run tests/unit/auth-session.test.ts -t "returns null"   # one case
bun run playwright test tests/e2e/landing.test.ts     # one E2E file
```

## Test layout gotchas

- `test:unit` runs the Vitest `unit` project (`vitest run --project unit`), targeting `tests/unit/` with `jsdom` environment.
- `test:integration` runs the Vitest `integration` project (`vitest run --project integration`), targeting `tests/integration/` with `node` environment.
- Unit tests must not start a database container; keep them to pure logic. Testcontainers belongs in integration/E2E only.
- Coverage is `enabled: true` in `vitest.config.ts`, so test runs rewrite `coverage/`.

## File naming inside `src/features/`

- Server functions exported via `createServerFn` and consumed by routes are compiled for the client environment. TanStack Start strips `.handler(...)` bodies but preserves all other `export` declarations.
- Never statically import runtime built-ins or server-only dependencies (`#/db`, `"bun"`) at module level if any exported helper references them (e.g. via default parameters like `database = db`). This anchors the dependency in the AST and prevents Dead Code Elimination, leaking server built-ins into client bundles.
- Instead, reach server dependencies dynamically inside `.handler()` via `await import("#/db")`, import server types with `import type`, and require injected dependencies in exported helpers (e.g. `database: Database`).
- Do **not** name either kind `<feature>.server.ts`. `@tanstack/start-plugin-core`'s import-protection plugin denies `**/*.server.*` in the client environment, so the first route that imports it fails `bun run build` — and only `build`, not `type:check` and not the test suites. That suffix is only for modules nothing client-reachable imports.
- No `-model` suffix, and no entity-name stutter (`notes/notes-fns.ts`). A helper with only one caller lives in that caller's file — even if a unit test also imports and tests it (export it from the caller's file for the test). Only extract a helper into its own file when it has two or more application callers.
- Server-function validation lives in the Zod schema, parsed with `safeParse` rethrowing `issues[0].message` — never let a raw `ZodError` reach a route.

## Imports

`#/...` is the only alias for `src/`. It is declared in three places that must stay in sync — `tsconfig.json` `paths`, `package.json` `imports`, and the `alias` block in `vitest.config.ts` — so adding another alias means touching all three or it will typecheck and then fail under test. `components.json` already generates `#/`, so shadcn output needs no rewriting.

## Adding an environment variable

Three places, all required: `src/env.ts`, a commented entry in `.env.example`, and `README.md` if it changes setup steps.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 3. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 4. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section your todo list
6. **Capture Lessons**: Update lessons/memory after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
