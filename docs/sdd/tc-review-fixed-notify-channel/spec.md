# Spec — TC review: always notify one fixed channel, ask only for the thread

**Owner request:** 20/Oct/2026 — "อัปเดตสกิลรีวิวเทสเคส ที่อยู่ในเรโป ols-qa ให้ส่งโนติที่กลุ่มนี้เสมอ <channel link> ไม่ว่าสกิลจะถูกเรียกใช้โดยใครก็ตาม ถามแค่ให้ส่งในเธรดไหนในกลุ่ม" and, the same turn, "สร้างแนวป้องกันการถามซ้ำด้วยว่าให้ส่งโนติที่กลุ่มไหน" and "แก้แล้วอัปเดตเวอร์ชันเลย".

## Why

- `skills/tc-review-workflow/SKILL.md` Step 5 is "Optional … only on explicit request, and only to a destination … the user names". So a run started by someone who does not ask for a share sends nothing, and a run that does share asks for the channel each time.
- The owner has given the destination before: the TC-review webhook in local secrets is bound to the owner's channel (measured 20/Oct/2026: `GET <webhook>` → `channel_id` = the channel in the owner's link). Asking for it again is the repeat-question class of post-mortem #0059.
- Repo is public (CLAUDE.md §5): the channel/guild id may not be committed. It lives in local secrets; the repo carries a placeholder.

## Rules

- **R1** — When a TC review reaches Step 5, the workflow must send the review to the project's fixed TC-review notify channel, on every run, whoever invoked the skill and whether or not they asked for a share.
- **R2** — The channel comes from the project config (placeholder `<TC_REVIEW_NOTIFY_CHANNEL>` in the project guide, real value in local secrets). The workflow must not ask which server, group or channel to send to.
- **R3** — The only question Step 5 asks is which thread of that channel to post in. Answering it is the go-ahead to send. Threads already used for this ticket (from the config or past sends) are offered as options.
- **R4** — When the project config has no fixed channel, the workflow must stop Step 5 and say the config is missing. It must not fall back to asking for a channel.
- **R5** — A PreToolUse guard must block an `AskUserQuestion` that asks *which* group / channel / server to send to (Thai or English) when the question mentions TC review or the tc-review skill ran in the session. It blocks even after an episodic search, since the answer is fixed. A thread question passes this rule (the existing search rule still applies).
- **R6** — Skill text stays generic (portable-content rules): no ids, names or paths. Real ids stay in `~/.ols-qa-secrets/`.
- **R7** — Existing Step 5 rules stay: read-back, delete-and-resend for a wrong destination, edit in place for wrong content, 2,000-character limit, webhook + `thread_id`, QA-Owner mention.

## Edge cases

- Question "ส่งเธรดไหนในห้องรีวิว TC" — mentions a room but asks for a thread → allowed by R5.
- Question "ส่งโนติกลุ่มไหนครับ" with no TC-review word, in a session where tc-review ran → blocked.
- Same question in a session where tc-review never ran and no TC-review word → not this rule (other flows may legitimately ask).
- Transcript unreadable → decide from the question text alone.

## Done when

- `node tools/ask-guard/ask_rules.test.js` has failing-first tests for: Thai which-group question + TC review → deny; English "which channel" + skill-ran transcript → deny even when searched; thread question → not denied by R5; unrelated which-channel question with no TC review → not denied by R5.
- SKILL.md Step 5 + checklist + MUST/NEVER + `commands/tc-review.md` state R1–R4.
- Project guide has the placeholder section; secrets hold the real channel.
- `bash scripts/run-test-suites.sh` green; PR merged; auto-version bumped; helix synced and parity passes.
