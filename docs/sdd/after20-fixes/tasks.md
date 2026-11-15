# after-20 fixes — tasks

- [x] T1 (R1) worked example 2 Fixture points as `**` sub-bullets. Fails first: `grep -n '^\* Existing queue item' worked-example.md` hits. Done: no hit; one blank line after the sub-bullets.
- [x] T2 (R2) footer hrefs `https://{JIRA_DOMAIN}/secure/attachment/__ATT{n}_ID__/{file}` on lines 68–69. Fails first: `grep -c '"href":"__ATT' jira-comment-adf-template.md` = 2. Done: 0; JSON block parses after placeholder substitution.
- [x] T3 (R3) testing-ticket (e) adds an expected hedged or unconfirmed after E3; "seven" unchanged. Fails first: line 88 has no "hedged". Done: it does; count words unchanged.
- [x] T4 (R4) evidence-per-row: a file binds only by case id in its name or stated content; otherwise a question, never a guess. Done: one sentence at the anchor; no new BLOCKED cause.
- [ ] T5 token measure before/after; suites; sdd-gate; 9 scorings; `regress_check.py` ×3; fresh Opus review; PR.
