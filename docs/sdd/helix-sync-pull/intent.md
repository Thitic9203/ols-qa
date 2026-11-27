# Intent — helix-sync-pull

Written in the originator's own words, before `spec.md`. Spec: docs/sdd/ai-native-sdlc-alignment R1.

## What is wanted

"ตั้งต้นจาก Helix ซิงก์ไปหา OLS-QA ส่วนขาซิงกลับ ถ้าอะไรที่ไม่เกี่ยวกับ helix ไม่ต้องซิงก์มา" (owner, 27 Nov 2026), and
on the same day: shared skills are edited in Helix only; ols-qa receives them.

## Why

The skill sync had grown two-way and hard to follow. Helix becomes the only source, and every leg runs one way.

## Constraints

Free only (public repos, `GITHUB_TOKEN`). OLS-only files (`references/ols-*.md`, smoke-test, content-takedown and the
others) must never be touched or sent anywhere. ols-qa's own secret guard and hooks stay ols-qa's.

## Reviewed by owner on 2026-11-27

2026-11-27: the owner gave these answers in the session and approved the plan (ADLC gate 3) in
SkillLane/team-pluton-skills `docs/sdd/skill-sync-simplify`.
