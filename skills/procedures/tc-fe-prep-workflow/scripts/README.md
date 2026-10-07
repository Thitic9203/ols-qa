# Scripts (TC FE prep)

Helix ships a shared CSV helper in the **Helix repository** (not in the user's project under test):

`scripts/export-markdown-table-to-csv.py`

**In skills:** export in-agent by default — see [csv-export-rules.md](../../../../references/csv-export-rules.md).

**Optional:** run the script only when the user provides `HELIX_INSTALL_ROOT` in the session. NEVER assume a default install path.
