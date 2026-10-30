# Retest guard scope word: tasks

1. (R3) Add known-answer tests to `retest_manifest.test.js` — red first.
2. (R1, R2) Add `unsupportedScopeWords` to `retest_manifest.js`. Done: new tests green.
3. Run `bash scripts/run-test-suites.sh`; fix any fixture that now fails by adding its real count. Done: all green.
4. PR → merge → helix sync if a shared file changed.
