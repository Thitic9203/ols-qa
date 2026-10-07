# Prerequisites — TC FE Prep

Read this before Step 0 of the main skill.

## Scope and authority

- Confirm **which Jira issue** receives the comment (almost always the **story**).
- Sub-tasks are out of scope unless the user explicitly names one.
- Do not post, transition, or assign tickets unless the user asked for that in a separate task.

## Requirements quality

- Parse **every** AC and EC row on the story.
- Note field max lengths, required fields, and forbidden controls from AC text.
- When seed data is missing, document creation steps in **shared prep** and reference the source story by key only.

## Writing quality

- **Test Title:** readable sentence; avoid internal tags like `[Validation]` unless requested.
- **Steps:** include navigation context (portal, menu, tab, button label, field label).
- **Expected:** one observable outcome per numbered line.
- **Precondition column:** line 1 always confirms shared prep completed; following lines are case-specific.

## Jira mechanics

- Markdown table cells: use `<br>` between numbered sub-items.
- Bold table headers: `**Column Name**` in header row.
- CSV must match the table row-for-row (plus header row).
- Prefer attachment **link** in the comment footer over embedded media nodes if ADF returns errors.

## Verification discipline

- Draft in chat first.
- After any automated publish, open Jira and count table rows.
- If only the header appears, switch publish method — do not declare success.

## Security

- Never paste credentials into Jira comments.
- Never commit `.env` or secrets into `references/` artifacts.
