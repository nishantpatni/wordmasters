// ── Fuzzy voice-answer matching, shared by VoiceTest and TeachAndAsk ──────────

const ARTICLES = new Set(['a', 'an', 'the']);

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

const norm = s => s.toLowerCase().replace(/-/g, ' ').replace(/[^a-z\s]/g, '').trim();

export function scoreMatch(answer, transcript) {
  const ansWords = norm(answer).split(/\s+/).filter(w => w && !ARTICLES.has(w));
  const spkWords = norm(transcript).split(/\s+/).filter(w => w && !ARTICLES.has(w));
  const wordResults = ansWords.map(aw => {
    if (spkWords.includes(aw)) return { word: aw, matched: true };
    const maxDist = aw.length <= 4 ? 1 : 2;
    return { word: aw, matched: spkWords.some(sw => levenshtein(aw, sw) <= maxDist) };
  });
  const score = ansWords.length
    ? wordResults.filter(w => w.matched).length / ansWords.length
    : 0;
  return { score, wordResults };
}

// Accepts any one of several valid answers (e.g. multiple synonyms for a word) —
// scores the transcript against each and returns the best match, so the user
// only needs to say one of them, not all.
//
// `decoys` is an optional list of other same-category words that are wrong
// for this specific question (e.g. other collective nouns). Without this,
// someone can game a closed-vocabulary quiz by rattling off several guesses
// ("pride, herd, flock, string...") until one happens to match. If a decoy
// is detected in the transcript, the answer is forced wrong even though a
// correct word was also said.
// Shared by scoreMatchAny/scoreMatchAll: exact-word match only — decoys are
// real dictionary words the user would say deliberately and clearly, so
// fuzzy-matching them (like we do for the target answer) risks flagging
// ordinary STT noise as a hedge and wrongly failing an otherwise-correct answer.
function findHedge(decoys, spkWords, exemptWords) {
  for (const decoy of decoys) {
    const decoyWords = norm(decoy).split(/\s+/).filter(w => w && !ARTICLES.has(w));
    if (decoyWords.length > 0 && decoyWords.every(dw => !exemptWords.has(dw) && spkWords.includes(dw))) {
      return decoy;
    }
  }
  return null;
}

export function scoreMatchAny(answers, transcript, decoys = []) {
  let best = null;
  for (const answer of answers) {
    const result = scoreMatch(answer, transcript);
    if (!best || result.score > best.score) best = { ...result, answer };
  }
  if (best && best.score > 0 && decoys.length) {
    const spkWords = norm(transcript).split(/\s+/).filter(w => w && !ARTICLES.has(w));
    const answerWords = new Set(
      answers.flatMap(a => norm(a).split(/\s+/).filter(w => w && !ARTICLES.has(w)))
    );
    const hedgeWord = findHedge(decoys, spkWords, answerWords);
    if (hedgeWord) best = { ...best, score: 0, hedged: true, hedgeWord };
  }
  return best;
}

// Requires ALL of several valid answers (e.g. every completion of "as bright
// as ___", or every antonym/synonym of a word) — order doesn't matter, but
// each spoken word can only satisfy one required answer, so saying the same
// word twice doesn't count for two different required answers.
// `decoys` is an optional list of other same-category answers that are wrong
// for this specific question (e.g. adjectives valid for a different simile
// stem, or antonyms of a different word) — see scoreMatchAny's decoys param
// for why this exists. Without it, saying every required word AND a pile of
// unrelated guesses still passes, since claim() only checks presence.
export function scoreMatchAll(requiredAnswers, transcript, decoys = []) {
  const spkWords = norm(transcript).split(/\s+/).filter(w => w && !ARTICLES.has(w));
  const used = new Array(spkWords.length).fill(false);

  function claim(word) {
    let i = spkWords.findIndex((w, idx) => !used[idx] && w === word);
    if (i === -1) {
      const maxDist = word.length <= 4 ? 1 : 2;
      i = spkWords.findIndex((w, idx) => !used[idx] && levenshtein(word, w) <= maxDist);
    }
    if (i === -1) return false;
    used[i] = true;
    return true;
  }

  const wordResults = requiredAnswers.map(reqAnswer => {
    const reqWords = norm(reqAnswer).split(/\s+/).filter(w => w && !ARTICLES.has(w));
    const matched = reqWords.length > 0 && reqWords.every(claim);
    return { word: reqAnswer, matched };
  });
  let score = requiredAnswers.length
    ? wordResults.filter(w => w.matched).length / requiredAnswers.length
    : 0;

  let hedged = false, hedgeWord = null;
  if (score > 0 && decoys.length) {
    const requiredWords = new Set(
      requiredAnswers.flatMap(a => norm(a).split(/\s+/).filter(w => w && !ARTICLES.has(w)))
    );
    hedgeWord = findHedge(decoys, spkWords, requiredWords);
    if (hedgeWord) { hedged = true; score = 0; }
  }
  return { score, wordResults, hedged, hedgeWord };
}

export function formatAnswerList(answers, joiner = 'or') {
  if (answers.length === 1) return answers[0];
  if (answers.length === 2) return `${answers[0]} ${joiner} ${answers[1]}`;
  return `${answers.slice(0, -1).join(', ')}, ${joiner} ${answers[answers.length - 1]}`;
}
