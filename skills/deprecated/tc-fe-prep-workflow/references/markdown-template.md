# Markdown template — FE test cases

Replace placeholders. Keep one table row per test case.

```markdown
Draft TC FE as below

**Shared data preparation (all TCs):**

1. Log in to {PORTAL} as {ROLE}.
2. Navigate to {FEATURE_AREA}.
3. Open tab **{TAB_NAME}**.
4. Ensure at least one {ENTITY} exists in state **{STATE}** (if missing: {SEED_STEPS_REF_OTHER_STORY}).
5. Use target {ENTITY} named **{ENTITY_NAME}** for all cases below.

**Note — Precondition column:** Complete shared prep above first. Precondition lists anything else required before Test Steps for that case.

| **Acceptance Criteria** | **Services Impacted** | **Test Case ID** | **Test Title** | **Precondition** | **Test Data** | **Test Steps** | **Expected Result** | **Priority** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: {AC_SUMMARY} | - {SERVICE} | TC_{Feature}_01 | {TITLE} | 1. Shared prep (items 1–5) completed.<br>2. {EXTRA_PRE} | 1. {DATA} | 1. {STEP}<br>2. {STEP} | 1. {EXPECTED}<br>2. {EXPECTED} | High |
```

## Precondition examples

**List-only case (menu):**

```text
1. Shared prep (items 1–5) completed.<br>2. On {FEATURE_AREA}, tab **{TAB}**.<br>3. Target row for **{ENTITY_NAME}** is visible.
```

**Edit form already open:**

```text
1. Shared prep (items 1–5) completed.<br>2. Edit form for **{ENTITY_NAME}** is open.
```

**Depends on prior case:**

```text
1. Shared prep (items 1–5) completed.<br>2. Steps through TC_{Feature}_07 completed; {MODAL} is open.
```
