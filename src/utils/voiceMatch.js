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
export function scoreMatchAny(answers, transcript) {
  let best = null;
  for (const answer of answers) {
    const result = scoreMatch(answer, transcript);
    if (!best || result.score > best.score) best = { ...result, answer };
  }
  return best;
}

// Requires ALL of several valid answers (e.g. every completion of "as bright
// as ___", or every antonym/synonym of a word) — order doesn't matter, but
// each spoken word can only satisfy one required answer, so saying the same
// word twice doesn't count for two different required answers.
export function scoreMatchAll(requiredAnswers, transcript) {
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
  const score = requiredAnswers.length
    ? wordResults.filter(w => w.matched).length / requiredAnswers.length
    : 0;
  return { score, wordResults };
}

export function formatAnswerList(answers, joiner = 'or') {
  if (answers.length === 1) return answers[0];
  if (answers.length === 2) return `${answers[0]} ${joiner} ${answers[1]}`;
  return `${answers.slice(0, -1).join(', ')}, ${joiner} ${answers[answers.length - 1]}`;
}
