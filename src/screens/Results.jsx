import { useEffect, useRef, useState } from 'react';
import { TOPIC_META } from '../data/topicData.js';
import { getTheme } from '../utils/theme.js';

function Confetti({ active }) {
  const pieces = useRef([]);
  if (pieces.current.length === 0) {
    const colors = ['#96F878','#21BF61','#A8F0B8','#212427','#71DC68'];
    pieces.current = Array.from({ length: 50 }, (_, i) => ({
      id: i, left: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 1.2, dur: 2 + Math.random() * 1.5,
      size: 6 + Math.random() * 8, round: Math.random() > 0.5,
    }));
  }
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
      {pieces.current.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: -20,
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.round ? '50%' : 3,
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

export default function Results({ results, topicId, onRetry, onHome, onRepractice, isPractice, darkMode }) {
  const theme  = getTheme(darkMode);
  const styles = themedStyles(theme);
  const correct = results.filter(r => r.correct).length;
  const total   = results.length;
  const pct     = Math.round((correct / total) * 100);
  const [confetti, setConfetti] = useState(pct >= 70);
  useEffect(() => { const t = setTimeout(() => setConfetti(false), 5000); return () => clearTimeout(t); }, []);

  const byTopic = {};
  for (const r of results) {
    if (!byTopic[r.topicId]) byTopic[r.topicId] = { correct: 0, total: 0 };
    byTopic[r.topicId].total++;
    if (r.correct) byTopic[r.topicId].correct++;
  }

  const trophy = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪';
  const title  = pct >= 80 ? 'Excellent Work!' : pct >= 60 ? 'Good Job!' : 'Keep Practising!';
  const ringColor = pct >= 80 ? '#21BF61' : pct >= 60 ? '#96F878' : '#F59E0B';

  const circ = 251;
  const dash = circ - (circ * pct / 100);

  return (
    <div style={styles.page}>
      <Confetti active={confetti} />

      <div style={styles.card} className="pop-in">
        <div style={{ fontSize: 52, marginBottom: 8 }}>{trophy}</div>
        <div style={styles.titleText}>{title}</div>

        {/* Score ring */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="40" fill="none" stroke={theme.progressTrack} strokeWidth="10" />
            <circle cx="55" cy="55" r="40" fill="none"
              stroke={ringColor}
              strokeWidth="10" strokeDasharray={circ} strokeDashoffset={dash}
              strokeLinecap="round" transform="rotate(-90 55 55)"
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="55" y="50" textAnchor="middle"
              style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 26, fill: theme.textPrimary }}>{pct}%</text>
            <text x="55" y="68" textAnchor="middle"
              style={{ fontSize: 11, fill: theme.textFaint }}>{correct}/{total}</text>
          </svg>
        </div>

        {/* Topic breakdown */}
        {Object.keys(byTopic).length > 1 && (
          <div style={styles.breakdown}>
            <div style={styles.breakdownTitle}>Topic Breakdown</div>
            {Object.entries(byTopic).map(([tid, s]) => {
              const m = TOPIC_META[tid] || { color: '#212427', bg: '#E3FDDB', name: tid, icon: '📖' };
              const tp = Math.round((s.correct / s.total) * 100);
              return (
                <div key={tid} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 3 }}>
                      <span>{m.name}</span><span>{s.correct}/{s.total}</span>
                    </div>
                    <div style={{ height: 6, background: theme.progressTrack, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${tp}%`, background: m.color, borderRadius: 3, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {onRepractice && !isPractice && results.some(r => !r.correct) && (
            <button onClick={() => onRepractice(results.filter(r => !r.correct))} style={styles.practiceBtn}>
              🔄 Repractice Incorrect ({results.filter(r => !r.correct).length})
            </button>
          )}
          {isPractice && (
            <div style={styles.practiceBadge}>Practice session — scores not saved</div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRetry} style={styles.primaryBtn}
              onMouseEnter={e => e.currentTarget.style.background = '#71DC68'}
              onMouseLeave={e => e.currentTarget.style.background = '#96F878'}
            >🔁 Try Again</button>
            <button onClick={onHome} style={styles.secondaryBtn}>🏠 Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function themedStyles(theme) {
  return {
    page:           { minHeight: '100vh', background: theme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    card:           { background: theme.cardBg, borderRadius: 28, padding: '36px 28px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` },
    titleText:      { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 26, color: theme.textPrimary },
    breakdown:      { background: theme.optionBg, borderRadius: 14, padding: 16, textAlign: 'left', marginTop: 4, border: `1px solid ${theme.cardBorder}` },
    breakdownTitle: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: theme.textFaint, marginBottom: 12 },
    primaryBtn:   { flex: 1, background: '#96F878', color: '#212427', border: 'none', borderRadius: 15, padding: 14, fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 17, cursor: 'pointer', transition: 'background 0.15s' },
    secondaryBtn: { flex: 1, background: theme.cardBg, color: theme.textPrimary, border: `1.5px solid ${theme.cardBorder}`, borderRadius: 15, padding: 14, fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 17, cursor: 'pointer' },
    practiceBtn:  { background: theme.cardBg, color: theme.textPrimary, border: `1.5px solid ${theme.cardBorder}`, borderRadius: 15, padding: '13px 14px', fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 16, cursor: 'pointer', width: '100%' },
    practiceBadge:{ fontSize: 12, fontWeight: 700, color: theme.textFaint, textAlign: 'center', letterSpacing: 0.3, padding: '6px 0' },
  };
}
