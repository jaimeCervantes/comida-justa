---
name: nextjs-bdd-feature
description: implement or change behavior in a next.js clean-architecture project by working from a small gherkin scenario/spec to tests and then code. use this skill for features, bug fixes, component changes, endpoint changes, query or command behavior that should be validated with vitest and/or playwright e2e tests. Do not use it for first-time project setup or boilerplate-only tasks.
---

# Next.js Feature delivery

Use this skill for behavior changes. Start from a small scenario, then tests, then implementation.

## Default workflow

> **Cadence is governed by `AGENTS.md` → "Autonomous delivery mode" (the default).** It reduces the
> only approval checkpoints to (1) the alignment gate and (2) the `.feature` + its scenarios.
>
> **Once the `.feature` is validated, run the slice to completion without stopping.** Do not ask for
> permission per command, per file, or per step: write the code, run `test:run`, `typecheck`, `lint` and
> the Playwright e2e (yes, even against the shared DB — the suite cleans up after itself), run seed or
> fixture scripts, fix what breaks, and only then report — with numbers, and saying what you wrote to
> any shared resource and how to undo it. A report is not a gate.
>
> The single exception is a **truly irreversible** action: destroying or overwriting data that isn't
> yours, a schema migration on the shared DB, `git push --force`, exposing secrets, or a discovery that
> invalidates the agreed model/scope. Everything else — routine blockers, tooling hiccups, "which
> option" choices — you decide yourself and note in the report.
>
> Steps 6–7 and the "Artifact checkpoint gate (mandatory)" section below apply ONLY when the user
> explicitly asks for step-by-step mode. This repo uses **pnpm**.

0. Alignment gate (mandatory, no exceptions):
   1. Ask the user for:
      - **The Problem:** What real friction exists?
      - **The Savings:** What do we save? (time, money, frustration, risk, operational load)
      - **The Why:** How does it connect to the bigger goal? Purpose and direction
   2. Propose the smallest valuable behavior slice based on the request.
   3. Ask for explicit agreement before writing any feature code/tests.
   4. If agreement is missing, stop and wait. Do not scaffold or implement.
1. Ask clarifying questions only if a real blocker prevents implementation. Maximum: three concise questions.
2. Before writing the first test under this skill, tell the user that adding **Vitest** (unit/component) and, if the scenario is a genuine end-to-end/browser flow, **Playwright** (e2e) is required, and get explicit approval as its own checkpoint before installing anything. Once approved, do it once — do not re-ask on every later feature.
3. Before any step that will create or modify repository artifacts, tell the user what files or generated artifacts will be affected.
4. Create or update one Gherkin spec in `e2e/<feature_area>/<scenario>.feature` for scenarios that are genuinely end-to-end (cross-route navigation, form submission, API round-trip). Skip the `.feature` file for pure unit-level bug fixes with no observable end-to-end behavior change; state explicitly why it was skipped.
5. Choose one priority scenario that can be implemented end-to-end in a small slice.
6. After each step that creates or modifies artifacts, stop and report:
   - the files or generated artifacts created or changed;
   - the purpose of that step;
   - what the user should validate next.
7. Ask for explicit user acceptance before continuing to the next artifact-changing step. If acceptance is missing, wait.
8. Add or update tests first (red), then implement (green):
   - Unit tests for the new/changed `src/domain/`/`src/use_cases/` logic.
   - A Playwright spec next to the `.feature` file that drives the same Given/When/Then steps end-to-end, when step 4 produced one.
9. Implement from inner layers outward:
   - `src/domain/`
   - `src/use_cases/`
   - `src/infra/`
   - `src/app/` (routes, Server/Client Components, Route Handlers/Server Actions) — the only place this scenario becomes visible to a user.
10. If new dependencies are genuinely needed, add them. Prefer existing libraries already in `package.json` over new ones that overlap.
11. Run validations with the correct command or commands
12. In the final response, include the exact validation commands you ran (or that the user should run if blocked).
13. Suggest the next scenario instead of forcing an artificial loop.
14. After each slice, append an entry to `docs/features/<feature>-bitacora.md` (append-only): objective, decisions + rationale, files touched (grouped), key commands, validation results (with numbers), deviations, follow-ups. **Every entry MUST end with a `Recap` (one-paragraph current state) and `Próximos pasos (opciones)` (concrete next choices + any actions pending on the user).** Mandatory for every slice. See "Autonomous delivery mode" in `AGENTS.md` for the full flow.

## Blocker handling

> In autonomous mode (default), do NOT pause for routine blockers — decide with best judgment and
> proceed. Only interrupt for a **truly irreversible** action (see the note at the top of "Default
> workflow"); a test run or a reversible seed against the shared DB is not one. The line below applies
> in step-by-step mode.

If a blocker appears (permissions, missing tooling, network restrictions, failed tests/install, or unclear scope), explicitly ask whether to continue by resolving the blocker now or stop and leave the task paused.
If the blocker is likely caused by sandbox restrictions or elevated permission needs, request explicit permission to run the required command with escalation and then retry the failed command.

## Artifact checkpoint gate (step-by-step mode only)

> Superseded by `AGENTS.md` → "Autonomous delivery mode" (the default): there, the only checkpoint is
> the `.feature` + scenarios and nothing else is gated. The rules below apply ONLY when the user asked
> for step-by-step / "pregúntame en cada paso".

- Treat every repository-changing step as a checkpoint, including the one-time test-tooling bootstrap in step 2.
- Show the concrete artifact list using repository paths whenever possible.
- Ask the user to validate and explicitly accept that checkpoint before continuing.
- Do not batch multiple artifact-changing steps into one approval unless the user explicitly asks for that.
- If a step produces no repository artifact, no checkpoint is required for that step.

## Gherkin rules

Use a compact feature file with business context when it is known or can be inferred safely.

```gherkin
Feature: [Feature Name]

  Context:
  - Problem: [real friction]
  - Savings: [time, money, risk, or frustration saved]
  - Why: [connection to the broader goal]

  As a [role]
  I want to [action]
  So that [benefit]

  Scenario: [short name]
    Given [initial context/route/state]
    When [the user or system does something]
    Then [the observable outcome on the page/API]
```

The `.feature` file is the authoritative scenario spec. Pair it with a Playwright spec of the same name that implements those exact Given/When/Then steps. If the repository later adopts a Gherkin step-runner (e.g. `playwright-bdd`), wire the `.feature` file directly into Playwright instead of duplicating it as prose plus a hand-written spec.

Do not skip this framing stage for end-to-end scenarios. If context is incomplete, ask concise clarification questions and wait for explicit agreement on feature scope and the first scenario.

## Testing rules

- Apply SOLID, clean code, and clean architecture principles to the tests as well as the implementation.
- Keep test files small and responsibility-focused; when setup data, fakes, HTTP stubs, or assertions start repeating, extract them into dedicated test helpers/builders instead of growing one large test module.
- Preserve test-layer separation: keep end-to-end scenario orchestration in Playwright specs, domain data builders in helper/factory modules, and transport or persistence fakes in dedicated test-double helpers.
- Apply the testing pyramid:
  1. Unit tests for `src/domain/` and `src/use_cases/` logic (fast, isolated, with fakes/mocks for `src/infra/` ports).
  2. Component tests with Vitest + `@testing-library/react` for non-trivial Client Components.
  3. Behavior-level Playwright tests for the selected end-to-end scenario (validating the full flow from the `.feature` file).
  4. Integration tests against real `src/infra/` wiring only if the behavior genuinely depends on it (e.g. the actual `mssql` query, a real SendGrid call stubbed at the HTTP boundary).
- Colocate unit/component tests next to what they test (`entities.test.ts` beside `entities.ts`, `Component.test.tsx` beside `Component.tsx`); keep Playwright specs under `e2e/`.
- Mock outer layers (`src/infra/`, `next/navigation`, `next/headers`) when testing `src/domain/`/`src/use_cases/` logic — inner layers must never need a real DB/HTTP call to be unit-tested.
- Keep test data minimal and focused on the scenario under implementation.
- Do not overbuild multiple scenarios before the first one is green.

When closing the task, always surface the exact validation commands you ran, or the exact manual commands the user should run if validation was skipped or blocked.

## Implementation rules

- Follow repository conventions before introducing new abstractions.
- Keep `src/domain/` free of Next.js, React, and any ORM/DB client (`mssql`, etc.) — plain TypeScript only.
- `src/use_cases/` depends only on `src/domain/`; it must not import `src/infra/` or Next.js APIs directly — `src/app/` wires the concrete `src/infra/` adapter in.
- Handle mutations via Next.js Route Handlers (`src/app/api/**/route.ts`, the established pattern in this repo) or Server Actions when that fits the flow better; either way, delegate the actual logic to `src/use_cases/`.
- Default to Server Components; keep Client Components (`"use client"`) small and leaf-focused to minimize the client bundle.
- Every new or changed route must define `metadata`/`generateMetadata` consistent with sibling routes; use `next/image` with meaningful `alt` text and `priority` for above-the-fold images.
- Catch specific exceptions in `src/app/` and map them to structured HTTP responses or React error boundaries — never let a use case's domain error surface as an unhandled 500 or blank UI.
- Write only the code needed to satisfy the selected scenario cleanly.
- Keep files small and responsibility-focused; extract collaborators before a file becomes a mixed implementation unit (e.g. move a growing `page.tsx` section into `ui/`).
- Do not use lazy imports for organizational reasons; keep imports explicit at module top level. Use `next/dynamic` only for genuine client-side code-splitting.
- If a route or feature area grows too many sibling files, reorganize into shallow responsibility-based subfolders (`ui/`, `data.ts`, `types.ts`, `helpers.ts`) instead of expanding a flat directory.

## Coding Standards (STRICT)

You already know clean code, clean architecture, and component-driven design for React/Next.js. Apply them ruthlessly. Additionally, enforce these specific rules:

- **Typing:** EVERY function signature, component prop type, and exported value MUST have explicit TypeScript types where inference isn't obvious/safe. No implicit `any`.
- **Docstrings:** Use JSDoc ONLY for complex business logic. Do not write obvious docstrings/comments for simple getters or straightforward components.
- **Error Handling:** Avoid throwing bare strings. Throw custom `Error` subclasses defined in `src/domain/<feature>/errors.ts`, or return a distinct Result/union type where that fits the use case better.
- **Naming:** Variables and functions in `camelCase`; Components and Classes in `PascalCase`; files named after their default export.
- **Refactoring and Clean Architecture:** If a file (especially a use case or component) grows too long or takes on multiple responsibilities, proactively propose and execute a refactor into a cohesive package with smaller, single-responsibility modules.

## What to avoid

- Do not turn every task into a multi-round ceremony; the alignment gate and checkpoints exist to protect scope, not to slow down small, well-understood changes.
- Do not stop after writing the Gherkin spec if the task can be implemented now.
- Do not let outer layers (`src/app/`, `src/infra/`) leak into inner layers (`src/domain/`, `src/use_cases/`).
- Do not assume everything runs in the Node.js runtime; some Next.js Edge runtimes and Client Components have API limitations (no `mssql`, no Node-only SDKs in Client Components or Edge routes).
- Do not jump into coding before problem framing and feature-scope agreement.
- Do not start implementation without explicit user approval from the alignment gate.
- Do not re-litigate the Vitest/Playwright bootstrap approval once it has already been granted once for this repository.
