// ─────────────────────────────────────────────────────────────────────────────
//  GEO QUIZ ENGINE  — question generation for Indian Geography
//  Score storage re-uses quiz.js functions; callers pass "geo_<username>"
//  so Geography scores are namespaced separately from English vocab.
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_GEO_DATA } from '../data/geoTopicData.js';
import { memoryScore } from './quiz.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// excludeSet: Set of lowercased strings to exclude
function pickDistinct(pool, excludeSet, count) {
  const filtered = shuffle(pool.filter(v => v && !excludeSet.has(v.toLowerCase())));
  return filtered.slice(0, count);
}

function makeQ(topicId, itemId, prompt, options, correctIndex, explanation, correctIndices) {
  return {
    id: `${topicId}_${itemId}_${Date.now()}_${Math.random()}`,
    topicId, itemId, inputType: 'mcq',
    prompt, options, correctIndex,
    correctIndices: correctIndices ?? [correctIndex],
    explanation,
  };
}

// ── Question generators ────────────────────────────────────────────────────────

// Forward: "What is the capital of [Name]?"
function genCapitalForward(item, pool) {
  const correct = item.capital;
  const wrong = pickDistinct(pool.filter(i => i.id !== item.id).map(i => i.capital), new Set([correct.toLowerCase()]), 3);
  const opts = shuffle([correct, ...wrong]);
  return makeQ('statesCapitals', item.id,
    `What is the capital of ${item.name}?`,
    opts, opts.indexOf(correct),
    `Capital of ${item.name} = ${item.capital}`
  );
}

// Reverse: "Which state/UT has [Capital] as its capital?"
// Capitals shared by multiple states (Chandigarh → Haryana + Punjab + Chandigarh UT)
// are forced into options to produce a multi-select question.
function genCapitalReverse(item, pool) {
  const correct = item.name;
  const validNameSet = new Set(
    pool.filter(i => i.capital === item.capital).map(i => i.name.toLowerCase())
  );

  const otherValidNames = pool.filter(i => i.capital === item.capital && i.id !== item.id).map(i => i.name);
  const excludeAll = new Set(pool.filter(i => i.capital === item.capital).map(i => i.name.toLowerCase()));

  let wrong;
  if (otherValidNames.length > 0) {
    // Force all other valid names into options (e.g. Haryana + Punjab for Chandigarh)
    const forced = otherValidNames.slice(0, 2);
    const fillers = pickDistinct(
      pool.filter(i => i.capital !== item.capital).map(i => i.name),
      new Set([...excludeAll]),
      Math.max(1, 3 - forced.length)
    );
    wrong = shuffle([...forced, ...fillers]).slice(0, 3);
  } else {
    wrong = pickDistinct(
      pool.filter(i => i.capital !== item.capital).map(i => i.name),
      excludeAll,
      3
    );
  }

  const opts = shuffle([correct, ...wrong]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validNameSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;

  const explanation = pool
    .filter(i => i.capital === item.capital)
    .map(i => i.name)
    .join(' / ') + ` → ${item.capital}`;

  return makeQ('statesCapitals', item.id,
    isMulti
      ? `"${item.capital}" is the capital of which of the following? (Select ALL that apply)`
      : `"${item.capital}" is the capital of which state/UT?`,
    opts, opts.indexOf(correct), explanation, correctIndices
  );
}

let geoSubIdx = 0;
function genCapital(item, pool) {
  return geoSubIdx++ % 2 === 0 ? genCapitalForward(item, pool) : genCapitalReverse(item, pool);
}

// ── SM-2 prioritisation (mirrors quiz.js prioritiseItems) ─────────────────────
function prioritiseItems(items, scores) {
  const unseen = [], weak = [], strong = [];
  for (const item of items) {
    const rec = scores[item.id];
    if (!rec || !rec.attempts) unseen.push(item);
    else {
      const ms = memoryScore(rec);
      if (ms < 70) weak.push({ item, ms });
      else         strong.push({ item, nextReview: rec.nextReview || '' });
    }
  }
  return [
    ...shuffle(unseen),
    ...weak.sort((a, b) => a.ms - b.ms).map(x => x.item),
    ...strong.sort((a, b) => a.nextReview.localeCompare(b.nextReview)).map(x => x.item),
  ];
}

// ── Public: build MCQ test ────────────────────────────────────────────────────
export function buildGeoTest(topicId, count, scores = {}) {
  geoSubIdx = 0;
  const pool = ALL_GEO_DATA[topicId];
  if (!pool) return [];
  const questions = [];
  for (const item of prioritiseItems(pool, scores)) {
    if (questions.length >= count) break;
    const q = genCapital(item, pool);
    if (q) questions.push(q);
  }
  return questions;
}

// ── Public: build voice test ──────────────────────────────────────────────────
// Alternates forward ("Capital of X?") and reverse ("X is capital of?") per item.
// For shared capitals (Chandigarh), the voice answer is the individual state name —
// accepted as correct since VoiceTest does per-item matching.
export function buildGeoVoiceTest(topicId, count) {
  const pool = ALL_GEO_DATA[topicId] || [];
  return shuffle([...pool]).map((item, i) => {
    if (i % 2 === 0) {
      return {
        itemId: item.id, topicId,
        prompt:    `Capital of ${item.name}?`,
        ttsPrompt: `What is the capital of ${item.name}?`,
        answer:    item.capital,
      };
    }
    return {
      itemId: item.id, topicId,
      prompt: `Which state or UT has ${item.capital} as its capital?`,
      answer: item.name,
    };
  }).slice(0, count);
}

// ── Public: repractice wrong answers ─────────────────────────────────────────
export function buildGeoRepractice(incorrectResults) {
  geoSubIdx = 0;
  const questions = [];
  for (const r of incorrectResults) {
    const pool = ALL_GEO_DATA[r.topicId];
    if (!pool) continue;
    const item = pool.find(i => i.id === r.itemId);
    if (!item) continue;
    const q = genCapital(item, pool);
    if (q) questions.push(q);
  }
  return shuffle(questions);
}
