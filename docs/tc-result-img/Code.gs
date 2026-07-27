/**
 * sync-tc-result — Unit evidence image embed (Apps Script, bound to the Unit deliverable sheet).
 * Owns COLUMN I ONLY (Actual Result). Python owns A–H, J–N. Disjoint ranges → no race (plan §6.7).
 * Generic + id-free (committable). Real ids live in the bound sheet + off-repo .clasp.json.
 *
 * WHY DriveApp (needs drive.readonly): a base64 data: URL of a screenshot is far larger than a
 * cell's 50k-char text limit, so it can't be handed via a cell. The script reads a CLEAN fileId
 * from `_img_manifest` (Python did all the messy folder/name matching) and fetches the blob itself.
 *
 * ┌─ THE ONE HUMAN STEP ───────────────────────────────────────────────────────────────────┐
 * │ Open this script (Extensions ▸ Apps Script) → Run `authorizeAndRun` → click **Allow**.   │
 * │ That one grant: self-tests in-cell rendering, embeds every matched image, and installs    │
 * │ the hourly trigger. Nothing else is manual, ever again.                                   │
 * └────────────────────────────────────────────────────────────────────────────────────────┘
 */

// ── CONFIG (id-free) ─────────────────────────────────────────────────────────────────────
var COL_I = 9;                     // Actual Result (1-based) — the ONLY column this script writes
var COL_N = 14;                    // hidden Python key `ticket|TCID` — the row match anchor
var MANIFEST_TAB = "_img_manifest"; // hidden: A ticket · B TCID · C fileId · D extraIds(csv) · F1 lease
var LEASE_CELL   = "F1";           // "writing" (Python) | "embedding" (this) | "idle"
var TC_TAB_RE    = /^TC0\d\d\b/;   // Unit function tabs; excludes TOR / "…ตัวอย่าง"
var COL_I_WIDTH  = 470;            // px: Actual-Result column width = image display width
var TBC_TEXT     = "TBC – จะแนบภาพหลักฐานหลังทดสอบผ่าน";  // non-passed rows (evidence pending pass)

// ── THE single entry the user runs once (authorizes + embeds + installs trigger) ──────────
function authorizeAndRun() {
  var ok = selfTestInCellImage();
  Logger.log(ok ? "self-test: in-cell data-URL image RENDERS ✓ — proceeding to embed."
                : "self-test: in-cell data-URL image DID NOT render ✗ — see log; NOT embedding (tell the dev).");
  if (!ok) return;
  var n = embedUnitImages();
  try { installHourlyTrigger(); Logger.log("hourly trigger installed."); }
  catch (e) { Logger.log("WARN: trigger not installed (" + e + ") — image embed still works; harmless."); }
  Logger.log("DONE — embedded/updated " + n + " image(s).");
}

// ── self-test (plan §6.1 / finding R1): does newCellImage(dataUrl) render + read back in-cell? ─
function selfTestInCellImage() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var man = _manifest(ss);
  var probeId = null;
  for (var k in man) { if (man[k].fileId) { probeId = man[k].fileId; break; } }
  if (!probeId) { Logger.log("self-test: no fileId in manifest yet — run the Python sync first."); return false; }
  var cell = ss.getSheets()[0].getRange("Z1");
  try {
    _embed(cell, probeId);
    SpreadsheetApp.flush();
    var v = cell.getValue();
    var isImg = v && v.valueType === SpreadsheetApp.ValueType.IMAGE;
    var marker = isImg ? v.getAltTextDescription() : null;
    Logger.log("self-test: isImage=" + isImg + " markerReadback=" + (marker === probeId));
    return isImg && marker === probeId;
  } catch (e) {
    Logger.log("self-test EXCEPTION: " + e);
    return false;
  } finally {
    cell.clearContent();
  }
}

// ── embed reconcile — col I over every Unit tab, matched by col N against the manifest ─────
function embedUnitImages() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!_leaseAcquire(ss)) { Logger.log("Python holds the lease (writing) — skip this round."); return 0; }
  var count = 0, tbc = 0;
  try {
    var man = _manifest(ss);
    ss.getSheets().forEach(function (sh) {
      if (!TC_TAB_RE.test(sh.getName())) return;
      var last = sh.getLastRow();
      if (last < 2) return;
      sh.setColumnWidth(COL_I, COL_I_WIDTH);
      var keys = sh.getRange(2, COL_N, last - 1, 1).getValues();
      var cur  = sh.getRange(2, COL_I, last - 1, 1).getValues();
      for (var r = 0; r < keys.length; r++) {
        var key = String(keys[r][0] || "").trim();
        if (!key) continue;                                         // label / blank row — never touch
        var want = man[key];
        var cell = sh.getRange(r + 2, COL_I);
        var isImg = cur[r][0] && cur[r][0].valueType === SpreadsheetApp.ValueType.IMAGE;
        if (want && want.fileId) {                                  // PASSED + evidence → image
          var marker = isImg ? cur[r][0].getAltTextDescription() : null;
          if (marker !== want.fileId) { _embed(cell, want.fileId); count++; }
          if (want.rowH) sh.setRowHeight(r + 2, want.rowH);         // readable height (from manifest)
        } else {                                                    // not passed / no image → TBC
          if (isImg) cell.clearContent();
          if (String(isImg ? "" : (cur[r][0] || "")).trim() !== TBC_TEXT) cell.setValue(TBC_TEXT);
          tbc++;
        }
      }
    });
    Logger.log("embed: " + count + " image(s) set, " + tbc + " TBC cell(s).");
  } finally {
    _leaseRelease(ss);
  }
  return count;
}

// ── helpers ───────────────────────────────────────────────────────────────────────────────
function _manifest(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();    // ticket, TCID, fileId, extra, rowH
  v.forEach(function (row) {
    var key = String(row[0]).trim() + "|" + String(row[1]).trim();
    out[key] = { fileId: String(row[2] || "").trim(), rowH: Number(row[4]) || 0 };
  });
  return out;
}

function _embed(range, fileId) {
  // full-resolution blob (composite is already width-normalized by Python) → crisp in-cell image
  var blob = DriveApp.getFileById(fileId).getBlob();
  var dataUrl = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
  range.setValue(SpreadsheetApp.newCellImage().setSourceUrl(dataUrl).setAltTextDescription(fileId).build());
}

function _leaseAcquire(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB); if (!sh) return true;
  if (String(sh.getRange(LEASE_CELL).getValue() || "idle") === "writing") return false;
  sh.getRange(LEASE_CELL).setValue("embedding"); SpreadsheetApp.flush(); return true;
}
function _leaseRelease(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB); if (sh) sh.getRange(LEASE_CELL).setValue("idle");
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "embedUnitImages") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("embedUnitImages").timeBased().everyHours(1).create();
}

// ── programmatic verification (the Sheets REST API can't see in-cell images; run this to count them) ──
function verifyImages() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var man = _manifest(ss), img = 0, tbc = 0, missing = [], wrong = [];
  ss.getSheets().forEach(function (sh) {
    if (!TC_TAB_RE.test(sh.getName())) return;
    var last = sh.getLastRow(); if (last < 2) return;
    var keys = sh.getRange(2, COL_N, last - 1, 1).getValues();
    var cur  = sh.getRange(2, COL_I, last - 1, 1).getValues();
    for (var r = 0; r < keys.length; r++) {
      var key = String(keys[r][0] || "").trim(); if (!key) continue;
      var want = man[key], v = cur[r][0];
      var isImg = v && v.valueType === SpreadsheetApp.ValueType.IMAGE;
      if (want && want.fileId) {
        if (isImg && v.getAltTextDescription() === want.fileId) img++;
        else if (isImg) wrong.push(sh.getName() + " " + key);
        else missing.push(sh.getName() + " " + key);
      } else if (!isImg && String(v).indexOf("TBC") === 0) { tbc++; }
    }
  });
  Logger.log("VERIFY: " + img + " image(s) OK · " + tbc + " TBC OK · missing " + missing.length + " · wrong " + wrong.length);
  if (missing.length) Logger.log("  MISSING: " + missing.slice(0, 25).join(", "));
  if (wrong.length)   Logger.log("  WRONG-marker: " + wrong.slice(0, 25).join(", "));
  return { img: img, tbc: tbc, missing: missing, wrong: wrong };
}
