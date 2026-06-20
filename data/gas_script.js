// ─────────────────────────────────────────────────────────────────────────────
//  WORD MASTERS — Google Apps Script
//  Deploy this as a Web App (Execute as: Me, Who has access: Anyone)
//  Then paste the deployment URL into src/config.js → GAS_URL
// ─────────────────────────────────────────────────────────────────────────────
//
//  Tabs:
//    <username>  — SM-2 scores per item (one row per item)
//    log         — Raw attempt log (one row per question answered)
//
//  GET  ?action=scores&user=NP_test
//       → { scores: { itemId: {...}, ... } }
//
//  POST payload={ action:'scores', user:'NP_test', scores:{...} }
//       → { ok: true }
//
//  POST payload={ action:'log', rows:[{ ts, username, itemId, topicId,
//                 correct, selectedOption, correctAnswer, prompt }, ...] }
//       → { ok: true }
// ─────────────────────────────────────────────────────────────────────────────

const HEADERS = ['itemId','attempts','correct','ef','interval','reps','nextReview','lastSeen'];

const LOG_HEADERS = ['timestamp','username','itemId','topicId','correct','selectedOption','correctAnswer','prompt'];

function doGet(e) {
  try {
    const action = e.parameter.action;
    const user   = e.parameter.user;
    if (action === 'scores' && user) {
      return jsonResponse({ scores: readScores(user) });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload);
    if (payload.action === 'scores' && payload.user && payload.scores) {
      writeScores(payload.user, payload.scores);
      return jsonResponse({ ok: true });
    }
    if (payload.action === 'log' && Array.isArray(payload.rows)) {
      appendLog(payload.rows);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Read all scores for a user ────────────────────────────────────────────────
function readScores(username) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(username);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};   // only header row or empty

  const scores = {};
  for (let i = 1; i < data.length; i++) {
    const [itemId, attempts, correct, ef, interval, reps, nextReview, lastSeen] = data[i];
    if (!itemId) continue;
    scores[String(itemId)] = {
      attempts:   Number(attempts)  || 0,
      correct:    Number(correct)   || 0,
      ef:         Number(ef)        || 2.5,
      interval:   Number(interval)  || 1,
      reps:       Number(reps)      || 0,
      nextReview: String(nextReview || ''),
      lastSeen:   String(lastSeen   || ''),
    };
  }
  return scores;
}

// ── Write (overwrite) all scores for a user ───────────────────────────────────
function writeScores(username, scores) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(username);
  if (!sheet) sheet = ss.insertSheet(username);

  const rows = [HEADERS];
  for (const [itemId, rec] of Object.entries(scores)) {
    rows.push([
      itemId,
      rec.attempts   ?? 0,
      rec.correct    ?? 0,
      rec.ef         ?? 2.5,
      rec.interval   ?? 1,
      rec.reps       ?? 0,
      rec.nextReview ?? '',
      rec.lastSeen   ?? '',
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, HEADERS.length).setValues(rows);
}

// ── Append raw attempt rows to the "log" tab ─────────────────────────────────
function appendLog(rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('log');
  if (!sheet) {
    sheet = ss.insertSheet('log');
    sheet.appendRow(LOG_HEADERS);
    sheet.setFrozenRows(1);
    // Widen columns for readability
    sheet.setColumnWidth(1, 180);  // timestamp
    sheet.setColumnWidth(8, 300);  // prompt
  }
  rows.forEach(function(row) {
    sheet.appendRow([
      row.ts             || '',
      row.username       || '',
      row.itemId         || '',
      row.topicId        || '',
      row.correct === true ? 'TRUE' : 'FALSE',
      row.selectedOption || '',
      row.correctAnswer  || '',
      row.prompt         || '',
    ]);
  });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
