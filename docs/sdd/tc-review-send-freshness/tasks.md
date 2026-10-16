# Tasks — TC review: fresh sources and the right mention before an external send

**Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

| # | Task | Serves | Failing test first | Done when |
|---|------|--------|--------------------|-----------|
| T1 | Write `check.test.js`: updated later → BLOCK; comment later → BLOCK; both earlier/equal → PASS with times printed; missing/bad time → REFUSE; `+0700` and `+07:00` compare as instants | R6 | yes — tool does not exist, suite fails | every case fails on an empty tool |
| T2 | Implement `tools/review-send-gate/check.js` | R6 | T1 | T1 green; output names both times |
| T3 | README for the tool + register the suite in `scripts/run-test-suites.sh` if needed | R6 | the suite runner lists the new suite | runner output shows the suite and its count |
| T4 | Edit `skills/tc-review-workflow/SKILL.md`: Step 1 `loadedAt`, Step 5 pre-send gate calling the tool, mention = QA Owner from the TC document + config, QA closing lines, MUST/NEVER rows; generic wording only | R1–R5 R7 R8 | `bash scripts/check-no-secrets.sh` + portability check on the file | both checks pass; diff reviewed against each rule |
| T5 | `bash scripts/run-test-suites.sh` | all | — | green |
| T6 | After merge: `bash scripts/sync-skills-to-helix.sh skills/tc-review-workflow/SKILL.md` from latest main, then `bash scripts/helix-parity.sh` | R8 | — | parity passes |
