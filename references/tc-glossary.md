# TC glossary — terminology source of truth

Rules for choosing the Thai wording used inside test case content.

The glossary itself is **project data, not skill content**. Its published-sheet URL, tab name, `gid`, and local CSV path are recorded in the project guide (for this workspace: [ols-project-guide.md](ols-project-guide.md) § TC glossary). Skills MUST read the location from the project guide rather than hardcoding a URL.

## Precedence

Resolve every term in this order. Stop at the first rule that produces an answer.

1. **Glossary CSV** — if the English term has a row with a non-empty Thai cell, use that Thai term verbatim.
2. **Fallback table** in the skill's own language-rules step — only for terms with no glossary row.
3. **Ask the user** — anything else. Never coin a term.

The glossary outranks the skill's fallback table. Where they disagree, the glossary wins and the fallback row is dead weight — delete it rather than leaving two sources of truth.

## The CSV is a verbatim mirror

`tc-glossary.csv` is a byte-faithful export of the published tab. It carries the sheet's typos, trailing spaces, and odd values on purpose.

- MUST NOT normalise, spell-fix, deduplicate, sort, or "clean" the CSV.
- Typos are fixed **in the sheet by the sheet owner**, then re-exported. Never in the CSV.
- A CSV that differs from the sheet is a drift bug, not a convenience.

## Re-check gate (before designing test cases)

Every TC run re-fetches the tab and shows the user what it got. A cached CSV from a previous session is not evidence — the sheet may have changed.

1. Fetch the published tab as CSV using the `gid` from the project guide:

   ```bash
   curl -sL "https://docs.google.com/spreadsheets/d/e/{PUB_ID}/pub?gid={GID}&single=true&output=csv" -o references/tc-glossary.csv
   ```

   If TLS verification fails, the machine likely has an intercepting proxy (corporate AV, e.g. Bitdefender). Export its CA from the OS trust store and pass `--cacert`. **Never** pass `-k` / `--insecure`.

2. Diff against the committed CSV. Report added, removed, and changed rows.
3. Post in chat: row count, the source URL, and the diff (or "ไม่มีการเปลี่ยนแปลง").
4. Run the gap and ambiguity scan below.
5. **Wait for the user to confirm or adjust.** Do not start test case design first.

## Gap scan — blocking

Scan only the terms the test case set will actually use. Do not interrogate the user about the whole sheet.

| Condition | Action |
|-----------|--------|
| Thai cell is **empty** | **STOP. Ask the user what word to use.** Offer the skill's fallback term as a suggestion if one exists, clearly labelled as a suggestion. |
| Same English key carries **conflicting Thai meanings** across rows (e.g. `Creator` vs `Creator (media owner)`) | **STOP. Ask the user which applies to this ticket.** |
| Thai cell holds **multiple comma-separated variants** (e.g. `แถบ, แท็บ`) | Not blocking. Propose one variant in the term-confirmation table and let the user confirm. |
| English term has **no row at all** | Use the skill's fallback table. If absent there too, ask. |

"Ask" means stop and wait for an answer. Writing a guess and tagging it *provisional*, *pending confirmation*, or *flagged for review* is not asking.

## Red flags

If you catch yourself thinking any of these, you are about to violate the gate:

- "The glossary has no entry, but the obvious word is …"
- "I'll pick one and mark it provisional / pending user sign-off."
- "It's a documented fallback, so I don't need to ask."
- "The sheet is probably unchanged since last session."
- "This is a reasoned judgment call, not an invention."
- "Asking about one word would interrupt the flow."

All of these mean: **stop, fetch the sheet, and ask.**

## Reporting

Every term-confirmation table MUST state, per term, where the word came from: `glossary` / `fallback` / `user` — and cite the sheet URL and row count above the table. The user approves words against evidence, not against the agent's memory.
