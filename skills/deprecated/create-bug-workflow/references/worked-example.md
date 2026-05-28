# Worked example (anonymized) — Create bug

**Target:** GitHub `example-org/checkout-ui`  
**Outcome:** 1 issue created and verified

## Inputs

- **A1:** `https://github.com/example-org/checkout-ui`
- **A2:** Helix default format
- **A3:** Empty cart still shows “Pay now” enabled; steps: add item → remove all → observe button; severity High; screenshot `empty-cart.png`

## Repro — agent steps (abbreviated)

1. **Phase C:** Showed draft summary → user `confirm`.
2. **Phase D:** `gh issue create` → returned URL `https://github.com/example-org/checkout-ui/issues/88`.
3. **Phase F:** Opened issue in browser — title and body match draft.

## Close-out line (verdict)

```text
Verdict: CREATED 1/1 — verified at destination
Issue: https://github.com/example-org/checkout-ui/issues/88
```

## Lessons

- Phase E falsification: button state matched design doc for “guest cart” — dropped a second “Likely” item before create.
- NEVER call create APIs before Phase C confirm.
