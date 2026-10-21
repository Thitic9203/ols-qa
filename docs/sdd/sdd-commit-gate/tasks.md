# Tasks — sdd-commit-gate (ols-qa)

| Task | What                                        | Rules  | Test that fails first                         | Done when                     |
| ---- | ------------------------------------------- | ------ | --------------------------------------------- | ----------------------------- |
| T1   | Self-test repo with 1 ok + 4 refusal shapes | R5     | `check.test.js` with no gate logic → mismatch | self-test prints all expected |
| T2   | Classifier + base-tree file check           | R1–R4  | T1 refusal cases                              | T1 green                      |
| T3   | Output + exit codes                         | R6, R7 | bad base ref returns 0                        | bad base → exit 2             |
| T4   | PR CI step in `tests.yml`                   | —      | PR with a spec-less `feat` commit stays green | step runs on the gate's PR    |
