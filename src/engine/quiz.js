// ─────────────────────────────────────────────────────────────────────────────
//  QUIZ ENGINE  — question generation, SM2, memory scoring, storage
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_TOPIC_DATA, TRICKY_TOPIC_DATA, TOPIC_ORDER } from '../data/topicData.js';
import RAW_CONFUSION_GROUPS from '../data/confusionSets.json';
import TOPIC_QUIZ_CONFIG from '../data/quizTopicConfig.json';

// Build answer-word → sibling-words map once at module load (case-insensitive)
const CONFUSION_MAP = new Map();
for (const group of RAW_CONFUSION_GROUPS) {
  for (const word of group) {
    CONFUSION_MAP.set(word.toLowerCase(), group);
  }
}

function getConfusions(word) {
  if (!word) return null;
  const group = CONFUSION_MAP.get(word.toLowerCase());
  if (!group) return null;
  return group.filter(w => w.toLowerCase() !== word.toLowerCase());
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDistinct(pool, exclude, count) {
  const filtered = shuffle(pool.filter(v => v !== exclude && v !== undefined && v !== null));
  return filtered.slice(0, count);
}

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────
export function sm2Update(record, quality) {
  // quality: 1 = wrong, 3 = partial, 5 = perfect
  let { ef = 2.5, interval = 1, reps = 0 } = record || {};
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { ef, interval, reps, nextReview: next.toISOString().split('T')[0] };
}

// ── Memory Score ──────────────────────────────────────────────────────────────
export function memoryScore(record) {
  if (!record || record.attempts === 0) return 0;
  const accuracy = (record.correct / record.attempts) * 70;
  const sm = Math.min(30, Math.max(0, ((record.ef ?? 2.5) - 1.3) / 1.2 * 30));
  return Math.round(accuracy + sm);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Storage ───────────────────────────────────────────────────────────────────
export function getScores(username) {
  try { return JSON.parse(localStorage.getItem(`wm_${username}`) || '{}'); }
  catch { return {}; }
}

export function saveScores(username, scores) {
  localStorage.setItem(`wm_${username}`, JSON.stringify(scores));
}

export function batchUpdateScores(username, results) {
  // results: [{ itemId, correct }]
  const scores = getScores(username);
  for (const { itemId, correct } of results) {
    const rec = scores[itemId] || { ef: 2.5, interval: 1, reps: 0, correct: 0, attempts: 0 };
    rec.attempts = (rec.attempts || 0) + 1;
    if (correct) rec.correct = (rec.correct || 0) + 1;
    const quality = correct ? 5 : 1;
    Object.assign(rec, sm2Update(rec, quality));
    rec.lastSeen = todayStr();
    scores[itemId] = rec;
  }
  saveScores(username, scores);
}

export function isDue(record) {
  if (!record) return true;
  return (record.nextReview || todayStr()) <= todayStr();
}

// ── Attempt Log (local) ───────────────────────────────────────────────────────
export function getAttemptLogs(username) {
  try { return JSON.parse(localStorage.getItem(`wm_logs_${username}`) || '[]'); }
  catch { return []; }
}

export function saveAttemptLogs(username, rows) {
  const existing = getAttemptLogs(username);
  const trimmed = [...existing, ...rows].slice(-500); // keep latest 500
  localStorage.setItem(`wm_logs_${username}`, JSON.stringify(trimmed));
}

// ── Streak & Session Tracking ─────────────────────────────────────────────────
export function updateStreak(username) {
  const key = `wm_meta_${username}`;
  const meta = JSON.parse(localStorage.getItem(key) || '{"streak":0,"lastStudy":"","sessions":0}');
  const today = todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  if (meta.lastStudy !== today) {
    meta.streak = meta.lastStudy === yStr ? meta.streak + 1 : 1;
    meta.lastStudy = today;
  }
  meta.sessions = (meta.sessions || 0) + 1;
  localStorage.setItem(key, JSON.stringify(meta));
  return meta;
}

export function getMeta(username) {
  const key = `wm_meta_${username}`;
  return JSON.parse(localStorage.getItem(key) || '{"streak":0,"lastStudy":"","sessions":0,"coins":0}');
}

export function addCoins(username, amount) {
  if (!amount) return;
  const key = `wm_meta_${username}`;
  const meta = getMeta(username);
  meta.coins = (meta.coins || 0) + amount;
  localStorage.setItem(key, JSON.stringify(meta));
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUESTION GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

// Returns: { id, topicId, itemId, inputType:'mcq'|'fill', prompt, options, correctIndex, explanation }

function makeQ(topicId, itemId, inputType, prompt, options, correctIndex, explanation, correctIndices) {
  return { id: `${topicId}_${itemId}_${Date.now()}_${Math.random()}`, topicId, itemId, inputType, prompt, options, correctIndex, correctIndices: correctIndices ?? [correctIndex], explanation };
}

// ── Synonyms ──────────────────────────────────────────────────────────────────
let synSubIdx = 0;

function genSynonymForward(item, pool) {
  const correct = pick(item.synonyms);
  const confusions = getConfusions(correct);
  let wrong;
  if (confusions && confusions.length >= 3) {
    wrong = pickDistinct(confusions, correct, 3);
  } else {
    const distPool = pool.filter(i => i.id !== item.id).flatMap(i => i.synonyms);
    wrong = pickDistinct(distPool, correct, 3);
  }
  const opts = shuffle([correct, ...wrong]);
  const synonymSet = new Set(item.synonyms.map(s => s.toLowerCase()));
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (synonymSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('synonyms', item.id, 'mcq',
    isMulti
      ? `Select ALL synonyms of "${item.word}":`
      : `Which of the following is a synonym of "${item.word}"?`,
    opts, opts.indexOf(correct),
    `"${item.word}" means ${item.synonyms.join(', ')}.`,
    correctIndices
  );
}

function genSynonymReverse(item, pool) {
  const synonym = pick(item.synonyms);
  const wrong = pickDistinct(
    pool.filter(i => i.id !== item.id).map(i => i.word),
    item.word, 3
  );
  const opts = shuffle([item.word, ...wrong]);
  return makeQ('synonyms', item.id, 'mcq',
    `"${synonym}" is a synonym of which word?`,
    opts, opts.indexOf(item.word),
    `"${item.word}" means ${item.synonyms.join(', ')}.`
  );
}

function genSynonym(item, pool) {
  return synSubIdx++ % 2 === 0
    ? genSynonymForward(item, pool)
    : genSynonymReverse(item, pool);
}

// Forces at least 2 synonyms into options — used by multiselect enforcement
function genSynonymForced(item, pool) {
  if (item.synonyms.length < 2) return null;
  const synonymSet = new Set(item.synonyms.map(s => s.toLowerCase()));
  const [syn1, syn2] = shuffle([...item.synonyms]);
  const distPool = pool.filter(i => i.id !== item.id).flatMap(i => i.synonyms)
    .filter(w => !synonymSet.has(w.toLowerCase()));
  const fillers = pickDistinct(distPool, null, 2);
  const opts = shuffle([syn1, syn2, ...fillers.slice(0, 2)]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (synonymSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  return makeQ('synonyms', item.id, 'mcq',
    `Select ALL synonyms of "${item.word}":`,
    opts, opts.indexOf(syn1),
    `"${item.word}" means ${item.synonyms.join(', ')}.`,
    correctIndices
  );
}

// ── Antonyms ──────────────────────────────────────────────────────────────────
let antSubIdx = 0;

function genAntonymForward(item, pool) {
  const correct = item.antonym;

  // Valid antonyms = direct entries + their confusion-set synonyms
  // (synonyms of a valid antonym are also valid antonyms of the same word)
  const validAntonyms = new Set(
    pool.filter(i => i.word.toLowerCase() === item.word.toLowerCase())
        .map(i => i.antonym.toLowerCase())
  );
  for (const ant of [...validAntonyms]) {
    const synGroup = getConfusions(ant);
    if (synGroup) synGroup.forEach(s => validAntonyms.add(s.toLowerCase()));
  }

  // Synonyms of the question word — must not be distractors (too easy to eliminate)
  const qWordSyns = new Set((getConfusions(item.word.toLowerCase()) || []).map(s => s.toLowerCase()));

  // Clean distractor pool: antonyms of other unrelated words,
  // excluding anything that is a valid answer OR a synonym of the question word
  const cleanPool = pool
    .filter(i => i.word.toLowerCase() !== item.word.toLowerCase())
    .map(i => i.antonym)
    .filter(a => !validAntonyms.has(a.toLowerCase()) && !qWordSyns.has(a.toLowerCase()));

  let wrong = pickDistinct(cleanPool, correct, 3);
  // Fallback (very small data sets): allow non-valid antonyms from full pool
  if (wrong.length < 3) {
    wrong = pickDistinct(
      pool.filter(i => i.word.toLowerCase() !== item.word.toLowerCase() && !validAntonyms.has(i.antonym.toLowerCase()))
          .map(i => i.antonym),
      correct, 3
    );
  }

  const opts = shuffle([correct, ...wrong]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validAntonyms.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('antonyms', item.id, 'mcq',
    isMulti ? `Select ALL antonyms of "${item.word}":` : `What is the antonym of "${item.word}"?`,
    opts, opts.indexOf(correct),
    `The antonym of "${item.word}" is "${item.antonym}".`,
    correctIndices
  );
}

function genAntonymReverse(item, pool) {
  // Valid answers: all words whose antonym matches item.antonym, plus their synonyms
  const validWords = new Set(
    pool.filter(i => i.antonym.toLowerCase() === item.antonym.toLowerCase())
        .map(i => i.word.toLowerCase())
  );
  for (const w of [...validWords]) {
    const synGroup = getConfusions(w);
    if (synGroup) synGroup.forEach(s => validWords.add(s.toLowerCase()));
  }

  // Synonyms of the question's antonym value — avoid as distractors
  const antSyns = new Set((getConfusions(item.antonym.toLowerCase()) || []).map(s => s.toLowerCase()));

  const cleanPool = pool
    .filter(i => i.word.toLowerCase() !== item.word.toLowerCase())
    .map(i => i.word)
    .filter(w => !validWords.has(w.toLowerCase()) && !antSyns.has(w.toLowerCase()));

  let wrong = pickDistinct(cleanPool, item.word, 3);
  if (wrong.length < 3) {
    wrong = pickDistinct(
      pool.filter(i => i.word.toLowerCase() !== item.word.toLowerCase() && !validWords.has(i.word.toLowerCase()))
          .map(i => i.word),
      item.word, 3
    );
  }

  const opts = shuffle([item.word, ...wrong]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validWords.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('antonyms', item.id, 'mcq',
    isMulti ? `Select ALL antonyms of "${item.antonym}":` : `What is the antonym of "${item.antonym}"?`,
    opts, opts.indexOf(item.word),
    `The antonym of "${item.antonym}" is "${item.word}".`,
    correctIndices
  );
}

function genAntonym(item, pool) {
  return antSubIdx++ % 2 === 0
    ? genAntonymForward(item, pool)
    : genAntonymReverse(item, pool);
}

// ── Idioms ────────────────────────────────────────────────────────────────────
// New schema: { id, idiom, meaning } — no example field
let idiomSubIdx = 0;

function genIdiom(item, pool) {
  const others = pool.filter(i => i.id !== item.id);

  if (idiomSubIdx++ % 2 === 0) {
    const correct = item.meaning;
    const wrong = pickDistinct(others.map(i => i.meaning), correct, 3);
    const opts = shuffle([correct, ...wrong]);
    return makeQ('idioms', item.id, 'mcq',
      `What does the idiom "${item.idiom}" mean?`,
      opts, opts.indexOf(correct), `"${item.idiom}" — ${item.meaning}`
    );
  }
  const correct = item.idiom;
  const wrong = pickDistinct(others.map(i => i.idiom), correct, 3);
  const opts = shuffle([correct, ...wrong]);
  return makeQ('idioms', item.id, 'mcq',
    `Which idiom means: "${item.meaning}"?`,
    opts, opts.indexOf(correct), `Answer: ${item.idiom}`
  );
}

// ── One Word Substitutions ────────────────────────────────────────────────────
let owsSubIdx = 0;

function genOneWord(item, pool) {
  const useWordQ = owsSubIdx++ % 2 === 0;
  const others = pool.filter(i => i.id !== item.id);

  if (useWordQ) {
    const correct = item.word;
    const confusions = getConfusions(correct);
    let wrong;
    if (confusions && confusions.length >= 3) {
      wrong = pickDistinct(confusions, correct, 3);
    } else {
      wrong = pickDistinct(others.map(i => i.word), correct, 3);
    }
    const opts = shuffle([correct, ...wrong]);
    return makeQ('oneWordSubs', item.id, 'mcq',
      `Which single word means: "${item.phrase}"?`,
      opts, opts.indexOf(correct), `Answer: ${item.word}`
    );
  }
  const correct = item.phrase;
  const wrong = pickDistinct(others.map(i => i.phrase), correct, 3);
  const opts = shuffle([correct, ...wrong]);
  return makeQ('oneWordSubs', item.id, 'mcq',
    `"${item.word}" refers to:`,
    opts, opts.indexOf(correct), `Definition: ${item.phrase}`
  );
}

// ── Similes ───────────────────────────────────────────────────────────────────
// New schema: { id, simile } where simile = "As X as Y"
function parseSimile(simileStr) {
  const m = simileStr.match(/^[Aa]s\s+(.+?)\s+[Aa]s\s+(.+)$/i);
  return m ? { adjective: m[1].trim(), comparator: m[2].trim() } : { adjective: simileStr, comparator: '' };
}

let simileSubIdx = 0;

function genSimile(item, pool) {
  const { adjective, comparator } = parseSimile(item.simile);

  if (simileSubIdx++ % 2 === 0) {
    // "as brave as ___?" → correct = comparator
    const correct = comparator;
    const wrong = pickDistinct(
      pool.filter(i => i.id !== item.id).map(i => parseSimile(i.simile).comparator).filter(Boolean),
      correct, 3
    );
    const opts = shuffle([correct, ...wrong]);
    return makeQ('similes', item.id, 'mcq',
      `Complete the simile: "as ${adjective} as ___"`,
      opts, opts.indexOf(correct), item.simile
    );
  }
  // "as ___ as a lion?" → correct = adjective; multiple adjectives can share a comparator
  const correct = adjective;
  const wrong = pickDistinct(
    pool.filter(i => i.id !== item.id).map(i => parseSimile(i.simile).adjective).filter(Boolean),
    correct, 3
  );
  const opts = shuffle([correct, ...wrong]);
  const validAdjectives = new Set(
    pool.map(i => parseSimile(i.simile))
      .filter(p => p.comparator.toLowerCase() === comparator.toLowerCase())
      .map(p => p.adjective.toLowerCase())
  );
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validAdjectives.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('similes', item.id, 'mcq',
    `Complete the simile: "as ___ as ${comparator}"`,
    opts, opts.indexOf(correct), item.simile,
    correctIndices
  );
}

// ── Oxymorons ─────────────────────────────────────────────────────────────────
// New schema: { id, phrase, meaning, example }
function shortMeaning(text) {
  const cut = text.indexOf(' / ');
  if (cut > 0) return text.slice(0, cut).trim();
  const m = text.match(/^(.+?\.) [A-Z]/);
  return m ? m[1] : text;
}

let oxySubIdx = 0;

function genOxymoron(item, pool) {
  const others = pool.filter(i => i.id !== item.id);
  const meaning = shortMeaning(item.meaning);
  const subtype = oxySubIdx++ % 3;

  if (subtype === 0) {
    // "What does 'Act Naturally' mean?" → pick meaning
    const correct = meaning;
    const wrong = pickDistinct(others.map(i => shortMeaning(i.meaning)), correct, 3);
    const opts = shuffle([correct, ...wrong]);
    return makeQ('oxymorons', item.id, 'mcq',
      `What does the oxymoron "${item.phrase}" mean?`,
      opts, opts.indexOf(correct), `Example: ${item.example}`
    );
  }

  if (subtype === 1) {
    // "Which oxymoron means X?" → pick phrase
    const correct = item.phrase;
    const wrong = pickDistinct(others.map(i => i.phrase), correct, 3);
    const opts = shuffle([correct, ...wrong]);
    return makeQ('oxymorons', item.id, 'mcq',
      `Which of these is an oxymoron that means: "${meaning}"?`,
      opts, opts.indexOf(correct), `Example: ${item.example}`
    );
  }

  // subtype === 2: Fill one word of the oxymoron pair — "Act ___" or "___ Naturally"
  const words = item.phrase.trim().split(/\s+/);
  if (words.length < 2) {
    // Fallback to phrase_to_meaning for single-word edge cases
    const correct = meaning;
    const wrong = pickDistinct(others.map(i => shortMeaning(i.meaning)), correct, 3);
    const opts = shuffle([correct, ...wrong]);
    return makeQ('oxymorons', item.id, 'mcq',
      `What does the oxymoron "${item.phrase}" mean?`,
      opts, opts.indexOf(correct), `Example: ${item.example}`
    );
  }
  const hideIdx = Math.floor(Math.random() * words.length);
  const correct = words[hideIdx];
  const blanked = words.map((w, i) => i === hideIdx ? '___' : w).join(' ');
  const wrongPool = others.flatMap(i => i.phrase.trim().split(/\s+/));
  const wrong = pickDistinct(wrongPool, correct, 3);
  const opts = shuffle([correct, ...wrong]);
  return makeQ('oxymorons', item.id, 'mcq',
    `Complete the oxymoron: "${blanked}"`,
    opts, opts.indexOf(correct),
    `Full phrase: "${item.phrase}" — ${meaning}`
  );
}

// ── Collective Nouns ──────────────────────────────────────────────────────────
// Schema: { id, phrase, collective, noun }
// Subtypes driven by quizTopicConfig: "forward" and "reverse"

// Forward: "What is the collective noun for a group of [noun]?"
// When noun has multiple collectives, force one into the options to guarantee multiselect.
function genCollectiveForward(item, pool) {
  const correct = item.collective;
  const validCollectiveSet = new Set(
    pool.filter(i => i.noun.toLowerCase() === item.noun.toLowerCase())
      .map(i => i.collective.toLowerCase())
  );

  const otherValidCollectives = pool.filter(i =>
    i.noun.toLowerCase() === item.noun.toLowerCase() &&
    i.collective.toLowerCase() !== correct.toLowerCase()
  ).map(i => i.collective);

  let wrong;
  if (otherValidCollectives.length > 0) {
    const forced = pick(otherValidCollectives);
    const fillers = pickDistinct(
      pool.filter(i => i.noun.toLowerCase() !== item.noun.toLowerCase()).map(i => i.collective),
      correct, 2
    );
    wrong = shuffle([forced, ...fillers]);
  } else {
    wrong = pickDistinct(
      pool.filter(i => i.noun.toLowerCase() !== item.noun.toLowerCase()).map(i => i.collective),
      correct, 3
    );
  }

  const opts = shuffle([correct, ...wrong]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validCollectiveSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('collectiveNouns', item.id, 'mcq',
    isMulti
      ? `Select ALL collective nouns for a group of ${item.noun}:`
      : `What is the collective noun for a group of ${item.noun}?`,
    opts, opts.indexOf(correct), `${item.phrase}`, correctIndices
  );
}

// Reverse: "A [collective] of ___?" — naturally multiselect when collective maps to multiple nouns.
function genCollectiveReverse(item, pool) {
  const correct = item.noun;
  const validNounSet = new Set(
    pool.filter(i => i.collective.toLowerCase() === item.collective.toLowerCase())
      .map(i => i.noun.toLowerCase())
  );

  const wrongPool = pool
    .filter(i => i.collective.toLowerCase() !== item.collective.toLowerCase())
    .map(i => i.noun);
  const wrong = pickDistinct(wrongPool, correct, 3);

  const opts = shuffle([correct, ...wrong]);
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (validNounSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  const isMulti = correctIndices.length > 1;
  return makeQ('collectiveNouns', item.id, 'mcq',
    isMulti
      ? `"${item.collective}" is a collective noun for which of the following? (Select ALL that apply)`
      : `"A ${item.collective} of ___" — what goes in the blank?`,
    opts, opts.indexOf(correct), `${item.phrase}`, correctIndices
  );
}

let collectiveSubIdx = 0;

function genCollective(item, pool) {
  return collectiveSubIdx++ % 2 === 0
    ? genCollectiveForward(item, pool)
    : genCollectiveReverse(item, pool);
}

// ── Homophones / Homonyms / Homographs ───────────────────────────────────────
function genHomophone(item, pool) {
  if (item.qType === 'fill_blank') {
    const correct = item.answer;
    const wrong = item.options.filter(o => o !== correct).slice(0, 3);
    // pad if needed
    const othersPool = pool.filter(i => i.id !== item.id && i.qType === 'fill_blank').map(i => i.answer);
    while (wrong.length < 3) wrong.push(pick(othersPool) || 'word');
    const opts = shuffle([correct, ...wrong.slice(0, 3)]);
    return makeQ('homophones', item.id, 'mcq',
      `Choose the correct word: "${item.sentence}"`,
      opts, opts.indexOf(correct),
      `(${item.label}) — correct: "${item.answer}"`
    );
  }
  // meaning_identify
  const correct = item.answer;
  const opts = shuffle([...item.options]);
  return makeQ('homophones', item.id, 'mcq',
    `In the sentence "${item.sentence}" — what does "${item.targetWord}" mean?`,
    opts, opts.indexOf(correct),
    `"${item.targetWord}" here means: ${item.answer}`
  );
}

// ── Proverbs ──────────────────────────────────────────────────────────────────
const PROVERB_SUBTYPES = ['proverb_to_meaning', 'meaning_to_proverb', 'usage_mcq'];
let proverbSubIdx = 0;

function genProverb(item, pool) {
  const subtype = PROVERB_SUBTYPES[proverbSubIdx++ % 3];
  const others = pool.filter(i => i.id !== item.id);

  if (subtype === 'proverb_to_meaning') {
    const correct = item.meaning;
    const wrong = pickDistinct(others.map(i => i.meaning), correct, 3);
    const opts = shuffle([correct, ...wrong]);
    return makeQ('proverbs', item.id, 'mcq',
      `What does this proverb mean?\n"${item.proverb}"`,
      opts, opts.indexOf(correct), `Example: ${item.example}`
    );
  }
  if (subtype === 'meaning_to_proverb') {
    const correct = item.proverb;
    const confusions = getConfusions(correct);
    let wrong;
    if (confusions && confusions.length >= 3) {
      wrong = pickDistinct(confusions, correct, 3);
    } else {
      wrong = pickDistinct(others.map(i => i.proverb), correct, 3);
    }
    const opts = shuffle([correct, ...wrong]);
    return makeQ('proverbs', item.id, 'mcq',
      `Which proverb best expresses:\n"${item.meaning}"?`,
      opts, opts.indexOf(correct), `Answer: ${item.proverb}`
    );
  }
  // usage_mcq — situational
  const correct = item.proverb;
  const wrong = pickDistinct(others.map(i => i.proverb), correct, 3);
  const opts = shuffle([correct, ...wrong]);
  const blankEx = item.example.includes(item.proverb)
    ? item.example.replace(item.proverb, '___')
    : item.example + ' Which proverb fits this?';
  return makeQ('proverbs', item.id, 'mcq',
    blankEx,
    opts, opts.indexOf(correct), `Answer: ${item.proverb}`
  );
}

// ── Generator Dispatch ────────────────────────────────────────────────────────
const GENERATORS = {
  synonyms:        genSynonym,
  antonyms:        genAntonym,
  idioms:          genIdiom,
  oneWordSubs:     genOneWord,
  similes:         genSimile,
  oxymorons:       genOxymoron,
  collectiveNouns: genCollective,
  homophones:      genHomophone,
  proverbs:        genProverb,
};

// ── Multiselect Enforcement ───────────────────────────────────────────────────
// Attempts to generate a guaranteed multiselect question for a given item.
// Returns null if the item can't produce one.
function genForcedMulti(topicId, item, pool) {
  if (topicId === 'collectiveNouns') {
    // Reverse questions are multiselect whenever collective maps to multiple nouns
    const q = genCollectiveReverse(item, pool);
    return (q.correctIndices?.length ?? 0) > 1 ? q : null;
  }
  if (topicId === 'synonyms') {
    return genSynonymForced(item, pool);
  }
  if (topicId === 'similes') {
    // fill_adjective direction can be multiselect when multiple adjectives share a comparator
    const { adjective, comparator } = parseSimile(item.simile);
    const correct = adjective;
    const wrong = pickDistinct(
      pool.filter(i => i.id !== item.id).map(i => parseSimile(i.simile).adjective).filter(Boolean),
      correct, 3
    );
    const opts = shuffle([correct, ...wrong]);
    const validAdjectives = new Set(
      pool.map(i => parseSimile(i.simile))
        .filter(p => p.comparator.toLowerCase() === comparator.toLowerCase())
        .map(p => p.adjective.toLowerCase())
    );
    const correctIndices = opts.reduce((acc, opt, i) => {
      if (validAdjectives.has(opt.toLowerCase())) acc.push(i);
      return acc;
    }, []);
    if (correctIndices.length <= 1) return null;
    return makeQ('similes', item.id, 'mcq',
      `Complete the simile: "as ___ as ${comparator}"`,
      opts, opts.indexOf(correct), item.simile, correctIndices
    );
  }
  return null;
}

function enforceMultiselectRatio(topicId, questions) {
  const cfg = TOPIC_QUIZ_CONFIG[topicId];
  if (!cfg || cfg.minMultiselectRatio <= 0) return questions;

  const target = Math.ceil(questions.length * cfg.minMultiselectRatio);
  let multiCount = questions.filter(q => (q.correctIndices?.length ?? 0) > 1).length;
  if (multiCount >= target) return questions;

  const pool = ALL_TOPIC_DATA[topicId];
  const result = [...questions];
  for (let i = 0; i < result.length && multiCount < target; i++) {
    if ((result[i].correctIndices?.length ?? 0) > 1) continue;
    const item = pool.find(it => it.id === result[i].itemId);
    if (!item) continue;
    const forced = genForcedMulti(topicId, item, pool);
    if (forced && (forced.correctIndices?.length ?? 0) > 1) {
      result[i] = forced;
      multiCount++;
    }
  }
  return result;
}

// ── Prioritise items: unseen → weak (worst first) → strong (most overdue first) ─
function prioritiseItems(items, scores) {
  const unseen = [];
  const weak   = [];
  const strong = [];

  for (const item of items) {
    const rec = scores[item.id];
    if (!rec || !rec.attempts) {
      unseen.push(item);
    } else {
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

// ── Public: build practice questions for a specific set of items ─────────────
export function buildRepractice(incorrectResults) {
  synSubIdx = 0; antSubIdx = 0; idiomSubIdx = 0; owsSubIdx = 0;
  simileSubIdx = 0; oxySubIdx = 0; proverbSubIdx = 0; collectiveSubIdx = 0;

  const questions = [];
  for (const r of incorrectResults) {
    const pool = ALL_TOPIC_DATA[r.topicId];
    if (!pool) continue;

    // Check tricky pool first (pre-built questions)
    const trickyPool = TRICKY_TOPIC_DATA[r.topicId] || [];
    const trickyItem = trickyPool.find(i => i.id === r.itemId);
    if (trickyItem) {
      const q = buildTrickyQ(r.topicId, trickyItem);
      if (q) questions.push(q);
      continue;
    }

    const item = pool.find(i => i.id === r.itemId);
    if (!item) continue;
    const gen = GENERATORS[r.topicId];
    if (!gen) continue;
    try {
      const q = gen(item, pool);
      if (q) questions.push(q);
    } catch (_) {}
  }
  return shuffle(questions);
}

// ── Tricky question converter ─────────────────────────────────────────────────
// Tricky JSONs are pre-built questions with curated options; convert to standard format.
function buildTrickyQ(topicId, item) {
  const opts = item.options.map(o => o.text);
  const correctSet = new Set(item.correctAnswers.map(a => a.toLowerCase()));
  const correctIndices = opts.reduce((acc, opt, i) => {
    if (correctSet.has(opt.toLowerCase())) acc.push(i);
    return acc;
  }, []);
  return makeQ(
    topicId, item.id, 'mcq',
    item.question,
    opts,
    correctIndices[0] ?? 0,
    `Answer: ${item.correctAnswers.join(', ')}`,
    correctIndices
  );
}

function addTrickyQuestions(topicId, trickyItems, scores, questions, limit) {
  for (const item of prioritiseItems(trickyItems, scores)) {
    if (questions.length >= limit) break;
    const q = buildTrickyQ(topicId, item);
    if (q) questions.push(q);
  }
}

function addRegularQuestions(topicId, regularItems, scores, questions, limit) {
  for (const item of prioritiseItems(regularItems, scores)) {
    if (questions.length >= limit) break;
    const q = GENERATORS[topicId](item, regularItems);
    if (q) questions.push(q);
  }
}

// ── Public: build a test question list ───────────────────────────────────────
export function buildTest(topicId, count, scores = {}) {
  synSubIdx = 0; antSubIdx = 0; idiomSubIdx = 0; owsSubIdx = 0;
  simileSubIdx = 0; oxySubIdx = 0; proverbSubIdx = 0; collectiveSubIdx = 0;

  const questions = [];

  if (topicId === 'mixed') {
    const liveTids = TOPIC_ORDER.filter(tid => ALL_TOPIC_DATA[tid].length > 0);
    const perTopic = Math.ceil(count / liveTids.length);
    for (const tid of liveTids) {
      const before = questions.length;
      addTrickyQuestions(tid, TRICKY_TOPIC_DATA[tid] || [], scores, questions, before + perTopic);
      addRegularQuestions(tid, ALL_TOPIC_DATA[tid], scores, questions, before + perTopic);
    }
    return shuffle(questions).slice(0, count);
  }

  // Tricky items surface first (unseen → weak → strong within their own pool),
  // then regular items fill the remainder.
  addTrickyQuestions(topicId, TRICKY_TOPIC_DATA[topicId] || [], scores, questions, count);
  addRegularQuestions(topicId, ALL_TOPIC_DATA[topicId], scores, questions, count);

  return enforceMultiselectRatio(topicId, questions);
}

// ── Voice Quiz ────────────────────────────────────────────────────────────────
// Returns questions shaped { itemId, topicId, prompt, ttsPrompt?, answer, altAnswers? }
// for VoiceTest — any ONE of answer/altAnswers is accepted.
// Or { itemId, topicId, prompt, ttsPrompt?, requiredAnswers } — ALL of
// requiredAnswers must be spoken (in any order) to be marked correct.
// ttsPrompt overrides prompt for TTS when the display text isn't ideal to speak aloud.
function itemToVoiceQ(topicId, item) {
  switch (topicId) {
    case 'idioms':
      return { prompt: item.meaning, answer: item.idiom };
    case 'oneWordSubs':
      return { prompt: item.phrase, answer: item.word };
    case 'proverbs':
      return { prompt: item.meaning, answer: item.proverb };
    case 'oxymorons':
      return { prompt: item.meaning.split(' / ')[0], answer: item.phrase };
    case 'similes': {
      // Single-item form (used by Teach & Ask) — the full voice quiz uses
      // buildSimileVoiceQs() below to group same-stem items instead.
      const m = item.simile.match(/^As\s+(.+?)\s+as\s+(.+)$/i);
      if (!m) return null;
      return {
        prompt:    `As ${m[1].trim()} as ___`,
        ttsPrompt: `As ${m[1].trim()} as...?`,
        answer:    expandSlashAlternates(m[2].replace(/\\/g, '/'))[0],
      };
    }
    case 'antonyms':
      // Single-item form (used by Teach & Ask) — the full voice quiz uses
      // buildAntonymVoiceQs() below to group same-word items instead.
      return { prompt: item.word, ttsPrompt: `What's the antonym of ${item.word}?`, answer: item.antonym };
    case 'synonyms':
      // All synonyms must be spoken (in any order).
      return {
        prompt:          item.word,
        ttsPrompt:       item.synonyms.length > 1 ? `Say all the synonyms for ${item.word}` : `Say a synonym for ${item.word}`,
        requiredAnswers: item.synonyms,
      };
    case 'collectiveNouns': {
      // Some nouns (e.g. "Flowers") have more than one valid collective —
      // accept any of them, mirroring the MCQ's forced-multiselect handling.
      const pool = ALL_TOPIC_DATA.collectiveNouns || [];
      const altAnswers = [...new Set(
        pool
          .filter(i => i.noun.toLowerCase() === item.noun.toLowerCase() && i.collective.toLowerCase() !== item.collective.toLowerCase())
          .map(i => i.collective)
      )];
      return {
        prompt:    item.noun,
        ttsPrompt: `What's the collective noun for a group of ${item.noun}?`,
        answer:    item.collective,
        altAnswers,
      };
    }
    default:
      return null;
  }
}

// A completion like "two peas/beans" means "two peas" OR "two beans" — expand
// the slash-alternated token into full standalone phrases.
function expandSlashAlternates(phrase) {
  const tokens = phrase.trim().split(/\s+/);
  const slashIdx = tokens.findIndex(t => t.includes('/'));
  if (slashIdx === -1) return [phrase.trim()];
  return tokens[slashIdx].split('/').filter(Boolean).map(alt => {
    const copy = [...tokens];
    copy[slashIdx] = alt;
    return copy.join(' ');
  });
}

// Similes data has one JSON entry per completion (e.g. "As bright as a
// diamond" / "...a flame" / "...the sun" are 3 separate items) — group them
// by stem so the voice quiz asks the stem once and expects every completion.
function buildSimileVoiceQs(raw) {
  const groups = new Map();
  for (const item of raw) {
    const m = item.simile.match(/^As\s+(.+?)\s+as\s+(.+)$/i);
    if (!m) continue;
    const stem = m[1].trim().toLowerCase();
    if (!groups.has(stem)) {
      groups.set(stem, {
        itemId:      item.id,
        prompt:      `As ${m[1].trim()} as ___`,
        ttsPrompt:   `As ${m[1].trim()} as...?`,
        completions: new Set(),
      });
    }
    expandSlashAlternates(m[2].replace(/\\/g, '/')).forEach(c => groups.get(stem).completions.add(c));
  }
  return [...groups.values()].map(g => ({
    itemId:          g.itemId,
    prompt:          g.prompt,
    ttsPrompt:       g.ttsPrompt,
    requiredAnswers: [...g.completions],
  }));
}

// Antonyms data also has one JSON entry per valid antonym for some words
// (e.g. "Amusing" → Serious/Dull/Solemn/Boring/Grave are 5 separate items) —
// group them so the voice quiz expects every antonym.
function buildAntonymVoiceQs(raw) {
  const groups = new Map();
  for (const item of raw) {
    const key = item.word.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { itemId: item.id, word: item.word, antonyms: new Set() });
    groups.get(key).antonyms.add(item.antonym.trim());
  }
  return [...groups.values()].map(g => ({
    itemId:          g.itemId,
    prompt:          g.word,
    ttsPrompt:       g.antonyms.size > 1 ? `What are the antonyms of ${g.word}?` : `What's the antonym of ${g.word}?`,
    requiredAnswers: [...g.antonyms],
  }));
}

export function buildVoiceTest(topicId, count) {
  const raw = ALL_TOPIC_DATA[topicId] || [];
  let list;
  if (topicId === 'similes') {
    list = buildSimileVoiceQs(raw);
  } else if (topicId === 'antonyms') {
    list = buildAntonymVoiceQs(raw);
  } else {
    list = raw
      .map(item => {
        const q = itemToVoiceQ(topicId, item);
        return q ? { itemId: item.id, ...q } : null;
      })
      .filter(Boolean);
  }
  return shuffle(list.map(q => ({ topicId, ...q }))).slice(0, count);
}

// ── Teach Session ─────────────────────────────────────────────────────────────
export function buildTeachSession(topicId, count = 9, scores = {}) {
  const raw = ALL_TOPIC_DATA[topicId] || [];
  const prioritized = prioritiseItems(raw, scores);
  return prioritized.slice(0, Math.min(count, prioritized.length));
}

export function buildTeachMCQ(topicId, targetItem) {
  const pool = ALL_TOPIC_DATA[topicId] || [];
  const gen = GENERATORS[topicId];
  if (!gen) return null;
  try { return gen(targetItem, pool); } catch { return null; }
}

export function getVoiceQ(topicId, item) {
  const q = itemToVoiceQ(topicId, item);
  if (!q) return null;
  return { itemId: item.id, topicId, ...q };
}
