# Spec — notify-send hook (`tools/notify-send-guard/check.js --hook`)

Status: layer 7 of the owner-approved 10-layer notify guard (relayed 2026-11-18) · offline tests · no env access

Source for every rule: the task brief relayed by the main thread on 2026-11-18 (quoted in `intent.md`),
the helper's documented flags in `references/ols-project-guide.md` § "Retest-bug QA notify"
(`--ticket`, `--jira-key`, `--body`, `--registry`, `--dry-run`), and the hook conventions of
`tools/process-kill-guard/kill_rules.js` (`--hook`, PreToolUse JSON on stdin, exit 0/2, stderr reason).

## Scope

Only Bash commands that **invoke** `discord_qa_notify.py` — as the script argument of `python`/`python3`,
as the command word itself (`./discord_qa_notify.py`), or inside `bash|sh|zsh -c "<…>"`. The file name as
data (`grep … discord_qa_notify.py`, `cat`, commit messages, heredoc bodies) is out of scope. Wrapper words
(`rtk`, `env`, `command`, `nohup`, `time`, `timeout N`, `VAR=value`) do not hide the invocation.

## Rules

- **R1** — เมื่อ invocation มี `--dry-run` ระบบต้องปล่อยผ่าน (exit 0) เสมอ และต้องบันทึก state
  `{session_id, ticket}` ลงไฟล์ใต้ `.claude/.notify-send-guard-state/` (ค่า override: env `NOTIFY_SEND_GUARD_STATE_DIR`).
- **R2** — ticket ของ invocation = ค่าของ `--ticket`; ถ้าไม่มีใช้ `--jira-key`; ถ้าไม่มีทั้งคู่ = `(none)`.
  รองรับทั้งรูป `--flag value` และ `--flag=value`.
- **R3** — เมื่อเป็นการส่งจริง (ไม่มี `--dry-run`) และไม่มี `--registry` ระบบต้องบล็อก (exit 2) ด้วยเหตุผลชื่อกฎ `R3`.
- **R4** — เมื่อเป็นการส่งจริงและข้อความของ `--body` (หลังแปลง `$'…'` escape เช่น `\n`) มีบรรทัด bullet
  (ขึ้นต้นด้วย `•`, `-`, `*` หรือ `·`) ที่มี `PASSED|FAILED|BLOCKED|PWMI` ตามด้วยตัวเลขรูป `n/n`
  (ไม่สนตัวพิมพ์ เว้นวรรค/`:` คั่นได้) ระบบต้องบล็อกด้วยเหตุผลชื่อกฎ `R4`.
- **R5** — เมื่อเป็นการส่งจริงและ `--body` มีบรรทัดที่ (หลังตัด bullet และ `*`/`_` ของ markdown) ขึ้นต้นด้วย
  `สถานะ:` หรือ `Status:` (ไม่สนตัวพิมพ์) ระบบต้องบล็อกด้วยเหตุผลชื่อกฎ `R5`.
- **R6** — เมื่อเป็นการส่งจริงและไม่มี state ของ `{session_id เดียวกัน, ticket เดียวกัน}` จาก R1 ระบบต้องบล็อก
  ด้วยเหตุผลชื่อกฎ `R6`. dry-run ของ ticket อื่นหรือ session อื่นต้องไม่นับ.
- **R7** — เมื่อบล็อก ระบบต้องพิมพ์เหตุผลสั้นภาษาไทย+อังกฤษลง stderr ระบุทุกกฎที่ผิด (`R3`/`R4`/`R5`/`R6`) และ exit 2.
  เมื่อผ่าน exit 0 โดยไม่พิมพ์อะไร. การส่งจริงที่ผ่านต้องไม่ลบ state (ส่งซ้ำ ticket เดิมใน session เดิมได้).
- **R8** — เมื่ออ่าน JSON ของ hook ไม่ได้: ถ้าข้อความดิบมีคำว่า `discord_qa_notify` ระบบต้องบล็อก (ตัดสินไม่ได้ว่า
  เป็นการส่งที่ถูก = ไม่) มิฉะนั้นปล่อยผ่านพร้อมคำเตือนบน stderr — เหมือน process-kill-guard สำหรับคำสั่งอื่น
  เพราะการบล็อก Bash ทุกคำสั่งเพราะ parse พัง แพงกว่าสิ่งที่กัน.
- **R9** — เมื่อเขียน state ไม่สำเร็จ (R1) ระบบต้องยังปล่อย dry-run ผ่าน และเตือนบน stderr ว่าการส่งจริงจะถูกบล็อก.
  เมื่อ `session_id` ไม่มีใน input ใช้ `(no-session)` เป็นคีย์.
- **R10** — hook ต้องลงทะเบียนใน `.claude/settings.json` ใต้ PreToolUse matcher `Bash` แบบเดียวกับ
  process-kill-guard (`node "$CLAUDE_PROJECT_DIR/tools/notify-send-guard/check.js" --hook`) และโฟลเดอร์ state
  ต้องอยู่ใน `.gitignore`.
- **R11** — `tools/notify-send-guard/notify_send_guard.test.js` ต้องมี known answer อย่างน้อย must-block 1 และ
  must-pass 1 ต่อกฎ R3–R6, dry-run ผ่าน+บันทึก state (R1), รูปแบบ invocation ใน Scope, คำสั่งที่มีชื่อไฟล์เป็นข้อมูล,
  input ที่ parse ไม่ได้ทั้งสองแบบ (R8) และอย่างน้อย 1 เคสรันผ่าน `--hook` จริงบนดิสก์ (stdin → exit code/stderr).

## Edge cases

- `--body` ที่ไม่มี verdict แบบ `n/n` เช่น `• PASSED on dev` = ผ่าน R4.
- คำสั่งหลาย segment (`cd bot && export X=… && python3 discord_qa_notify.py …`) ต้องตรวจ segment ที่เรียก helper.
- เรียก helper สองครั้งในคำสั่งเดียว: dry-run ก่อนแล้วส่งจริง → dry-run segment บันทึก state ก่อนตรวจ segment ถัดไป.

## Done when

- `node tools/notify-send-guard/notify_send_guard.test.js` จบด้วย 0 และนับเคสทุกกฎ R1–R9, R11.
- `bash scripts/run-test-suites.sh` เขียวจาก root ของ worktree และรายชื่อมีไฟล์เทสต์นี้.
- `.claude/settings.json` มี entry ตาม R10 และ JSON ยัง parse ได้.
- `node tools/sdd-gate/check.js --base origin/main` exit 0.
