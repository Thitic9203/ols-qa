# Verify closing checklist (unified)

Use with [session-closing.md](session-closing.md). Check all that apply.

## All workflows

- [ ] English only in user-facing messages ([user-communication.md](user-communication.md))
- [ ] No success claim without tool output **and** destination re-read where applicable
- [ ] Approval gates were not skipped
- [ ] Artifact index posted
- [ ] One-line next-workflow suggestion offered (or “none” stated)
- [ ] `Verdict:` block posted

## TC FE / TC API prep

- [ ] Coverage review **Ready for draft: YES** was posted
- [ ] Coverage delta table posted ([coverage-delta-template.md](coverage-delta-template.md))
- [ ] File row count matches approved table (if files written)
- [ ] Jira/destination UI matches draft (not API response alone)

## Testing ticket

- [ ] Pre-flight **Ready to run: YES** was posted before run
- [ ] F1–F3 summary posted before Phase G
- [ ] Every scenario has result + evidence reference
- [ ] Phase G6 re-read completed if external update ran

## Retest bug

- [ ] Retest plan (dev claim vs verify) posted before tests
- [ ] Comment format v2/v3 not switched mid-session
- [ ] Screenshots attached before v2 wiki embed (FE)
- [ ] Transition names match workspace guide

## Create bug

- [ ] Draft shown before create
- [ ] Each created issue URL fetched and body matches draft
- [ ] `CREATED n/n` in verdict
