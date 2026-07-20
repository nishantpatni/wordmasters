import { TOPIC_META } from '../data/topicData.js';
import { getTheme } from '../utils/theme.js';

export default function ReviewScreen({ results, onContinue, continueLabel = 'Continue →', onRepractice, onMarkCorrect, darkMode }) {
  const theme = getTheme(darkMode);
  const styles = themedStyles(theme);
  const wrong = results
    .map((r, i) => ({ ...r, _idx: i }))
    .filter(r => !r.correct);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>Review Incorrect</div>
        <div style={styles.sub}>
          {wrong.length === 0
            ? 'Perfect score! Nothing to review.'
            : `${wrong.length} question${wrong.length !== 1 ? 's' : ''} to brush up on`}
        </div>
      </div>

      <div style={styles.list}>
        {wrong.map(r => {
          const meta = TOPIC_META[r.topicId] || { color: '#212427', bg: '#E3FDDB', name: r.topicId, icon: '📖' };
          const timedOut = r.selectedOption === 'timeout';
          return (
            <div key={r._idx} style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ ...styles.badge, background: meta.bg, color: meta.color }}>
                  {meta.icon} {meta.name}
                </span>
                {r.quizType === 'voice' && onMarkCorrect && (
                  <button onClick={() => onMarkCorrect(r._idx)} style={styles.markCorrectBtn}>
                    ✓ I spoke correctly
                  </button>
                )}
              </div>

              <div style={styles.prompt}>{r.prompt}</div>

              <div style={styles.answerRow}>
                <div style={styles.wrongBox}>
                  <div style={styles.answerLabel}>You answered</div>
                  <div style={styles.wrongText}>
                    {timedOut ? '⏱ Timed out' : r.selectedOption || '—'}
                  </div>
                </div>
                <div style={styles.correctBox}>
                  <div style={styles.answerLabel}>Correct answer</div>
                  <div style={styles.correctText}>{r.correctAnswer}</div>
                </div>
              </div>
            </div>
          );
        })}

        {wrong.length === 0 && (
          <div style={styles.emptyState}>🎉 All correct — great work!</div>
        )}
      </div>

      <div style={styles.footer}>
        {onRepractice && wrong.length > 0 && (
          <button onClick={() => onRepractice(wrong)} style={styles.repracticeBtn}>
            🔄 Repractice Incorrect ({wrong.length})
          </button>
        )}
        <button onClick={onContinue} style={styles.continueBtn}
          onMouseEnter={e => e.currentTarget.style.background = '#71DC68'}
          onMouseLeave={e => e.currentTarget.style.background = '#96F878'}
        >{continueLabel}</button>
      </div>
    </div>
  );
}

function themedStyles(theme) {
  return {
    page:       { minHeight: '100vh', background: theme.pageBg, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  paddingBottom: 160 },
    header:     { background: theme.headerBg, borderBottom: `1px solid ${theme.headerBorder}`,
                  padding: '18px 20px', textAlign: 'center',
                  boxShadow: theme.cardShadow },
    title:      { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, color: theme.textPrimary },
    sub:        { fontSize: 13, color: theme.textMuted, fontWeight: 500, marginTop: 4 },
    list:       { padding: '16px 16px 20px', maxWidth: 680, margin: '0 auto' },
    card:       { background: theme.cardBg, borderRadius: 20, boxShadow: theme.cardShadow,
                  border: `1px solid ${theme.cardBorder}`, padding: '18px 18px 16px', marginBottom: 14 },
    badge:      { borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 700,
                  letterSpacing: 0.3, display: 'inline-block', marginBottom: 12 },
    markCorrectBtn: { background: theme.correctBg, color: theme.correctText, border: `1.5px solid ${theme.correctBorder}`,
                  borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif" },
    prompt:     { fontSize: 15, fontWeight: 700, color: theme.textPrimary, lineHeight: 1.55,
                  marginBottom: 14, whiteSpace: 'pre-line' },
    answerRow:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
    wrongBox:   { flex: 1, minWidth: 120, background: theme.wrongBg, borderRadius: 10,
                  padding: '10px 13px', border: `1px solid ${theme.wrongBorder}` },
    correctBox: { flex: 1, minWidth: 120, background: theme.correctBg, borderRadius: 10,
                  padding: '10px 13px', border: `1px solid ${theme.correctBorder}` },
    answerLabel:{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6,
                  marginBottom: 4, color: theme.textFaint },
    wrongText:  { fontSize: 14, fontWeight: 700, color: theme.wrongText, lineHeight: 1.4 },
    correctText:{ fontSize: 14, fontWeight: 700, color: theme.correctText, lineHeight: 1.4 },
    emptyState: { textAlign: 'center', fontSize: 18, color: theme.correctBorder, fontWeight: 700,
                  padding: '40px 0' },
    footer:        { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px',
                     background: theme.headerBg, backdropFilter: 'blur(6px)',
                     borderTop: `1px solid ${theme.headerBorder}`, display: 'flex', flexDirection: 'column',
                     alignItems: 'center', gap: 8 },
    repracticeBtn: { background: theme.cardBg, color: theme.textPrimary, border: `1.5px solid ${theme.panelBorder}`,
                     borderRadius: 15, padding: '11px 40px',
                     fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 16, cursor: 'pointer',
                     maxWidth: 400, width: '100%' },
    continueBtn:   { background: '#96F878', color: '#212427',
                     border: 'none', borderRadius: 15, padding: '13px 40px',
                     fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 17, cursor: 'pointer',
                     transition: 'background 0.15s', maxWidth: 400, width: '100%' },
  };
}
