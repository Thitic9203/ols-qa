# Tasks

| # | Task | Rules | Check that fails first | Done when |
|---|------|-------|------------------------|-----------|
| T1 | Add the duplicate check to step 4 | R1 R2 R3 R4 | `grep -n "searchJiraIssuesUsingJql" WORKFLOW.md` finds nothing in step 4 | step 4 names the search, the found branch and the search-fails stop; test suites pass |
