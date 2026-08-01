import { supabase } from './supabaseClient.js';

// ── Scores ───────────────────────────────────────────────────────────────────
// Row shape (DB, snake_case) <-> app shape (camelCase, keyed by itemId):
//   { itemId: { correct, attempts, ef, interval, reps, nextReview, lastSeen } }

function rowToScore(row) {
  return {
    correct:    row.correct,
    attempts:   row.attempts,
    ef:         row.ef,
    interval:   row.interval,
    reps:       row.reps,
    nextReview: row.next_review || '',
    lastSeen:   row.last_seen || '',
  };
}

// Returns the scores object, or null if offline / Supabase not configured / error.
export async function loadScores(username, subject) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('item_id, correct, attempts, ef, interval, reps, next_review, last_seen')
      .eq('username', username)
      .eq('subject', subject);
    if (error || !data) return null;
    const scores = {};
    for (const row of data) scores[row.item_id] = rowToScore(row);
    return Object.keys(scores).length > 0 ? scores : null;
  } catch {
    return null; // offline or network error — fall back to localStorage
  }
}

// Per-item upsert (never delete-then-replace) — a stale local snapshot can
// only ever add/update the items it knows about, never erase items another
// device already synced.
export function saveScores(username, subject, scores) {
  if (!supabase) return;
  const rows = Object.entries(scores).map(([itemId, r]) => ({
    username, subject, item_id: itemId,
    correct:     r.correct    || 0,
    attempts:    r.attempts   || 0,
    ef:          r.ef         || 2.5,
    interval:    r.interval   || 1,
    reps:        r.reps       || 0,
    next_review: r.nextReview || null,
    last_seen:   r.lastSeen   || null,
    updated_at:  new Date().toISOString(),
  }));
  if (!rows.length) return;
  try {
    supabase.from('scores').upsert(rows, { onConflict: 'username,subject,item_id' }).then(() => {});
  } catch {}
}

// ── Attempt logs ─────────────────────────────────────────────────────────────
// rows: [{ ts, username, itemId, topicId, correct, selectedOption, correctAnswer, prompt }]
export function logAttempts(username, subject, rows) {
  if (!supabase || !rows.length) return;
  const dbRows = rows.map(r => ({
    username, subject,
    ts:              r.ts,
    item_id:         r.itemId,
    topic_id:        r.topicId,
    correct:         r.correct,
    selected_option: r.selectedOption || '',
    correct_answer:  r.correctAnswer  || '',
    prompt:          r.prompt         || '',
  }));
  try {
    supabase.from('attempt_logs').insert(dbRows).then(() => {});
  } catch {}
}

// Returns array of log rows shaped like the local wm_logs_* format, or null on error.
export async function loadLogs(username, subject) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('attempt_logs')
      .select('ts, item_id, topic_id, correct, selected_option, correct_answer, prompt')
      .eq('username', username)
      .eq('subject', subject)
      .order('ts', { ascending: true });
    if (error || !data) return null;
    return data.map(row => ({
      ts: row.ts, username, topicId: row.topic_id, itemId: row.item_id,
      correct: row.correct, selectedOption: row.selected_option,
      correctAnswer: row.correct_answer, prompt: row.prompt,
    }));
  } catch {
    return null;
  }
}

// ── Streak / coins / session meta ───────────────────────────────────────────
// One row per username — shared across subjects (matches existing local
// wm_meta_<username> behavior, which was never subject-specific).
export async function loadMeta(username) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_meta')
      .select('streak, last_study, sessions, coins')
      .eq('username', username)
      .maybeSingle();
    if (error || !data) return null;
    return { streak: data.streak, lastStudy: data.last_study || '', sessions: data.sessions, coins: data.coins };
  } catch {
    return null;
  }
}

export function saveMeta(username, meta) {
  if (!supabase) return;
  const row = {
    username,
    streak:     meta.streak     || 0,
    last_study: meta.lastStudy  || null,
    sessions:   meta.sessions   || 0,
    coins:      meta.coins      || 0,
    updated_at: new Date().toISOString(),
  };
  try {
    supabase.from('user_meta').upsert(row, { onConflict: 'username' }).then(() => {});
  } catch {}
}
