# Frontend and Backend instructions

This repository is a Next.js full-stack application. Keep instructions here focused on persistent repository norms. Use the dedicated skills for scaffolding and feature-delivery workflows.

## Skill invocation (mandatory, no exceptions)

**Before ANY feature/behavior work**, invoke the relevant skill via the `Skill` tool so its rules load as active context:

- `Skill("nextjs-scaffold")` — project initialization, boilerplate, repo restructure, dependencies, Docker, test setup.
- `Skill("nextjs-bdd-feature")` — feature, bugfix, component change, endpoint change, use-case change, refactor with behavior impact.

**Do NOT start implementation until the skill's context is loaded.** The skill enforces its own workflow (alignment gate, tests first, step-by-step acceptance). Without it, you are operating with incomplete instructions.

## Feature alignment gate (mandatory)

- Before implementing any feature or behavior change, ask and capture:
  - `Problem`: real friction being solved.
  - `Savings`: expected savings (time, money, frustration, risk, operational load).
  - `Why`: connection to the broader goal.
- Propose the smallest valuable first slice and ask for explicit approval.
- Do not write feature code/tests until the user approves that first slice.

## Autonomous delivery mode (default)

Deliver features end-to-end without stopping for per-step validation. This is the default, and it **overrides** the per-step gates in `nextjs-bdd-feature`: workflow steps 6–7, the "Artifact checkpoint gate (mandatory)" section, and the ask-to-continue in "Blocker handling".

- Before the first slice, write a **slice roadmap** under `docs/features/<semantic-area>/<NNN>-<YYYY-MM-DD>-<feature>.md`: the ordered slices, each slice's scope, and its acceptance criteria. This is the single review checkpoint that replaces per-step gates.
- Write **all planned scenarios as Gherkin up front** for the roadmap review, but:
  - Tag each scenario by slice (`@slice-1`, `@slice-2`, …) and mark not-yet-implemented ones `@future` so they do NOT run in CI or block.
  - Only the **current** slice's scenarios are detailed and wired to executable tests; future slices stay as skeletons (title + coarse Given/When/Then). Do not add fine detail you will likely rewrite once the current slice teaches you something.
  - Never implement future slices before the current one is green (specs up front ≠ implementation up front).
- **The ONLY approval checkpoints, in order:**
  1. The **alignment gate** (Problem / Savings / Why + agreed model + smallest-slice agreement).
  2. The **slice roadmap + the `.feature` with its scenarios** — one combined review before coding starts.
- **After checkpoint 2 is approved, do NOT ask for validation or authorization for anything else.** Writing/editing any files (new modules, refactors, migrations-as-code), running tests/lint/typecheck, generating fixtures — just do it and run to completion. When the slice is green, **report** the outcome (with numbers) — that is a report, not a gate; do not wait for approval.
- Between checkpoints, implement in a single run: tests first, then inner-to-outer layers, running `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run lint` yourself.
- Run the Playwright e2e scoped to the feature you touched (e.g. `pnpm exec playwright test src/e2e/<area>`) without asking, when the app stack is available (dev server + a reachable DB with pending migrations applied) — the suite seeds its own data and cleans it up in `afterEach`, including against the shared DB. **Never run the complete suite (`pnpm run test:e2e:run`, no path) unless the user explicitly asks for it** — it is slow and out of scope for a single slice. If e2e cannot run in the current environment, say so explicitly and leave it as a pending validation; never imply e2e passed when it was not executed.
- **Borra `.next` antes de cualquier corrida de e2e** (`rm -rf .next`), sin excepciones. Playwright
  levanta su propio `next dev`, y una corrida anterior que se cortó —tiempo de espera, `Ctrl+C`,
  dos compilaciones solapadas— deja artefactos generados a medio escribir. Dos síntomas ya vistos,
  los dos imposibles de diagnosticar desde el mensaje de error: `dev/types/validator.ts` con un JSON
  o un TypeScript truncado, que tumba `pnpm typecheck` con errores de sintaxis **dentro de un
  archivo generado**; y un `prerender-manifest.json` con basura al final, que hace que el servidor
  responda 404 o 500 a todo y llena el informe de fallos que no tienen que ver con el cambio.
- **Y su contrapartida obligatoria: si tu slice estrena una ruta, añádela a
  `src/e2e/testUtils/warmRoutes.ts`.** Borrar `.next` hace que la corrida arranque en frío, y Next
  dev compila cada ruta la primera vez que alguien la pide: el primer escenario que la visita paga
  esa compilación **dentro** del plazo de 5 s de un `toBeVisible`, no dentro de los 90 s del
  escenario. El síntoma es inconfundible y engañoso a la vez: fallan escenarios **distintos** en
  cada corrida, siempre en su primera interacción, y todos pasan al repetirlos en aislamiento. Una
  acción de servidor es su propia unidad de compilación, así que una ruta con formularios hay que
  calentarla aunque la página parezca barata.
- **Parte la corrida de Playwright en shards en cuanto pase de ~20 escenarios**, y lánzalos uno detrás de otro: `pnpm exec playwright test <rutas> --shard=1/3 --reporter=line`, luego `2/3`, luego `3/3`. **Nunca en paralelo**: cada tramo levanta su propio servidor en el mismo puerto. El motivo no es la velocidad: una corrida que se corta a la mitad —por un tiempo de espera o un `Ctrl+C`— deja sin ejecutar sus `afterEach`, y el residuo en la base compartida hace fallar la corrida siguiente con errores que no tienen nada que ver (404 en rutas que sí existen, tiendas duplicadas). **Un fallo justo después de una corrida cortada es residuo hasta que se demuestre lo contrario**: mata el `next dev` huérfano que se quedó escuchando en el puerto, deja que el barrido de `globalTeardown` limpie, y repite antes de diagnosticar nada.
- After each slice, append an entry to the matching bitacora at `docs/features/<semantic-area>/<NNN>-<YYYY-MM-DD>-<feature>-bitacora.md` (append-only). Narrate the WHY, do not duplicate the diff (git log already has the what). Each entry: objective, decisions + rationale, files touched (grouped), key commands, validation results (with numbers), deviations from roadmap, follow-ups. **Every entry MUST end with two sections:** a **Recap** (one-paragraph current state) and **Próximos pasos (opciones)** — the concrete choices for what to do next, plus any actions pending on the user. This is mandatory for every slice, not optional.
- **Interrupt mid-run ONLY for something very grave** — otherwise keep going and decide with best judgment, and run every command yourself until the slice is finished.
  - **Grave (stop and ask):** something **irreversible** — destroying or overwriting data that isn't yours (dropping/altering populated columns, `DELETE`/`UPDATE` over real user records, restoring a dump), a schema migration on the shared DB (`alembic upgrade`), `git push --force`, rotating/exposing secrets, publishing to an external service, or a discovery that invalidates the agreed model/scope.
  - **NOT grave (just do it and report):** running `test:run` or the feature-scoped Playwright e2e even against the shared DB, running seed/fixture scripts that are scoped and reversible, creating and deleting your own test/dummy records, and every routine blocker, tooling hiccup, unclear-but-decidable scope, or "which option" choice — pick the sensible default and note it in the report. Running the **complete** `test:e2e:run` suite is not on this list — it needs an explicit ask (see above).
  - When a run wrote to a shared resource, say so plainly in the report (what was written, how to undo it). The report replaces the question; do not ask permission first.
- If the user says "modo paso a paso" / "pregúntame en cada paso", revert to the skill's per-step gate for that task.

## Commit authorship (mandatory)

- Every commit is the user's alone. Never add a `Co-Authored-By` trailer, a session link, or any
  other AI-attribution to a commit message — write it exactly as the user would have written it
  themselves.

## Documentation organization

- New documentation belongs in a semantic subfolder under `docs/` (`features/<area>/`, `architecture/`, `operations/`, `design_system/`, `troubleshooting/`, etc.) instead of growing a large flat directory.
- Name new docs as `<NNN>-<YYYY-MM-DD>-<slug>.md`; use the current local date and the next three-digit sequence number in that semantic folder. Related files share the same prefix, for example `<NNN>-<YYYY-MM-DD>-<feature>.md` and `<NNN>-<YYYY-MM-DD>-<feature>-bitacora.md`.
- Keep appending to existing legacy docs when continuing the same work. Do not rename or move old docs as part of unrelated feature work; do a dedicated documentation migration if the reorganization itself is the task.

## Tooling baseline (pnpm)

- **This repo uses `pnpm`** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). Use `pnpm` for everything — never `npm`/`yarn` here.
- Add packages with `pnpm add <package>` (dev/test deps: `pnpm add -D <package>`).
- Run project validation with `pnpm run <command>`.

## Repository structure

- Keep source code under `src/` (or strictly in standard Next.js folders).
- `src/app/` is the Next.js App Router boundary: pages, layouts, error handling, route handlers (APIs), and Server Actions.
- `src/domain/` is pure business code: entities, value objects, domain services, ports, and domain errors. No React or Next.js code here.
- `src/use_cases/` orchestrates application behavior using domain types and domain ports.
- `src/infra/` contains concrete adapters such as database queries (Prisma/Drizzle/typeORM), external REST clients, and schedulers.
- `src/presentation/design_system/` holds reusable presentation with no app knowledge (buttons, forms, tokens). `src/presentation/` holds app-specific components shared by several routes. A component usable in only one route lives in that route's `ui/` folder. **Search before creating: a second near-duplicate component is a design failure.** See "Component placement" in `.agents/skills/nextjs-bdd-feature/SKILL.md`.
- `src/presentation/` is organised by concern, not as one flat `components/` folder: `chrome/`
  (header, footer, selector de idioma), `navigation/`, `post/`, `media/`, `search/`, `user/`,
  `auth/`, `money/`, `directory/`, `location/`, `seo/`, `design_system/`. Un componente nuevo va en
  la carpeta de su concern; si no encaja en ninguna, es señal de que falta nombrarlo.
- `src/infra/UI/` ya **no** tiene componentes: solo quedan `hooks/`, `labels/`, `mappers/`,
  `metadata/` y `stories/`, que son adaptadores y datos, no interfaz. Keep UI dumb where possible.
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

## Internationalization rules

The routed locales are **`es` (default) and `en`**, via `next-intl` with `localePrefix: "as-needed"`:
Spanish keeps its bare paths (`/productos`) and only English is prefixed (`/en/productos`). The
Spanish URLs are already indexed — do **not** move them to `/es/…`. See `docs/features/content/002-2026-08-01-i18n.md`.

- **No user-visible string is ever hardcoded in a component.** Every label, helper, error, button
  and metadata value comes from `useTranslations`/`getTranslations`. A literal in JSX is a bug, not
  a shortcut. _(Being rolled out by slice 1; the rule applies to everything you touch from now on.)_
- Message catalogs live in `src/i18n/messages/<locale>.json`, one file per language with the
  namespaces as top-level keys. `en.json` must stay structurally identical to `es.json`.
- `src/i18n/next-intl.d.ts` binds next-intl's types to `es.json`, so an unknown key or one missing
  from `en.json` is a `pnpm typecheck` failure rather than a broken string in production. Do not
  weaken that augmentation.
- Next hands `params.locale` over as a plain `string`. Convert it with `resolveLocale()` from
  `src/i18n/routing.ts`, or with `hasLocale()` + `notFound()` when an unknown locale must 404.
  **Never cast.**
- Import `Link`, `useRouter` and `usePathname` from `src/i18n/navigation.ts`, never from
  `next/link` or `next/navigation` — the wrappers preserve the active locale, the raw APIs silently
  drop it. To redirect on the server use `redirectKeepingLocale()` from
  `src/i18n/redirectKeepingLocale.ts`; it is typed `never`, so it still narrows types after the call.
  The only exception is `src/app/not-found.tsx`, which lives outside `[locale]`.
- Every page calls `setRequestLocale(...)`; skipping it forces the route into request-time
  rendering. (Today every route is dynamic anyway because `Header` reads the session — see the
  finding in `docs/features/content/002-2026-08-01-i18n.md`. That does not make the call optional.)
- Never compose a message key at runtime (`t(\`badge.${x}\`)`) unless `x` is a closed union. A key
  you cannot find with grep is a key that gets lost.
- Component tests that render anything using the navigation wrappers or translations must render
  through `renderWithIntl` from `src/infra/test-utils/renderWithIntl.tsx`.
- **`src/presentation/design_system/` must never call `useTranslations`.** It has to be renderable
  anywhere, and part of the tree sits outside `NextIntlClientProvider` — `src/app/not-found.tsx`
  lives outside `[locale]`, and a future `global-error.tsx` would too. A design-system component
  that reaches for the catalog turns those pages into a 500. Take the string as a prop instead
  (see `loadingLabel` on `Button`) and let the caller translate it.
- `src/app/not-found.tsx` is the one page deliberately outside the locale tree: it answers URLs that
  match no route at all, has no `[locale]` segment to read, and stays in the default language. Do
  not add translations or locale-aware navigation to it.

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

- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:run` (Vitest, non-watch) / `pnpm run test:e2e:run` (Playwright)

## Non-Negotiable Engineering Rules

1. SOLID principles, Clean Architecture and Clean Code have highest priority — **in tests too, e2e
   included**. A test suite is production code: same naming, same small responsibility-focused
   modules, same extraction of repeated setup into builders and helpers.
2. **Tests assert the promise, not the implementation.** A spec you have to edit every time the
   design moves is a badly written spec, not a design problem. See "Testing rules" in
   `.agents/skills/nextjs-bdd-feature/SKILL.md` for the concrete patterns to avoid.
3. No hardcoded period dates in business code (if applicable to business rules).
4. Period range contract is always `[start_date, end_date)`.
5. Keep business logic in domain/use case, side effects in infra.

## PR/Change Checklist

1. Architecture boundaries respected.
2. Config validated explicitly.
3. Tests cover changed behavior.
4. Server/Client component boundaries are correctly used.
5. Backward compatibility assessed and documented.
