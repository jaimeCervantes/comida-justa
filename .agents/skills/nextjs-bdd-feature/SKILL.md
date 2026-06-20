---
name: nextjs-bdd-feature
description: implement or change behavior in a next.js clean-architecture project by working from a small gherkin scenario/spec to tests and then code. use this skill for features, bug fixes, component changes, endpoint changes, query or command behavior that should be validated with vitest and/or playwright e2e tests. Do not use it for first-time project setup or boilerplate-only tasks.
---

# Next.js Feature delivery

Use this skill for behavior changes. Start from a small scenario, then tests, then implementation.

## Default workflow

0. Alignment gate (mandatory, no exceptions):
   1. Ask the user for:
      - **The Problem:** What real friction exists?
      - **The Savings:** What do we save? (time, money, frustration, risk, operational load)
      - **The Why:** How does it connect to the bigger goal? Purpose and direction
   2. Propose the smallest valuable behavior slice based on the request.
   3. Ask for explicit agreement before writing any feature code/tests.
   4. If agreement is missing, stop and wait. Do not scaffold or implement.
1. Ask clarifying questions only if a real blocker prevents implementation. Maximum: three concise questions.
2. Before any step that will create or modify repository artifacts, tell the user what files or generated artifacts will be affected.
3. Create or update one Gherkin spec in `e2e/**/<feature_name>.feature`.
4. Choose one priority scenario that can be implemented end-to-end in a small slice.
5. After each step that creates or modifies artifacts, stop and report:
   - the files or generated artifacts created or changed;
   - the purpose of that step;
   - what the user should validate next.
6. Ask for explicit user acceptance before continuing to the next artifact-changing step. If acceptance is missing, wait.
7. Add or update tests first.
8. Implement from inner layers outward:
   - `src/domain/`
   - `src/use_cases/`
   - `src/infra/`
   - `src/app/` (Next.js context) or `src/infra/UI/components/`
9. Run validations and ensure standard `npm run lint` and `npm run test` pass.

## Blocker handling

If a blocker appears explicitly ask whether to continue by resolving the blocker now or stop and leave the task paused.

## Testing rules

- Apply SOLID, clean code, and clean architecture principles and best practices to the tests as well as the implementation.
- Keep test files small and responsibility-focused; when setup data, fakes, HTTP stubs, or assertions start repeating, extract them into dedicated test helpers/builders instead of growing one large test module.
- Preserve test-layer separation: keep scenario orchestration in BDD step files, domain data builders in helper/factory modules, and transport or persistence fakes in dedicated test-double helpers.
- Apply the testing pyramid:
  1.  Unit tests for domain and use-case logic (fast, isolated, with mocks for external dependencies).
  2.  Behavior-level tests with `playwright` for the selected scenario (validating the full behavior from the feature file).
  3.  Async integration tests only if the behavior genuinely depends on the infra wiring (e.g., database interactions, external APIs).
- Keep test data minimal and focused on the scenario under implementation.
- Do not overbuild multiple scenarios before the first one is green.
- Use `vitest` for unit, integration, and behavior tests.
- Use `testing-library/react` for React components.
- Mock outer layers (infra, next/navigation, next/headers) when testing domain or application logic.
- Keep test data minimal.

Recommended validation commands:

- `npm run test`
- `npx tsc --noEmit`
- `npm run lint`

## Implementation rules

- Follow repository conventions before introducing new abstractions.
- Keep `src/domain/` free of Next.js, React, and DB ORMs.
- Action mutations should be done via Next.js Server Actions or Route Handlers.
- Ensure proper use of React Server Components (RSC) to minimize client bundle.
- Keep Client Components small and leaf-focused.
- Catch specific exceptions and map them to HTTP errors or React error boundaries.

## Coding Standards (STRICT)

- **Typing:** EVERY function, component edge, and variable MUST have explicit TS typing where inference isn't obvious/safe.
- **Docstrings:** Use JSDoc ONLY for complex business logic. Do not write obvious docstrings.
- **Error Handling:** Avoid generic throw of strings. Throw Custom Error classes or return distinct Result objects where applicable.
- **Naming:** `camelCase` for functions/variables. `PascalCase` for Components/Classes.
- **Refactoring and Clean Architecture:** If a file grows too long or takes on multiple responsibilities, proactively propose and execute a refactoring to split it into a cohesive package with smaller, single-responsibility modules.

## What to avoid

- Do not turn every task into a multi-round ceremony.
- Do not let outer layers leak into inner layers.
- Do not assume everything runs in Node (some Next.js edge runtimes have limitations).
- Do not start implementation without explicit user approval from the alignment gate.
