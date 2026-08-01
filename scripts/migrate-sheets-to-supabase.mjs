// One-time backfill: copy each user's existing English vocab scores from the
// live Google Apps Script / Sheets backend into Supabase's `scores` table.
// Idempotent (per-item upsert) — safe to re-run.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/migrate-sheets-to-supabase.mjs
//
// The service role key bypasses RLS and must never be committed or shipped
// client-side — get it from Supabase dashboard > Project Settings > API,
// pass it as an env var for this one run only.

import { createClient } from '@supabase/supabase-js';
import { GAS_URL } from '../src/config.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iqbsrqdlvhtljhbbldme.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERS = ['NP_test', 'PB_test', 'ATV'];

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var. See usage comment at the top of this script.');
  process.exit(1);
}
if (!GAS_URL) {
  console.error('GAS_URL is empty in src/config.js — nothing to migrate from.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// GAS web apps can be slow to "cold start" after being idle — one retry
// before giving up on a timeout/network error.
async function fetchSheetScores(username, attempt = 1) {
  try {
    const res = await fetch(`${GAS_URL}?action=scores&user=${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (!json || typeof json.scores !== 'object' || json.scores === null) {
      throw new Error(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return json.scores; // { [itemId]: { correct, attempts, ef, interval, reps, nextReview, lastSeen } }
  } catch (err) {
    if (attempt < 2) return fetchSheetScores(username, attempt + 1);
    throw err;
  }
}

// Sheets silently coerced the app's clean "YYYY-MM-DD" strings into Date
// cells — reading them back through Apps Script's String(cell) now produces
// full JS Date.toString() output (e.g. "Thu Jun 18 2026 00:00:00 GMT+0530
// (India Standard Time)"), which a Postgres `date` column won't accept as-is.
// Only affects this one-time backfill — the new Supabase path never
// round-trips through Sheets, so this corruption can't recur going forward.
// Extracts the calendar date straight from the string instead of going
// through `new Date(...).toISOString()`, which would convert through UTC
// and shift the date backward by a day for any positive-offset timezone
// (e.g. midnight IST -> 18:30 the previous day UTC).
const MONTHS = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
function normalizeDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw; // already clean
  const m = raw.match(/^\w+ (\w+) (\d{1,2}) (\d{4})/); // "Thu Jun 18 2026 ..."
  if (m && MONTHS[m[1]]) return `${m[3]}-${MONTHS[m[1]]}-${m[2].padStart(2, '0')}`;
  return null; // unrecognized format — skip rather than guess wrong
}

function toRows(username, scores) {
  return Object.entries(scores).map(([itemId, r]) => ({
    username, subject: 'english', item_id: itemId,
    correct:     r.correct  || 0,
    attempts:    r.attempts || 0,
    ef:          r.ef       || 2.5,
    interval:    r.interval || 1,
    reps:        r.reps     || 0,
    next_review: normalizeDate(r.nextReview),
    last_seen:   normalizeDate(r.lastSeen),
    updated_at:  new Date().toISOString(),
  }));
}

let hadError = false;

for (const username of USERS) {
  try {
    const scores = await fetchSheetScores(username);
    const rows = toRows(username, scores);
    if (!rows.length) {
      console.log(`${username}: 0 items in Sheets — nothing to migrate (this is the genuine count, not a fetch failure).`);
      continue;
    }
    const { error } = await supabase.from('scores').upsert(rows, { onConflict: 'username,subject,item_id' });
    if (error) throw error;
    console.log(`${username}: migrated ${rows.length} item(s).`);
  } catch (err) {
    hadError = true;
    console.error(`${username}: FAILED — ${err.message}`);
  }
}

if (hadError) {
  console.error('\nOne or more users failed to migrate — re-run this script after fixing the issue above (it is safe to re-run, upserts are idempotent).');
  process.exit(1);
}
console.log('\nDone. Verify row counts in the Supabase dashboard against each Scores_<username> sheet tab before considering this complete — especially ATV.');
