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
