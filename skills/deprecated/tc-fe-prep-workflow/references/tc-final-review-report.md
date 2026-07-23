# FE test cases — final review report (mandatory close-out)

Run **after Step 7 post-publish review passes** and any fixes are applied. Compare the **published** TC set (Jira comment + attachment, or final approved draft if publish was skipped) against the **story ticket** (AC, EC, description, business rules).

Pair with [ac-ec-coverage-review.md](ac-ec-coverage-review.md) (pre-draft gate) and [tc-quality-standards.md](../../../../references/tc-quality-standards.md).

**This is not a substitute for Step 4.** Step 4 gates the draft before user approval; this report certifies the **final** TC set the user receives at session close.

---

## When to run

| Trigger | Source to review |
|---------|------------------|
| Jira comment posted | Re-read comment body + attachment on the issue |
| Draft-only session (no publish) | Final approved table in chat + workspace `.md` / export file |
| User requested review of existing comment | That comment ID + ticket description |

Fix any **FAIL** before posting the report. Re-run checks after fixes (max 2 rounds).

---

## Review dimensions (four axes)

Score each axis **PASS** or **FAIL**. Overall **PASS** only when all four axes pass.

### Axis 1 — AC / EC alignment (complete)

| Check | PASS when |
|-------|-----------|
| Traceability | Every **AC** and **EC** on the story maps to at least one `TC_*` row |
| Expected outcomes | Each AC/EC expected result from the ticket appears in **Expected Result** of mapped TC(s) |
| Error messages | Validation/error copy in TC matches ticket text (exact or approved paraphrase) |
| Split coverage | When one AC covers multiple branches (e.g. Draft vs Submit), each branch has its own TC or explicit steps |

Build a traceability table for the report (see output template).

**FAIL examples:** missing EC_03; AC_02 omits Consent or PENDING_APPROVE; wrong error string.

### Axis 2 — Spelling

| Check | PASS when |
|-------|-----------|
| English | No typos in titles, steps, services, status names (`DRAFT`, `PENDING_APPROVE`, etc.) |
| Thai UI labels | Match ticket / Figma labels (`บันทึกร่าง`, `ส่งเพื่อขออนุมัติ`, `เพิ่มวิดีโอใหม่`, etc.) |
| Encoding | No mojibake (`â€`, `à¸`, broken arrows) in Jira comment or export file |
| Metadata field names | Match ticket Key Feature / metadata spec when listed in steps |

**FAIL examples:** `Transscoding`, `Comunity`, `PENDING APPROVE` (underscore missing), Thai labels wrong or garbled.

### Axis 3 — Numbering order

| Check | PASS when |
|-------|-----------|
| Shared data prep | Ordered list `1.` … `N.` sequential, no gaps or duplicates |
| Test Case ID | `TC_01` … `TC_N` sequential when using numeric IDs; or stable project convention with no gaps |
| Cell numbering | Within each **Precondition**, **Test Steps**, and **Expected Result** cell, items are `1.` `2.` `3.` … with no skips |
| Jira formatting | Bold numbering in table cells (`**1.**` …) per [jira-formatting.md](jira-formatting.md) — not bare `1.` at cell start |

**Note:** Row sort order (e.g. Unit → Integration → System) may differ from ticket AC/EC order — that is **not** a numbering failure unless the user asked to preserve ticket order.

**FAIL examples:** steps jump `1.` → `3.`; TC_08 followed by TC_10; shared prep missing item 3.

### Axis 4 — Content accuracy / scope

| Check | PASS when |
|-------|-----------|
| In scope | Every TC traces to an AC, EC, or user-confirmed story constraint |
| Out of scope absent | No TC for features explicitly deferred (other epic, Phase 2, “>> EPIC11”, etc.) |
| No invented UI | Buttons, fields, and flows exist in ticket, linked PRD, or project guide |
| Business rules | Material limits in description (file size, types, retry count, ownership) reflected in Test Data / Expected Result |
| No orphan rows | No “nice to have” or exploratory cases without AC/EC mapping |

**FAIL examples:** NDLP import TC when ticket defers to EPIC11; Short Video TC when Phase 2; Audit Log verification with no AC/EC.

---

## Verification procedure

1. Load story **description** — extract all AC_*, EC_*, business rules, deferred items.
2. Load **final TC** — Jira comment (preferred) or approved draft + CSV.
3. Build traceability matrix (AC/EC → TC IDs).
4. Run axes 2–4 on full table text.
5. Record **optional improvements** (non-blocking suggestions only).
6. If any axis **FAIL** → fix TC → re-publish or re-show draft → re-run from step 2.

---

## User-facing report (mandatory before "done")

Post this report in chat **immediately before** Step 8 session closing. Use **direct tone** — no polite particles or filler closings.

Do **not** say TC prep is complete until this report is posted with overall **PASS** (or **PASS with optional improvements**).

### Template

```markdown
# TC review — {ISSUE_KEY} {comment URL or "draft in chat"}

Compared final TC against story **{ISSUE_KEY}** ({summary short}).

---

## Summary

| Dimension | Result | Notes |
|-----------|--------|-------|
| AC / EC alignment (complete) | **PASS** \| **FAIL** | {one line} |
| Spelling | **PASS** \| **FAIL** | {one line} |
| Numbering order | **PASS** \| **FAIL** | {one line} |
| Content accuracy / in scope | **PASS** \| **FAIL** | {one line} |

**Overall:** **PASS** \| **FAIL** — {one line verdict}

---

## 1. AC / EC alignment

| Ticket | TC(s) | Notes |
|--------|-------|-------|
| AC_01 | TC_XX | … |
| EC_01 | TC_XX | … |

{Bullet gaps if FAIL. Omit section detail if PASS with nothing notable.}

**Key expected results verified:** {e.g. error strings, status names, Consent flow}

---

## 2. Spelling

{PASS: one line confirming EN + TH labels and encoding.}

{FAIL: list each typo or mismatch with location TC_ID + column.}

---

## 3. Numbering order

| Area | Result |
|------|--------|
| Shared data prep | 1–{N} ✓ |
| Test Case ID | TC_01–TC_{N} ✓ |
| Cell step numbering | ✓ |

{Note row sort strategy if Test Type grouping used.}

---

## 4. Content vs ticket scope

**In scope and correct:** {short bullet list}

**Correctly excluded:** {deferred / out-of-scope items from ticket — confirm no TC written}

{FAIL: list orphan or out-of-scope TC rows.}

---

## Optional improvements (non-blocking)

{Omit section if none.}

1. {TC_ID} — {suggestion}
2. …
```

### Rules for the report

- Use markdown links for issue and comment URLs.
- **FAIL** overall → fix and re-run; do not proceed to Step 8.
- **PASS** with optional improvements → proceed to Step 8; list improvements without blocking.
- Keep prose concise; tables carry the evidence.
- Language: follow [user-communication.md](../../../../references/user-communication.md) for chat (English default). Match ticket language for quoted UI strings and error messages.

---

## Relation to other gates

| Gate | When | Output |
|------|------|--------|
| Step 4 — [ac-ec-coverage-review.md](ac-ec-coverage-review.md) | Before draft in chat | `Ready for draft: YES` + coverage delta |
| Step 7 — [jira-comment-post-review.md](../../../../references/jira-comment-post-review.md) | After Jira post | Formatting / attachment checks |
| **This report** | Before session close | Four-axis PASS/FAIL + traceability |
