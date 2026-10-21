# Spec — SDD commit gate

Status: approved direction (owner 2026-10-21: "ทำมาให้ครบ อย่าพลาดอีก") · offline · no env access

## Why

The SDD audit of 2026-10-21 found code commits on `main` with no `Spec:` line, citing a slug whose
`docs/sdd/<slug>/` folder is not in this repo, or whose spec merged in the same PR as the code.
The rule (owner, global rule 26) was only written down; nothing refused a commit that broke it.

## Rules

- **R1** — A commit is a **code commit** when its subject starts with `feat`, `fix`, `test` or `refactor`
  (optionally `(<scope>)` and `!`) followed by `:`. Merge commits and every other type (`docs`, `chore`,
  `ci`, `style`, `build`, `perf`, `revert`) are not checked.
- **R2** — เมื่อ code commit อยู่ในช่วงที่ตรวจ (`<base>..HEAD`, ไม่รวม merge) ระบบต้องปฏิเสธถ้า body ไม่มีบรรทัด
  `Spec: <slug-or-path> R<n>…` (`Spec:` ที่ต้นบรรทัด, ไม่สนตัวพิมพ์). Reason printed: `no-spec-line`.
- **R3** — The slug is the folder name after `docs/sdd/` in that line, or the first token when no path is
  given. ระบบต้องปฏิเสธถ้า `docs/sdd/<slug>/spec.md`, `plan.md`, `tasks.md` ไม่ครบทั้ง 3 ไฟล์ **ใน tree ของ
  `<base>`** (= ขึ้น main ก่อนโค้ด). A folder that exists only on the branch fails with
  `spec-not-on-main-first`; a folder missing everywhere fails with `spec-missing-files` naming the files.
- **R4** — A line `Spec: none` or a `R<n>` with no slug is treated as no spec line (R2).
- **R5** — ทุกครั้งที่รัน gate ต้องรัน known-answer self-test ก่อน (temp git repo: 1 commit ที่ต้องผ่าน และ
  1 commit ต่อเหตุปฏิเสธแต่ละแบบที่ต้องไม่ผ่าน และ docs commit ที่ต้องถูกข้าม). Self-test ไม่ตรง = exit 1.
- **R6** — Output names each refused commit as `<sha7> <reason> <subject>` and the counts
  `checked N · ok N · refused N`. An empty range prints `checked 0 (range empty)` and exits 0 only because
  the self-test in R5 measured the rule; exit 1 on any refusal; exit 2 when git cannot be read.
- **R7** — The gate never rewrites history, never pushes, never reaches a network host.

## Out of scope

- Judging whether the spec text is good (owner review).
- Commits already on `main` before the gate (audited separately, backfilled honestly).

## Done when

- Self-test passes; gate exits 0 on the gate's own PR (it cites this spec, which is on `main` first).
- The gate is in the repo's gate list and runs on every PR.
