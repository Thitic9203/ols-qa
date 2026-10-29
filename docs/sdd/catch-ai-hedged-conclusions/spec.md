# Spec — catch-ai-workflow: hedged conclusions are defects, not endings

**Source:** owner order in chat, 29/Oct/2026: "อัปเดตสกิล /catch-ai ให้ตรวจตรา เมื่อผลลัพธ์ออกมาจากการเดา เช่น น่าจะ อาจจะ แล้วจบไปแบบเนียนๆ ห้ามทำแบบนั้น ต้องให้ไปตรวจสอบโดยละเอียดในชั้นที่ลึกที่สุด เพื่อหาต้นตอของปัญหาและแก้ปัญหา" and, same thread, "แก้สกิลแล้วอัปเดตเวอร์ชันเลย ทั้งใน helix, ols-qa repo".

Re-verified on main 7bf0dc7 (29/Oct/2026): `skills/catch-ai-workflow/SKILL.md` flags hedge words only in an **Expected** line (Red flags, line 142) and allows a `Suspected` root cause at step 7 (line 98) with no rule that it must be pushed further. Nothing makes a hedged conclusion *in the audited work* a finding. The hedge list already exists in `references/root-cause-investigation.md` § 4 "Banned unless a label + artifact is attached".

## Rules

- **R1** — When the audited work closes a conclusion (cause, verdict, status, "fixed", "done", "not a bug", a number) on a hedge (น่าจะ · อาจจะ · คงจะ · คาดว่า · เข้าใจว่า · ดูเหมือน · เป็นไปได้ว่า · probably · likely · maybe · might · seems · appears · should be · must be · I think) with no artifact proving it, catch-ai must classify it **Defect (hedged conclusion)** — never Clean, never a Question that ends the audit. Source: owner order.
- **R2** — For every hedged conclusion, catch-ai must investigate it to the deepest layer the owner controls, using `superpowers:systematic-debugging` and `references/root-cause-investigation.md`, until the cause is `Confirmed` with an artifact. Source: owner order ("ตรวจสอบโดยละเอียดในชั้นที่ลึกที่สุด เพื่อหาต้นตอของปัญหาและแก้ปัญหา").
- **R3** — catch-ai must not end its own run on a hedge: no hedge word in any conclusion line of its report (Verdict, Root cause, Correction, Remediation, Checked-clean). Verbatim quotes of the audited work are exempt. Source: owner order ("ห้ามทำแบบนั้น").
- **R4** — A `Suspected` cause must not close a defect. catch-ai must run the confirming check; it may stop short of `Confirmed` only when that check needs access, data or permission the run does not have — then the item stays open as a Question naming the exact check and what is needed, and the verdict cannot be PASSED or "No issue found" for it. Source: owner order + `references/root-cause-investigation.md` § 4, § 6.
- **R5** — The rule must be enforced at the points the skill already gates: Quick reference, step 5 classification, step 7, Rationalizations, Red flags, QA closing, MUST / NEVER, report template. Source: existing structure of `skills/catch-ai-workflow/SKILL.md`.
- **R6** — Ship to both repos: merge to ols-qa main (CI `auto-version.yml` bumps the version), then `scripts/sync-skills-to-helix.sh` the changed shared files (helix pre-commit bumps the helix version), then `scripts/helix-parity.sh`. Source: owner order + CLAUDE.md § 5.

## Edge cases

- A hedge inside a quoted Actual line (the audited text itself) is evidence, not the auditor's conclusion — exempt from R3.
- A hedge used with an attached artifact and a `Suspected` label plus a named confirming check is not "closed quietly" — it is R4's open Question, not R1's defect, if the audited work itself left it open and said so.
- Hedge words in a non-conclusion sentence (a plan, "we might also add X") are not conclusions.

## Done when

- SKILL.md carries R1–R5 in the named sections; reference.md report template carries the hedge-free rule.
- `bash scripts/run-test-suites.sh` passes.
- PR merged to ols-qa main; `bash scripts/verify-on-origin.sh` prints `ON-ORIGIN`; auto-version commit present.
- helix main carries the same two files; `bash scripts/helix-parity.sh` passes; helix version bumped.
