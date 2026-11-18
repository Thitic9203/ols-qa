# Intent — smoke-unreleased-flag-gate

## What is wanted

Owner, 18 Nov 2026: when the smoke test runs on production or a training environment, it must also
check that work not yet released as of the test day — read from the Jira ticket's fix version — is
switched off by its flag and does not show on the web. Every piece that shows is listed as a bullet:
which ticket, which fix version, which environment.

## Why

Production and training are what real users see. Work from a future release showing there is a
release-gate problem the current smoke suite does not look for.

## Constraints

Read-only on the environment and on Jira. No bug is opened without the owner's order. Free tier
only, no new dependency. "Future release" = fix version `releaseDate` after the test date (owner
answer at the plan gate, 18 Nov 2026).
