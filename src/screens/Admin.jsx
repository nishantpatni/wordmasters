import { useState, useEffect } from 'react';
import { TOPIC_META, TOPIC_ORDER, ALL_TOPIC_DATA } from '../data/topicData.js';
import { getScores, saveScores, memoryScore } from '../engine/quiz.js';
import { loadScoresFromSheets, loadLogsFromSheets } from '../services/sheetsService.js';

const USERS = ['NP_test', 'PB_test', 'ATV'];

function scoreColor(s) {
  if (s >= 70) return '#10A07A';
  if (s >= 40) return '#F59E0B';
  return '#DC2626';
}
function scoreBg(s) {
  if (s >= 70) return '#E0F5EE';
  if (s >= 40) return '#FFFBEB';
  return '#FEF2F2';
}

export default function Admin({ onBack }) {
  const [activeUser,   setActiveUser]   = useState(USERS[0]);
  const [view,         setView]         = useState('scores'); // 'scores' | 'logs'
  const [sortBy,       setSortBy]       = useState('score');
  const [filterTopic,  setFilterTopic]  = useState('all');
  const [search,       setSearch]       = useState('');
  const [scores,       setScores]       = useState(() => getScores(USERS[0]));
  const [scoresLoading,setScoresLoading]= useState(false);
  const [logs,         setLogs]         = useState(null); // null = not fetched
  const [logsLoading,  setLogsLoading]  = useState(false);
  const [logFilter,    setLogFilter]    = useState('wrong'); // 'all' | 'wrong'

  // Load scores from Sheets whenever user switches
  useEffect(() => {
    let cancelled = false;
    setScores(getScores(activeUser)); // show localStorage first
    setLogs(null); // clear logs for new user
    setScoresLoading(true);
    loadScoresFromSheets(activeUser).then(remote => {
      if (cancelled) return;
      setScoresLoading(false);
      if (!remote) return;
      const local = getScores(activeUser);
      const merged = { ...remote };
      for (const [id, loc] of Object.entries(local)) {
        if (!merged[id] || (loc.reps ?? 0) > (merged[id].reps ?? 0)) merged[id] = loc;
      }
      saveScores(activeUser, merged);
      setScores(merged);
    });
    return () => { cancelled = true; };
  }, [activeUser]);

  // Fetch logs when "Logs" tab is clicked
  useEffect(() => {
    if (view !== 'logs' || logs !== null) return;
    let cancelled = false;
    setLogsLoading(true);
    loadLogsFromSheets(activeUser).then(result => {
      if (cancelled) return;
      setLogsLoading(false);
      setLogs(result ?? []);
    });
    return () => { cancelled = true; };
  }, [view, activeUser, logs]);

  // ── Scores view data ──────────────────────────────────────────────────────
  const rows = TOPIC_ORDER.flatMap(tid =>
    ALL_TOPIC_DATA[tid].map(item => {
      const rec = scores[item.id] || null;
      const ms  = rec ? memoryScore(rec) : null;
      return {
        id: item.id, topicId: tid,
        word: item.word || item.idiom || item.phrase || item.oxymoron || item.proverb || item.group || item.sentence || item.id,
        attempts: rec?.attempts ?? 0,
        correct:  rec?.correct  ?? 0,
        score:    ms,
        nextReview: rec?.nextReview ?? '—',
        reps:     rec?.reps ?? 0,
      };
    })
  );

  const filtered = rows
    .filter(r => filterTopic === 'all' || r.topicId === filterTopic)
    .filter(r => !search || r.word.toLowerCase().includes(search.toLowerCase()))
    .filter(r => r.attempts > 0);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score')    return (a.score ?? 999) - (b.score ?? 999);
    if (sortBy === 'attempts') return b.attempts - a.attempts;
    if (sortBy === 'topic')    return a.topicId.localeCompare(b.topicId);
    return 0;
  });

  const topicSummary = TOPIC_ORDER.map(tid => {
    const items = ALL_TOPIC_DATA[tid];
    const attempted = items.filter(i => scores[i.id]);
    const avgScore  = attempted.length === 0 ? 0 :
      Math.round(attempted.reduce((s, i) => s + memoryScore(scores[i.id]), 0) / attempted.length);
    return { tid, meta: TOPIC_META[tid], attempted: attempted.length, total: items.length, avgScore };
  });

  function exportCSV() {
    const header = 'User,Topic,Word/Phrase,Attempts,Correct,MemoryScore,NextReview\n';
    const body   = sorted.map(r =>
      [activeUser, r.topicId, `"${r.word}"`, r.attempts, r.correct, r.score ?? 0, r.nextReview].join(',')
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `wm_scores_${activeUser}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Logs view data ────────────────────────────────────────────────────────
  const visibleLogs = (logs ?? []).filter(row => {
    if (logFilter === 'wrong' && row.correct === true) return false;
    if (filterTopic !== 'all' && row.topicId !== filterTopic) return false;
    if (search && !row.prompt?.toLowerCase().includes(search.toLowerCase()) &&
        !row.selectedOption?.toLowerCase().includes(search.toLowerCase()) &&
        !row.correctAnswer?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={styles.title}>Admin Dashboard ⚙️</div>
        <button onClick={exportCSV} style={{ ...styles.exportBtn, visibility: view === 'scores' ? 'visible' : 'hidden' }}>↓ CSV</button>
      </div>

      <div style={styles.body}>
        {/* User tabs */}
        <div style={styles.userTabs}>
          {USERS.map(u => (
            <button key={u} onClick={() => { setActiveUser(u); setView('scores'); }}
              style={{ ...styles.userTab, ...(activeUser === u ? styles.userTabActive : {}) }}>
              {u}
              {scoresLoading && activeUser === u && <span style={{ fontSize: 10, marginLeft: 4 }}>⟳</span>}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={styles.viewToggle}>
          <button onClick={() => setView('scores')}
            style={{ ...styles.toggleBtn, ...(view === 'scores' ? styles.toggleActive : {}) }}>
            📊 Scores
          </button>
          <button onClick={() => setView('logs')}
            style={{ ...styles.toggleBtn, ...(view === 'logs' ? styles.toggleActive : {}) }}>
            📋 Attempt Logs
          </button>
        </div>

        {/* ── SCORES VIEW ── */}
        {view === 'scores' && (
          <>
            {scoresLoading && (
              <div style={styles.syncBanner}>⟳ Syncing scores from Google Sheets…</div>
            )}

            {/* Topic summary cards */}
            <div style={styles.summaryGrid}>
              {topicSummary.map(({ tid, meta, attempted, total, avgScore }) => (
                <div key={tid} style={{ ...styles.summaryCard, border: `1.5px solid ${meta.color}20` }}
                  onClick={() => setFilterTopic(filterTopic === tid ? 'all' : tid)}
                  role="button"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ fontFamily: "'Fredoka',cursive", fontWeight: 500, fontSize: 16, color: scoreColor(avgScore) }}>
                      {avgScore > 0 ? `${avgScore}%` : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.3 }}>{meta.name}</div>
                  <div style={{ fontSize: 10, color: '#B4B2A9', marginTop: 2 }}>{attempted}/{total} attempted</div>
                  <div style={{ height: 4, background: '#F0EEF8', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${avgScore}%`, background: meta.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={styles.filtersRow}>
              <input
                placeholder="Search word or phrase…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.select}>
                <option value="score">Weakest first</option>
                <option value="attempts">Most attempted</option>
                <option value="topic">By topic</option>
              </select>
            </div>
            {filterTopic !== 'all' && (
              <div style={styles.filterChip}>
                Showing: {TOPIC_META[filterTopic]?.name} &nbsp;
                <button onClick={() => setFilterTopic('all')} style={styles.clearChip}>✕</button>
              </div>
            )}

            {/* Table */}
            {sorted.length === 0 ? (
              <div style={styles.empty}>
                {scoresLoading ? 'Loading…' : 'No attempted items found. Start a test first!'}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <div style={styles.tableHeader}>
                  <span style={{ flex: 3 }}>Word / Phrase</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Topic</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Attempts</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Correct</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Score</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Next Review</span>
                </div>
                {sorted.map(r => {
                  const m = TOPIC_META[r.topicId] || { color: '#6C4EE0', icon: '📖' };
                  return (
                    <div key={r.id} style={styles.tableRow}>
                      <span style={{ flex: 3, fontSize: 13, fontWeight: 700, color: '#1A1A18' }}>{r.word}</span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 16 }}>{m.icon}</span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#7A7870' }}>{r.attempts}</span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#10A07A' }}>{r.correct}</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>
                        {r.score !== null ? (
                          <span style={{ background: scoreBg(r.score), color: scoreColor(r.score), borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
                            {r.score}%
                          </span>
                        ) : '—'}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#B4B2A9', fontWeight: 700 }}>{r.nextReview}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {sorted.length > 0 && (
              <div style={{ fontSize: 12, color: '#B4B2A9', fontWeight: 700, marginTop: 12, textAlign: 'center' }}>
                {sorted.length} attempted item{sorted.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}

        {/* ── LOGS VIEW ── */}
        {view === 'logs' && (
          <>
            <div style={styles.filtersRow}>
              <input
                placeholder="Search question or answer…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
              <select value={logFilter} onChange={e => setLogFilter(e.target.value)} style={styles.select}>
                <option value="wrong">Incorrect only</option>
                <option value="all">All attempts</option>
              </select>
              <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} style={styles.select}>
                <option value="all">All topics</option>
                {TOPIC_ORDER.map(tid => (
                  <option key={tid} value={tid}>{TOPIC_META[tid]?.name}</option>
                ))}
              </select>
            </div>

            {logsLoading && (
              <div style={styles.syncBanner}>⟳ Loading attempt logs from Google Sheets…</div>
            )}

            {!logsLoading && logs === null && (
              <div style={styles.empty}>Could not load logs. Ensure GAS supports <code>action=logs</code>.</div>
            )}

            {!logsLoading && logs !== null && visibleLogs.length === 0 && (
              <div style={styles.empty}>No {logFilter === 'wrong' ? 'incorrect' : ''} attempts found.</div>
            )}

            {!logsLoading && logs !== null && visibleLogs.length > 0 && (
              <div style={styles.logList}>
                {[...visibleLogs].reverse().map((row, i) => {
                  const m = TOPIC_META[row.topicId] || { color: '#6C4EE0', bg: '#F5F3FF', icon: '📖', name: row.topicId };
                  const timedOut = row.selectedOption === 'timeout';
                  return (
                    <div key={i} style={{ ...styles.logCard, borderLeft: `3px solid ${row.correct ? '#10A07A' : '#DC2626'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ ...styles.logBadge, background: m.bg, color: m.color }}>{m.icon} {m.name}</span>
                        <span style={{ fontSize: 11, color: '#B4B2A9', fontWeight: 700 }}>
                          {row.ts ? new Date(row.ts).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A18', marginBottom: 8, lineHeight: 1.45 }}>
                        {row.prompt}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 120, background: row.correct ? '#E0F5EE' : '#FEF2F2', borderRadius: 8, padding: '7px 11px' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9CA3AF', marginBottom: 3 }}>Answered</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: row.correct ? '#0A6E56' : '#DC2626' }}>
                            {timedOut ? '⏱ Timed out' : (row.selectedOption || '—')}
                          </div>
                        </div>
                        {!row.correct && (
                          <div style={{ flex: 1, minWidth: 120, background: '#E0F5EE', borderRadius: 8, padding: '7px 11px' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9CA3AF', marginBottom: 3 }}>Correct</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A6E56' }}>{row.correctAnswer || '—'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center', fontSize: 12, color: '#B4B2A9', fontWeight: 700, marginTop: 12 }}>
                  {visibleLogs.length} log entr{visibleLogs.length !== 1 ? 'ies' : 'y'} shown
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  header:       { background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  backBtn:      { background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10, padding: '7px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#212427' },
  title:        { fontFamily: "'Fredoka',cursive", fontWeight: 500, fontSize: 20, color: '#212427' },
  exportBtn:    { background: '#E3FDDB', color: '#197A56', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  body:         { padding: '20px 16px 48px', maxWidth: 900, margin: '0 auto' },
  userTabs:     { display: 'flex', gap: 8, marginBottom: 14 },
  userTab:      { flex: 1, background: '#fff', border: '1.5px solid #DCD5CE', borderRadius: 12, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#6B7280', textAlign: 'center' },
  userTabActive:{ background: '#E3FDDB', borderColor: '#96F878', color: '#197A56' },
  viewToggle:   { display: 'flex', gap: 8, marginBottom: 18 },
  toggleBtn:    { flex: 1, background: '#fff', border: '1.5px solid #DCD5CE', borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6B7280' },
  toggleActive: { background: '#E3FDDB', borderColor: '#96F878', color: '#197A56' },
  syncBanner:   { background: '#E3FDDB', color: '#197A56', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, marginBottom: 14, textAlign: 'center' },
  summaryGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 20 },
  summaryCard:  { background: '#fff', borderRadius: 14, padding: 12, cursor: 'pointer', border: '1px solid #DCD5CE', transition: 'transform 0.15s', userSelect: 'none' },
  filtersRow:   { display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  searchInput:  { flex: 1, minWidth: 160, border: '1.5px solid #DCD5CE', borderRadius: 10, padding: '9px 12px', fontSize: 14, outline: 'none', background: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  select:       { border: '1.5px solid #DCD5CE', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600, outline: 'none', background: '#fff', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  filterChip:   { background: '#E3FDDB', color: '#197A56', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  clearChip:    { background: 'none', border: 'none', cursor: 'pointer', color: '#197A56', fontSize: 14, fontWeight: 700, lineHeight: 1 },
  empty:        { textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 15, fontWeight: 600 },
  tableWrap:    { background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #DCD5CE' },
  tableHeader:  { display: 'flex', padding: '10px 16px', background: '#F2F2F2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9CA3AF', borderBottom: '1px solid #DCD5CE' },
  tableRow:     { display: 'flex', padding: '11px 16px', borderBottom: '1px solid #DCD5CE', alignItems: 'center', transition: 'background 0.1s' },
  logList:      { display: 'flex', flexDirection: 'column', gap: 10 },
  logCard:      { background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #DCD5CE' },
  logBadge:     { borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 },
};
