# Retest notify is always sent by the agent: spec

2026-10-30 · Owner order (OLS-279 retest): "ปกติเรียกใช้สกิลมันก็ต้องส่งโนติเสมอที่นี่", "สำหรับงาน OLS ที่เทสแล้วส่งในเธรดนี้ตลอดนะ ถ้าเทสด้วย AI", "แก้มาดิ"

## Why
On the OLS-279 retest the agent ran the notify helper without its webhook, got `SKIP`, guessed the
cause, and handed the send command to the owner. The webhook location was already written down
(project guide § Retest-bug QA notify → local memory → a local file), but Step 9 never told the agent
that a `SKIP` is not a send or that the send is its own job.

## Rules
- **R1.** When Step 9 runs, the agent must send the notify itself, using the transport the project guide
  names. It must not hand the send command to the user. Source: owner order 2026-10-30.
- **R2.** When the helper reports a skip / unavailable transport, the agent must treat it as not sent:
  re-read the project guide's notify section and what it points to, fix the input, and send again.
  It must not state a cause it has not checked. Source: owner order; repo rule §0 (no guessing).
- **R3.** The round must not be reported closed until the helper prints its success line. Source: owner order.
- **R4.** The OLS project guide must name the transport concretely (webhook file, credentials file,
  `--jira-key`, `--registry`, success line) and say it applies to every OLS ticket tested by AI.
  No webhook URL or token is written in the repo. Source: owner order; CLAUDE.md §5.
- **R5.** A test must fail when R1–R4 wording is missing. Source: owner rule 18.

## Done when
- Step 9 of the retest workflow carries R1–R3.
- The OLS guide notify section carries R4 with no secret value.
- The new test is red without the text and green with it; the full suite is green.
