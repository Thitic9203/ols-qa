# after-18 gate fixes — spec

Scope: only what kept skills from the round-9 Exit gate in after-17 (`ols-qa-evidence` `evals/helix-skill-eval-2026-11-13-after17/GATE.md`, 4/8 passed). Owner 15/Nov/2026: fix everything first, then run one round ("แก้มาให้ครบแล้วค่อยไปสเตปถัดไป ไม่วนแก้วนรัน"); P2/P3 of after-17 are out of scope ("แก้เฉพาะที่ทำให้ไม่ผ่าน DoD (แนะนำ)").

## Rules

- **R1 catch-ai order.** The Order line runs the Result quality gate before the CHECKPOINT, because the step-9 report shown at the CHECKPOINT already carries the gate line. Source: after-17 verify `catch-ai-workflow#s2-0` (`SKILL.md:61`).
- **R2 retest waiver.** `references/verify-closing-checklist.md` never offers a user waiver for a text-only FE comment; it matches retest `WORKFLOW.md` and `closeout-and-notify.md:43` (an FE evidence gap is never waived). Source: `retest-bug-workflow#s2-0`.
- **R3 retest approval bundle.** Every action in the Step 6d approval bundle names its target; a name is resolved from the project guide, else the ticket or the request, and an unknown name is a decisions-popup question, never "names come from the project guide". Same sentence in `round-time-contract.md` §4. Source: after-17 grade, retest p2r2 expectation "approval bundle listing every action by name" FAIL.
- **R4 tc-fe first glossary run.** Step 2.6.2's diff line has a first-run branch when no committed CSV exists. Source: `tc-fe-prep-workflow#s2-0` (`requirement-gates.md:186`).
- **R5 tc-fe review time.** The 4f author self-check also covers the three defects every after-17 round-1 reviewer found (two outcomes on one Expected line, a "saved" clause with no read-back step, AC rows after EC rows), and the Step 4.5 term table is drafted while a reviewer round runs. No gate, round rule or reviewer requirement changes. Source: after-17 tc-fe p1r1–p1r3 each needed review round 2 (time 132 s vs ceiling 128 s); owner 15/Nov/2026 "ลดงาน 4f (แนะนำ)".
- **R6 narrow-width clips.** A row run under 1920 px records a 1920×1080 browser window whose page is emulated at the row width (`deviceScaleFactor` 2), so layer 1 holds and the row can pass or fail on its clip. Source: `testing-ticket-workflow#s2-0` (`qa-evidence-capture.md:115`); owner 15/Nov/2026 "อัดหน้าต่าง 1920×1080 + หน้าเว็บกว้างตามแถว (แนะนำ)".

## Done when

- Each rule's text is in the files named above.
- `bash scripts/run-test-suites.sh` green; `node tools/skill-lint/lint.js` OK; `node tools/sdd-gate/check.js --base <spec branch>` ok.
- helix scratch check prints `token-budget: pass` and `rule-lines: pass`.
