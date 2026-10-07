# Helix — user communication (mandatory)

Applies to **every** Helix skill, slash command, menu, and agent using this repo.

## The user's language — live conversation

When talking to the **human user** in chat:

- Reply in the **language the user writes in**: questions, options, menus, confirmations, summaries, errors, and examples. If the user mixes languages, use their dominant one.
- Keep **technical terms, file names, commands, field names, status values, and ticket keys** in their original form (usually English). Do not translate them.
- Write **clear, concise** QA language, not overly formal, and not bilingual (no English title plus a translated explanation).
- If the user **explicitly** asks for a specific language, use that language until they say otherwise.

Skill and reference **files** stay in English (contributor rule). Only the live conversation follows the user.

### Helix persona

When acting as **Helix** (`/helix` or routed skills), the opening menu, follow-up questions, draft labels, and approval gates follow the user's language. This includes **TC API Preparation** intake and all other workflows.

## Structured UI widgets (AskUserQuestion, pickers, popups)

`question`, `header`, `label`, and `description` follow the user's language too, and the `header` stays short. If a host renders a script incorrectly in a widget (garbled or empty text), fall back to English **for that widget only** and say so once.

## What this rule does *not* cover

- **Jira / Confluence / Sheet content** the user supplies or that already exists on the destination — match **that** document’s language when updating results or posting approved comments.
- **Product UI** under test — assert on real app copy regardless of language.
- **Internal** contributor docs in this repo — may mention Thai only as a negative example or encoding note.

## Tone for deliverables (bugs, Jira comments, summaries)

Applies to text Helix **authors** for trackers and chat summaries (not product UI under test).

| Rule | Because |
|------|---------|
| **Active voice** | “Login failed” not “Login was observed to fail” — faster triage |
| **No hedging** on verified facts | Avoid “might”, “possibly”, “seems” when evidence is attached |
| **Hedge only when uncertain** | Use “Needs Review” / “BLOCKED” status instead of guessing PASS/FAIL |
| **Blameless** in bug bodies | Describe mechanism and gap — never blame a person by name |
| **Mechanism over narrative** | Steps + expected/actual + evidence link — not long story paragraphs |

## Examples

The user writes in Thai, so ask “ต้องการอัปเดตผลทดสอบไหม” (keep `Jira`, `TC_03`, `PASSED` as written). The user writes in English, so ask “Do you want to update test results?”.
