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
5. Ask clarifying questions only if a real blocker prevents implementation.
6. Create or update one spec or test under `tests/` (e.g., `tests/features/` or inline `.test.ts`).
7. Choose one priority scenario that can be implemented end-to-end in a small slice.
8. Add or update tests first.
9. Implement from inner layers outward:
   - `src/domain/`
   - `src/use_cases/`
   - `src/infra/`
   - `src/app/` (Next.js context) or `src/infra/UI/components/`
10. Run validations and ensure standard `npm run lint` and `npm run test` pass.

## Blocker handling

If a blocker appears explicitly ask whether to continue by resolving the blocker now or stop and leave the task paused.

## Testing rules

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
