# Deny the OLS worker the credential folder: tasks

| # | Task | Rules | Failing test first | Done when |
|---|---|---|---|---|
| 1 | the test | R3 | itself, red on main | fails listing the missing entries |
| 2 | add the deny entries | R1, R2 | task 1 | green; diff touches only `permissions.deny` |
