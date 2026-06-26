import { useState } from 'react';
import { TOPIC_META, TOPIC_ORDER, ALL_TOPIC_DATA } from '../data/topicData.js';
import { getScores, getMeta, memoryScore, isDue } from '../engine/quiz.js';
import { USER_CHANGELOG } from '../data/changelog.js';


export default function Home({ user, syncing, onStartTest, onRevise, onAdmin, onLogout }) {
  const scores  = getScores(user.username);
  const meta    = getMeta(user.username);
  const allItems = TOPIC_ORDER.flatMap(tid => ALL_TOPIC_DATA[tid].map(i => ({ ...i, topicId: tid })));
  const totalItems = allItems.length;
  const attempted  = Object.keys(scores).length;
  const due        = allItems.filter(i => isDue(scores[i.id])).length;
  const strongItems = Object.values(scores).filter(r => memoryScore(r) >= 70).length;
  const avgScore   = attempted === 0 ? 0 :
    Math.round(Object.values(scores).reduce((s, r) => s + memoryScore(r), 0) / attempted);
  const coins = meta.coins || 0;

  const [changelogOpen, setChangelogOpen] = useState(true);
  const [changelogAll,  setChangelogAll]  = useState(false);

  const circR = 54;
  const circ  = 2 * Math.PI * circR;
  const pct   = Math.round((strongItems / Math.max(1, totalItems)) * 100);
  const dash  = circ - (circ * pct / 100);

  return (
    <div style={styles.page}>
      {syncing && (
        <div style={{ background: '#E3FDDB', color: '#197A56', textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '6px 0', letterSpacing: 0.3 }}>
          ☁️ Syncing scores from cloud…
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginRight: 8 }} />
          Word <span style={{ color: '#96F878' }}>Masters</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {meta.streak > 0 && (
            <div style={{ background: '#E3FDDB', color: '#197A56', borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
              🔥 {meta.streak}
            </div>
          )}
          {user.role === 'admin' && (
            <button onClick={onAdmin} style={styles.adminBtn}>Admin ⚙️</button>
          )}
          <button onClick={onLogout} style={styles.logoutBtn}>{user.display} ↗</button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Hero greeting */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={styles.greeting}>Hello, {user.display}! 👋</div>
          <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, marginTop: 4 }}>
            {due === 0 ? "You're all caught up! Great work." : `You have ${due} words due for review today.`}
          </div>

          {/* Mastery ring */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={circR} fill="none" stroke="#E3FDDB" strokeWidth="10" />
              <circle cx="70" cy="70" r={circR} fill="none" stroke="#96F878" strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
                transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
              <text x="70" y="60" textAnchor="middle"
                style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 28, fill: '#212427' }}>{pct}%</text>
              <text x="70" y="76" textAnchor="middle" style={{ fontSize: 11, fill: '#197A56', fontWeight: 700 }}>{strongItems}/{attempted} strong</text>
              <text x="70" y="90" textAnchor="middle" style={{ fontSize: 10, fill: '#9CA3AF' }}>{totalItems} total words</text>
            </svg>
          </div>

          {/* AsanCoins + AsanScore highlight row */}
          <div style={styles.asanRow}>
            <div style={styles.asanBadge}>
              <span style={{ fontSize: 22 }}>🪙</span>
              <div>
                <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, color: '#B45309', lineHeight: 1 }}>{coins.toLocaleString()}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }}>AsanCoins</div>
              </div>
            </div>
            <div style={{ width: 1, background: '#DCD5CE', alignSelf: 'stretch' }} />
            <div style={styles.asanBadge}>
              <span style={{ fontSize: 22 }}>📊</span>
              <div>
                <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, color: '#197A56', lineHeight: 1 }}>{avgScore}%</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#197A56', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }}>AsanScore</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={styles.statsGrid}>
          {[
            { icon: '⏰', val: due,          label: 'Due Today',    color: '#DC2626' },
            { icon: '💪', val: strongItems,  label: 'Strong (70+)', color: '#21BF61' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 24, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* What's New */}
        <div style={styles.changelogCard}>
          <button onClick={() => { setChangelogOpen(o => !o); setChangelogAll(false); }} style={styles.changelogHeader}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#197A56' }}>🆕 What's New</span>
            <span style={{ fontSize: 12, color: '#B4B2A9', fontWeight: 700 }}>{USER_CHANGELOG[0].date} {changelogOpen ? '▲' : '▼'}</span>
          </button>
          {changelogOpen && (
            <div style={{ padding: '0 14px 14px' }}>
              {(changelogAll ? USER_CHANGELOG : [USER_CHANGELOG[0]]).map((release, ri) => (
                <div key={ri}>
                  {changelogAll && ri > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#197A56', background: '#E3FDDB', display: 'inline-block', borderRadius: 999, padding: '2px 10px', margin: '14px 0 6px' }}>
                      {release.date}
                    </div>
                  )}
                  {release.entries.map((e, i) => (
                    <div key={i} style={styles.changelogEntry}>
                      <span style={{ fontSize: 16, minWidth: 22 }}>{e.icon}</span>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 12, color: '#212427' }}>{e.topic} — </span>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{e.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {!changelogAll && USER_CHANGELOG.length > 1 && (
                <button onClick={() => setChangelogAll(true)} style={styles.viewAllBtn}>
                  View all updates ↓
                </button>
              )}
              {changelogAll && (
                <button onClick={() => setChangelogAll(false)} style={styles.viewAllBtn}>
                  Show less ↑
                </button>
              )}
            </div>
          )}
        </div>

        {/* Per-topic mini progress */}
        <div style={styles.sectionTitle}>Topics</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {TOPIC_ORDER.filter(tid => !TOPIC_META[tid].comingSoon).map(tid => {
            const m = TOPIC_META[tid];
            const items = ALL_TOPIC_DATA[tid];
            const topicScores = items.map(i => scores[i.id]).filter(Boolean);
            const att = topicScores.length;
            const strong = topicScores.filter(r => memoryScore(r) >= 70).length;
            const masteryPct = Math.round((strong / items.length) * 100);
            return (
              <div key={tid} style={styles.topicRow}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#212427' }}>{m.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: att > 0 ? m.color : '#9CA3AF' }}>
                        {att > 0 ? `${masteryPct}%` : `${items.length} items`}
                      </span>
                      {att > 0 && (
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginLeft: 5 }}>
                          {strong}/{items.length} mastered
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F2F2F2', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${masteryPct}%`, background: m.color, borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    {att > 0
                      ? <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
                          {att}/{items.length} attempted · {strong} mastered
                        </span>
                      : <span />
                    }
                    <button
                      onClick={() => onRevise(tid)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: m.color, padding: 0, opacity: 0.8 }}
                    >
                      Browse →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={onStartTest}
          style={styles.bigBtn}
          onMouseEnter={e => e.currentTarget.style.background = '#71DC68'}
          onMouseLeave={e => e.currentTarget.style.background = '#96F878'}
        >
          🚀 Start a Test
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10, fontWeight: 600 }}>
          {meta.sessions} sessions completed
        </div>


      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header:    { background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  logo:      { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, color: '#212427', display: 'flex', alignItems: 'center' },
  adminBtn:  { background: '#E3FDDB', color: '#197A56', border: '1px solid #A8F0B8', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  logoutBtn: { background: '#F2F2F2', color: '#212427', border: '1px solid #DCD5CE', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  body:      { padding: '24px 16px 48px', maxWidth: 560, margin: '0 auto' },
  greeting:  { fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 26, color: '#212427' },
  asanRow:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, background: '#fff', border: '1px solid #DCD5CE', borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  asanBadge: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', flex: 1, justifyContent: 'center' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  statCard:  { background: '#fff', borderRadius: 18, padding: 14, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #DCD5CE' },
  sectionTitle: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 10 },
  topicRow:  { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1px solid #DCD5CE' },
  bigBtn:    { width: '100%', background: '#96F878', color: '#212427', border: 'none', borderRadius: 18, fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 22, padding: 18, cursor: 'pointer', transition: 'background 0.15s' },
  changelogCard:   { background: '#fff', borderRadius: 14, border: '1px solid #DCD5CE', marginBottom: 20, overflow: 'hidden' },
  changelogHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F0FDF4', border: 'none', cursor: 'pointer', borderBottom: '1px solid #D1FAE5' },
  changelogEntry:  { display: 'flex', gap: 10, alignItems: 'flex-start', paddingTop: 10 },
  viewAllBtn:      { marginTop: 12, background: 'transparent', border: 'none', color: '#197A56', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: '4px 0', letterSpacing: 0.2 },

};
