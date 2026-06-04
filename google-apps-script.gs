/* =====================================================================
   SOD RECITAL — GOOGLE APPS SCRIPT BACKEND
   ---------------------------------------------------------------------
   This runs ON your Google Sheet and gives the website a free backend:
     • Stores every registration as a row (your "payments export")
     • Serves editable settings from the "Config" + "Tiers" tabs
     • Saves uploaded receipts to a Drive folder
     • Counts remaining seats per tier

   SETUP (one time):
     1. Create a new Google Sheet.
     2. Extensions → Apps Script. Delete the sample code.
     3. Paste THIS whole file in. Save.
     4. Run the function `setup` once (authorize when asked).
     5. Deploy → New deployment → type "Web app"
          - Execute as:  Me
          - Who has access:  Anyone
        Copy the Web app URL → paste into config.js (apiUrl).
   To edit prices / limits / open-close later: just edit the Config
   and Tiers tabs in the Sheet. No code or redeploy needed.
   ===================================================================== */

var SHEETS = { CONFIG: "Config", TIERS: "Tiers", REG: "Registrations" };
var RECEIPTS_FOLDER = "Recital Receipts";

/* ---------- One-time setup: build the tabs with defaults ---------- */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfg = sheet_(ss, SHEETS.CONFIG, ["Setting", "Value"]);
  if (cfg.getLastRow() < 2) {
    cfg.getRange(2, 1, 6, 2).setValues([
      ["salesOpen", false],
      ["ticketLimitPerStudent", 4],
      ["totalCapacity", 1275],
      ["eventName", "Fantasy — A Decade of Non-Stop Moving"],
      ["eventDate", "June 28, 2026 · 7:00 PM"],
      ["venue", "The New Theatre"]
    ]);
  }

  var tiers = sheet_(ss, SHEETS.TIERS, ["id", "name", "price", "entry", "note", "allocation"]);
  if (tiers.getLastRow() < 2) {
    tiers.getRange(2, 1, 2, 6).setValues([
      ["vip",   "VIP",                2295, "Early entry 5:00 PM", "Reserved seating · priority entry", 300],
      ["genad", "General Admission",  1295, "Doors open after VIP", "Open seating",                     975]
    ]);
  }

  sheet_(ss, SHEETS.REG, [
    "Order ID", "Timestamp", "Student Name", "Class/Level", "Buyer Name",
    "Email", "Phone", "Tier", "Qty", "Unit Price", "Total",
    "Pay Method", "Reference No.", "Receipt", "Status"
  ]);
}

function sheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#2a1850").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- GET: serve config to the website ---------- */
function doGet(e) {
  try {
    setup(); // ensure tabs exist
    return json_(readConfig_());
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function readConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = { ok: true, payments: {} };

  // Config key/value
  var cfg = ss.getSheetByName(SHEETS.CONFIG).getDataRange().getValues();
  for (var i = 1; i < cfg.length; i++) {
    var k = String(cfg[i][0]).trim(), v = cfg[i][1];
    if (k) out[k] = v;
  }
  out.salesOpen = (out.salesOpen === true || String(out.salesOpen).toLowerCase() === "true");
  out.ticketLimitPerStudent = Number(out.ticketLimitPerStudent) || 4;
  out.totalCapacity = Number(out.totalCapacity) || 1275;

  // Tiers
  var tv = ss.getSheetByName(SHEETS.TIERS).getDataRange().getValues();
  out.tiers = [];
  for (var r = 1; r < tv.length; r++) {
    if (!tv[r][0]) continue;
    out.tiers.push({
      id: String(tv[r][0]), name: String(tv[r][1]), price: Number(tv[r][2]),
      entry: String(tv[r][3]), note: String(tv[r][4]), allocation: Number(tv[r][5])
    });
  }

  // Remaining seats per tier (allocation − confirmed/pending qty sold)
  out.remaining = remainingByTier_(ss, out.tiers);
  return out;
}

function remainingByTier_(ss, tiers) {
  var reg = ss.getSheetByName(SHEETS.REG).getDataRange().getValues();
  var sold = {};
  for (var i = 1; i < reg.length; i++) {
    var status = String(reg[i][14] || "").toLowerCase();
    if (status === "cancelled" || status === "rejected") continue;
    var tier = String(reg[i][7]);
    sold[tier] = (sold[tier] || 0) + Number(reg[i][8] || 0);
  }
  var rem = {};
  tiers.forEach(function (t) {
    rem[t.id] = Math.max(0, (t.allocation || 0) - (sold[t.name] || 0));
  });
  return rem;
}

/* ---------- POST: store a registration ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setup();

    // Re-check sales open + capacity server-side (don't trust the client)
    var cfg = readConfig_();
    if (!cfg.salesOpen) return json_({ ok: false, error: "Registration is closed." });

    var tier = cfg.tiers.filter(function (t) { return t.id === data.tierId; })[0];
    if (!tier) return json_({ ok: false, error: "Invalid ticket type." });

    var qty = Number(data.qty) || 0;
    if (qty < 1 || qty > cfg.ticketLimitPerStudent) {
      return json_({ ok: false, error: "Quantity exceeds the allowed limit." });
    }
    if ((cfg.remaining[tier.id] || 0) < qty) {
      return json_({ ok: false, error: "Not enough seats left in " + tier.name + "." });
    }

    var orderId = makeOrderId_();
    var receiptLink = "";
    if (data.receiptData) receiptLink = saveReceipt_(orderId, data);

    ss.getSheetByName(SHEETS.REG).appendRow([
      orderId, data.timestamp || new Date(), data.studentName, data.studentClass,
      data.buyerName, data.email, data.phone, tier.name, qty, tier.price,
      tier.price * qty, data.payMethod, data.reference, receiptLink, "Pending"
    ]);

    return json_({ ok: true, orderId: orderId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function saveReceipt_(orderId, data) {
  var folders = DriveApp.getFoldersByName(RECEIPTS_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(RECEIPTS_FOLDER);
  var bytes = Utilities.base64Decode(data.receiptData);
  var blob = Utilities.newBlob(bytes, data.receiptType || "application/octet-stream",
    orderId + "_" + (data.receiptName || "receipt"));
  var file = folder.createFile(blob);
  return file.getUrl();
}

function makeOrderId_() {
  var d = new Date();
  var stamp = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyMMdd");
  var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "SOD-" + stamp + "-" + rand;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
