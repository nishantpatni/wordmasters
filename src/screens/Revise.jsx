import { useState, useMemo } from 'react';
import { ALL_TOPIC_DATA, TOPIC_META } from '../data/topicData.js';
import { getScores, memoryScore } from '../engine/quiz.js';
import { getTheme } from '../utils/theme.js';

// ── How to display each topic's items ─────────────────────────────────────────
function getDisplay(topicId, item) {
  switch (topicId) {
    case 'synonyms':        return { left: item.word,    right: item.synonyms.join(', ') };
    case 'antonyms':        return { left: item.word,    right: item.antonym };
    case 'oneWordSubs':     return { left: item.word,    right: item.phrase };
    case 'proverbs':        return { left: item.proverb, right: item.meaning, tall: true };
    case 'collectiveNouns': return { left: item.noun,    right: item.collective };
    case 'idioms':          return { left: item.idiom,   right: item.meaning, tall: true };
    case 'oxymorons':       return { left: item.phrase,  right: item.meaning };
    case 'similes':
    case 'vocabopediaSimiles': {
      const m = item.simile.match(/^[Aa]s\s+(.+?)\s+[Aa]s\s+(.+)$/i);
      return m ? { left: `as ${m[1]} as…`, right: m[2] } : { left: item.simile, right: '' };
    }
    default:                return { left: item.id,      right: '' };
  }
}

function statusOf(rec) {
  if (!rec || !rec.attempts) return 'unseen';
  return memoryScore(rec) >= 70 ? 'strong' : 'weak';
}

const STATUS_ORDER = { unseen: 0, weak: 1, strong: 2 };

function badgeStyles(theme) {
  return {
    unseen: { background: theme.pillNeutralBg, color: theme.textFaint },
    weak:   { background: theme.warnBg, color: theme.warnText },
    strong: { background: theme.correctBg, color: theme.correctText },
  };
}

function stripeColor(theme) {
  return { unseen: theme.optionBorder, weak: '#FCD34D', strong: '#96F878' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Revise({ topicId, username, onBack, darkMode }) {
  const [sortBy, setSortBy] = useState('status'); // 'status' | 'az' | 'score'
  const [search, setSearch] = useState('');

  const theme       = getTheme(darkMode);
  const styles       = themedStyles(theme);
  const BADGE_STYLES = badgeStyles(theme);
  const STRIPE_COLOR = stripeColor(theme);

  const meta   = TOPIC_META[topicId] || { color: '#6C4EE0', bg: '#F5F3FF', name: topicId, icon: '📖' };
  const items  = ALL_TOPIC_DATA[topicId] || [];
  const scores = useMemo(() => getScores(username), [username]);

  // Enrich each item with display text + score info
  const enriched = useMemo(() => items.map(item => {
    const rec    = scores[item.id];
    const score  = rec?.attempts ? memoryScore(rec) : -1;
    const status = statusOf(rec);
    const disp   = getDisplay(topicId, item);
    return { item, rec, score, status, ...disp };
  }), [items, scores, topicId]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter(e =>
      e.left.toLowerCase().includes(q) || e.right.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  // Sort
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === 'az') return a.left.localeCompare(b.left);
    if (sortBy === 'score') {
      // unseen treated as 999 (review last when filtering by score)
      const sa = a.score < 0 ? 999 : a.score;
      const sb = b.score < 0 ? 999 : b.score;
      return sa - sb;
    }
    // default: unseen → weak (worst first) → strong (most overdue first)
    const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (diff !== 0) return diff;
    if (a.status === 'weak')   return a.score - b.score;
    if (a.status === 'strong') return (a.rec?.nextReview || '').localeCompare(b.rec?.nextReview || '');
    return 0;
  }), [filtered, sortBy]);

  // Summary counts (always based on full enriched, not filtered)
  const counts = useMemo(() => ({
    unseen: enriched.filter(e => e.status === 'unseen').length,
    weak:   enriched.filter(e => e.status === 'weak').length,
    strong: enriched.filter(e => e.status === 'strong').length,
  }), [enriched]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 18, color: meta.color }}>
          {meta.icon} {meta.name}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textFainter }}>
          {items.length} items
        </div>
      </div>

      {/* Search + sort controls */}
      <div style={styles.controls}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          style={styles.searchInput}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'status', label: 'Status' },
            { id: 'az',     label: 'A–Z' },
            { id: 'score',  label: 'Score ↑' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              style={{
                ...styles.sortBtn,
                ...(sortBy === opt.id
                  ? { background: meta.color, color: '#fff', borderColor: meta.color }
                  : {}),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <span style={{ color: theme.textFaint, fontWeight: 700 }}>New</span>
        <span style={styles.statNum}>{counts.unseen}</span>
        <span style={styles.dot}>·</span>
        <span style={{ color: '#F59E0B', fontWeight: 700 }}>Weak</span>
        <span style={styles.statNum}>{counts.weak}</span>
        <span style={styles.dot}>·</span>
        <span style={{ color: '#10A07A', fontWeight: 700 }}>Strong</span>
        <span style={styles.statNum}>{counts.strong}</span>
        {search.trim() && (
          <>
            <span style={styles.dot}>·</span>
            <span style={{ color: meta.color, fontWeight: 700 }}>{sorted.length} shown</span>
          </>
        )}
      </div>

      {/* Item list */}
      <div style={styles.list}>
        {sorted.map(({ item, rec, score, status, left, right, tall }) => (
          <div
            key={item.id}
            style={{ ...styles.row, borderLeft: `3px solid ${STRIPE_COLOR[status]}` }}
          >
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {tall ? (
                <>
                  <div style={styles.proverbMain}>{left}</div>
                  <div style={styles.proverbSub}>{right}</div>
                </>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 }}>
                  <span style={styles.wordLeft}>{left}</span>
                  <span style={styles.arrow}>→</span>
                  <span style={styles.wordRight}>{right}</span>
                </div>
              )}
            </div>

            {/* Score badge */}
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <span style={{ ...styles.pill, ...BADGE_STYLES[status] }}>
                {status === 'unseen' && 'New'}
                {status === 'weak'   && `${score}%`}
                {status === 'strong' && `✓ ${score}%`}
              </span>
              {rec?.attempts > 0 && (
                <div style={{ fontSize: 10, color: theme.textFainter, marginTop: 3 }}>
                  {rec.correct}/{rec.attempts}
                </div>
              )}
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', color: theme.textFainter, padding: '60px 0', fontSize: 14, fontWeight: 600 }}>
            No results for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

function themedStyles(theme) {
  return {
    page: { minHeight: '100vh', background: theme.pageBg, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    header: {
      background: theme.headerBg, borderBottom: `1px solid ${theme.headerBorder}`,
      padding: '14px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      boxShadow: theme.cardShadow,
    },
    backBtn: {
      background: 'transparent', border: `1px solid ${theme.panelBorder}`, borderRadius: 10,
      padding: '7px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: theme.textPrimary,
    },
    controls: {
      padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center',
      flexWrap: 'wrap', background: theme.headerBg, borderBottom: `1px solid ${theme.headerBorder}`,
    },
    searchInput: {
      flex: 1, minWidth: 140, background: theme.pillNeutralBg, border: `1px solid ${theme.panelBorder}`,
      borderRadius: 10, padding: '8px 12px', fontSize: 14, outline: 'none', color: theme.textPrimary,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    sortBtn: {
      borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
      border: `1.5px solid ${theme.panelBorder}`, background: 'transparent',
      cursor: 'pointer', transition: 'all 0.15s', color: theme.textMuted,
    },
    statsBar: {
      padding: '7px 20px', display: 'flex', gap: 6, alignItems: 'center',
      fontSize: 13, background: theme.optionBg, borderBottom: `1px solid ${theme.headerBorder}`,
    },
    statNum: { fontWeight: 800, color: theme.textPrimary },
    dot: { color: theme.panelBorder },
    list: { padding: '10px 16px 60px' },
    row: {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
      background: theme.cardBg, borderRadius: 12, padding: '11px 14px', marginBottom: 7,
      border: `1px solid ${theme.cardBorder}`,
    },
    wordLeft:    { fontSize: 15, fontWeight: 700, color: theme.textPrimary },
    arrow:       { fontSize: 12, color: theme.panelBorder, flexShrink: 0 },
    wordRight:   { fontSize: 14, fontWeight: 600, color: theme.textMuted },
    proverbMain: { fontSize: 14, fontWeight: 700, color: theme.textPrimary, fontStyle: 'italic', marginBottom: 4 },
    proverbSub:  { fontSize: 12, color: theme.textMuted, fontWeight: 500, lineHeight: 1.5 },
    pill: { borderRadius: 999, padding: '3px 9px', fontSize: 12, fontWeight: 700 },
  };
}
