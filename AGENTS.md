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
bun run vitest run tests/unit/notes-model.test.ts     # one file
bun run vitest run tests/unit/notes-model.test.ts -t "creates a note"   # one case
bun run playwright test tests/e2e/landing.test.ts     # one E2E file
```

## Test layout gotchas

- `test:unit` runs the Vitest `unit` project (`vitest run --project unit`), targeting `tests/unit/` with `jsdom` environment.
- `test:integration` runs the Vitest `integration` project (`vitest run --project integration`), targeting `tests/integration/` with `node` environment.
- Unit tests must not start a database container; keep them to pure logic. Testcontainers belongs in integration/E2E only.
- Coverage is `enabled: true` in `vitest.config.ts`, so test runs rewrite `coverage/`.

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
