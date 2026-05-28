# Session closing (all workflows)

Apply at **end of every workflow** (success, partial, or blocked). English only.

## 1 — Unified verification

Complete [verify-closing-checklist.md](verify-closing-checklist.md) for this workflow type before saying the session is complete.

## 2 — Artifact index (mandatory)

Post paths and links the user may need next:

```text
━━━ Artifacts ━━━
| Item | Location |
|------|----------|
| Draft / table | chat above |
| Markdown | references/{file}.md |
| CSV | references/{file}.csv |
| Screenshots | screenshots/{KEY}/ |
| Jira comment | {URL} |
━━━━━━━━━━━━━━━
```

List only what was actually created. Use workspace-relative paths.

## 3 — Next workflow (mandatory one line)

Offer **exactly one** logical next step from [skill-routing.md](skill-routing.md) when relevant — user may decline.

| Finished | Suggest (one line) |
|----------|-------------------|
| TC FE prep | “Run **/testing-ticket** on the same story?” |
| TC API prep | “Run **/testing-ticket** or export-only — your call.” |
| Testing ticket (failures) | “File bugs with **/create-bug** using the F3 table?” |
| Retest PASSED | “Close or notify PM — no Helix step required.” |
| Retest FAILED | “**Create bug** or reassign per your process?” |
| Create bug | “**Retest** after the fix is deployed?” |

Do not auto-start the next workflow without user consent.

## 4 — Handoff file (long or interrupted sessions)

Write when **any** applies:

- User may continue in a **new chat**
- Workflow ran **> 30 minutes** or **> 15 TC rows**
- Session ended **blocked** (VPN, auth, partial Jira post)

**Path:** `references/helix-handoff-{ISSUE_KEY or slug}.md` in the **user’s workspace**

Use [handoff-file-template.md](handoff-file-template.md). Tell the user the path.

## 5 — Verdict block (mandatory)

Close with:

```text
Verdict: {COMPLETE | PARTIAL | BLOCKED}
Verified: {what was re-read on destination}
Blocked: {none | list}
```

Never use “done” without `Verified:` when Jira/files were written.
