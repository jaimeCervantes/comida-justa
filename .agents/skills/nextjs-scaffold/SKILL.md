---
name: nextjs-scaffold
description: initialize or repair a next.js full-stack repository that uses clean architecture, app router, vitest, and modern node tooling. use this skill when the task is project setup, missing boilerplate, repo restructuring, dependency separation, docker or test setup, or creating the base folder layout. do not use it for implementing a specific business feature unless the blocking issue is missing project scaffolding.
---

# Next.js Fullstack scaffold

Use this skill for setup work, not feature delivery.

## Workflow

1. Decide whether the task is **initialize from scratch** or **repair existing scaffolding**.
2. Detect current dependency tooling (`pnpm`, `npm`, `yarn`) and preserve working conventions that are already consistent.
3. Validate Node.js availability (`node --version`) and the package manager.
4. If `git` is missing, install it first. If the project is not a git repository, initialize it (`git init -b main`).
5. Create or repair the structure under `src/`, plus `features/` and `tests/`.
6. Create foundational files only when missing or clearly broken:
   - `.gitignore`
   - `.dockerignore`
   - `package.json`
   - `tsconfig.json`
   - `vitest.config.mjs` / `vitest.config.ts`
7. Keep changes minimal and avoid inventing extra root folders.

## Dependency management

- Add runtime packages with `<manager> install <package>`.
- Add development and test packages with `<manager> install -D <package>`.
- Do not mix package managers. If `package-lock.json` exists, use `npm`. If `pnpm-lock.yaml`, use `pnpm`.

## Blocker handling

If a blocker appears (permissions, missing tooling, network restrictions, failed installs, or unclear scope), explicitly ask whether to continue by resolving the blocker now or stop and leave the task paused. Do not silently skip blocked steps.

## Required structure

Use this layout unless the existing repository already has a clearly established equivalent:

```text
src/
  app/
    api/
    (routes)/
    layout.tsx
    page.tsx
  components/
    ui/
  domain/
    models/
    services/
    errors.ts
    ports.ts
  use_cases/
  infra/
    db/
    clients/
features/
tests/
```

## Scaffolding rules

- `src/domain/` stays framework-free. Use standard TypeScript interfaces, types, and classes only. No React.
- Do not place Zod schemas in `src/domain/` if they are strictly for HTTP validation; keep those bounded to the app routing layer.
- Keep database models (Prisma schema, Drizzle schema) and DB clients in `src/infra/db/`.
- Separate production and development dependencies in `package.json`.

## Foundation file defaults

- `.gitignore` must exclude `node_modules`, `.next`, coverage caches, and `.env*` files (except `.env.example`).
- `.dockerignore` must keep build context small and exclude `node_modules`, `.git`, local environments.
- `tsconfig.json` should have strict typing enabled and map `@/*` to `./src/*`.
- `vitest.config.mjs` should support testing both React components and plain TypeScript logic.

## What to avoid

- Do not rewrite a working project just to match this exact structure.
- Do not bypass App Router conventions (`page.tsx`, `layout.tsx`, `route.ts`).
- Do not make everything a Client Component (`"use client"`).

## Deliverables

When this skill is used, produce the minimal set of files and folders needed for the app to build, test, and accept future feature work cleanly.
