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
> permission per command, per file, or per step: write all tests needed starting with e2e tests, then
> implement the code, run `test:run`, `typecheck`, `lint` and the Playwright e2e scoped to the feature
> touched (yes, even against the shared DB — the suite cleans up after itself), run seed or fixture
> scripts, fix what breaks, and only then report — with numbers, and saying what you wrote to any
> shared resource and how to undo it. A report is not a gate. **Never run the complete e2e suite
> (`pnpm run test:e2e:run` with no path) unless the user explicitly asks for it.**
>
> **Antes de cualquier corrida de e2e, `rm -rf .next`.** Sin excepciones. Playwright levanta su
> propio `next dev`, y una corrida anterior que se cortó deja artefactos generados a medio escribir.
> Los dos síntomas ya vistos son imposibles de diagnosticar desde el error: `dev/types/validator.ts`
> truncado, que tumba `pnpm typecheck` con errores de sintaxis **dentro de un archivo generado**, y
> un `prerender-manifest.json` con basura al final, que hace que el servidor conteste 404 o 500 a
> todo.
>
> **Y su contrapartida: si el slice estrena una ruta, añádela a `src/e2e/testUtils/warmRoutes.ts`.**
> Borrar `.next` arranca la corrida en frío, y Next dev compila cada ruta al pedirla: el primer
> escenario que la visita paga esa compilación dentro del plazo de 5 s de un `toBeVisible`, no
> dentro de los 90 s del escenario. El síntoma engaña —fallan escenarios **distintos** en cada
> corrida, siempre en su primera interacción, y todos pasan en aislamiento— y se confunde con
> intermitencia. Una acción de servidor es su propia unidad de compilación: una ruta con formularios
> hay que calentarla aunque la página parezca barata.
>
> **Playwright siempre en shards cuando pasen de ~20 escenarios.** Una corrida que se corta a la
> mitad —por un tiempo de espera, por un `Ctrl+C`— deja sin ejecutar sus `afterEach`, y el residuo
> en la base compartida hace fallar la corrida siguiente con errores que no tienen nada que ver
> (404 en rutas que sí existen, tiendas duplicadas). Diagnosticarlo cuesta más que evitarlo. Parte
> en tramos que terminen holgados:
>
> ```sh
> pnpm exec playwright test <rutas> --shard=1/3 --reporter=line
> pnpm exec playwright test <rutas> --shard=2/3 --reporter=line
> pnpm exec playwright test <rutas> --shard=3/3 --reporter=line
> ```
>
> Se lanzan **uno detrás de otro, nunca en paralelo**: cada tramo levanta su propio servidor en el
> mismo puerto. Si una corrida se corta igualmente, antes de repetir hay que (1) matar el `next dev`
> huérfano que se quedó escuchando y (2) dejar que el barrido de `globalTeardown` limpie; un fallo
> tras una corrida cortada es residuo hasta que se demuestre lo contrario.
>
> The single exception is a **truly irreversible** action: destroying or overwriting data that isn't
> yours, a schema migration on the shared DB, `git push --force`, exposing secrets, or a discovery that
> invalidates the agreed model/scope. Everything else — routine blockers, tooling hiccups, "which
> option" choices — you decide yourself and note in the report.
>
> Steps 6–7 and the "Artifact checkpoint gate (mandatory)" section below apply ONLY when the user
> explicitly asks for step-by-step mode. This repo uses **pnpm**.

## Branching (mandatory)

**Every feature or behavior change starts on its own branch.** Never commit onto `dev` (the main
branch) directly.

- Create it before the first artifact-changing step: `git checkout -b feat/<feature>` (or
  `fix/<bug>`). Name it after the feature area, not the slice — one branch carries a roadmap's
  slices, each as its own commit.
- If work has already started on `dev`, branch immediately: uncommitted changes follow you across
  `git checkout -b`, so nothing is lost.
- Commit per zone or per slice, not in one gigantic commit. Push and open the PR only when the user
  asks.
- Every commit is the user's alone: never add a `Co-Authored-By` trailer, a session link, or any
  other AI-attribution to the message (see `AGENTS.md` → "Commit authorship").

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
14. After each slice, append an entry to the matching bitacora under `docs/features/<semantic-area>/<NNN>-<YYYY-MM-DD>-<feature>-bitacora.md` (append-only): objective, decisions + rationale, files touched (grouped), key commands, validation results (with numbers), deviations, follow-ups. **Every entry MUST end with a `Recap` (one-paragraph current state) and `Próximos pasos (opciones)` (concrete next choices + any actions pending on the user).** Mandatory for every slice. See "Autonomous delivery mode" and "Documentation organization" in `AGENTS.md` for the full flow.

## Documentation naming

- New feature roadmaps and bitacoras live in semantic subfolders under `docs/features/`, not in the root of `docs/features/`.
- Name them `<NNN>-<YYYY-MM-DD>-<feature>.md` and `<NNN>-<YYYY-MM-DD>-<feature>-bitacora.md`, using the current local date and the next three-digit sequence number in that semantic folder.
- If continuing an existing legacy roadmap or bitacora, append to that existing file. Do not rename old docs during unrelated feature delivery.

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

### Scenario writing rules (mandatory)

- **The `Context:` block lives inside the `.feature` itself**, not only in the feature roadmap under `docs/features/<semantic-area>/`.
  A reader who never opens another document must still know the Problem, the Savings and the Why.
- **Use concrete, real data — never placeholders.** Take the values from the shared/production
  database, the seeds or the existing UI: `"Jugo Verde"` at `40`, not `"a product"` at `"some price"`.
  Concrete data exposes disagreements about the model that abstract wording hides.
- **Use `Scenario Outline` + `Examples` whenever the rule has more than one case.** This is the desk
  check ("corrida de escritorio"): input columns and the expected result, so the rule can be verified
  by reading the table. Reach for it for allowlists, per-locale labels, boundary values, field-by-field
  mappings, and scoring or ranking rules.

```gherkin
@slice-1
Scenario Outline: The label follows the visitor's locale, never the database
  Given a product published with sub-category "<key>"
  When a visitor opens its detail page in locale "<locale>"
  Then the sub-category is shown as "<label>"

  Examples:
    | key       | locale | label     |
    | jugos     | es     | Jugos     |
    | jugos     | en     | Juices    |
    | panaderia | en     | Bakery    |
```

- **Name the `Examples` blocks** when one outline covers accepted and rejected input
  (`Examples: rejected — labels and unknown keys never reach the database`). A trailing `reason`
  column that no step consumes is fine: it documents why each row exists.
- **Use a data table in a `Then`** to desk-check stored state — field/value rows read better than a
  chain of `And the X is Y`.
- **Tag every scenario by slice** (`@slice-1`, `@slice-2`, …). Scenarios of slices not built yet carry
  `@future` so they neither run in CI nor block. Only the current slice's scenarios are detailed and
  wired to executable tests; future slices stay coarse — do not add detail you will rewrite once the
  current slice teaches you something. Add `@component` when Vitest covers the scenario instead of
  Playwright, with a comment saying why.

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

### Write specs that survive a redesign (mandatory)

**A spec you have to edit every time the design moves is a badly written spec.** It is asserting
**how** the screen is built instead of **what it promises**. Editing it back to green is not
maintenance, it is the test costing more than it protects.

Six patterns that always rot, and what to write instead:

| Rots                                        | Why                                                                           | Write instead                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toBe("rgb(27, 30, 24)")`                   | Freezes a token's current value                                               | Read the token in the browser and assert the **relation**: "the price is body ink, not the accent"                                                 |
| `toHaveText("0")` on a count                | Depends on what the community published today                                 | Assert the shape (`/^\d+$/`), or an invariant between two numbers on the same screen                                                               |
| `page.getByRole("link", { name })` unscoped | The footer and bottom nav repeat labels, and `getByRole` matches by substring | Scope to a region: `page.getByTestId("region").getByRole(...)`. A `data-testid` on the container is cheaper than an `exact: true` somebody forgets |
| Pixel gap between two named pieces          | Adding a third piece between them breaks it, though nothing detached          | Measure from the **last** piece, whatever it is                                                                                                    |
| `toEqual({ ...exact shape })`               | Any added field breaks it with nothing wrong                                  | Assert the fields the scenario is about                                                                                                            |
| A route list copied into the spec           | Drifts from the `.feature` and from the app                                   | One list, derived; or assert the rule ("it is on every route, exactly once")                                                                       |

**Editing a spec is right when the behaviour actually changed** (a section became desktop-only) or
**when the spec found a real defect** (two controls sharing one `data-testid`). That is not
brittleness — that is the test doing its job. Say which of the two it was in the report.

Clean code applies to the suite itself: repeated setup becomes a builder, repeated navigation
becomes a page object, and a spec file keeps one responsibility — exactly the rules the production
code follows.

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

## Component placement (mandatory)

**Never write a new component before searching for an existing one.** Grep the three homes below for
the concern first. If something close already exists, extend or parameterize it; if two routes are
about to grow the same component, extract one reusable version instead of copying. A second
near-duplicate component is a design failure, not a shortcut.

Placement follows **how widely the component can be used**, and is decided when it is created:

| Reach                                          | Home                              | Examples                                     |
| ---------------------------------------------- | --------------------------------- | -------------------------------------------- |
| Reusable anywhere, carries no app knowledge    | `src/presentation/design_system/` | `buttons/`, `forms/`, `styling/`, `tokens/`  |
| Specific to this app, shared by several routes | `src/presentation/`               | header, footer, badges, cards, media pickers |
| Usable **only** in one route                   | `src/app/[locale]/<route>/ui/`    | `PostDetail`, `StoreHeader`, `EditPostForm`  |

- A component in `design_system/` must not import from `src/domain/`, `src/use_cases/` or
  `src/app/`. If it needs to know what a "post" or a "seller" is, it is not design system — it
  belongs one row down.
- A component under a route's `ui/` that a second route starts wanting is the signal to promote it
  to `src/presentation/`. Promote it; do not import across routes.
- Promotion is a move, not a copy. Leave no duplicate behind.

> **La mudanza ya se hizo.** `src/infra/UI/components/` está vacía y borrada: los veinte
> componentes compartidos viven en `src/presentation/`, agrupados por concern (`chrome/`,
> `navigation/`, `post/`, `media/`, `search/`, `user/`, `auth/`, `money/`, `directory/`). En
> `src/infra/UI/` solo quedan `hooks/`, `labels/`, `mappers/`, `metadata/` y `stories/`.

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
