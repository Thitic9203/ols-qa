<!-- ols-only: this file is never synced to the generic plugin (Helix has no such file, so
     scripts/sync-skills-to-helix.sh skips it as a new references/* file). -->
# OLS test data prep recipe (pointer)

Read by Helix **test-data-prep-workflow** through workspace discovery (`references/*-data-prep.md`). The OLS values
live in the private evidence repo, not here: **`{EVIDENCE_REPO}/docs/ols-data-prep.md`, Appendix H** ("OLS values for
Helix test-data-prep", ols-qa-evidence main `7ea5187e`). Each slot below names the Appendix H heading that holds the
value — read it there; do not copy values into this file. Edit OLS rules in the evidence repo. Never write a
password, token or host here.

`H ›` = a heading inside Appendix H of `{EVIDENCE_REPO}/docs/ols-data-prep.md`.

| Slot | Value for OLS | Source (doc, decision, or who said it) |
|------|---------------|----------------------------------------|
| Source documents to read first | `{EVIDENCE_REPO}/docs/ols-data-prep.md` Appendix H, then the sections it cites (`H › Discipline`) | Helix spec `docs/sdd/project-agnostic` R4, R6; Appendix H intro |
| Environments the workflow may touch (and which it must never touch) | see `H › Intake 0.1 — Environment + spec source` (Environment bullet) | Appendix H. ⚠️ `ols-data-prep.md` §0.0 lists a different env set — owner to resolve; until then the user picks from what they are shown |
| Network / VPN notes per environment | see `H › Intake 0.1` (Environment bullet) | Appendix H (same §0.0 conflict as above) |
| Roles and test accounts (names only) | see `H › Intake 0.1` (Account / role bullet) | Appendix H |
| Where secrets live (`{SECRETS_DIR}`) | see ols-qa `CLAUDE.md` (ลิงก์/URL rule) — path only | ols-qa `CLAUDE.md:37`; `H › Refusal-first` |
| Data types | see `H › Intake 0.2 — Data type(s) to create` (option list) | Appendix H |
| Allowed target statuses per data type | see `H › Intake 0.2` (target status list) and `H › Step 2` | Appendix H |
| List endpoint or UI path per data type (reuse check) | see `H › Step 1 — Reuse first` | Appendix H |
| Create recipe + status-transition chain per data type | see `H › Step 2 — Create only what is missing` (→ `ols-data-prep.md` §5–6 and the LP state model in `references/ols-project-guide.md`) | Appendix H |
| Tracking label (for example the ticket key) and the field it goes in | see `H › Step 8 — Register every record` (`ticket` column of `data-register.md`) | Appendix H |
| Naming language, tone, and forbidden markers | see `H › Step 3 — Names + descriptions` | Appendix H |
| Style buckets / themes | see `H › Intake 0.3` (style bucket list) and `H › Step 4` rule 3 | Appendix H |
| Cover pipeline, its rules, cover gate, approved reference lot | see `H › Step 4 — Covers` (→ `ols-data-prep.md` §5.7.2) | Appendix H |
| Video spec | see `H › Step 5 — Videos` (→ `ols-data-prep.md` §5.7.2F) | Appendix H |
| Tools root (`{QA_TOOLS_ROOT}`) and scripts to reuse | scripts: see `H › Discipline` ("Reuse the real tools"). Root path: not configured | Appendix H says the root comes from the workspace project guide; `references/ols-project-guide.md` does not name `{QA_TOOLS_ROOT}` |
| Readback / publish-chain gates | see `H › Step 6 — Gates` | Appendix H |
| Clean-up policy | see `H › Step 8` ("Clean up") | Appendix H |

## Corrections log

Record every user correction here with its date (and fix the value in Appendix H), so the next run does not repeat
the mistake.
