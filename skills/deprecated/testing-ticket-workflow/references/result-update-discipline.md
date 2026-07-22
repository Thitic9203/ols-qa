# Result update discipline

Used in **Phase G** after test summary in chat.

## Write-scope guard — only ever touch this run's own work (3 layers, mandatory)

**The one rule: work someone else already did is off limits.** In a shared results sheet or a
shared evidence folder, you may write only the cells and files that belong to the run you are
doing right now. Everything else is read-only — no overwrite, no delete, no rename, no reorder,
no reformat, even when it looks stale, wrong, or half-empty. If you believe an existing entry
needs changing, **ask the user**; do not decide for the person who wrote it.

Every layer **fails closed**: if a check cannot be satisfied, do not write.

### What counts as yours

| Existing state of the row | Yours? |
|---|:---:|
| Status empty or `NOT STARTED`, **and** no result text, **and** no evidence links | ✅ untested — this run owns it |
| Result text starts with your own run marker (e.g. `Tested by <agent> …`) | ✅ your earlier run — re-runs and retests may update it |
| Anything else — a status, a note, or a link a person put there | ⛔ hands off |

### Layer 1 — pre-flight claim (before writing anything)

- Confirm the tab/page you resolved is the one you were given (name **and** id must agree — an
  id that silently points at a different tab is a classic way to corrupt an unrelated sheet).
- **Detect the target columns from the header row. Never hardcode column letters** — sheets
  routinely have more than one column layout, and a fixed offset writes into a neighbour column.
- **Anchor every row on its own identifier** (test case id, key). If the id in that row is not
  the case you are recording, do not write — you are off by a row.
- Snapshot the whole result block first (values *and* rich text), classify every target row per
  the table above, and drop the not-yours rows **before** they reach the writer.
- Rows must sit inside the existing grid — do not grow someone else's tab.

### Layer 2 — write-time recheck (as you write)

- Re-read each row immediately before writing and compare to the layer-1 snapshot. Changed
  underneath you (someone is editing right now) → skip that row.
- Write single cells in the claimed rows only — never a broad range, never another tab, and
  never a sort, filter, format, row insert/delete, or a column outside the agreed result columns.

### Layer 3 — post-write audit (after writing)

- Re-read the block and diff against the snapshot. Any cell that changed outside the claimed set
  is collateral damage: **restore it from the snapshot** and fail the run loudly. Never leave it
  silently changed, and never "fix it up" by writing something new over it.
- Append every decision — written, refused, overridden, restored — to an audit log.

### Shared file/evidence folders

1. **Scope lock** — resolve exactly one destination folder for this ticket, verify its name, type
   and parent, and never write outside it.
2. **No-clobber** — stamp the files you upload so you can recognise them later. On a name
   collision with a file you did not upload: refuse. Do not overwrite it, and **do not reuse its
   link as this run's evidence** — rename your file and upload that instead. Keep no delete,
   trash, or rename path at all.
3. **Folder audit** — list the folder before and after; every pre-existing file must still be
   present and unchanged (same checksum and modified time), and the only new items may be yours.

### Escape hatch

An explicit override (write a row a person owns) exists **for a human operator only**, requires a
written reason, and is logged. An agent must never use it, and must never work around a refusal
by writing through a raw API instead of the guarded path. A refusal is a correct outcome: record
"not written — owned by <someone else>" in the report and move on.

## Read before write

- Fetch the destination and note existing headers, status vocabulary, and date format.
- Do not invent column names — use what the user specified or what exists on the page.

## Common destinations

| Destination | Access | Rules |
|-------------|--------|--------|
| **Google Sheets** | Browser or API | Match header row; confirm tab name **and** id; detect result columns by header, never by fixed letter; batch updates; never touch a row or column this run does not own |
| **Jira comment** | MCP or browser | Draft in chat first; FE often v2 wiki; API often v3 ADF; wrap keys `{{PROJ-123}}` |
| **Confluence** | Browser or API | Preserve page structure; update only the table the user named |
| **Shared file folder** | API | Add only your own new files; never overwrite, rename, or delete someone else's |
| **CSV / file in repo** | Read/write file | Show diff summary before commit unless user waived |

## Verification

After writing:

1. Re-read the same URL or file.
2. Compare each scenario result from the chat table to the destination.
3. Confirm nothing outside the claimed cells/files changed (layer 3).
4. Report discrepancies — and every refused row — before claiming complete.

## Failure

If you cannot access the link → stop and list: URL tried, error, what the user must do (login, VPN, share sheet).
