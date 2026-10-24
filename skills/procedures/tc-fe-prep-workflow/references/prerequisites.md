# Prerequisites — TC FE Prep

Read this before Step 0 of the main skill.

## Scope and authority

- Confirm **which Jira issue** receives the comment (almost always the **story**).
- Sub-tasks are out of scope unless the user explicitly names one.
- The only Jira write is the Step 7 comment (plus its attachments) on that story, and only after the user approves the Step 5 HTML draft in chat. Never transition or assign tickets in this workflow. A draft-only request posts nothing (WORKFLOW Step 7).

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

- Comment layout, header and line-break rules: [jira-formatting.md](jira-formatting.md) (the comment is ADF; the `.md` file and HTML draft use `<br>`).
- CSV must match the approved draft row-for-row (plus header row).
- Use attachment **links** in the comment footer, not embedded media nodes.

## Verification discipline

- Show the HTML draft (Step 5) and get approval in chat before anything is posted — never paste the TC table into chat.
- After any automated publish, open Jira and count table rows.
- If only the header appears, the post failed — re-post via ADF (Step 7) and do not declare success.

## Security

- Never paste credentials into Jira comments.
- Never commit `.env` or secrets into `references/` artifacts.
