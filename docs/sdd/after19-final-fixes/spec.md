# after-19 final fixes — spec

Source: ols-qa-evidence `evals/helix-skill-eval-2026-11-15-after18/GATE.md` and its `verify/` files.

## Rules

- **R1 create-bug duplicate titles on GitHub.** After a failed `gh issue create`, one equal-title match is this run's issue; two or more → show them, ask which is this run's, create nothing (mirrors the Jira branch). Source: `create-bug-workflow#0` (`phase-d-create.md:26`).
- **R2 create-bug B2 search path.** B2 searches with the MCP or with the same JQL over Jira REST when the run posts by REST; it stops only when neither can search. Source: `create-bug-workflow#1` (`phase-b2-board-check.md:14`, `:42`).
- **R3 helix API trigger.** The API-prep trigger row uses signals the router already reads (branch name, last commit subject), not a changed-files list. Source: `helix#s2-0` (`proactive-qa-triggers.md:3`, `:23`).
- **R4 testing-ticket order.** The checklist puts QA closing (with its pre-delivery gate) before any Phase G external write. Source: `testing-ticket-workflow#s2-0` (`WORKFLOW.md:46`).
- **R5 superseded expected.** E3 allows BLOCKED for an expected superseded by a related ticket (spec conflict, `non-pass-challenge-gate.md` §2), alongside the layer-17 causes. Source: `testing-ticket-workflow#s3-1`.
- **R6 no recorder.** With no `{QA_TOOLS_ROOT}`, story evidence is BLOCKED with the install step; stills or Playwright `recordVideo` never stand in; no-wait layer 17 names this cause and drops the old "row under 1920 px" cause (after18 R6 gave narrow rows a clip path). Owner 15/Nov/2026: "เขียนทางไปที่ชัด: ไม่มีเครื่องมือ = BLOCKED + บอกวิธีติดตั้ง (แนะนำ)". Source: `testing-ticket-workflow#s3-0`.
- **R7 retest header bullets.** Every v2 header line is a bullet (`* *Env:* …`), multi-point values use `**` sub-bullets, and the guard accepts the bullet prefix. Owner 15/Nov/2026: "ปรับ template ให้หัวทุกบรรทัดเป็น bullet (แนะนำ)". Source: after-18 grade, retest p1r1–p1r3 header expectation FAIL.
- **R8 tc-fe ceiling.** tc-fe's time ceiling is re-measured on runs that reach the end of the 4f review (the v4 runs stopped before Step 3), same formula (median + 2×SE). Owner 15/Nov/2026: "วัดเพดาน tc-fe ใหม่แบบเดินครบขั้น (แนะนำ)". Lives in ols-qa-evidence, not here.

## Done when

- R1–R7 text in the named files; pinned tests updated with the same intent (owner: "แก้เทสต์ให้ตรงข้อความใหม่").
- `bash scripts/run-test-suites.sh` green; skill-lint OK; sdd-gate ok; helix `token-budget: pass` and `rule-lines: pass`.
