import { TOPIC_META, TOPIC_ORDER, ALL_TOPIC_DATA } from '../data/topicData.js';

const COUNT_OPTIONS = [50, 100];

export default function TopicSelect({ onStart, onBack, onRevise, onVoiceStart, onTeachStart, syncing }) {
  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <button onClick={onBack} style={styles.back}>← Back</button>
        <div style={styles.title}>Choose a Topic</div>
        <div />
      </div>

      {syncing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(241,238,234,0.92)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>☁️</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#197A56', fontSize: 16 }}>Syncing your progress…</div>
        </div>
      )}
      <div style={styles.body}>
        {/* Mixed test */}
        <TopicCard
          meta={{ id: 'mixed', name: 'Mixed Test', icon: '🎲', color: '#212427', bg: '#E3FDDB' }}
          count={TOPIC_ORDER.filter(tid => !TOPIC_META[tid].comingSoon).reduce((s, tid) => s + ALL_TOPIC_DATA[tid].length, 0)}
          onStart={onStart}
          highlight
        />

        <div style={styles.sectionLabel}>Or pick a topic</div>

        {TOPIC_ORDER.map(tid => (
          <TopicCard
            key={tid}
            meta={TOPIC_META[tid]}
            count={ALL_TOPIC_DATA[tid]?.length ?? 0}
            onStart={onStart}
            onRevise={onRevise}
            onVoiceStart={['idioms','oneWordSubs','proverbs','oxymorons','similes','vocabopediaSimiles','antonyms','synonyms','collectiveNouns'].includes(tid) ? onVoiceStart : undefined}
            onTeachStart={onTeachStart}
          />
        ))}
      </div>
    </div>
  );
}

function TopicCard({ meta, count, onStart, onRevise, onVoiceStart, onTeachStart, highlight }) {
  const comingSoon = !!meta.comingSoon;
  return (
    <div style={{ ...styles.card, border: highlight ? `2px solid #96F878` : '1px solid #DCD5CE', opacity: comingSoon ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 32 }}>{meta.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 18, color: '#212427' }}>{meta.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
            {comingSoon ? 'Coming soon' : `${count} items in bank`}
          </div>
        </div>
        {comingSoon && (
          <div style={{ background: '#E3FDDB', color: '#197A56', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            Soon
          </div>
        )}
      </div>
      {!comingSoon && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => onStart(meta.id, n)}
                style={{ ...styles.countBtn, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}30` }}
                onMouseEnter={e => { e.currentTarget.style.background = meta.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = meta.bg; e.currentTarget.style.color = meta.color; }}
              >
                📝 {n}
              </button>
            ))}
            {onVoiceStart && COUNT_OPTIONS.map(n => (
              <button
                key={`v${n}`}
                onClick={() => onVoiceStart(meta.id, n)}
                style={{ ...styles.countBtn, background: '#FFF7ED', color: '#D97706', border: '1.5px solid #D97706' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#D97706'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#D97706'; }}
              >
                🎤 {n}
              </button>
            ))}
            {onTeachStart && (
              <button
                onClick={() => onTeachStart(meta.id)}
                style={{ ...styles.countBtn, background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #2563EB' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
              >
                📖 9
              </button>
            )}
          </div>
          <button
            onClick={() => onRevise(meta.id)}
            style={{ ...styles.browseBtn, color: meta.color }}
          >
            Browse list ↗
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: {
    background: '#fff', borderBottom: '1px solid #DCD5CE',
    padding: '14px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  },
  back: {
    background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10,
    padding: '7px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#212427',
  },
  title: { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 20, color: '#212427' },
  body: { padding: '20px 16px 48px', maxWidth: 600, margin: '0 auto' },
  sectionLabel: {
    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
    color: '#9CA3AF', margin: '20px 0 12px',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  countBtn: {
    borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  browseBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, padding: '6px 2px 0', letterSpacing: 0.2,
    opacity: 0.75,
  },
};
