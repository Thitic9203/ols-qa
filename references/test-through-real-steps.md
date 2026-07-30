# Test through the real steps (no API shortcut for the action under test)

Governs **execution** in retest-bug-workflow (Step 4) and testing-ticket-workflow (Phase E).
It does not apply to the TC-writing workflows (tc-fe-prep / tc-api-prep) — those design steps, they don't run them.

## The rule

When you **execute** a retest or a test case, exercise the **behaviour under verification through its
own real surface, following the case's Test Steps completely** — a UI / story case is driven through
the UI exactly as a user would (click the button, fill the field, submit the form); an API case is
driven through the API. **Never substitute a lower-layer call to make the tested action happen** —
e.g. `POST`ing the submit endpoint instead of clicking **Submit** on the form under test, or jumping
to the end state via API to "confirm the result". A shortcut like that verifies the wrong layer: it
skips FE validation, button wiring, and UI state, so it can report **PASSED** while the real screen is
broken — the exact class of defect QA exists to catch.

## The one exception — test-data / precondition setup

Preparing the data a case needs (seed a record, create a fixture, set a status / role, reach the
starting state) **may** use the API. That is setup, not the thing under test. Create it via API with
clear test naming, then run the actual case through its real steps. This is the same allowance already
written into retest **Step 4c** and the testing-ticket **"create test data"** rule — this file makes
its boundary explicit: **API for the precondition, real steps for the action.**

## Layer match — testing an API case at the API is NOT a workaround

If the case or bug *is* an API-layer behaviour (an endpoint's response, a status code, a contract vs
Swagger), then the API call **is** the real step — drive it directly and keep the full cURL / response
as evidence. Reading server-side truth via a direct API call **during root-cause investigation** is
likewise fine — that is investigation evidence, not the verdict path. The rule forbids swapping layers
to shortcut a **UI** action; it never forbids testing an API case at its own layer.

## Decision table

| You are about to… | Allowed? |
|---|---|
| Click through the UI form / flow the case describes | ✅ required — this is the real step |
| Call the submit / save / publish **API** to perform a **UI** case's action | ❌ shortcut — drive the UI instead |
| Skip Test Steps and jump to the end state via API to "confirm the result" | ❌ run every step as written |
| Seed a record / set status / create a fixture via API to reach the precondition | ✅ exception — data prep only |
| Drive an **API** case / bug directly via `fetch` / cURL | ✅ the API is that case's real surface |
| Read server-side truth via a direct API call **during root-cause** (not as the verdict path) | ✅ investigation evidence, not the tested action |

## Why

- A UI case "passed" via API proves the endpoint works, not the screen the user sees — validation,
  disabled states, wiring and rendering are all skipped.
- "Follow the steps completely" is also about completeness: a half-run case with an API jump to the end
  is not the case that was written.
- The evidence (whole-flow MP4 / screenshots) must show the real steps happening; an API-driven action
  produces no such flow to capture, so it cannot satisfy [qa-evidence-gates.md](qa-evidence-gates.md).
