# Security Policy

## Scope

This repo is **public** and contains **Markdown only** — QA workflow skills, references, and
commands. It must contain no credentials, no internal hostnames, no tenant or resource
identifiers, and no personal data.

Every OLS-specific value is written as a **placeholder** (`<JIRA_DOMAIN>`, `<DEV_HOST>`,
`<TEST_ACCOUNT_1>`, `<QA_TRACKING_SHEET_ID>`, `QA Owner A`, ...). The real values live in a local,
untracked file outside the repo and are never committed.

## Enforcement

`scripts/check-no-secrets.sh` runs from `scripts/hooks/pre-commit` against every staged text
blob and fails closed. It detects leaks two ways:

- **Shape regexes** — any Thai-government host, any Atlassian tenant, Google Sheet/Drive and
  Figma resource URLs, Discord webhooks and snowflake ids, Bearer/JWT/Slack/GitHub/AWS tokens,
  private keys, and local machine paths.
- **Hash set** — exact known identifiers, stored only as truncated SHA-256 of the lowercased
  token, so the cleartext is never present in this repo yet an exact appearance is still caught.

Run `bash scripts/setup-hooks.sh` once per clone to activate the hooks.

## Known incident

On **2026-07-24** an audit found that test-account credentials, internal hostnames, the Atlassian
tenant, Google/Figma resource ids and staff names had been committed while the repo was public
(public since 2026-06-11). All history was rewritten with `git-filter-repo` and the affected
credentials were rotated. The pre-commit guard previously exempted non-shared paths on the
assumption that this repo was a private vault; that exemption was the root cause and is gone.

## Reporting a Vulnerability

Open a [private security advisory](https://github.com/Thitic9203/ols-qa/security/advisories/new)
on this repository. Please do not open a public issue for anything credential-related.
