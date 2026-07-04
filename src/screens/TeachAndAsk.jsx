import { useState, useEffect, useRef } from 'react';
import { TOPIC_META } from '../data/topicData.js';
import { buildTeachSession, buildTeachMCQ, getVoiceQ, getScores, addCoins } from '../engine/quiz.js';
import TeachCard from './TeachCard.jsx';
import { AskMCQ, AskVoice, AskJumble, MasteryRow, MASTERY_REQUIRED } from './TeachAskQuestion.jsx';
import { getVoiceLang, speak } from '../utils/voice.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const SET_SIZE = 3;
const TOTAL_ITEMS = 9;
const AFFIRMATIVES = ['Nice one!', 'You nailed it!', 'Spot on!', 'Boom, correct!', 'Well played!', "That's a win!", 'Fantastic!', 'Perfect!', 'Brilliant!', 'Nailed it!', 'Outstanding!', 'Excellent!'];
const VOICE_TOPICS = new Set(['idioms', 'oneWordSubs', 'proverbs', 'oxymorons', 'similes']);

// ── Content helpers ───────────────────────────────────────────────────────────

function getTeachContent(topicId, item) {
  switch (topicId) {
    case 'idioms':       return { front: item.idiom, back: item.meaning, tts: `${item.idiom}. ${item.meaning}` };
    case 'oneWordSubs':  return { front: item.word, back: item.phrase, tts: `${item.word}. ${item.phrase}` };
    case 'proverbs':     return { front: item.proverb, back: item.meaning, tts: `${item.proverb}. Meaning: ${item.meaning}` };
    case 'oxymorons': {
      const meaning = item.meaning.split(' / ')[0];
      return { front: item.phrase, back: meaning, tts: `${item.phrase}. ${meaning}` };
    }
    case 'similes':      return { front: item.simile, back: null, tts: item.simile };
    case 'synonyms': {
      const syns = Array.isArray(item.synonyms) ? item.synonyms.join(', ') : (item.synonym || '');
      return { front: item.word, back: `Synonyms: ${syns}`, tts: `${item.word}. Synonyms: ${syns}` };
    }
    case 'antonyms':     return { front: item.word, back: `Antonym: ${item.antonym}`, tts: `${item.word}. Antonym: ${item.antonym}` };
    case 'collectiveNouns': return { front: item.phrase, back: `${item.collective} — collective noun for ${item.noun}`, tts: item.phrase };
    case 'homophones':   return { front: item.sentence?.replace('____', `[${item.answer}]`) || item.sentence, back: `Answer: ${item.answer} (${item.label || ''})`, tts: item.sentence?.replace('____', item.answer) || '' };
    default:             return { front: item.id, back: '', tts: item.id };
  }
}

function getAnswerStr(topicId, item) {
  switch (topicId) {
    case 'idioms':           return item.idiom;
    case 'oneWordSubs':      return item.word;
    case 'proverbs':         return item.proverb;
    case 'oxymorons':        return item.phrase;
    case 'similes': {
      const m = item.simile?.match(/^As\s+(.+?)\s+as\s+(.+)$/i);
      return m ? m[2].replace(/[/\\]/g, ' ').trim() : item.simile;
    }
    case 'synonyms':         return Array.isArray(item.synonyms) ? item.synonyms[0] : (item.synonym || '');
    case 'antonyms':         return item.antonym;
    case 'collectiveNouns':  return item.collective;
    case 'homophones':       return item.answer;
    default:                 return '';
  }
}

function isMultiWord(str) { return (str || '').split(/\s+/).filter(Boolean).length >= 2; }

// ── Queue helpers ─────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function toJumble(topicId, item) {
  const answer = getAnswerStr(topicId, item);
  const content = getTeachContent(topicId, item);
  const prompt = content.back || content.front;
  return { type: 'jumble', itemId: item.id, answer, prompt, words: shuffle(answer.split(/\s+/).filter(Boolean)) };
}

function buildInitialQueue(setItems, topicId) {
  const mcqs = shuffle(setItems.map(item => { const q = buildTeachMCQ(topicId, item); return q ? { type: 'mcq', itemId: item.id, q } : null; }).filter(Boolean));
  const voices = VOICE_TOPICS.has(topicId)
    ? shuffle(setItems.map(item => { const q = getVoiceQ(topicId, item); return q ? { type: 'voice', itemId: item.id, q } : null; }).filter(Boolean))
    : [];
  const jumbles = shuffle(setItems.filter(item => isMultiWord(getAnswerStr(topicId, item))).map(item => toJumble(topicId, item)));
  return [...mcqs, ...voices, ...jumbles];
}

function buildRefillQueue(setItems, mastery, topicId) {
  const needy = setItems.filter(item => (mastery[item.id] || 0) < MASTERY_REQUIRED);
  if (!needy.length) return [];
  return shuffle(needy.map(item => {
    const m = mastery[item.id] || 0;
    const type = m % 3;
    if (type === 0 || !VOICE_TOPICS.has(topicId)) { const q = buildTeachMCQ(topicId, item); return q ? { type: 'mcq', itemId: item.id, q } : null; }
    if (type === 1) { const q = getVoiceQ(topicId, item); if (q) return { type: 'voice', itemId: item.id, q }; }
    if (isMultiWord(getAnswerStr(topicId, item))) return toJumble(topicId, item);
    const q = buildTeachMCQ(topicId, item); return q ? { type: 'mcq', itemId: item.id, q } : null;
  }).filter(Boolean));
}

// ── Fuzzy match for voice ─────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function scoreMatch(got, expected) {
  const gw = got.toLowerCase().split(/\s+/).filter(Boolean);
  const ew = expected.toLowerCase().split(/\s+/).filter(Boolean);
  if (!gw.length || !ew.length) return { ratio: 0, matched: new Array(ew.length).fill(false) };
  let hits = 0;
  const matched = new Array(ew.length).fill(false);
  for (const g of gw) {
    const idx = ew.findIndex((e, i) => !matched[i] && levenshtein(g, e) <= (e.length <= 4 ? 1 : 2));
    if (idx !== -1) { hits++; matched[idx] = true; }
  }
  return { ratio: hits / ew.length, matched };
}

// ── TTS ───────────────────────────────────────────────────────────────────────

function ttsSay(text, onEnd) {
  speak(text, { rate: 0.9, onEnd });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeachAndAsk({ topicId, username, onQuit }) {
  const [sets, setSets]         = useState([]);
  const [setIdx, setSetIdx]     = useState(0);
  const [phase, setPhase]       = useState('teach');
  const [teachPage, setTeachPage] = useState(0);
  const [queue, setQueue]       = useState([]);
  const [qIdx, setQIdx]         = useState(0);
  const [mastery, setMastery]   = useState({});
  const [coins, setCoins]       = useState(0);
  // MCQ state
  const [mcqSel, setMcqSel]     = useState(null);
  const [mcqDone, setMcqDone]   = useState(false);
  // Jumble state
  const [jBank, setJBank]       = useState([]);
  const [jBuilt, setJBuilt]     = useState([]);
  const [jDone, setJDone]       = useState(false);
  const [jResult, setJResult]   = useState(null);
  // Voice state
  const [vState, setVState]     = useState('idle');
  const [vTx, setVTx]           = useState('');
  const [vTip, setVTip]         = useState(null);
  // Affirmative
  const [affirmMsg, setAffirmMsg] = useState('');

  const recRef    = useRef(null);
  const submitRef = useRef(null);
  const nextRef   = useRef(null);
  const backRef   = useRef(null);
  const affTRef   = useRef(null);

  // Keep refs current
  nextRef.current = handleTeachNext;
  backRef.current = handleTeachBack;

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const items = buildTeachSession(topicId, TOTAL_ITEMS, getScores(username));
    const s = [];
    for (let i = 0; i < items.length; i += SET_SIZE) s.push(items.slice(i, i + SET_SIZE));
    setSets(s);
  }, [topicId, username]);

  // ── Teach: TTS on card change ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'teach' || !sets[setIdx]) return;
    const item = sets[setIdx][teachPage];
    if (!item) return;
    const delay = setTimeout(() => ttsSay(getTeachContent(topicId, item).tts), 400);
    return () => { clearTimeout(delay); window.speechSynthesis.cancel(); };
  }, [phase, setIdx, teachPage, sets, topicId]);

  // ── Teach: keyboard nav ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'teach') return;
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextRef.current();
      if (e.key === 'ArrowLeft') backRef.current();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase]);

  // ── Ask: build queue when entering phase ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ask' || !sets[setIdx]) return;
    setQueue(buildInitialQueue(sets[setIdx], topicId));
    setQIdx(0);
  }, [phase, setIdx]);

  // ── Ask: per-question setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ask' || !queue.length) return;
    // Reset all question UI
    setMcqSel(null); setMcqDone(false);
    setJDone(false); setJResult(null);
    setVState('idle'); setVTx(''); setVTip(null);
    stopVoice();

    const q = queue[qIdx];
    if (!q) return;
    if (q.type === 'mcq') {
      ttsSay(q.q.prompt.replace(/\n/g, '. '));
    } else if (q.type === 'voice') {
      const tts = (q.q.ttsPrompt || q.q.prompt).replace(/_{2,}/g, 'blank');
      ttsSay(tts, () => setTimeout(startVoice, 400));
    } else if (q.type === 'jumble') {
      setJBank(q.words.map((w, i) => ({ w, i })));
      setJBuilt([]);
      ttsSay(q.prompt);
    }
    return () => stopVoice();
  }, [queue, qIdx, phase]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => { window.speechSynthesis.cancel(); stopVoice(); }, []);

  // ── Teach navigation ────────────────────────────────────────────────────────

  function handleTeachNext() {
    if (!sets[setIdx]) return;
    if (teachPage < sets[setIdx].length - 1) {
      setTeachPage(p => p + 1);
    } else {
      setPhase('ask');
    }
  }

  function handleTeachBack() {
    if (teachPage > 0) setTeachPage(p => p - 1);
  }

  // ── Advance queue (called after each question) ──────────────────────────────

  function advanceQueue(isCorrect) {
    const q = queue[qIdx];
    let newMastery = mastery;
    if (isCorrect) {
      const cur = (mastery[q.itemId] || 0) + 1;
      newMastery = { ...mastery, [q.itemId]: cur };
      setMastery(newMastery);
      setCoins(c => c + 15);
      addCoins(username, 15);
      const msg = AFFIRMATIVES[Math.floor(Math.random() * AFFIRMATIVES.length)];
      setAffirmMsg(msg);
      clearTimeout(affTRef.current);
      affTRef.current = setTimeout(() => setAffirmMsg(''), 1600);
    }

    const nextIdx = qIdx + 1;
    if (nextIdx < queue.length) { setQIdx(nextIdx); return; }

    const refill = buildRefillQueue(sets[setIdx], newMastery, topicId);
    if (refill.length) { setQueue(refill); setQIdx(0); return; }

    // Set complete
    const next = setIdx + 1;
    if (next < sets.length) {
      setSetIdx(next); setTeachPage(0); setPhase('teach');
    } else {
      setPhase('done');
    }
  }

  // ── MCQ ─────────────────────────────────────────────────────────────────────

  function handleMCQSelect(idx) {
    if (mcqDone) return;
    setMcqSel(idx); setMcqDone(true);
    const q = queue[qIdx];
    const correct = q.q.correctIndices ? q.q.correctIndices.includes(idx) : idx === q.q.correctIndex;
    ttsSay(q.q.options[q.q.correctIndex]);
    setTimeout(() => advanceQueue(correct), correct ? 1400 : 2000);
  }

  // ── Voice ────────────────────────────────────────────────────────────────────

  submitRef.current = (tx) => {
    const q = queue[qIdx];
    if (!q || q.type !== 'voice') return;
    const { ratio, matched } = scoreMatch(tx, q.q.answer);
    const correct = ratio >= 0.85;
    const words = q.q.answer.split(/\s+/).filter(Boolean);
    setVTip({ matched, words, correct });
    setVState('done');
    ttsSay(correct ? q.q.answer : `The answer is: ${q.q.answer}`);
    setTimeout(() => advanceQueue(correct), 3000);
  };

  function startVoice() {
    if (!SR) return;
    stopVoice();
    const rec = new SR();
    recRef.current = rec;
    rec.lang = getVoiceLang(); rec.interimResults = true; rec.continuous = false;
    let handled = false;
    rec.onresult = (e) => {
      handled = true;
      const tx = Array.from(e.results).map(r => r[0].transcript).join('');
      setVTx(tx);
      if (e.results[e.results.length - 1].isFinal) { stopVoice(); submitRef.current(tx); }
    };
    rec.onend = () => { if (!handled) { setVState('listening'); try { rec.start(); } catch {} } };
    setVState('listening');
    try { rec.start(); } catch {}
  }

  function stopVoice() {
    const r = recRef.current;
    if (!r) return;
    r.onresult = null; r.onend = null; r.onerror = null;
    try { r.stop(); } catch {}
    recRef.current = null;
    setVState('idle');
  }

  // ── Jumble ───────────────────────────────────────────────────────────────────

  function handleJumbleTile(tile, from) {
    if (jDone) return;
    if (from === 'bank') { setJBank(b => b.filter(t => t.i !== tile.i)); setJBuilt(b => [...b, tile]); }
    else { setJBuilt(b => b.filter(t => t.i !== tile.i)); setJBank(b => [...b, tile]); }
  }

  function handleJumbleSubmit() {
    if (jDone || !jBuilt.length) return;
    const q = queue[qIdx];
    const built = jBuilt.map(t => t.w).join(' ');
    const correct = built.toLowerCase() === q.answer.toLowerCase();
    setJResult(correct); setJDone(true);
    ttsSay(correct ? q.answer : `The answer is: ${q.answer}`);
    setTimeout(() => advanceQueue(correct), 2500);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!sets.length) return <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#9CA3AF' }}>Loading…</div>;

  const meta = TOPIC_META[topicId] || { name: topicId, icon: '📖', color: '#197A56', bg: '#E3FDDB' };
  const totalItems = sets.reduce((s, s2) => s + s2.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 48 }}>
      <style>{`@keyframes affirmPop { 0%{transform:translateX(-50%) scale(.8);opacity:0} 20%{transform:translateX(-50%) scale(1.1);opacity:1} 80%{transform:translateX(-50%) scale(1);opacity:1} 100%{transform:translateX(-50%) scale(.9);opacity:0} } @keyframes micPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onQuit} style={{ background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#DC2626' }}>✕ Quit</button>
        <div style={{ fontFamily: "'Fredoka',cursive", fontWeight: 500, fontSize: 18, color: '#212427' }}>
          {phase === 'teach' ? '📖 Learn' : phase === 'ask' ? '🧠 Quiz' : '🎓 Done'} — {meta.name}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>💰 {coins}</div>
      </div>

      {/* Teach phase */}
      {phase === 'teach' && sets[setIdx] && (
        <TeachCard
          item={sets[setIdx][teachPage]}
          topicId={topicId}
          content={getTeachContent(topicId, sets[setIdx][teachPage])}
          setIdx={setIdx}
          teachPage={teachPage}
          setSize={sets[setIdx].length}
          totalSets={sets.length}
          totalItems={totalItems}
          globalIdx={setIdx * SET_SIZE + teachPage}
          meta={meta}
          onNext={handleTeachNext}
          onBack={handleTeachBack}
          onReplay={() => ttsSay(getTeachContent(topicId, sets[setIdx][teachPage]).tts)}
        />
      )}

      {/* Ask phase */}
      {phase === 'ask' && queue[qIdx] && (
        <>
          <MasteryRow setItems={sets[setIdx]} mastery={mastery} getContent={(item) => getTeachContent(topicId, item)} meta={meta} />
          {queue[qIdx].type === 'mcq'    && <AskMCQ    q={queue[qIdx].q} sel={mcqSel} done={mcqDone} onSelect={handleMCQSelect} meta={meta} />}
          {queue[qIdx].type === 'voice'  && <AskVoice  q={queue[qIdx].q} vState={vState} vTx={vTx} vTip={vTip} onRetry={() => { setVTx(''); startVoice(); }} meta={meta} hasSR={!!SR} />}
          {queue[qIdx].type === 'jumble' && <AskJumble q={queue[qIdx]} jBank={jBank} jBuilt={jBuilt} jDone={jDone} jResult={jResult} onTile={handleJumbleTile} onSubmit={handleJumbleSubmit} meta={meta} />}
        </>
      )}

      {/* Done phase */}
      {phase === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 20 }} className="fade-in">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
          <div style={{ fontFamily: "'Fredoka',cursive", fontSize: 28, fontWeight: 600, color: '#212427', marginBottom: 8 }}>Session Complete!</div>
          <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 24, textAlign: 'center' }}>You mastered {totalItems} {meta.name} items</div>
          <div style={{ fontSize: 40, marginBottom: 28 }}>💰 {coins}</div>
          <button onClick={onQuit} style={{ background: meta.color, border: 'none', borderRadius: 16, padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>Back to Home</button>
        </div>
      )}

      {/* Affirmative overlay */}
      {affirmMsg && (
        <div style={{ position: 'fixed', top: '22%', left: '50%', transform: 'translateX(-50%)', background: '#212427', color: '#fff', borderRadius: 20, padding: '16px 28px', fontSize: 20, fontWeight: 700, zIndex: 100, animation: 'affirmPop 1.6s ease forwards', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {affirmMsg}
        </div>
      )}
    </div>
  );
}
