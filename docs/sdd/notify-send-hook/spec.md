# Spec — notify-send hook (`tools/notify-send-guard/check.js --hook` / `--record`)

Status: layer 7 of the owner-approved 10-layer notify guard (relayed 2026-11-18) · offline tests · no env access

Source for every rule: the task brief relayed by the main thread on 2026-11-18 (quoted in `intent.md`),
the helper's documented flags in `references/ols-project-guide.md` § "Retest-bug QA notify"
(`--ticket`, `--jira-key`, `--body`, `--registry`, `--dry-run`), the helper's own code in the bot repo
(`discord_qa_notify.py`: `argparse.ArgumentParser()` with default prefix matching and its full flag list in
`main()`; dry-run stamp = sha256 of the content, `DRYRUN_MAX_AGE = 1800` s, deleted after a successful post),
the hook conventions of `tools/process-kill-guard/kill_rules.js` (`--hook`, JSON on stdin, exit 0/2, stderr
reason, `WRAPPERS`), and the PR #294 review (2026-11-20).

## Scope

In scope: Bash commands that **invoke** `discord_qa_notify.py`:

- as the script argument of `python`/`python3`/`python3.N`, including interpreter options before it
  (`-u`, `-B`, `-O`, `-E`, `-I`, `-s`, `-S`, `-X <opt>`, `-W <arg>`), and `python3 -m discord_qa_notify`;
- as the command word itself (`./discord_qa_notify.py`, `/path/discord_qa_notify.py`);
- behind wrapper words with their options: `rtk`, `env` (incl. `/usr/bin/env python3`), `command`, `builtin`,
  `nohup`, `time`, `timeout N`, `sudo [-u x]`, `exec`, `nice [-n N]`, `caffeinate [-i…]`, `VAR=value`
  (same set as `kill_rules.js` `WRAPPERS`);
- inside `bash|sh|zsh -c "<…>"` and `eval "<…>"` (the string is parsed again by the same rules);
- in every segment of `&&`, `||`, `;`, `|` chains and `$( … )` / backtick substitutions.

Cannot-prove forms (blocked by R8 whenever the raw text names `discord_qa_notify`): `xargs … discord_qa_notify.py`
(arguments come from stdin), `eval`/`bash -c` whose string is not a literal, a shell reading a script from stdin
(`bash <<EOF`, `bash -s`, `sh <<EOF`), `source`/`.` of the helper, `python3 -c "<code naming the helper>"`.

Out of scope: the file name as data (`grep … discord_qa_notify.py`, `cat`, commit messages, a heredoc fed to a
non-shell command); running a script that calls the helper itself (`bash _retest_closeout.sh`,
`./_retest_closeout.sh` — it invokes the helper inside the script) — that path is covered by the helper's own
stamp check (exit 5 without a fresh matching dry-run).

## Rules

- **R1** — เมื่อ PostToolUse ของ Bash (`--record`) แจ้งว่าคำสั่งรันสำเร็จ (ไม่มี `is_error`/`interrupted` เป็นจริง และ
  exit code เป็น 0 เมื่อ payload มีค่านี้) และคำสั่งนั้นมี segment ที่เรียก helper พร้อม `--dry-run` ซึ่งเป็น segment
  สุดท้ายหรือทุก segment หลังจากนั้นต่อด้วย `&&` เท่านั้น ระบบต้องบันทึก state
  `{session_id, ticket, sha256(ticket + "\0" + body), เวลาบันทึก}` ใต้ `.claude/.notify-send-guard-state/`
  (override: env `NOTIFY_SEND_GUARD_STATE_DIR`); body ที่ไม่ส่ง = ค่า `(default)`. dry-run ใหม่ของ ticket เดิมเขียนทับ.
  ระบบต้องไม่บันทึก state ใน PreToolUse และต้องไม่บันทึกเมื่อคำสั่งล้มเหลว ถูกขัดจังหวะ หรือ dry-run ต่อด้วย `||`/`;`/`|`.
  PreToolUse ของ dry-run ต้องปล่อยผ่าน (exit 0) เว้นแต่ R8/R13 บล็อก.
- **R2** — ticket ของ invocation = ค่าของ `--ticket`; ถ้าไม่มีใช้ `--jira-key`; ถ้าไม่มีทั้งคู่ = `(none)`.
  รองรับทั้ง `--flag value` และ `--flag=value`, และใช้ชื่อ flag หลัง R12 normalize แล้ว.
- **R3** — เมื่อเป็นการส่งจริง (ไม่มี `--dry-run` หลัง normalize) และไม่มี `--registry` ระบบต้องบล็อก (exit 2) ด้วยเหตุผล `R3`.
- **R4** — เมื่อเป็นการส่งจริงและข้อความของ `--body` (หลังแปลง `$'…'` escape เช่น `\n`) มีบรรทัด bullet
  (ขึ้นต้นด้วย `•`, `-`, `–`, `*`, `·`, `‣` หรือเลขลำดับ `1.`/`1)`) ที่มีคำ verdict
  `PASSED|PASS|FAILED|FAIL|BLOCKED|PWMI|ผ่าน|ไม่ผ่าน` ตามด้วยตัวเลขรูป `n/n` (ไม่สนตัวพิมพ์ เว้นวรรค/`:` คั่นได้)
  ระบบต้องบล็อกด้วยเหตุผล `R4`.
- **R5** — เมื่อเป็นการส่งจริงและ `--body` มีบรรทัดที่ (หลังตัด bullet ตาม R4 และ `*`/`_` ของ markdown) ขึ้นต้นด้วย
  `สถานะ:` หรือ `Status:` (ไม่สนตัวพิมพ์ เว้นวรรคก่อน `:` ได้) ระบบต้องบล็อกด้วยเหตุผล `R5`.
- **R6** — เมื่อเป็นการส่งจริงและไม่มี state ของ `{session_id เดียวกัน, ticket เดียวกัน}` จาก R1 ที่อายุ 0–1800 วินาที
  และ sha256 ตรงกับ ticket+body ของการส่งนี้ ระบบต้องบล็อกด้วยเหตุผล `R6` พร้อมบอกสาเหตุ (ไม่มี / หมดอายุ / body ต่างจาก
  dry-run). dry-run ของ ticket อื่น session อื่น หรือในคำสั่ง Bash เดียวกับการส่งจริงต้องไม่นับ.
- **R7** — เมื่อบล็อก ระบบต้องพิมพ์เหตุผลสั้นภาษาไทย+อังกฤษลง stderr ระบุทุกกฎที่ผิด และ exit 2; เมื่อผ่าน exit 0
  โดยไม่พิมพ์อะไร. state ใช้ได้ครั้งเดียว: เมื่อ PostToolUse แจ้งว่าการส่งจริงสำเร็จ ระบบต้องลบ state ของ ticket นั้น
  (ตรงกับที่ helper ลบ stamp หลังโพสต์) — ส่งซ้ำต้อง dry-run ใหม่.
- **R8** — ระบบต้องบล็อก (fail closed) เมื่อข้อความดิบมีคำว่า `discord_qa_notify` และ: อ่าน JSON ของ hook ไม่ได้,
  แยก token ของคำสั่ง shell ไม่ได้ (quote ไม่ปิด, heredoc ไม่จบ, `$(`/backtick ไม่ปิด) หรือเป็นรูป cannot-prove ใน Scope.
  ถ้าไม่มีคำนั้น ระบบต้องปล่อยผ่านพร้อมคำเตือนบน stderr — เหมือน process-kill-guard สำหรับคำสั่งอื่น.
- **R9** — เมื่อเขียนหรือลบ state ไม่สำเร็จ (R1/R7) ระบบต้อง exit 0 และเตือนบน stderr ว่าการส่งจริงครั้งถัดไปจะถูกบล็อก.
  เมื่อ `session_id` ไม่มีใน input ใช้ `(no-session)`; session id ถูก sanitise เป็น `[A-Za-z0-9._-]`.
- **R10** — hook ต้องลงทะเบียนใน `.claude/settings.json` สองจุด: PreToolUse matcher `Bash`
  (`node "$CLAUDE_PROJECT_DIR/tools/notify-send-guard/check.js" --hook`) และ PostToolUse matcher `Bash` (`… --record`),
  และโฟลเดอร์ state ต้องอยู่ใน `.gitignore`. PreToolUse เป็น read-only จึงไม่ขึ้นกับลำดับเทียบ
  `discord-notify-guard.sh --gate`: ถ้า hook ใดบล็อก คำสั่งไม่รัน PostToolUse ไม่เกิด และไม่มี state.
- **R11** — `tools/notify-send-guard/notify_send_guard.test.js` ต้องมี known answer must-block ≥1 และ must-pass ≥1
  ต่อกฎ R1–R9, R12, R13, ทุกรูป invocation ใน Scope, คำสั่งที่มีชื่อไฟล์เป็นข้อมูล, และอย่างน้อย 1 เคสต่อโหมด
  (`--hook`, `--record`) ที่รันจริงบนดิสก์ (stdin → exit code/stderr/ไฟล์ state); ท้ายเทสต์ต้องพิมพ์จำนวนเคสต่อกฎ
  และ exit ≠ 0 ถ้ากฎใดมี 0 เคส.
- **R12** — ระบบต้อง normalize flag ที่เป็น prefix ของ flag ของ helper ตัวเดียว (`--tic`, `--bod`, `--reg`, `--dry`,
  `--bod=x`) เป็นชื่อเต็มแบบ argparse. เมื่อ prefix ตรงหลาย flag (เช่น `--r`) ในการส่งจริง ระบบต้องบล็อกด้วยเหตุผล `R12`.
  รายชื่อ flag ต้องตรงกับ `main()` ของ helper ทุกตัว; flag ที่ไม่ตรงตัวใดไม่มีผลต่อการตัดสิน (argparse จบก่อนส่ง).
- **R13** — เมื่อเป็นการส่งจริงและค่าของ `--body`, `--ticket` หรือ `--jira-key` มี expansion ที่รู้ค่าได้ตอนรันเท่านั้น
  (`$VAR`, `${…}`, `$(…)`, backtick, `<(…)` นอก single quote) ระบบต้องบล็อกด้วยเหตุผล `R13` ("cannot prove").

## Edge cases

- `--body` ที่ไม่มี verdict แบบ `n/n` เช่น `• PASSED on dev` หรือ `• AC1-AC5 ผ่านทั้งหมดบน dev` = ผ่าน R4.
- คำสั่งหลาย segment (`cd bot && export X=… && python3 discord_qa_notify.py …`) ต้องตรวจ segment ที่เรียก helper.
- dry-run แล้วส่งจริงในคำสั่ง Bash เดียวกัน = บล็อก R6 (state เกิดหลังคำสั่งจบเท่านั้น) — dry-run ต้องเป็นคำสั่งแยก.
- `--body '$HOME'` (single quote) = ข้อความตรงตัว ไม่ใช่ expansion → ไม่บล็อก R13.
- dry-run แล้วแก้ body หนึ่งตัวอักษร → R6 บล็อก "body ต่างจาก dry-run".

## Done when

- `node tools/notify-send-guard/notify_send_guard.test.js` จบด้วย 0 และพิมพ์จำนวนเคสต่อกฎ R1–R9, R12, R13 (ไม่มีกฎใดเป็น 0).
- `bash scripts/run-test-suites.sh` เขียวจาก root ของ worktree และรายชื่อมีไฟล์เทสต์นี้.
- `.claude/settings.json` มี entry PreToolUse และ PostToolUse ตาม R10 และ JSON ยัง parse ได้.
- `node tools/sdd-gate/check.js --base origin/main` exit 0.
