// Ask-phase question renderer for Teach & Ask — MCQ, Voice, and Jumble types

const MASTERY_REQUIRED = 3;
export { MASTERY_REQUIRED };

// ── MCQ ───────────────────────────────────────────────────────────────────────
export function AskMCQ({ q, sel, done, onSelect, meta }) {
  return (
    <div style={S.wrap} className="fade-in">
      <div style={S.label}>Multiple Choice</div>
      <div style={S.prompt}>{q.prompt}</div>
      <div style={S.grid}>
        {q.options.map((opt, i) => {
          const isCorrect = q.correctIndices ? q.correctIndices.includes(i) : i === q.correctIndex;
          let bg = '#fff', color = '#212427', border = '1.5px solid #DCD5CE';
          if (done && sel === i) {
            bg = isCorrect ? '#E0F5EE' : '#FEF2F2';
            color = isCorrect ? '#0A6E56' : '#DC2626';
            border = `1.5px solid ${color}`;
          } else if (done && isCorrect) {
            bg = '#E0F5EE'; color = '#0A6E56'; border = '1.5px solid #0A6E56';
          }
          return (
            <button key={i} onClick={() => onSelect(i)} disabled={done}
              style={{ ...S.optBtn, background: bg, color, border, cursor: done ? 'default' : 'pointer' }}>
              <span style={S.badge}>{i + 1}</span>{opt}
            </button>
          );
        })}
      </div>
      {done && q.explanation && <div style={S.expl}>{q.explanation}</div>}
    </div>
  );
}

// ── Voice ─────────────────────────────────────────────────────────────────────
export function AskVoice({ q, vState, vTx, vTip, onRetry, meta, hasSR }) {
  if (!hasSR) return (
    <div style={S.wrap}>
      <div style={S.label}>Voice Answer</div>
      <div style={S.prompt}>{q.prompt}</div>
      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>
        Voice input requires Chrome on desktop.
      </div>
    </div>
  );

  return (
    <div style={S.wrap} className="fade-in">
      <div style={S.label}>Voice Answer</div>
      <div style={S.prompt}>{q.prompt}</div>
      {vTip ? (
        <div style={S.voiceTip}>
          {vTip.words.map((w, i) => (
            <span key={i} style={{ color: vTip.matched[i] ? '#10A07A' : '#DC2626', fontWeight: 700, marginRight: 6 }}>{w}</span>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: vTip.correct ? '#10A07A' : '#DC2626' }}>
            {vTip.correct ? '✓ Correct!' : '✗ Not quite'}
          </div>
        </div>
      ) : (
        <>
          {vTx && <div style={S.voiceTx}>{vTx}</div>}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ ...S.micBtn, background: vState === 'listening' ? meta.color : '#F3F4F6', animation: vState === 'listening' ? 'micPulse 1.2s ease-in-out infinite' : 'none' }}>🎤</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>
              {vState === 'listening' ? 'Listening…' : 'Waiting…'}
            </div>
          </div>
          {vState !== 'listening' && (
            <button onClick={onRetry} style={S.retryBtn}>↺ Try again</button>
          )}
        </>
      )}
    </div>
  );
}

// ── Jumble ────────────────────────────────────────────────────────────────────
export function AskJumble({ q, jBank, jBuilt, jDone, jResult, onTile, onSubmit, meta }) {
  return (
    <div style={S.wrap} className="fade-in">
      <div style={S.label}>Word Order</div>
      <div style={S.prompt}>{q.prompt}</div>

      <div style={S.jumbleAnswer}>
        {jBuilt.length === 0
          ? <span style={{ color: '#D1D5DB', fontSize: 14 }}>Tap words below to build your answer…</span>
          : jBuilt.map(tile => (
            <button key={tile.i} onClick={() => onTile(tile, 'built')} disabled={jDone}
              style={{ ...S.tile, background: jDone ? (jResult ? '#E0F5EE' : '#FEF2F2') : meta.bg, color: jDone ? (jResult ? '#0A6E56' : '#DC2626') : meta.color, border: `1.5px solid ${jDone ? (jResult ? '#0A6E56' : '#DC2626') : meta.color}` }}>
              {tile.w}
            </button>
          ))}
      </div>

      <div style={S.jumbleBank}>
        {jBank.map(tile => (
          <button key={tile.i} onClick={() => onTile(tile, 'bank')} disabled={jDone}
            style={{ ...S.tile, background: '#F9FAFB', color: '#374151', border: '1.5px solid #D1D5DB' }}>
            {tile.w}
          </button>
        ))}
      </div>

      {!jDone ? (
        <button onClick={onSubmit} disabled={!jBuilt.length}
          style={{ ...S.submitBtn, background: jBuilt.length ? meta.color : '#D1D5DB' }}>
          Submit
        </button>
      ) : (
        <div style={{ textAlign: 'center', marginTop: 16, fontWeight: 700, color: jResult ? '#10A07A' : '#DC2626' }}>
          {jResult ? '✓ Correct!' : `✗ Answer: ${q.answer}`}
        </div>
      )}
    </div>
  );
}

// ── Mastery bar row (shared) ──────────────────────────────────────────────────
export function MasteryRow({ setItems, mastery, getContent, meta }) {
  return (
    <div style={S.masteryRow}>
      {setItems.map(item => {
        const c = mastery[item.id] || 0;
        const label = getContent(item).front;
        return (
          <div key={item.id} style={S.masteryItem}>
            <div style={S.masteryLabel} title={label}>{label.length > 16 ? label.slice(0, 16) + '…' : label}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < c ? meta.color : '#E5E7EB', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  wrap:         { padding: '16px 20px', maxWidth: 560, margin: '0 auto' },
  label:        { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 8 },
  prompt:       { fontFamily: "'Fredoka',cursive", fontSize: 20, fontWeight: 500, color: '#212427', lineHeight: 1.4, marginBottom: 20, background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #DCD5CE', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  grid:         { display: 'flex', flexDirection: 'column', gap: 10 },
  optBtn:       { borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, border: 'none' },
  badge:        { background: '#F3F4F6', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 800, color: '#374151', minWidth: 24, textAlign: 'center', flexShrink: 0 },
  expl:         { marginTop: 14, fontSize: 12, color: '#6B7280', background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 },
  voiceTip:     { background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #DCD5CE', marginBottom: 16, lineHeight: 2.2, fontSize: 16 },
  voiceTx:      { background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', fontSize: 15, color: '#374151', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  micBtn:       { fontSize: 36, width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'background 0.2s', cursor: 'default' },
  retryBtn:     { display: 'block', margin: '16px auto 0', background: 'transparent', border: '1.5px solid #DCD5CE', borderRadius: 12, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#374151' },
  jumbleAnswer: { background: '#fff', borderRadius: 16, padding: 16, minHeight: 60, border: '2px dashed #DCD5CE', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' },
  jumbleBank:   { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0', justifyContent: 'center', marginBottom: 8 },
  tile:         { borderRadius: 10, padding: '8px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' },
  submitBtn:    { width: '100%', border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff', marginTop: 8 },
  masteryRow:   { display: 'flex', gap: 10, padding: '12px 20px', maxWidth: 560, margin: '0 auto' },
  masteryItem:  { flex: 1, background: '#fff', borderRadius: 12, padding: '8px 10px', border: '1px solid #DCD5CE' },
  masteryLabel: { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
};
