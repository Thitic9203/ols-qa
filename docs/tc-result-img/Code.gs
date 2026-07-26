/**
 * sync-tc-result — Unit evidence image embed (Apps Script, bound to the Unit deliverable sheet).
 * Owns COLUMN I ONLY (Actual Result). Python owns A–H, J–N. Disjoint ranges → no race (plan §6.7).
 * Generic + id-free (committable). Real ids live in the bound sheet + off-repo .clasp.json.
 *
 * ┌─ RUN ORDER ────────────────────────────────────────────────────────────────────────────┐
 * │ 1. clasp push  →  open editor  →  Run `spike`  →  Allow (Drive consent, one-time).       │
 * │ 2. Read the Logger output. It answers the 4 questions embedUnitImages() depends on        │
 * │    (plan §6.1 / finding R1). Paste the numbers back so the constants below are finalized. │
 * │ 3. Only THEN is embedUnitImages() trustworthy — until the spike runs it is a skeleton.    │
 * └────────────────────────────────────────────────────────────────────────────────────────┘
 */

// ── CONFIG (id-free) ─────────────────────────────────────────────────────────────────────
var COL_I = 9;               // Actual Result (1-based) — the ONLY column this script writes
var COL_N = 14;              // hidden Python-written row key `ticket|TCID` — the match anchor
var MANIFEST_TAB = "_img_manifest";   // hidden: ticket · TCID · driveFileId(s) · folderId · lease
var LEASE_CELL   = "F1";     // on MANIFEST_TAB: "writing" (Python) | "embedding" (this) | "idle"
var TC_TAB_RE    = /^TC0\d\d\b/;      // Unit function tabs; excludes TOR / "…ตัวอย่าง"
// —— finalized by spike() (plan §6.1); placeholders until then ——
var SIZE_CAP_KB  = 0;        // TODO(spike): hard cap; blobs over this go through getThumbnail()
var USE_THUMBNAIL = null;    // TODO(spike): true if getThumbnail() renders acceptably in-cell

// ── §6.1 GATE-0 SPIKE — run this FIRST, measure, then finalize the constants above ─────────
function spike() {
  var FILE_ID = PropertiesService.getScriptProperties().getProperty("SPIKE_FILE_ID") || "";
  if (!FILE_ID) {
    Logger.log("SPIKE: set Script Property SPIKE_FILE_ID to a real Unit-screenshot Drive fileId, then re-run.");
    return;
  }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cell = sh.getRange("Z1");   // throwaway cell — clear after
  var out = {};
  try {
    var file = DriveApp.getFileById(FILE_ID);
    var blob = file.getBlob();
    out.blob_kb = Math.round(blob.getBytes().length / 1024);
    out.mime = blob.getContentType();
    var dataUrl = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
    // Q1: does CellImage accept a data: URL, and does it render in-cell?
    var img = SpreadsheetApp.newCellImage().setSourceUrl(dataUrl).setAltTextDescription(FILE_ID).build();
    cell.setValue(img);
    SpreadsheetApp.flush();
    out.data_url_accepted = true;
    // Q2 (finding R1, CRITICAL): can we read the alt-text marker back? reconcile depends on it.
    var got = cell.getValue();
    out.readback_is_image = got && got.valueType === SpreadsheetApp.ValueType.IMAGE;
    out.marker_readback = out.readback_is_image ? cell.getValue().getAltTextDescription() : null;
    out.marker_matches = out.marker_readback === FILE_ID;
    // Q3: thumbnail downscale path + size
    try {
      var thumb = file.getThumbnail();
      out.thumb_kb = thumb ? Math.round(thumb.getBytes().length / 1024) : null;
    } catch (e) { out.thumb_err = String(e); }
  } catch (e) {
    out.error = String(e);
  } finally {
    cell.clearContent();
  }
  Logger.log("SPIKE RESULT: " + JSON.stringify(out, null, 2));
  Logger.log("→ finalize SIZE_CAP_KB (cap below the data_url that still rendered) and USE_THUMBNAIL (thumb renders?).");
}

// ── §6.2–6.4 EMBED — reconcile col I over every Unit tab (PENDING SPIKE: constants above) ──
// current = alt-text marker of the CellImage already in the cell (fileId) → skip if unchanged
// (never re-download, finding M9). desired empty but cell has image → clear (row moved).
function embedUnitImages() {
  if (SIZE_CAP_KB === 0 || USE_THUMBNAIL === null) {
    Logger.log("embedUnitImages: constants not finalized — run spike() first (plan §6.1). Aborting.");
    return;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!_leaseAcquire(ss)) { Logger.log("Python holds the lease (writing) — skip this round."); return; }
  try {
    var man = _readManifest(ss);          // key `ticket|TCID` → {fileIds:[], folderId}
    ss.getSheets().forEach(function (sh) {
      if (!TC_TAB_RE.test(sh.getName())) return;
      var last = sh.getLastRow();
      if (last < 2) return;
      var keys = sh.getRange(2, COL_N, last - 1, 1).getValues();     // hidden anchor col N
      var iCol = sh.getRange(2, COL_I, last - 1, 1);
      var cur  = iCol.getValues();
      for (var r = 0; r < keys.length; r++) {
        var key = String(keys[r][0] || "").trim();
        var want = key ? man[key] : null;                            // manifest entry or undefined
        var haveImg = cur[r][0] && cur[r][0].valueType === SpreadsheetApp.ValueType.IMAGE;
        var haveMarker = haveImg ? cur[r][0].getAltTextDescription() : null;
        var fileId = want ? _resolveFileForRow(want, key) : null;    // folder → first TCID-prefixed file
        if (!fileId) {                                               // desired empty
          if (haveImg) sh.getRange(r + 2, COL_I).clearContent();     // reconcile: clear stale image
          continue;
        }
        if (haveMarker === fileId) continue;                         // unchanged → skip (no re-download)
        _embedCell(sh.getRange(r + 2, COL_I), fileId);               // embed / re-embed
      }
    });
  } finally {
    _leaseRelease(ss);
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────────────────
function _readManifest(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB);
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();     // ticket, TCID, fileIds, folderId
  v.forEach(function (row) {
    var key = String(row[0]).trim() + "|" + String(row[1]).trim();
    out[key] = { fileIds: String(row[2] || "").split(/[,\s]+/).filter(String), folderId: String(row[3] || "").trim() };
  });
  return out;
}

function _resolveFileForRow(want, key) {
  if (want.fileIds && want.fileIds.length) return want.fileIds[0];   // explicit file link wins
  if (want.folderId) {                                               // §6.4 folder + TCID-prefix match
    var tcid = key.split("|")[1] || "";
    var it = DriveApp.getFolderById(want.folderId).getFiles();
    var hits = [];
    while (it.hasNext()) { var f = it.next(); if (f.getName().indexOf(tcid) === 0) hits.push(f); }
    hits.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
    return hits.length ? hits[0].getId() : null;                     // first → cell; rest → Comment (TODO)
  }
  return null;
}

function _embedCell(range, fileId) {
  var blob = DriveApp.getFileById(fileId).getBlob();
  if (Math.round(blob.getBytes().length / 1024) > SIZE_CAP_KB && USE_THUMBNAIL) {
    var t = DriveApp.getFileById(fileId).getThumbnail();
    if (t) blob = t;
  }
  var dataUrl = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
  range.setValue(SpreadsheetApp.newCellImage().setSourceUrl(dataUrl).setAltTextDescription(fileId).build());
}

function _leaseAcquire(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB); if (!sh) return true;
  var c = sh.getRange(LEASE_CELL); var v = String(c.getValue() || "idle");
  if (v === "writing") return false;                                 // Python owns this round
  c.setValue("embedding"); SpreadsheetApp.flush(); return true;
}
function _leaseRelease(ss) {
  var sh = ss.getSheetByName(MANIFEST_TAB); if (sh) sh.getRange(LEASE_CELL).setValue("idle");
}
