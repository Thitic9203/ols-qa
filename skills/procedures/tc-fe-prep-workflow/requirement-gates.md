# TC FE prep — requirement gates (Steps 2a, 2.5, 2.6)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read after Step 2, before designing any TC.

## Contents

- [Step 2a — AC/EC internal consistency check \[medium freedom\]](#step-2a--acec-internal-consistency-check-medium-freedom)
  - [2a.1 — Analyse all AC and EC items](#2a1--analyse-all-ac-and-ec-items)
  - [2a.2 — Build report (do not post tables in chat)](#2a2--build-report-do-not-post-tables-in-chat)
  - [2a.3 — User decision gate (when issues found)](#2a3--user-decision-gate-when-issues-found)
- [Step 2.5 — Conflict check against PRD and Figma (pre-design gate) \[medium freedom\]](#step-25--conflict-check-against-prd-and-figma-pre-design-gate-medium-freedom)
  - [2.5a — Locate PRD and Figma links](#25a--locate-prd-and-figma-links)
  - [2.5b — Collect source metadata (recency)](#25b--collect-source-metadata-recency)
  - [2.5c — Cross-reference and conflict detection](#25c--cross-reference-and-conflict-detection)
  - [2.5d — Generate HTML report and open in Chrome](#25d--generate-html-report-and-open-in-chrome)
- [Step 2.6 — TC glossary re-check (mandatory gate) \[medium freedom\]](#step-26--tc-glossary-re-check-mandatory-gate-medium-freedom)
  - [2.6.1 — Re-fetch the glossary](#261--re-fetch-the-glossary)
  - [2.6.2 — Report to the user (evidence)](#262--report-to-the-user-evidence)
  - [2.6.3 — Gap and ambiguity scan](#263--gap-and-ambiguity-scan)

---

## Step 2a — AC/EC internal consistency check [medium freedom]

**Must complete after Step 2 and before Step 2.5.** Catches duplicates, redundancies, and contradictions within the ticket's own AC/EC list — problems that waste TC effort or produce conflicting test cases.

### 2a.1 — Analyse all AC and EC items

Compare every AC/EC pair against every other AC/EC on the same ticket. Flag items that fall into any of these categories:

| Category | Definition | Example |
|----------|-----------|---------|
| **Duplicate** | Two items describe the same requirement in different wording | AC_02 "กดปุ่มบันทึกแล้วบันทึกข้อมูลสำเร็จ" ↔ AC_05 "ระบบบันทึกข้อมูลเมื่อผู้ใช้คลิกปุ่ม Save" |
| **Redundant** | One item is a subset of another (fully covered by the broader item) | AC_01 "ค้นหาด้วยชื่อ, รหัส, หรือคำอธิบาย" covers EC_03 "ค้นหาด้วยชื่อแล้วพบผลลัพธ์" |
| **Contradictory** | Two items specify conflicting expected behaviour for the same scenario | AC_04 "เมื่อฟิลด์ว่าง → ปุ่มบันทึกปิดใช้งาน" vs EC_02 "เมื่อฟิลด์ว่าง → แสดง error message ใต้ฟิลด์" |

### 2a.2 — Build report (do not post tables in chat)

Collect all findings from 2a.1 into the HTML report. The report is generated in Step 2.5d together with the conflict check results — both checks share one HTML page.

**If NO issues:** record `Issues found: NO` for the HTML template.

**If issues found:** record each item with its category badge and recommendation for the HTML template.

Do NOT post tables in chat — all detail goes into the HTML page (Step 2.5d).

### 2a.3 — User decision gate (when issues found)

After the HTML report is opened in Chrome (Step 2.5d), if Step 2a found issues, ask in chat:

> พบ AC/EC ที่ซ้ำ/ซ้ำซ้อน/ขัดแย้งกัน (ดูรายละเอียดใน Chrome) — ต้องการให้จัดการอย่างไรครับ?
>
> 1. **ข้ามส่วนที่ซ้ำ** — ตัดข้อที่ซ้ำซ้อนออก draft TC เฉพาะข้อที่ไม่ซ้ำ
> 2. **Draft ตาม AC/EC ทั้งหมดที่ระบุในทิคเกต** — เขียน TC ตาม AC/EC ทุกข้อตามที่เขียนไว้ ไม่ตัดไม่รวม
> 3. **ปรับ AC/EC ก่อน** — แจ้งให้แก้ไข AC/EC ในทิคเกตก่อนแล้วค่อยกลับมา draft
>
> หรือระบุวิธีอื่นได้เลยครับ

**Wait for the user's answer.** Apply their decision:
- **Option 1 (skip duplicates):** Record which items are skipped and which are kept. Use only kept items for TC design. Note skipped items in the Remark block (Step 3d).
- **Option 2 (draft all as-is):** Proceed with all AC/EC items as written. Each gets its own TC rows — even if duplicated.
- **Option 3 (fix first):** Pause workflow. Resume from Step 2 after the user updates the ticket.
- **Custom:** Follow the user's instruction.

Do NOT proceed past Step 2.6 until the user has decided on Step 2a issues (if any) AND Step 2.5 conflicts (if any). The surviving AC/EC set determines which terms Step 2.6 must scan.

---

## Step 2.5 — Conflict check against PRD and Figma (pre-design gate) [medium freedom]

**Must complete before Step 3.** Do not skip even if requirements look complete — conflicts caught here prevent rework after TCs are drafted.

### 2.5a — Locate PRD and Figma links

Check the ticket's description and linked documents for a **PRD link** and **Figma link**.

If either is missing, ask the user once:

> ก่อนออกแบบเทสเคส ผมขอเทียบ ticket กับ PRD และ Figma ก่อน เพื่อหาจุดที่ขัดกันตั้งแต่ต้นครับ
>
> รบกวนส่งลิงก์ที่ยังขาดให้ด้วยครับ
> - **PRD:** [พบที่ {link} / ไม่พบ — ถ้ามีรบกวนส่งให้ด้วยครับ]
> - **Figma:** [พบที่ {link} / ไม่พบ — ถ้ามีรบกวนส่งให้ด้วยครับ]
>
> ถ้า story นี้ไม่มีทั้งสองอย่าง ตอบว่า "ไม่มี PRD / ไม่มี Figma" ได้เลยครับ ผมจะใช้เนื้อหาใน ticket อย่างเดียว

**Wait for the user's response.** If the user confirms that a source does not exist (or provides no link after being asked):

- **Record which links are absent** (Figma / PRD / both) for the HTML report and the Remark block (design-and-review Step 3d / Step 5).
- Continue to Step 2.5b with available sources only.

**Link present but unreadable** (403, no Figma access, deleted or moved page, sign-in wall, empty render): do not treat the source as read and do not compare against it from memory. Record the exact error and the link, list the source as **unavailable** (with that error) in the HTML report and the Remark block (design-and-review Step 3d), then ask the user once for an export or screenshot of that source, or for approval to continue on the ticket text only. **Wait for the answer**; continue to Step 2.5b only after it, with the source marked unavailable if the user approved ticket-only.

### 2.5b — Collect source metadata (recency)

For each source that is available, record its **last-updated datetime** before comparing content:

| Source | What to look for |
|--------|-----------------|
| Jira ticket | "Updated" timestamp in issue detail; story status (Open / In Progress / Done) |
| PRD | Page last-modified datetime (Confluence footer); version number in page title if present |
| Figma | Frame or page last-edited datetime shown in Figma (hover the file or frame); version label in page/frame name if present |

**Timezone:** All datetimes MUST be displayed in **Bangkok time (ICT, UTC+7)**. Convert from UTC or any other timezone before displaying — never show UTC or raw platform timestamps.

Format: `DD Mon YYYY HH.MM AM/PM` (e.g. `05 Jun 2026 02.30 PM`)

If a datetime cannot be determined, mark it **"ไม่ทราบวันที่"** — do not guess.

**Recency rule:** The most recently updated source is the **stronger default truth**. When two sources conflict, the newer one takes precedence unless the user says otherwise. Always surface recency in the report so the user can override this default.

### 2.5c — Cross-reference and conflict detection

Compare against the story's AC/EC and description across these areas:

| Check area | What to look for |
|-----------|-----------------|
| AC/EC vs PRD | AC/EC items absent from PRD, or PRD requirements not reflected in any AC/EC |
| AC/EC vs Figma | UI flows, field labels, error messages, or states in Figma that differ from the AC/EC description |
| Description vs Figma | Status names, tabs, field limits, or forbidden actions in the ticket description vs Figma |
| Scope gaps | Features visible in Figma/PRD that no AC/EC covers |
| Contradictions | Conflicting expected results between ticket and PRD/Figma |

### 2.5d — Generate HTML report and open in Chrome

**Do NOT post conflict tables or AC/EC consistency tables in chat.** Generate a single HTML page that contains both Step 2a and Step 2.5 results.

1. **Generate** `references/{ISSUE_KEY}_FE_pre_draft_review.html` following [html-pre-draft-review-template.md](references/html-pre-draft-review-template.md) — includes Step 2a consistency check + Step 2.5 conflict/recency/scope-gap sections.
2. **Write** the file to the workspace using the Write tool.
3. **Open** in the browser (the agent's browser tool, `open_url` / `navigate`) → `file:///absolute/path/to/references/{ISSUE_KEY}_FE_pre_draft_review.html` — if that is not possible, use the WORKFLOW Step 5 item-3 fallback (absolute path + short chat summary of issue counts, then the same decision prompts).
4. **Post in chat** (short — all detail is in Chrome):

> Pre-draft review เปิดใน Chrome แล้ว — ตรวจสอบผลการเช็ค AC/EC consistency + PRD/Figma conflict ได้เลยครับ

Then handle user decisions in chat:
- If Step 2a found issues → post the Step 2a.3 decision prompt in chat.
- If Step 2.5 found conflicts or gaps → present recommendations in chat and wait for the user to confirm or override.
- If both checks are clean → tell the user in chat and proceed to Step 3.

**Column detail rules** (apply when building the HTML) — every cell must be fully written out, never summarised or abbreviated:

| Column | What to put in it |
|--------|------------------|
| **AC/EC** | Label + full text of the acceptance/edge criterion as written in the ticket (e.g. `AC_02: When the user clicks Save, the system saves the record and shows a success toast`) |
| **Area** | Specific UI element, field, flow, or rule being compared — not a generic category (e.g. `Save button → post-save feedback` not just `Save`) |
| **Ticket says** | Exact wording or behavior from the ticket — quote verbatim (paraphrase only behaviour the ticket states without wording, and mark it `paraphrase`); include field names, error texts, UI labels as written |
| **PRD/Figma says** | Exact wording, label, or behavior from PRD/Figma; include frame name/number or PRD section for traceability (e.g. `Figma frame P-14: modal titled "ยืนยันการบันทึก?" with "ตกลง" and "ยกเลิก" buttons`) |
| **Newer source (ICT)** | Source name + its last-updated datetime in `DD Mon YYYY HH.MM AM/PM` |
| **Severity** | High = blocks TC design or changes core flow; Medium = affects expected result wording or label; Low = cosmetic / minor label difference |

**If NO conflicts and no gaps and no Step 2a issues:** generate the HTML (both sections show clean status), tell the user in chat, then continue to Step 3 immediately.

**If conflicts, gaps, or Step 2a issues found:** generate the HTML, open in Chrome, then handle each set of issues in chat. Do NOT start Step 3 until all issues are resolved — TCs built on contradictory or inconsistent requirements must be redesigned.

**Go back:** If an issue is resolved by changing the ticket's AC/EC (Step 2a.3 option 3), return to Step 2 — Extract requirements and run Step 2a and Step 2.5 again on the updated ticket.

---

## Step 2.6 — TC glossary re-check (mandatory gate) [medium freedom]

**Must complete after the Step 2a and Step 2.5 decisions are settled, and before Step 3.** Runs last among the pre-design gates because the gap scan below covers only the terms the *surviving* AC/EC will use — and which AC/EC survive is not known until the user answers Step 2a.3.

The Thai wording inside test cases comes from a project glossary that the team edits between runs. A cached copy is not evidence.

Rules: [tc-glossary.md](../../../references/tc-glossary.md). Sheet URL, tab, and `gid`: the project guide loaded in Step 1.

### 2.6.1 — Re-fetch the glossary

Fetch the published tab as CSV using the `gid` from the project guide, overwriting the local mirror `{GLOSSARY_CSV}` — the local CSV path recorded in the project guide § TC glossary (see [tc-glossary.md](../../../references/tc-glossary.md)). Never hand-edit the CSV.

**If the project guide has no glossary row (URL / tab / `gid`), or the fetch fails (non-200, empty body, header-only CSV, no network):** stop, report the exact error or the missing guide value, and ask the user to either supply the current CSV or approve running on the Step 3b fallback table only — in which case every term the TCs use that has no fallback row is asked at 2.6.3. Never reuse an earlier cached CSV as if it were re-fetched, and never report the gate as re-checked.

**If `curl` fails TLS verification (exit 60):** the machine has an intercepting proxy (corporate AV). Export its CA from the OS trust store and pass `--cacert`. **Never** pass `-k` / `--insecure` — it disables verification against a proxy you have not identified.

### 2.6.2 — Report to the user (evidence)

Post in chat, before any test case design:

```
**TC glossary — re-checked**

ที่มา: {published sheet URL}
Tab: {tab name} (gid {gid}) · {N} คำ
ไฟล์: {GLOSSARY_CSV}

{diff vs committed CSV — added / removed / changed rows, or "ไม่มีการเปลี่ยนแปลงจากครั้งก่อน"}
```

Attach or link the CSV. The user must be able to see the words, not take the agent's word for them.

### 2.6.3 — Gap and ambiguity scan

Scan **only the terms this ticket's test cases will use** — do not interrogate the user about the whole sheet.

| Condition | Action |
|-----------|--------|
| Thai cell empty | **STOP and ask** what word to use. When the Step 3b fallback table has the term, offer it labelled as a suggestion — never as the answer. |
| One English key, conflicting Thai meanings across rows | **STOP and ask** which meaning applies to this ticket. |
| Thai cell has comma-separated variants | Not blocking — propose one variant at the Step 4.5 gate. |
| No row for the term | Use the Step 3b fallback table. If absent there too: **(a)** the term is an English UI label the ticket itself writes verbatim (e.g. a menu name `Profile`) → not a 2.6 stop: design keeps the ticket's label unchanged and the term is asked once at the Step 4.5 gate (a question row, see there), which stops and waits before any deliverable is written; **(b)** anything else (a Thai word would have to be chosen) → **STOP and ask** here. |
| Glossary term the UI may show in English (collision rule, [design-and-review.md § 3b](design-and-review.md#3b--language-rules-thai-always)) — the ticket writes it as an English label, or a design shows it in English | Not a 2.6 stop: design uses the glossary Thai term; the term is asked once at the Step 4.5 gate (a question row, see there), which stops and waits before any deliverable is written. |

**Wait for the user's answers** to every 2.6 stop above. Record each decision for the Step 4.5 table, and list the (a) and collision terms you carry to Step 4.5 in the 2.6 report so the user sees them now.

Writing a guess and tagging it *provisional* / *pending confirmation* / *documented fallback* is **not** asking. See the red flags in [tc-glossary.md](../../../references/tc-glossary.md).

Do NOT proceed to Step 3 until every Step 2.6 stop is answered. Carried (a) and collision terms are not stops; they are open questions that Step 4.5 must close.

**Go back:** If a later Step 2a or 2.5 decision changes the surviving AC/EC set, return to 2.6.3 and scan again — the scan covers only the surviving terms.

---
