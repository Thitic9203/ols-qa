# QA capture tooling — the contracts the gates depend on

The recorder, the verifiers and the reconcilers live **outside this repo**, with the rest of the QA
bot tooling, because they carry environment-specific configuration. The gates in
[qa-evidence-gates.md](qa-evidence-gates.md) treat their exit codes as results, so their contracts
belong somewhere a change can be noticed — a tool referenced only from the middle of a prose table is
a tool whose interface can drift without anyone finding out until evidence fails.

> **Status of this page:** the contracts below are transcribed from the gates that already require
> them. They have **not** been re-run while writing this page, so treat a mismatch between this table
> and a tool's own `--help` as this page being stale — and fix it here.

## Contracts

| Tool | Invocation | Exit 0 means | Notes |
|---|---|---|---|
| **recorder** | `node capture/qa_recorder.js …` | the clip was captured at the declared rate and the verifier passed on it | measures viewport and `devicePixelRatio` from the page rather than trusting the caller; refuses anything under the floor; **fails closed** under the fps floor; writes the run manifest that provenance is checked against. `node capture/qa_recorder.test.js` is its self-test |
| **clip verifier** | `python3 capture/verify_video.py <clip>.mp4` | quality, steadiness, provenance and file integrity pass | `--no-manifest` downgrades the provenance failure to a warning — a **deliverable** checked that way has not passed provenance. Refuses a clip under 5 s, and one with too little motion to judge stutter, rather than certifying what it cannot measure |
| **still verifier** | `python3 capture/verify_shot.py <file.png>…` | size, blankness and format pass | it says plainly that the rest — is this the right screen, is the value readable — is yours |
| **plan builder** | `capture/evidence_plan.py <KEY>` | the required file list was derived from the ticket | reads the bug's own content fields (an OLS bug keeps them in custom fields and leaves `description` empty, so a reader that looks only there enumerates nothing); a ticket whose text matches no role term is reported `unresolved` rather than guessed |
| **reconciler** | `capture/evidence_reconcile.py <KEY>_evidence_plan.json --dir out/ [--jira]` | every planned file exists, opens, measures and matches its case | opens and measures each file rather than counting names; `--jira` fetches each attachment from the ticket so "the link resolves" stops being a claim; exits non-zero when anything is missing |
| **role preflight** | `node capture/preflight_roles.js --plan <KEY>_evidence_plan.json --env <env>` | every role the plan needs can actually log in | `--env` is **required and has no default** — choosing the environment is the user's call. Does not trust the account sheet's label: the auth response carries the real roles, and a mismatch is reported rather than quietly recorded as that role's evidence |

## Rules that apply to all of them

| Rule | Because |
|---|---|
| An exit code is the result — do not re-interpret it in prose | "the clip looked fine" is what these tools exist to replace |
| A tool that **cannot run** is a stop, never a silent pass | the same reason a scan that cannot run exits 2 rather than 0 |
| A file the reconciler cannot find is a **BLOCKED row with its reason** | a dropped row reads downstream as a clean pass |
| Never raise a floor to make a run go green | lower the target to a rate the machine can hold, or fix the machine |
| When a contract here disagrees with the tool, the tool wins — then fix this page in the same session | a stale contract is worse than none, because it is trusted |

## Related

- [qa-evidence-gates.md](qa-evidence-gates.md) — the gates that consume these exit codes
- `tools/retest-guard/` — the in-repo gate for the comment body and the run manifest, which is
  unit-tested here and calls the reconciler's result rather than repeating its job
