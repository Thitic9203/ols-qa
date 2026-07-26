# /sync-tc-result

Route every TC result from the OLS QA source sheet into the three test-type deliverable
spreadsheets (System / Integration / Unit, the `- 03 OLS` variant), split by **Type**. Takes **no
arguments**. All-or-nothing per tab: a tab is written only if its 5-layer gate passes, otherwise it
is restored from a pre-write snapshot.

## What it does

1. Read every `OLS-*` case tab from the QA source sheet + `Summary.parent` (the epic backbone).
2. Route each case by **Type** → `unit` / `system` / `integration`; resolve module + roles
   (System/Integration fan out to the 5 role tabs) or the Unit function tab.
3. Map canonical status → the target's status vocabulary (see the guide's status table).
4. **System / Integration** — rebuild the data rows of each role tab from source (sorted, timestamped,
   hidden key col K = `ticket|TCID`), clear the old seed/template tail, **keep** the QA
   summary-formula block at the bottom, and repair System's broken `=COUNTIF(#REF!,…)` failed-count.
5. **Unit** — keyed upsert (hidden key col N) so the evidence CellImage in col I rides its row
   (via a bound Apps Script; needs a one-time Drive consent).

## Usage

```bash
python3 ~/ols-qa-testing-bot/tc_result_sync.py            # dry-run report (read-only, default)
python3 ~/ols-qa-testing-bot/tc_result_sync.py --preview  # per-tab apply plan (read-only)
python3 ~/ols-qa-testing-bot/tc_result_sync.py --apply     # write System + Integration
```

- Config and real ids are **off-repo** (`~/ols-qa-testing-bot/sync_tc_config.json`,
  `~/.ols-qa-secrets/ §5.1`). Never commit a real sheet id here — this repo is public.
- Deliverable-sheet layout, status map and write-model:
  [references/ols-project-guide.md](../references/ols-project-guide.md) § Test-type deliverable sheets.

## Safety

- `--apply` writes **customer production** sheets. Run `--preview` first and eyeball the per-tab
  clear/write counts + any `⚠` flags.
- Each tab passes a 5-layer fail-closed gate (snapshot → status/key re-derive → structure → write RAW
  → readback); any mismatch restores that tab from its snapshot. Snapshots live under
  `~/ols-qa-testing-bot/logs/tc_result_sync_snap/`.
- The hourly launchd job runs the same `--apply`. It is **off by default** — arm it deliberately
  (see the staged plist in `~/ols-qa-testing-bot/launchd/`).
