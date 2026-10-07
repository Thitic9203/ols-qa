# Workflow procedures

Full workflow procedures live here: `skills/procedures/<skill-name>/WORKFLOW.md`.

**Agent discovery** uses thin stubs at `skills/<skill-name>/SKILL.md` (symlinked by `link-skills.sh`). Each stub loads the matching `WORKFLOW.md` in this directory.

Do not delete `WORKFLOW.md` files here — they are the canonical procedure source.

This folder was named `deprecated/` until 2026-10-07 (it was used to keep the files out of skill auto-discovery). Nothing in it is deprecated.
