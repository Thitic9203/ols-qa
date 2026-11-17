# Spec — tc-fe-expected-plain

Source: Thitic9203/helix#61 (merged a333148); owner report 17 Nov 2026 (Pyrite TC sheet PYR-787); pairs with Thitic9203/pluton-ai-agent#383.

## Rules

- **R1** When the tc-fe-prep skill writes an Expected Result cell, it must write one observable result per numbered item, using the ticket's own labels, messages and values, and must not copy Gherkin connectors (`Given`, `When`, `Then`, `And`, `But`) into the cell. It must cover the whole result of the mapped AC/EC and must not add a line from an unrelated business rule. The verbatim ticket wording stays in the Acceptance Criteria column.
- **R2** `skills/procedures/tc-fe-prep-workflow/design-and-review.md` must be byte-identical to the same file on helix main.

## Done when

- R1: the paragraph "Expected Result must read as plain assertions." is present in design-and-review.md.
- R2: `diff` of the ols-qa file against helix main prints nothing.
