// ── Word Masters – Google Apps Script backend ──────────────────────────────
// Deploy as: Web App  |  Execute as: Me  |  Who has access: Anyone
//
// Spreadsheet tab naming: one tab per user, named  Scores_<username>
// Columns (A–H):
//   itemId | correct | attempts | ef | interval | reps | nextReview | lastSeen

var SS = SpreadsheetApp.getActiveSpreadsheet();

// ── GET  ──────────────────────────────────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action;
  var user   = e.parameter.user;

  if (action === 'scores' && user) {
    var scores = readScores(user);
    return jsonResponse({ scores: scores });
  }

  return jsonResponse({ error: 'unknown action' });
}

// ── POST  (no-cors form-encoded body) ─────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.parameter.payload || '{}');
    if (payload.action === 'scores' && payload.user && payload.scores) {
      writeScores(payload.user, payload.scores);
    }
  } catch(err) {
    // silently ignore malformed payloads
  }
  // no-cors POST callers can't read the response; return anything valid
  return ContentService.createTextOutput('ok');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sheetForUser(username) {
  var name = 'Scores_' + username;
  var sh = SS.getSheetByName(name);
  if (!sh) {
    sh = SS.insertSheet(name);
    sh.appendRow(['itemId','correct','attempts','ef','interval','reps','nextReview','lastSeen']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readScores(username) {
  var sh = sheetForUser(username);
  var data = sh.getDataRange().getValues();
  var scores = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0]);
    if (!id) continue;
    scores[id] = {
      correct:    Number(row[1]),
      attempts:   Number(row[2]),
      ef:         Number(row[3]),
      interval:   Number(row[4]),
      reps:       Number(row[5]),
      nextReview: String(row[6]),
      lastSeen:   String(row[7])
    };
  }
  return scores;
}

function writeScores(username, scores) {
  var sh = sheetForUser(username);
  // Clear existing data (keep header row)
  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.deleteRows(2, lastRow - 1);

  var rows = Object.entries(scores).map(function(entry) {
    var id = entry[0];
    var r  = entry[1];
    return [id, r.correct||0, r.attempts||0, r.ef||2.5, r.interval||1, r.reps||0,
            r.nextReview||'', r.lastSeen||''];
  });
  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
