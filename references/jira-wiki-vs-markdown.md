# Jira wiki markup vs markdown — the silent-corruption rule

Canonical syntax rule for **any** body sent to Jira. Linked by every skill that posts a comment or
issue description; do not duplicate this content into a skill.

## The rule

**Draft in the syntax of the endpoint you picked, from the first keystroke.** Never draft in
markdown and "convert at post time".

| Endpoint / tool | Body language |
|-----------------|---------------|
| `/rest/api/2/issue/{key}/comment` | **Jira wiki markup** |
| `/rest/api/3/…` (ADF-direct) | ADF JSON |
| MCP `addCommentToJiraIssue` / `createJiraIssue` | markdown (converted to ADF for you) |

A markdown body POSTed to the **v2** endpoint **returns HTTP 200 and renders wrong**. There is no
error to catch. Proof-reading the draft does not catch it either — the source reads as correct,
because markdown is what the author meant. Only a string scan of the outgoing body catches it.

## markdown → wiki

| Markdown | Posted to v2 renders as | Wiki markup to use |
|----------|-------------------------|--------------------|
| `**bold**` | `*<b>bold</b>*` — bold text wrapped in literal asterisks | `*bold*` |
| `---` | `—` em-dash character, no horizontal rule | `----` |
| `\| a \| b \|` + `\|---\|---\|` | table renders, divider becomes a visible row of dashes | `\|\|a\|\|b\|\|` header, **no divider row** |
| `![alt](url)` | literal `![alt](url)` text | `!file.png\|width=450!` |
| `` `code` `` | literal backticks | `{{code}}` |
| `[text](url)` | literal text | `[text\|url]` |

## Two traps that survive a visual check

**Unknown `{macro}`.** Any `{word}` the parser doesn't recognise — `{id}`, `{status}`, `{PENDING}`,
a raw JSON blob — is read as a macro that never closes. **Every table, rule and list below it
degrades to raw text, while images above and below still render.** Escape as `\{id\}`, or wrap in
`{code}…{code}`.

**Bold beside unspaced scripts.** Wiki `*bold*` opens only after whitespace/line-start and closes
only before whitespace/punctuation. Thai, Japanese and Chinese have no word spaces, so
`คำ*เน้น*ต่อ` renders with literal asterisks. Use `{*}เน้น{*}` for mid-word emphasis.

## Gates

**Pre-post — scan the exact outgoing string** (not the draft in chat). Any hit = fix, do not post:

```
**            ^---$            ^\|\s*-{3,}            ![](            `code`            (?<!\\)\{\w+\}
```

**Post-post — verify by counting, not by looking.** Re-fetch with `?expand=renderedBody` and assert
against the source body:

- `<table>` count == `||` header-row count
- `<hr>` count == `----` count
- `<img>` count == `!…!` embed count
- zero `*`, `||` or `----` left in the tag-stripped rendered text

Counting images alone proves nothing — a broken macro leaves every image intact while destroying the
tables below it.

## Not every `*` is a defect

Footnote markers (`✅ *`), required-field markers copied off a form (`ชื่อสื่อ*`), and CSS selectors
(`[class*=Toast]`) are content. Triage scan output; never auto-strip.

## Fixing a comment that already shipped

`PUT /rest/api/2/issue/{key}/comment/{id}` with the corrected body — edit in place, never delete and
repost. **Fix the template that produced it in the same pass**, or it keeps emitting the fault.
