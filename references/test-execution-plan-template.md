# Test execution plan (testing ticket)

Fill **before** running Playwright (Phase B/C in `testing-ticket-workflow`). User approves this plan; then run tests.

```markdown
## Test execution plan — {ISSUE-KEY}

**Environment:** {pd3 | dev | other URL}
**Branch / build:** {if known}
**Auth:** {storageState file | role | login steps}
**Preflight:** [ ] [playwright-preflight.md](playwright-preflight.md) checklist done — YES/NO

### AC/EC enumeration (coverage gate layer 1 — char-exact)

List every Acceptance Criteria / Expected-Condition line from the ticket, one id per testable assertion (split compound "A and B" into `AC2a` / `AC2b`):

| AC/EC id | Assertion (verbatim) |
|----------|----------------------|
| AC1 | |
| AC2 | |

### In scope (coverage gate layer 2 — every AC/EC id maps to ≥1 row)

| # | Scenario | AC/EC id(s) | Spec / path | Data setup |
|---|----------|-------------|-------------|------------|
| 1 | | | | |
| 2 | | | | |

**Coverage check:** every AC/EC id above appears in the `AC/EC id(s)` column of ≥1 scenario. An id with no scenario = a gap → add the scenario (or move it to Out of scope with a reason). Do not confirm the plan until every enumerated id is covered or explicitly excluded.

### Out of scope

- {explicit exclusions — an AC/EC id deferred here is listed by id + reason, never silently dropped}

### Evidence to collect

- [ ] Playwright HTML report path
- [ ] Screenshots on failure
- [ ] Trace on failure (retain path)
- [ ] API/network note if UI blocked

### Pass criteria

- All in-scope scenarios **PASSED** with fresh runner output (see [qa-evidence-gates.md](qa-evidence-gates.md))
- **Every enumerated AC/EC id is rowed-and-verdicted** — `enumerated in-scope ids == rows carrying a verdict + evidence` (AC/EC coverage gate layer 6); none parked only in a remark, none left `NOT TESTED`
- No blocker labels without user ack

### Risks

| Risk | Mitigation |
|------|------------|
| VPN / CF | preflight |
| Flaky selector | {wait strategy} |

**Approved by user:** [ ] YES — proceed to run
```

After run, attach results to Jira draft per workflow — do not post until user approves comment text.
