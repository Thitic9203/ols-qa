# Defect Report Patterns

## Knowledge Sources
- [ISTQB CTFL v4.0 — Defect Management](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [5-Whys Root Cause Analysis — Sakichi Toyoda](https://en.wikipedia.org/wiki/Five_whys)

## Severity vs Priority

These are independent dimensions:

| | High Priority | Low Priority |
|--|--------------|-------------|
| **High Severity** | P0/P1 crash on main flow | P2 crash in rare edge case |
| **Low Severity** | P2 wrong text on homepage | P3 cosmetic in admin panel |

**Common mistake:** Equating severity with priority. A cosmetic defect on the homepage might be low severity but high priority (brand image).

## 5-Whys Example

```
Problem: Payment fails at checkout

Why 1: The API call returns 500
→ Why 2: The order total calculation throws an exception
→ Why 3: A null currency code is passed when user switches region
→ Why 4: Region switch clears the cart but not the currency state
→ Why 5: Root cause — currency state is not reset on cart clear event

Fix: Reset currency state in cart-clear event handler
Prevention: Add integration test for region switch → checkout flow
```

## Good vs Bad Reproduction Steps

```
❌ Bad:
"The form doesn't work when I submit it"

✅ Good:
1. Navigate to /checkout
2. Add item to cart (Product ID: ABC-123)
3. Proceed to payment
4. Enter card number: 4111111111111111
5. Click "Pay Now"
Observed: Error toast "Payment failed" — network tab shows POST /api/payment → 500
Expected: Success redirect to /order-confirmation
```

## Defect Lifecycle

```
Open → In Progress → Fixed → In Verification → Closed
          ↓                         ↓
       Deferred              Reopened (if fix incomplete)
```

## Defect Density Benchmarks

| Defects/KLOC | Quality Level |
|-------------|---------------|
| < 1 | Excellent |
| 1–5 | Good |
| 5–10 | Average |
| > 10 | Needs improvement |

## Defect Removal Efficiency (DRE)

```
DRE = Defects found in testing / (found in testing + found in production) × 100%

Target: ≥ 85% (industry standard)
World class: ≥ 95%
```
