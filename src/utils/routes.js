// ── Deep-linkable URLs ───────────────────────────────────────────────────────
// Keeps the address bar in sync with a handful of bookmarkable/shareable
// screens (topic browse lists, fresh quizzes) so a link like /revise/similes
// or /quiz/synonyms/voice can be opened directly (after login — these pages
// are per-user, so there's no way around signing in first).
// Everything else (review, results, admin, teach, login) still gets a
// stable path for consistency, but isn't parsed back into a deep-link target.

export function pathForScreen(screen, ctx = {}) {
  const { topicId, subject, voice } = ctx;
  switch (screen) {
    case 'home':            return '/';
    case 'topic-select':    return '/topics';
    case 'geo-topic-select':return '/topics/geography';
    case 'revise':          return topicId ? `/revise/${topicId}` : '/topics';
    case 'test':
    case 'voice-test': {
      if (!topicId) return '/topics';
      const base = subject === 'geography' ? `/quiz/geo/${topicId}` : `/quiz/${topicId}`;
      return (screen === 'voice-test' || voice) ? `${base}/voice` : base;
    }
    case 'teach-ask':        return topicId ? `/teach/${topicId}` : '/topics';
    case 'review':           return '/review';
    case 'results':          return '/results';
    case 'admin':            return '/admin';
    case 'login':            return '/login';
    default:                 return '/';
  }
}

// Parses a pathname into a deep-link target: { screen, topicId, subject }.
// Returns null for anything that isn't a recognized, revisitable shape —
// callers should fall back to the normal post-login landing screen.
export function parseRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0] === 'revise' && parts[1]) {
    return { screen: 'revise', topicId: parts[1] };
  }
  if (parts[0] === 'quiz') {
    if (parts[1] === 'geo' && parts[2]) {
      return { screen: parts[3] === 'voice' ? 'voice-test' : 'test', topicId: parts[2], subject: 'geography' };
    }
    if (parts[1]) {
      return { screen: parts[2] === 'voice' ? 'voice-test' : 'test', topicId: parts[1], subject: 'english' };
    }
  }
  if (parts[0] === 'topics') {
    return parts[1] === 'geography' ? { screen: 'geo-topic-select' } : { screen: 'topic-select' };
  }
  return null;
}
