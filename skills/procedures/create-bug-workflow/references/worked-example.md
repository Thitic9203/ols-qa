# Worked example (anonymized) — Create bug

**Target:** GitHub `example-org/checkout-ui`  
**Outcome:** 1 issue created and verified

## Inputs

- **A1:** `https://github.com/example-org/checkout-ui`
- **A2:** Helix default format
- **A3:** Empty cart still shows “Pay now” enabled; expected: AC-2 “Pay now is disabled while the cart is empty” (link); steps: add item → remove all → observe button; severity High; screenshot `empty-cart.png`

## Repro — agent steps (abbreviated)

1. **Phase B:** `gh auth status` OK; `gh label list` → `bug` and `severity:High` both exist.
2. **Phase B2:** `gh issue list --state all --search '"Pay now" empty cart in:title,body,comments'` — 2 closed
   issues matched, neither concluded the button may stay enabled on an empty cart → no conflict, no duplicate.
3. **Phase E:** one disproof attempt — guest cart vs signed-in cart both reproduce → Confirmed.
4. **Draft:** title `[High] Checkout — Pay now stays enabled after the cart is emptied`; Severity High (as
   given); Priority Medium — matrix bug-priority-matrix.md:57 "functionality problem affecting **several** users"
   (Severity High row × Medium column, :42); steps copied from A3 only.
5. **Phase C:** Showed confirm block (Board check: 1 searched, 0 dropped) and full draft → user `confirm`.
6. **Phase D:** `gh issue create` → returned URL `https://github.com/example-org/checkout-ui/issues/88`.
7. **Phase F:** Opened issue in browser — title and body match draft.

## Close-out line (verdict)

```text
Verdict: CREATED 1/1 — verified at destination
Issue: https://github.com/example-org/checkout-ui/issues/88
```

## Lessons

- Phase E falsification: button state matched design doc for “guest cart” — dropped a second “Likely” item before create.
- NEVER call create APIs before Phase C confirm.
