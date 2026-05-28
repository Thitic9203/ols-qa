# Test execution plan (testing ticket)

Fill **before** running Playwright (Phase B/C in `testing-ticket-workflow`). User approves this plan; then run tests.

```markdown
## Test execution plan — {ISSUE-KEY}

**Environment:** {pd3 | dev | other URL}
**Branch / build:** {if known}
**Auth:** {storageState file | role | login steps}
**Preflight:** [ ] [playwright-preflight.md](playwright-preflight.md) checklist done — YES/NO

### In scope

| # | Scenario | Spec / path | Data setup |
|---|----------|-------------|------------|
| 1 | | | |
| 2 | | | |

### Out of scope

- {explicit exclusions}

### Evidence to collect

- [ ] Playwright HTML report path
- [ ] Screenshots on failure
- [ ] Trace on failure (retain path)
- [ ] API/network note if UI blocked

### Pass criteria

- All in-scope scenarios **PASSED** with fresh runner output (see [qa-evidence-gates.md](qa-evidence-gates.md))
- No blocker labels without user ack

### Risks

| Risk | Mitigation |
|------|------------|
| VPN / CF | preflight |
| Flaky selector | {wait strategy} |

**Approved by user:** [ ] YES — proceed to run
```

After run, attach results to Jira draft per workflow — do not post until user approves comment text.
