# Gotchas — retest bug workflow

## General

- After `evaluate`, if the page is `about:blank`, check `window.location.href` before each step.
- `SyntaxError: await` in injected scripts → use `.then()` chains or an IIFE.
- Always use **full URLs** in `fetch()` — no relative paths.
- Token may be portal-specific — read project config.
- Re-login when the session expires (see config).

## v2 wiki markup

| Mistake | Result in Jira |
|---------|----------------|
| `\\u274c` in a template literal | Literal `\u274c` text, not ❌ |
| Bare issue key `PROJ-123` in body | Auto-linked as a full ticket chip |
| POST to `/rest/api/3/` with wiki body | Wrong format / error |

**Correct:**

- Use real ❌ ✅ characters in the source string; escape only when building ASCII-safe JS for JXA.
- Wrap issue keys in `{{PROJ-123}}` if they must appear in text.
- Wiki markup → **v2** comment endpoint only.

### markdown → wiki (the silent-corruption table)

A markdown body POSTed to `/rest/api/2/` **returns 200 and renders wrong**. There is no error to
catch, and proof-reading the draft does not catch it either — the source looks correct because
markdown is what you meant. Only a string scan of the outgoing body catches it.

| Markdown | Posted to v2 renders as | Wiki markup to use instead |
|----------|-------------------------|----------------------------|
| `**bold**` | `*<b>bold</b>*` — bold text wrapped in literal asterisks | `*bold*` |
| `---` | `—` (em-dash character), no horizontal rule | `----` |
| `\| a \| b \|` + `\|---\|---\|` | table renders, divider becomes a visible row of dashes | `\|\|a\|\|b\|\|` header, no divider row |
| `![alt](url)` | literal `![alt](url)` text | `!file.png\|width=450!` |
| `` `code` `` | literal backticks | `{{code}}` |
| `[text](url)` | literal text | `[text\|url]` |

**Unknown `{macro}` is the dangerous one.** Any `{word}` the parser doesn't recognise (`{id}`,
`{status}`, `{PENDING}`, a raw JSON blob) is read as a macro that never closes — **every table,
rule and list below it degrades to raw text**, while images above and below still render. Escape it
as `\{id\}`, or put it inside `{code}…{code}`. Verify by comparing `<table>` count in
`renderedBody` against the `||` header-row count in the source — never by eyeballing the top of the
comment.

**Bold beside unspaced scripts.** Wiki `*bold*` opens only after whitespace/line-start and closes
only before whitespace/punctuation. Thai, Japanese and Chinese have no word spaces, so
`คำ*เน้น*ต่อ` renders with literal asterisks. Use `{*}เน้น{*}` when the emphasis sits mid-word.

A lone `*` that is genuinely content — a footnote marker, a required-field marker copied off a
form, a CSS selector like `[class*=Toast]` — is correct and must be left alone. Scan results are
reviewed, not auto-stripped.

## JXA and non-ASCII text

**Cause:** JXA `read()` treats files as Latin-1. Thai or other Unicode in the JS file breaks unless escaped.

**Correct pipeline:**

1. Build body with real Unicode in memory.
2. `JSON.stringify({ body })` **first**.
3. Escape non-ASCII to `\uXXXX` **after** stringify.
4. `writeFileSync(path, js, 'ascii')`.
5. Assert: `/[^\x00-\x7F]/.test(js)` must be false.

Chrome decodes `\uXXXX` before `fetch` → Jira receives correct Unicode.

See Step 7b in `WORKFLOW.md` and `publish-options.md` patterns in the TC prep skill for the same idea.
