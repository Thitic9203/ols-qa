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
var SIZE_CAP_KB  = 800;            // blobs larger than this fall back to getThumbnail()

// ── THE single entry the user runs once (authorizes + embeds + installs trigger) ──────────
function authorizeAndRun() {
  var ok = selfTestInCellImage();
  Logger.log(ok ? "self-test: in-cell data-URL image RENDERS ✓ — proceeding to embed."
                : "self-test: in-cell data-URL image DID NOT render ✗ — see log; NOT embedding (tell the dev).");
  if (!ok) return;
  var n = embedUnitImages();
  installHourlyTrigger();
  Logger.log("DONE — embedded/updated " + n + " image(s); hourly trigger installed. You never need to run this again.");
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
  var count = 0;
  try {
    var man = _manifest(ss);
    ss.getSheets().forEach(function (sh) {
      if (!TC_TAB_RE.test(sh.getName())) return;
      var last = sh.getLastRow();
      if (last < 2) return;
      var keys = sh.getRange(2, COL_N, last - 1, 1).getValues();
      var cur  = sh.getRange(2, COL_I, last - 1, 1).getValues();
      for (var r = 0; r < keys.length; r++) {
        var key = String(keys[r][0] || "").trim();
        var want = key ? man[key] : null;
        var haveImg = cur[r][0] && cur[r][0].valueType === SpreadsheetApp.ValueType.IMAGE;
        var marker = haveImg ? cur[r][0].getAltTextDescription() : null;
        if (!want || !want.fileId) { if (haveImg) sh.getRange(r + 2, COL_I).clearContent(); continue; }
        if (marker === want.fileId) continue;                       // unchanged → skip, no re-download
        _embed(sh.getRange(r + 2, COL_I), want.fileId);
        if (want.extras && want.extras.length) {                    // §6.4 multi-file → links in a note
          sh.getRange(r + 2, COL_I).setNote("More evidence:\n" +
            want.extras.map(function (id) { return "https://drive.google.com/file/d/" + id + "/view"; }).join("\n"));
        }
        count++;
      }
    });
  } finally {
    _leaseRelease(ss);
  }
  return count;
}

// ── helpers ───────────────────────────────────────────────────────────────────────────────
function _manifest(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();    // ticket, TCID, fileId, extraIds(csv)
  v.forEach(function (row) {
    var key = String(row[0]).trim() + "|" + String(row[1]).trim();
    out[key] = { fileId: String(row[2] || "").trim(),
                 extras: String(row[3] || "").split(/[,\s]+/).filter(String) };
  });
  return out;
}

function _embed(range, fileId) {
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  if (Math.round(blob.getBytes().length / 1024) > SIZE_CAP_KB) {
    try { var t = file.getThumbnail(); if (t) blob = t; } catch (e) { /* keep full */ }
  }
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
