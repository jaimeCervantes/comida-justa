# Frontend and Backend instructions

This repository is a Next.js full-stack application. Keep instructions here focused on persistent repository norms. Use the dedicated skills for scaffolding and feature-delivery workflows.

## Use the right instruction source

- Use `.agents/skills/nextjs-scaffold/` when the task is project initialization, missing boilerplate, repo restructuring, dependency setup, Docker setup, or test-environment setup.
- Use `.agents/skills/nextjs-bdd-feature/` when the task is a feature, bugfix, component change, endpoint change, use-case change, or a behavior change that should start from a scenario and tests.

## Feature alignment gate (mandatory)

- Before implementing any feature or behavior change, ask and capture:
  - `Problem`: real friction being solved.
  - `Savings`: expected savings (time, money, frustration, risk, operational load).
  - `Why`: connection to the broader goal.
- Propose the smallest valuable first slice and ask for explicit approval.
- Do not write feature code/tests until the user approves that first slice.

## Tooling baseline (pnpm, npm or yarn)

- Use standard Node.js tooling: verify package manager through `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`. Assume `npm` or `pnpm` if unsure, based on local settings.
- Add packages using the detected package manager (e.g. `npm install <package>`).
- Add development/test dependencies (e.g. `npm install -D <package>`).
- Run project validation with `npm run <command>` (or equivalent).

## Repository structure

- Keep source code under `src/` (or strictly in standard Next.js folders).
- `src/app/` is the Next.js App Router boundary: pages, layouts, error handling, route handlers (APIs), and Server Actions.
- `src/domain/` is pure business code: entities, value objects, domain services, ports, and domain errors. No React or Next.js code here.
- `src/use_cases/` orchestrates application behavior using domain types and domain ports.
- `src/infra/` contains concrete adapters such as database queries (Prisma/Drizzle/typeORM), external REST clients, and schedulers.
- `src/infra/UI/components/` represents reusable React presentation logic. Keep UI dumb where possible.
- `features/` stores Gherkin specifications (if using BDD for Next.js).
- `e2e/` stores e2e testing with playwright.
- `MUST` not include `src` directory as module root in imports (use TS paths/aliases like `@/`).
- `MUST` place components and unit tests in the same directory of production source code. Or use stories for UI components in `src/infra/UI/stories/`.

## Architecture rules

- Inner layers must not import outer layers.
- `src/domain/` must not depend on Next.js, React, Prisma, typeORM or Drizzle.
- Keep ports (interfaces) in `src/domain/ports.ts` unless the existing repo already uses a different consistent location.
- HTTP Schemas/Zod validators for endpoints belong in `src/app/api/...` or a dedicated `schemas/` folder.
- Database access patterns belong in `src/infra/db/` only.

## Runtime rules

- Use React Server Components by default. Keep Client Components (`"use client"`) only at the leaves of the render tree where interaction/state is needed.
- Action mutations should be done via Server Actions for simple forms, or Route Handlers when building a REST API.
- Catch specific exceptions and gracefully downgrade UI via `error.tsx` or return structured JSON for APIs.

## Coding rules

- Add strict type hints/interfaces to every public function and component.
- Use `camelCase` for functions and variables, `PascalCase` for classes and React components.
- Add docstrings/JSDoc only where business logic is non-obvious.
- Follow existing repository conventions before introducing new patterns.
- Prefer small, purpose-specific modules. Avoid large files that combine orchestration, mapping, styled components, and UI logic in one place.
- Keep directory structure semantic: each folder should have a readable separation of concerns and a single dominant responsibility.
- Add or update tests for behavior changes.

## Default validation commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test` (Vitest)

If the repository already defines wrappers such as `make test` or `just test`, prefer the repository-native command instead of replacing it.

## Non-Negotiable Engineering Rules

1. SOLID principles, Clean Architecture and Clean Code have highest priority.
2. No hardcoded period dates in business code (if applicable to business rules).
3. Period range contract is always `[start_date, end_date)`.
4. Keep business logic in domain/use case, side effects in infra.

## PR/Change Checklist

1. Architecture boundaries respected.
2. Config validated explicitly.
3. Tests cover changed behavior.
4. Server/Client component boundaries are correctly used.
5. Backward compatibility assessed and documented.
