import { TOPIC_META } from '../data/topicData.js';

export default function ReviewScreen({ results, onContinue, continueLabel = 'Continue →', onRepractice, onMarkCorrect }) {
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

const styles = {
  page:       { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif",
                paddingBottom: 160 },
  header:     { background: '#fff', borderBottom: '1px solid #DCD5CE',
                padding: '18px 20px', textAlign: 'center',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  title:      { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, color: '#212427' },
  sub:        { fontSize: 13, color: '#6B7280', fontWeight: 500, marginTop: 4 },
  list:       { padding: '16px 16px 20px', maxWidth: 680, margin: '0 auto' },
  card:       { background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #DCD5CE', padding: '18px 18px 16px', marginBottom: 14 },
  badge:      { borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 700,
                letterSpacing: 0.3, display: 'inline-block', marginBottom: 12 },
  markCorrectBtn: { background: '#E3FDDB', color: '#197A56', border: '1.5px solid #A8F0B8',
                borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 12,
                fontFamily: "'Plus Jakarta Sans', sans-serif" },
  prompt:     { fontSize: 15, fontWeight: 700, color: '#212427', lineHeight: 1.55,
                marginBottom: 14, whiteSpace: 'pre-line' },
  answerRow:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
  wrongBox:   { flex: 1, minWidth: 120, background: '#FEF2F2', borderRadius: 10,
                padding: '10px 13px', border: '1px solid #FECACA' },
  correctBox: { flex: 1, minWidth: 120, background: '#E3FDDB', borderRadius: 10,
                padding: '10px 13px', border: '1px solid #A8F0B8' },
  answerLabel:{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6,
                marginBottom: 4, color: '#9CA3AF' },
  wrongText:  { fontSize: 14, fontWeight: 700, color: '#DC2626', lineHeight: 1.4 },
  correctText:{ fontSize: 14, fontWeight: 700, color: '#197A56', lineHeight: 1.4 },
  emptyState: { textAlign: 'center', fontSize: 18, color: '#21BF61', fontWeight: 700,
                padding: '40px 0' },
  footer:        { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px',
                   background: 'rgba(241,238,234,0.96)', backdropFilter: 'blur(6px)',
                   borderTop: '1px solid #DCD5CE', display: 'flex', flexDirection: 'column',
                   alignItems: 'center', gap: 8 },
  repracticeBtn: { background: '#fff', color: '#212427', border: '1.5px solid #DCD5CE',
                   borderRadius: 15, padding: '11px 40px',
                   fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 16, cursor: 'pointer',
                   maxWidth: 400, width: '100%' },
  continueBtn:   { background: '#96F878', color: '#212427',
                   border: 'none', borderRadius: 15, padding: '13px 40px',
                   fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 17, cursor: 'pointer',
                   transition: 'background 0.15s', maxWidth: 400, width: '100%' },
};
