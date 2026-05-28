# FE test cases — AC / EC coverage review

Run **after Step 3 (design)** and **before Step 5 (draft in chat)**. Pair with [tc-quality-standards.md](../../../references/tc-quality-standards.md) for ISTQB / 29119-3 row quality.

---

## Goal

Prove the table **fully reflects the story’s AC and EC** — nothing required is missing, nothing irrelevant is added. Row count **does not** need to equal AC+EC count.

---

## Build the traceability matrix (mandatory)

List every **AC** and **EC** from the story (from Step 2). For each item record:

| AC/EC ID | Summary (short) | Covered by TC ID(s) | Notes |
|----------|-----------------|---------------------|-------|
| AC_01 | … | TC_Feature_01, TC_Feature_02 | Split positive/negative |
| EC_02 | … | TC_Feature_05 | |

Rules:

- **Every AC and EC** must appear in the matrix with at least one `TC_*` — or STOP and add cases.
- **One TC may cover multiple AC/EC** when they share the same flow and assertions.
- **Multiple TCs may cover one AC/EC** when scenarios differ (e.g. role, data state, validation branch).

---

## Coverage completeness (ไม่ขาด)

| Check | PASS when |
|-------|-----------|
| AC coverage | Each AC’s **expected outcome** from the story is asserted in Expected Result of mapped TC(s) |
| EC coverage | Each EC’s **invalid/boundary/blocked** behaviour is exercised in mapped TC(s) |
| Description / notes | Material constraints from description (status rules, tabs, limits) appear in Preconditions or steps |
| Linked scope | Only linked docs the **user confirmed** for this story are reflected |

---

## Scope discipline (ไม่เกิน · ไม่กาว · ไม่เพ้อ)

| Check | FAIL examples |
|-------|----------------|
| **No orphan TCs** | Row with no AC/EC mapping (“nice to have” UI polish) |
| **No invented scope** | Cases for features not in AC/EC/description unless user explicitly added scope |
| **No duplicate intent** | Two rows that verify the same AC outcome with identical steps (merge unless boundary split is intentional) |
| **No glue cases** | Generic “open page and check everything” not tied to a specific AC/EC |
| **No fantasy cases** | Steps that assume buttons/APIs not mentioned in story or config |

**ไม่เกิน:** Extra TCs that do not trace to an AC, EC, or user-confirmed story constraint → **remove** or ask user to accept as out-of-scope add-on.

**ไม่กาว:** Forcing one TC to cover unrelated ACs without shared flow → **split**.

**ไม่เพ้อ:** Edge cases not in EC or implied by AC (e.g. random browser resize) → **remove** unless user requests exploratory add-ons.

---

## Review output (post in chat before draft table)

```text
━━━ FE TC coverage review ━━━
Story: {ISSUE_KEY}
AC/EC items: {A} AC + {E} EC
Test cases: {M} rows (ratio to AC+EC is informational only)

Traceability: all AC/EC mapped — YES | gaps: {list}
Scope: orphan TCs removed — {n} | out-of-scope TCs removed — {n}
Quality (ISTQB/29119-3): PASS | FIX rows: {ids}

Ready for draft: YES | NO — {reason}
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then post the **Coverage delta** table per [coverage-delta-template.md](../../../references/coverage-delta-template.md) (FE section).

MUST NOT post the full draft table until **Ready for draft: YES** and the delta table is posted.
