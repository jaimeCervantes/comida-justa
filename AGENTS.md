# 🤖 Agile AI Protocol: The 3 Principles & Technical Excellence (Next.js Edition)

**Goal:** Deliver software in small batches with clear behavior, strong feedback loops, and a maintainable architecture that accepts requirements will evolve.

## 🎯 The Core Thesis: Valuable Software

Real software value is not just "it works now," but its continuous adaptability to changing user needs. It must be flexible, understandable, and sustainable to maintain a steady delivery speed without friction.

When software becomes hard to modify, it loses value and client trust.

---

## 🏛️ Principle 1: Personas y Justicia (People-Centric Architecture)

_"Communication, motivation, and shared justice determine the product quality"_. We respect our "future self," our teammates, and our clients by ensuring clarity and sustainability.

### Technical Operationalization:

- **Clean Architecture (Mandatory):** AI `MUST` separate business logic from the Next.js framework magic.
  - `domain/`: Pure business rules and TypeScript types. Zod schemas for validation. No React or Next.js imports.
  - `use_cases/`: Orchestrates domain logic. Often implemented as plain TS functions or explicitly bound Next.js Server Actions (`'use server'`).
  - `infra/`: Concrete adapters (Prisma/Drizzle ORM, external API fetches, third-party services).
  - `app/`: Next.js App Router delivery layer (React Server Components, Client Components, API Routes).
  - `shared/`: Core shared utilities and configurations.
- **Import Boundaries:** `domain` and `use_cases` `MUST NOT` import from `app` or UI libraries. Frameworks are tools, not core dependencies.
- **RSC vs Client Boundaries:** AI `MUST` explicitly define `'use client'` only at the lowest possible leaf nodes in the component tree to maximize server-side performance.
- **BDD (Gherkin):** AI `MUST` validate behavior with concrete examples before coding to ensure the client receives what they actually need.

---

## 🏛️ Principle 2: Simplicidad y Lotes Pequeños (The "Small Batch" Flow)

_"Complex problems are mastered by dividing them"_. We use small units to reduce mental load and accelerate learning.

### Technical Operationalization:

- **Async-First Next.js Policy:** - Data fetching in Server Components `MUST` be asynchronous.
  - Database calls `MUST` use async ORM methods (e.g., `await prisma.user.findUnique()`).
  - Mutations `SHOULD` be handled via async Server Actions (`'use server'`) rather than traditional REST endpoints where possible to reduce boilerplate.
- **Small Batch Delivery:**
  - Tasks `MUST` be shippable in increments of <= 1 day of effort.
  - Pull Requests (PRs) `SHOULD` be kept small to ensure precise reviews.
- **Experimentation:** Use **Feature Flags** (e.g., Vercel Edge Config, LaunchDarkly) for uncertain features to innovate fast and cheap.

---

## 🏛️ Principle 3: Retroalimentación y Adaptación (Continuous Learning)

_"Feedback nurtures growth and keeps the team focused on the purpose"_. We learn from every version instead of trying to be perfect in the first one.

### Technical Operationalization:

- **CI Gates (The Safety Net):** Automated pipelines (ESLint, Prettier, TypeScript strict mode, Testing) are mandatory.
- **Testing Strategy:**
  - **TDD/BDD:** Write failing scenarios first.
  - **Isolation:** Tests `MUST NOT` share mutable state.
  - **Tooling:** Use `Vitest` or `Jest` for domain/unit tests. Use `Playwright` or `Cypress` for E2E and BDD integration.
- **Definition of Done (DoD):** A task is only "Done" if:
  1. Architecture boundaries (Domain vs App) are respected.
  2. CI is green (TS compiles with no errors).
  3. Tests are added/updated.
  4. Technical debt is explicitly tracked (`TODO` + Ticket).

---

# 🛠️ Entry Criteria: Before You Code

Implementation can start only if all are present:

1. Outcome statement (1-3 sentences):
   - What problem is solved?
   - Who benefits?
   - Why this matters now?
2. At least one concrete behavior example:
   - Preferred: Gherkin scenario
   - Alternative: Given/When/Then or input/output example
3. Explicit acceptance criteria
4. Expected evolution note:
   - What is likely to change next?
   - How does this increment keep that change easy?

If any item is missing:

- `MUST` request clarification before implementation.

---

# Delivery Workflow (Agent/Human)

1. Clarify scope and constraints
2. Define smallest shippable increment (<= 1 day effort)
3. Add failing tests/spec examples first
4. Implement minimal code to satisfy behavior
5. Refactor while preserving behavior (e.g., extracting UI logic to custom hooks)
6. Run quality gates locally (`npm run lint`, `npm run build`)
7. Open small PR with validation evidence

---

# Architecture Rules (Clean Architecture in Next.js)

## Layer responsibilities

- `domain/`: Pure business rules. No Next.js router, no React hooks. Zod models live here.
- `use_cases/`: Orchestrates domain and interfaces. Can export Server Actions if strictly separated from UI logic.
- `infra/`: DB clients (Prisma/Drizzle), external REST/GraphQL clients.
- `app/`: Next.js specific. Only handles UI rendering (RSC/Client), routing, and passing data to/from use cases.

## Import boundaries

- `domain` MUST NOT import `infra` or `app`.
- `use_cases` MAY import `domain` and interfaces, MUST NOT import React components.
- `infra` implements interfaces defined by `domain`/`use_cases`.
- `app` wires dependencies and handles the presentation layer.

# Repository Structure (Target)

````text
# Repository Structure (Target)

```text
src/
  app/                     # Next.js App Router (UI & Routing only)
    (shop)/
      page.tsx             # React Server Component
      page.test.tsx        # Co-located Component Test
    components/
      HabitCard.tsx
      HabitCard.test.tsx   # Co-located UI Test
  domain/                  # Pure TypeScript
    entities/
      farmer.ts
      farmer.test.ts       # Co-located Domain Test
    schemas/
  use_cases/               # Application Logic
    actions/
      registerSleep.ts
      registerSleep.test.ts # Co-located Use Case Test
  infra/                   # External adapters
    db/
  shared/                  # Utils, constants
  features/                  # .feature files (Cucumber/Playwright BDD)
  e2e/                     # E2E tests
````

---

# Code Quality Standards

## Readability

- `MUST` prefer clarity over cleverness.
- `MUST` use explicit names (e.g., `fetchLocalFarmers` over `getData`).
- `MUST` keep React components focused (extract complex logic to custom hooks or utility functions).
- `MUST` use strictly typed props and return types. Avoid `any`.

## Style references

- JS/TS: https://github.com/ryanmcdermott/clean-code-javascript
- React: Standard ESLint config (`eslint-config-next`), Prettier.

---

# BDD and Testing Policy

## BDD rules

- `MUST` keep scenarios business-readable.
- `MUST` map each scenario to automated tests (via Playwright BDD).
- `SHOULD` keep UI implementation details (like CSS selectors) out of feature files.

## Testing stack rules

- `MUST` ensure `npm run test` and `npm run build` pass before pushing.
- Unit: Vitest/Jest (Testing pure domain logic is fast and requires no React context).
- Integration/Components: React Testing Library.
- E2E: Playwright (Ideal for Next.js to test SSR and client transitions).

---

# Background Jobs Policy (Next.js context)

Since Next.js is serverless by default, long-running processes differ from traditional backends:

- `MUST` use Vercel Cron Jobs, GitHub Actions, or asynchronous queues (like Inngest, Upstash, or Trigger.dev) for scheduled tasks.
- `MUST` be idempotent where possible.
- `MUST` call `use_cases` (no business logic embedded in the background worker itself).

---

# CI Gates & PR Policies

On every PR:

- Formatting (Prettier)
- Linting (ESLint)
- Type checks (`tsc --noEmit`)
- Unit & E2E tests
- Next.js Build (`npm run build` to ensure no RSC/Client boundary violations)

Merge is blocked until CI is green.

---

# Quick Templates (Context: Hazlo Sano)

## Outcome statement template

`For <user>, enable <capability> so that <measurable value>.`
_Example: For a local farmer, enable inventory management so that they can sell organic produce directly to restaurants._

## Gherkin template (BDD)

```gherkin
Scenario: Recompensar un hábito atómico completado
  Given que el usuario "Juan" está intentando mejorar su pilar de "sueño y descanso"
  When registra haber dormido 8 horas por 3 días consecutivos
  Then el sistema otorga la insignia "Descanso Profundo"
  And desbloquea un descuento en restaurantes saludables locales
```

## PR validation template

- `What`: Added Server Action to create new local restaurant profiles.
- `Why`: To expand our healthy food network and make eating healthy the default option.
- `Validation`: Vitest passed for domain rules. Playwright E2E scenario "Register Restaurant" passes.
