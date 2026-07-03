import { GEO_TOPIC_META, GEO_TOPIC_ORDER, ALL_GEO_DATA } from '../data/geoTopicData.js';
import { getScores, memoryScore } from '../engine/quiz.js';

const COUNT_OPTIONS = [18, 36];

export default function GeoTopicSelect({ username, onStart, onVoiceStart, onBack, syncing }) {
  const scores = getScores(`geo_${username}`);

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <button onClick={onBack} style={styles.back}>← Back</button>
        <div style={styles.title}>🗺️ Indian Geography</div>
        <div />
      </div>

      {syncing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(241,238,234,0.92)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>☁️</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#197A56', fontSize: 16 }}>Syncing your progress…</div>
        </div>
      )}

      <div style={styles.body}>
        {GEO_TOPIC_ORDER.map(tid => {
          const meta  = GEO_TOPIC_META[tid];
          const items = ALL_GEO_DATA[tid];
          const topicScores = items.map(i => scores[i.id]).filter(Boolean);
          const strong = topicScores.filter(r => memoryScore(r) >= 70).length;
          const masteryPct = Math.round((strong / items.length) * 100);
          const attempted  = topicScores.length;

          return (
            <div key={tid} style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 32 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 18, color: '#212427' }}>{meta.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{items.length} items · 28 states + 8 UTs</div>
                </div>
              </div>

              {/* Mastery bar */}
              {attempted > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>{attempted}/{items.length} attempted</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{masteryPct}% mastered</span>
                  </div>
                  <div style={{ height: 6, background: '#F2F2F2', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${masteryPct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COUNT_OPTIONS.map(n => (
                  <button key={n} onClick={() => onStart(tid, n)}
                    style={{ ...styles.countBtn, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}30` }}
                    onMouseEnter={e => { e.currentTarget.style.background = meta.color; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = meta.bg; e.currentTarget.style.color = meta.color; }}>
                    📝 {n}
                  </button>
                ))}
                {COUNT_OPTIONS.map(n => (
                  <button key={`v${n}`} onClick={() => onVoiceStart(tid, n)}
                    style={{ ...styles.countBtn, background: '#FFF7ED', color: '#D97706', border: '1.5px solid #D97706' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#D97706'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#D97706'; }}>
                    🎤 {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div style={styles.hint}>
          More Geography topics coming soon — Rivers, Mountains, National Parks…
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:     { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header:   { background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  back:     { background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10, padding: '7px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#212427' },
  title:    { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 20, color: '#212427' },
  body:     { padding: '20px 16px 48px', maxWidth: 600, margin: '0 auto' },
  card:     { background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '2px solid #BAE6FD' },
  countBtn: { borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' },
  hint:     { textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginTop: 24, letterSpacing: 0.2 },
};
