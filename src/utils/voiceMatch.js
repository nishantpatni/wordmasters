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

export function scoreMatch(answer, transcript) {
  const norm     = s => s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
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

export function formatAnswerList(answers) {
  if (answers.length === 1) return answers[0];
  if (answers.length === 2) return `${answers[0]} or ${answers[1]}`;
  return `${answers.slice(0, -1).join(', ')}, or ${answers[answers.length - 1]}`;
}
