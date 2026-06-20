import { GAS_URL } from '../config.js';

// ── Read scores for a user from Google Sheets ─────────────────────────────────
// Returns the scores object, or null if offline / GAS not configured.
export async function loadScoresFromSheets(username) {
  if (!GAS_URL) return null;
  try {
    const res = await fetch(
      `${GAS_URL}?action=scores&user=${encodeURIComponent(username)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const json = await res.json();
    return json.scores && Object.keys(json.scores).length > 0 ? json.scores : null;
  } catch {
    return null; // offline or GAS error — fall back to localStorage
  }
}

// ── Write all scores for a user back to Google Sheets ────────────────────────
// Fire-and-forget. Uses no-cors + form body to avoid CORS preflight issues
// with Google Apps Script.
export function saveScoresToSheets(username, scores) {
  if (!GAS_URL) return;
  try {
    const form = new URLSearchParams();
    form.append('payload', JSON.stringify({ action: 'scores', user: username, scores }));
    fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: form });
  } catch {}
}

// ── Append raw attempt rows to the "log" sheet ───────────────────────────────
// rows: [{ ts, username, itemId, topicId, correct, selectedOption, correctAnswer, prompt }]
// Fire-and-forget — never blocks the UI.
export function logQuizAttempts(rows) {
  if (!GAS_URL || !rows.length) return;
  try {
    const form = new URLSearchParams();
    form.append('payload', JSON.stringify({ action: 'log', rows }));
    fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: form });
  } catch {}
}

// ── Read attempt log rows for a user from Google Sheets ──────────────────────
// Returns array of log rows, or null if GAS doesn't support it / offline.
export async function loadLogsFromSheets(username) {
  if (!GAS_URL) return null;
  try {
    const res = await fetch(
      `${GAS_URL}?action=logs&user=${encodeURIComponent(username)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    return Array.isArray(json.logs) ? json.logs : null;
  } catch {
    return null;
  }
}
