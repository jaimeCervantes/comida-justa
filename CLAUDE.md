Follow instructions from the root file `AGENTS.md`.

When repository instructions change, keep Claude mirrors synchronized:

- Changes to `AGENTS.md` must be reflected here when this entrypoint needs the same instruction or a
  pointer to it.
- Changes to `.agents/skills/<skill>/SKILL.md` must be reflected in the matching
  `.claude/skills/<skill>/SKILL.md` in the same change.
- Changes that start in `.claude/skills/` must be reflected back into `.agents/skills/` when they
  apply to both agents.

Database migrations are owned by the sibling project `bot-whatsapp`. This repo only mirrors the
schema after those migrations exist there; do not create or run Drizzle migrations from here.

Every new feature or change to `src/domain/`, `src/use_cases/`, or the DB schema mirror must keep
the core (listings/products/services/events, sellers, branches, orders, payments, categories, users)
reusable for a different type of business, not only this one. See "Reusability across verticals" in
`AGENTS.md` for the concrete rules (vertical vocabulary stays in its own module, no hardcoded
privileged tenant, closed vocabularies in one named file).
