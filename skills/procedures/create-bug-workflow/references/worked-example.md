# Worked example (anonymized) — Create bug

**Target:** GitHub `example-org/checkout-ui`  
**Outcome:** 1 issue created and verified

## Inputs

- **A1:** `https://github.com/example-org/checkout-ui`
- **A2:** Helix default format
- **A3:** Empty cart still shows “Pay now” enabled; expected: AC-2 “Pay now is disabled while the cart is empty” (link); steps: add item → remove all → observe button; severity High; "happens every time"; screenshots
  `empty-cart-guest.png` and `empty-cart-signed-in.png`. A second item: the payment-step heading reads
  “Order summary”, reporter thinks it should say “Your order”.

## Repro — agent steps (abbreviated)

1. **Phase B:** `gh auth status` OK; `gh label list` → `bug` and `severity:High` both exist.
2. **Phase B2 (both items):** `gh issue list --state all --search '"Pay now" empty cart in:title,body,comments'` — 2 closed
   issues matched, neither concluded the button may stay enabled on an empty cart → no conflict, no duplicate. The heading search
   (`'"Order summary" in:title,body,comments'`) matched nothing.
3. **Phase E:** three checks from the evidence only — no reproduction by the agent. Intentional design? AC-2
   opened, text matches the expected side char-exact, the app differs. Role-only? The reporter's two screenshots
   show it on a guest cart and on a signed-in cart. Flake? The reporter wrote "every time" and sent both
   screenshots → Confirmed.
4. **Draft:** title `[High] Checkout — Pay now stays enabled after the cart is emptied`; Severity High (as
   given); Priority Medium — matrix bug-priority-matrix.md:57 "functionality problem affecting **several** users"
   (Severity High row × Medium column, :42); steps copied from A3 only.
5. **Phase C:** Showed confirm block (Board check: 2 searched — 0 dropped, 1 to file; the heading item was
   already Dropped in Phase E) and full draft → user `confirm`.
6. **Phase D:** `gh issue create` → returned URL `https://github.com/example-org/checkout-ui/issues/88`.
7. **Phase F:** Opened issue in browser — title and body match draft.

## Close-out line (verdict)

```text
Verdict: CREATED 1/1 — verified at destination
Issue: https://github.com/example-org/checkout-ui/issues/88
```

## Lessons

- Phase E falsification: the reporter's second item (the “Order summary” heading on the payment step) matched the
  design frame char-exact — labelled **Dropped** and reported in chat with the frame link, never drafted.
- NEVER call create APIs before Phase C confirm.
