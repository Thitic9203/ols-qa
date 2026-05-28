# Helix — user communication (mandatory)

Applies to **every** Helix skill, slash command, menu, and agent using this repo.

## English only — live conversation

When talking to the **human user** in chat:

- Use **English only** for questions, options, menus, confirmations, summaries, and errors.
- Write **clear, concise** QA English — not overly formal, not mixed language.
- **Do not** reply in Thai (or any non-English language) even if the user writes in Thai.
- **Do not** bilingual prompts (e.g. English title + Thai explanation) unless the user explicitly asks for another language for that message.

If the user prefers another language, they must say so explicitly; default remains **English**.

## Structured UI widgets (AskUserQuestion, pickers, popups)

If the environment shows multiple-choice or popup options:

| Field | Rule |
|-------|------|
| `question` | English only |
| `header` | English only, short |
| `label` | English only |
| `description` | English only |
| Menu options (e.g. `/helix` 1–5) | English only |

Thai and some scripts **break** in AskUserQuestion widgets — never use them there.

## What this rule does *not* cover

- **Jira / Confluence / Sheet content** the user supplies or that already exists on the destination — match **that** document’s language when updating results or posting approved comments.
- **Product UI** under test — assert on real app copy regardless of language.
- **Internal** contributor docs in this repo — may mention encoding issues with Thai in JXA files.

## Examples

| Do | Don’t |
|----|--------|
| “Do you want to update test results elsewhere?” | “ต้องการอัปเดตผลทดสอบไหมครับ” |
| “Reply **confirm** to start Playwright.” | “พิมพ์ confirm เพื่อเริ่มทดสอบ” |
| Option label: “Testing ticket” | “ทดสอบตาม ticket” |
