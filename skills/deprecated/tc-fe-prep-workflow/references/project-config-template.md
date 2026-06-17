# Project config template — TC FE Prep

Save completed answers as `references/{PROJECT}-tc-fe-prep-guide.md` in the **user's repository**.

Ask **one section at a time**. Wait for answers before the next section.

---

## Section A — Jira

1. What is the Jira site domain? (e.g. `your-org.atlassian.net`)
2. What is the ticket prefix? (e.g. `PROJ` from `PROJ-123`)
3. Should FE TC comments go on the **story** by default? (yes/no)
4. Cloud ID for API/MCP if needed (optional).

---

## Section B — Application

1. Product / portal name for manual tests (e.g. Admin portal, Student portal).
2. Base URL per environment (staging, UAT, prod).
3. Default test role for these cases (e.g. BackOffice Admin).

---

## Section C — Feature vocabulary

1. Menu path to the feature under test.
2. Tab names and status labels as shown in UI (exact spelling).
3. Standard entity name (e.g. Section, Course, Banner).

---

## Section D — Data seeding

1. How to create minimum data when missing (short steps or reference story keys).
2. Default test entity naming pattern (e.g. `Entity QA {ISSUE_KEY}`).

---

## Section E — Deliverables

1. Column list if not the default ten columns (Type is always included).
2. Preferred publish method: MCP / browser session / manual paste.
3. Should the Qase import CSV be attached to the same comment? (default yes)

> Fixed for this workspace (do not ask): content language = **Thai** (ราชบัณฑิตยสภา);
> **Type** column always present (`System Test` / `Unit Test` / `Integration Test`);
> **Status** = `Done`; export is a **Qase import CSV** named `Import_Qase_{ISSUE_KEY}.csv`;
> **Suite** must reuse an existing OLS Qase suite or a user-approved new one.

---

## Example saved config (snippet)

```markdown
# PROJECT-tc-fe-prep-guide

- Jira domain: `example.atlassian.net`
- Comment target: story only
- Portal: Back Office — Section Management
- Shared login: BackOffice Admin
- Seed reference: `{OTHER_STORY_KEY}` for data created in another story (if applicable)
- Artifacts: `references/{ISSUE_KEY}_FE_TC.md` + `references/Draft_Jira_{ISSUE_KEY}.csv` + `references/Import_Qase_{ISSUE_KEY}.csv`
```
