# Retest guard scope word: plan

## Files
- `tools/retest-guard/retest_manifest.js` — in the results loop, add `unsupportedScopeWords(actual)` → error per offending point.
- `tools/retest-guard/retest_manifest.test.js` — known-answer tests (R3).

## Options weighed
- Body scan (`scanBody`) as well: hand-written bodies are rare; manifest path is the default render path. Kept to the manifest.
- Require a link to a measurement file: not checkable mechanically. A stated `N/N` is checkable and visible to the reader.

## What could break
- Existing fixtures/worked examples whose `actual` uses "all"/"any" without a count — the full suite run shows them; fix the fixture text, not the rule.
