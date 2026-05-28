# Post-mortem log — retest workflow

Append new entries at the bottom. This file ships with examples only; teams maintain their own log in project repos.

## PM-1: Comment format decided too late

**Problem:** Started with v3 ADF for a UI bug, then re-posted with v2 wiki for inline screenshots.

**Root cause:** Bug type (FE vs API) was not fixed at Step 3, so comment format changed mid-flight.

**Lesson:** Set `COMMENT_FORMAT=v2|v3` at Step 3 and never switch.

## PM-2: JXA encoding garbled Thai text

**Problem:** Jira comment showed corrupted characters.

**Root cause:** Non-ASCII written into the JS file before `JSON.stringify` + ASCII escape.

**Lesson:** Follow the pipeline in `gotchas.md` (stringify first, then escape, ASCII file only).
