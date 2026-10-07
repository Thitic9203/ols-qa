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

### markdown → wiki (the silent-corruption rule)

**Canonical:** [references/jira-wiki-vs-markdown.md](../../../../references/jira-wiki-vs-markdown.md)
— syntax map, the unknown-`{macro}` trap, the unspaced-script bold rule, and both gates.

Retest-specific: FE retests always take the v2 path (Step 7c), so **every retest comment body is
wiki markup**. The one that bites hardest here is `**Retest Result: PASSED**` → renders as
`*Retest Result: PASSED*`. Drafting from a markdown example is how it gets in (PM-004).

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
