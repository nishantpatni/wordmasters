// Teaching card for Teach & Ask mode — one item per card with TTS, keyboard nav

export default function TeachCard({ item, topicId, content, setIdx, teachPage, setSize, totalSets, totalItems, globalIdx, meta, onNext, onBack, onReplay }) {
  const isFirst = teachPage === 0;
  const isLastInSet = teachPage >= setSize - 1;

  return (
    <div style={S.page}>
      {/* Set progress dots */}
      <div style={S.setRow}>
        {Array.from({ length: totalSets }).map((_, si) => (
          <div key={si} style={{ ...S.setDot, background: si < setIdx ? meta.color : si === setIdx ? meta.color + 'BB' : '#DDD' }} />
        ))}
      </div>

      {/* Card */}
      <div style={S.cardWrap} className="fade-in" key={`${setIdx}-${teachPage}`}>
        <div style={{ ...S.card, borderColor: meta.color + '40' }}>
          <div style={S.cardMeta}>
            <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.icon} {meta.name}</span>
            <span style={S.progress}>{globalIdx + 1} / {totalItems}</span>
          </div>

          <div style={S.cardSet}>Set {setIdx + 1}/{totalSets} — Card {teachPage + 1}/{setSize}</div>

          <div style={S.front}>{content.front}</div>

          {content.back && (
            <div style={S.back}>{content.back}</div>
          )}

          <button onClick={onReplay} style={{ ...S.ttsBtn, color: meta.color }}>
            🔊 Hear it again
          </button>
        </div>
      </div>

      {/* Page dots */}
      <div style={S.pageDots}>
        {Array.from({ length: setSize }).map((_, pi) => (
          <div key={pi} style={{ ...S.pageDot, background: pi <= teachPage ? meta.color : '#DDD' }} />
        ))}
      </div>

      {/* Navigation */}
      <div style={S.navRow}>
        <button onClick={onBack} disabled={isFirst}
          style={{ ...S.navBtn, opacity: isFirst ? 0.3 : 1, cursor: isFirst ? 'default' : 'pointer' }}>
          ← Back
        </button>
        <button onClick={onNext} style={{ ...S.navBtnPrimary, background: meta.color }}>
          {isLastInSet ? 'Start Quiz →' : 'Next →'}
        </button>
      </div>
      <div style={S.hint}>← → arrow keys or Enter to navigate</div>
    </div>
  );
}

const S = {
  page:         { maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  setRow:       { display: 'flex', justifyContent: 'center', gap: 10, padding: '20px 0 0' },
  setDot:       { width: 12, height: 12, borderRadius: '50%', transition: 'background 0.3s' },
  cardWrap:     { padding: '16px 20px 0' },
  card:         { background: '#fff', borderRadius: 24, padding: '28px 24px', border: '2px solid', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minHeight: 260, display: 'flex', flexDirection: 'column' },
  cardMeta:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progress:     { fontSize: 11, fontWeight: 700, color: '#9CA3AF' },
  cardSet:      { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#C4C0BB', marginBottom: 16 },
  front:        { fontFamily: "'Fredoka',cursive", fontSize: 26, fontWeight: 600, color: '#212427', lineHeight: 1.3, marginBottom: 16, flex: 1 },
  back:         { fontSize: 15, color: '#374151', lineHeight: 1.6, background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', marginBottom: 16 },
  ttsBtn:       { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '4px 0', alignSelf: 'flex-start' },
  pageDots:     { display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0' },
  pageDot:      { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.2s' },
  navRow:       { display: 'flex', gap: 12, padding: '0 20px' },
  navBtn:       { flex: 1, background: '#fff', border: '1.5px solid #DCD5CE', borderRadius: 14, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#6B7280' },
  navBtnPrimary:{ flex: 1, border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff' },
  hint:         { textAlign: 'center', fontSize: 11, color: '#B4B2A9', fontWeight: 600, marginTop: 12 },
};
