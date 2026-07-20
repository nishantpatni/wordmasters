import { useState, useEffect, useRef } from 'react';
import { TOPIC_META } from '../data/topicData.js';
import { GEO_TOPIC_META } from '../data/geoTopicData.js';
import {
  VOICE_LANG_OPTIONS, getVoiceLang, setVoiceLang,
  getVoiceName, setVoiceName, getVoicesForLang, onVoicesChanged, speak,
} from '../utils/voice.js';
import { scoreMatchAny, scoreMatchAll, formatAnswerList } from '../utils/voiceMatch.js';
import VoiceFooter from '../components/VoiceFooter.jsx';

const MATCH_THRESHOLD    = 0.9;
const TIP_MS             = 3000;
const TIP_MS_WRONG       = 5200; // longer so "you said X — the answer is Y" has time to finish
const LISTEN_SECS_BASE   = 20;
const LISTEN_SECS_PER_EXTRA_WORD = 3;

function wordCountOf(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Longer answers need more time to speak — add 3s per word beyond the first.
// "All answers required" questions (requiredAnswers) must add up every word
// the user needs to say; "any one of" questions (answer/altAnswers) only
// need the longest single alternative, since the user only says one.
function listenSecsFor(q) {
  if (!q) return LISTEN_SECS_BASE;
  const wordCount = q.requiredAnswers
    ? q.requiredAnswers.reduce((sum, r) => sum + wordCountOf(r), 0)
    : Math.max(...[q.answer, ...(q.altAnswers || [])].map(wordCountOf));
  return LISTEN_SECS_BASE + LISTEN_SECS_PER_EXTRA_WORD * Math.max(0, wordCount - 1);
}

const AFFIRMATIVES = [
  'Nice one!', "That's good!", 'Love it!', "Yep, that's right!", 'You got it!',
  'You nailed it!', 'Great going!', 'Well played!', "That's the way!", 'Perfect!',
  'Spot on!', 'Exactly!', 'Looking good!', 'Solid work!', 'Boom, correct!',
  "That's a win!", 'Nicely done!', "You're getting it!", 'So good!', 'Keep going!',
];

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

// ── TTS helper ────────────────────────────────────────────────────────────────
function ttsSay(text, onEnd) {
  speak(text, { rate: 0.85, onEnd });
}

// ── Web Audio cues — lets someone follow the whole quiz by ear, screen off ────
function playChime(notes) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(({ freq, t, dur, type = 'sine', peak = 0.2 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur + 0.02);
    });
  } catch {}
}

// New question card appears
function playNewQuestionCue() {
  playChime([
    { freq: 440,    t: 0,    dur: 0.10, type: 'triangle', peak: 0.14 },
    { freq: 587.33, t: 0.09, dur: 0.15, type: 'triangle', peak: 0.14 },
  ]);
}

// Mic just started listening
function playListenCue() {
  playChime([{ freq: 900, t: 0, dur: 0.11, peak: 0.16 }]);
}

// Correct answer — bright "coin win" ding
function playCorrectCue() {
  playChime([
    { freq: 987.77,  t: 0,    dur: 0.09, type: 'square', peak: 0.16 },
    { freq: 1318.51, t: 0.07, dur: 0.24, type: 'square', peak: 0.18 },
  ]);
}

// Incorrect answer
function playWrongCue() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

// ── Per-topic labels ──────────────────────────────────────────────────────────
const TOPIC_VOICE_LABELS = {
  idioms:          { question: 'What idiom means…',     instruction: 'Speak the idiom' },
  oneWordSubs:     { question: 'One word for…',          instruction: 'Say the one-word answer' },
  proverbs:        { question: 'Which proverb means…',   instruction: 'Speak the proverb' },
  oxymorons:       { question: 'Name the oxymoron for…', instruction: 'Say the oxymoron' },
  similes:         { question: 'Complete the simile',    instruction: 'Say every missing word' },
  vocabopediaSimiles: { question: 'Complete the simile', instruction: 'Say every missing word' },
  antonyms:        { question: 'What is the antonym of…', instruction: 'Speak every antonym' },
  synonyms:        { question: 'Say the synonyms for…',   instruction: 'Speak every synonym' },
  collectiveNouns: { question: 'Name the collective noun…', instruction: 'Speak the collective noun' },
  statesCapitals:  { question: 'Indian Geography',       instruction: 'Speak your answer' },
};
function voiceLabel(topicId) {
  return TOPIC_VOICE_LABELS[topicId] || { question: 'Say the answer…', instruction: 'Speak your answer' };
}

// ── Chrome-only gate ──────────────────────────────────────────────────────────
function NotSupported({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F1EEEA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 400, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #DCD5CE' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
        <div style={{ fontFamily: "'Fredoka', cursive", fontSize: 22, fontWeight: 500, marginBottom: 10, color: '#212427' }}>
          Chrome Only
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          Voice Quiz uses the Web Speech API which only works in{' '}
          <strong>Chrome on desktop</strong>. Please open Word Masters in Chrome to use this feature.
        </div>
        <button
          onClick={onBack}
          style={{ background: '#212427', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: "'Fredoka', cursive", fontSize: 16, cursor: 'pointer' }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoiceTest({ questions, onComplete, onQuit, quitRef }) {
  const [idx,        setIdx]       = useState(0);
  // phase: 'ready' | 'listening' | 'reviewing' | 'result' | 'mic-blocked'
  const [phase,      setPhase]     = useState('ready');
  const [transcript, setTranscript] = useState('');
  const [autoSub,    setAutoSub]   = useState(() => localStorage.getItem('wm_vauto') !== 'off');
  const [tipData,    setTipData]   = useState(null);
  const [points,     setPoints]    = useState(0);
  const [results,    setResults]   = useState([]);
  const [timeLeft,   setTimeLeft]  = useState(LISTEN_SECS_BASE);
  const [blackScreen, setBlackScreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceLang,  setVoiceLangState] = useState(getVoiceLang);
  const [voiceName,  setVoiceNameState] = useState(getVoiceName);
  const [availVoices, setAvailVoices]   = useState([]);

  const q    = questions[idx];
  const meta = TOPIC_META[q?.topicId] || GEO_TOPIC_META[q?.topicId] || { color: '#D97706', bg: '#FFFBEB', name: 'Voice Quiz', icon: '🎤' };
  const pct  = (idx / questions.length) * 100;
  const correctCount = results.filter(r => r.correct).length;

  // Stable refs so event callbacks always see current values
  const recogRef   = useRef(null);
  const tipTRef    = useRef(null);
  const tickRef    = useRef(null);
  const idxRef     = useRef(0);    idxRef.current     = idx;
  const resultsRef = useRef([]);   resultsRef.current = results;
  const autoSubRef = useRef(true); autoSubRef.current = autoSub;
  const txRef      = useRef('');   txRef.current      = transcript;
  const startRef   = useRef(null);
  const submitRef  = useRef(null);
  const affirmTRef = useRef(null);
  const [affirmMsg, setAffirmMsg] = useState(null);
  const settingsOpenRef = useRef(false); settingsOpenRef.current = settingsOpen;
  const resumePhaseRef  = useRef(null);
  const settingsPanelRef = useRef(null);

  function stopRec() {
    clearInterval(tickRef.current);
    if (recogRef.current) {
      try {
        recogRef.current.onend = recogRef.current.onresult = recogRef.current.onerror = null;
        recogRef.current.stop();
      } catch {}
      recogRef.current = null;
    }
  }

  function submitAnswer(tx) {
    stopRec();
    const cur    = questions[idxRef.current];
    const allMode = !!cur.requiredAnswers;
    const answers = allMode ? cur.requiredAnswers : [cur.answer, ...(cur.altAnswers || [])];
    const { score, wordResults, answer: matchedAnswer } = allMode
      ? scoreMatchAll(cur.requiredAnswers, tx || '')
      : scoreMatchAny(answers, tx || '');
    const threshold  = allMode ? 1 : MATCH_THRESHOLD;
    const correct    = score >= threshold;
    const coins      = correct ? 10 : 0;
    const heard      = (tx || '').trim();
    const answerText = formatAnswerList(answers, allMode ? 'and' : 'or');

    if (correct) {
      playCorrectCue();
      setPoints(p => p + coins);
      const msg = AFFIRMATIVES[Math.floor(Math.random() * AFFIRMATIVES.length)];
      setAffirmMsg(msg);
      clearTimeout(affirmTRef.current);
      affirmTRef.current = setTimeout(() => setAffirmMsg(null), 1600);
      setTimeout(() => ttsSay(allMode ? answerText : matchedAnswer), 450);
    } else {
      playWrongCue();
      // Say what was actually heard before the correct answer — lets a
      // screen-off user tell a mishear apart from a genuine wrong answer.
      setTimeout(() => {
        ttsSay(heard ? `You said: ${heard}.` : `I didn't hear anything.`, () => {
          ttsSay(`The answer is ${answerText}.`);
        });
      }, 450);
    }

    const newRes = {
      itemId: cur.itemId, topicId: cur.topicId, correct,
      selectedOption: tx || '(no speech)',
      correctAnswer:  answerText,
      prompt:         cur.prompt,
      quizType:       'voice',
    };
    const updated = [...resultsRef.current, newRes];
    resultsRef.current = updated; // update immediately so quit captures this result

    setTipData({ correct, wordResults, coins, score, threshold });
    setPhase('result');

    tipTRef.current = setTimeout(() => {
      setTipData(null);
      if (idxRef.current + 1 >= questions.length) {
        onComplete(updated);
      } else {
        setResults(updated);
        setIdx(idxRef.current + 1);
      }
    }, correct ? TIP_MS : TIP_MS_WRONG);
  }

  function startListening() {
    if (!SR || settingsOpenRef.current) return;
    stopRec();
    setTranscript('');
    setPhase('listening');
    setTimeLeft(listenSecsFor(q));
    playListenCue();

    const r = new SR();
    r.continuous      = false;
    r.interimResults  = true;
    r.lang            = getVoiceLang();
    recogRef.current  = r;

    r.onresult = e => {
      let t = '';
      for (const res of e.results) t += res[0].transcript;
      const cleaned = t.trim();
      setTranscript(cleaned);
      txRef.current = cleaned;
    };

    r.onend = () => {
      clearInterval(tickRef.current);
      if (autoSubRef.current) {
        submitRef.current(txRef.current);
      } else {
        setPhase('reviewing');
      }
    };

    r.onerror = e => {
      clearInterval(tickRef.current);
      if (e.error === 'not-allowed') setPhase('mic-blocked');
      else setPhase('reviewing');
    };

    r.start();

    tickRef.current = setInterval(() => {
      if (settingsOpenRef.current) return; // paused while settings panel is open
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          try { r.stop(); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Always point refs at latest function versions
  submitRef.current = submitAnswer;
  startRef.current  = startListening;

  // Pause gameplay while the settings panel is open: stop the mic/TTS and
  // remember whether we were actively waiting on speech, so we can resume
  // listening fresh once the panel closes.
  useEffect(() => {
    if (settingsOpen) {
      resumePhaseRef.current = (phase === 'ready' || phase === 'listening') ? phase : null;
      stopRec();
      window.speechSynthesis?.cancel();
    } else if (resumePhaseRef.current) {
      resumePhaseRef.current = null;
      startRef.current?.();
    }
  }, [settingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeVoiceLang(lang) {
    setVoiceLang(lang);
    setVoiceLangState(lang);
    setVoiceName('');
    setVoiceNameState('');
  }

  function changeVoiceName(name) {
    setVoiceName(name);
    setVoiceNameState(name);
  }

  useEffect(() => onVoicesChanged(() => setAvailVoices(getVoicesForLang(voiceLang))), [voiceLang]);

  // Close settings panel on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    function onOutside(e) {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [settingsOpen]);

  // Per-question reset: TTS reads meaning, then start listening
  useEffect(() => {
    if (!q) return;
    clearTimeout(tipTRef.current);
    stopRec();
    window.speechSynthesis?.cancel();
    setPhase('ready');
    setTranscript('');
    setTipData(null);
    setTimeLeft(listenSecsFor(q));
    playNewQuestionCue();

    let fired = false;
    const fallback = setTimeout(() => {
      if (!fired) { fired = true; startRef.current(); }
    }, 4800);

    // Small gap after the chime so it doesn't talk over the TTS prompt.
    const ttsTimer = setTimeout(() => {
      ttsSay(q.ttsPrompt || q.prompt, () => {
        if (!fired) { fired = true; clearTimeout(fallback); startRef.current(); }
      });
    }, 300);

    return () => {
      clearTimeout(fallback);
      clearTimeout(ttsTimer);
      stopRec();
      window.speechSynthesis?.cancel();
    };
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter key submits in reviewing phase
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' && phase === 'reviewing' && transcript.trim()) {
        submitRef.current(transcript);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, transcript]);

  // Esc dismisses the black screen (quiz keeps running underneath either way)
  useEffect(() => {
    if (!blackScreen) return;
    function onKey(e) {
      if (e.key === 'Escape') setBlackScreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blackScreen]);

  // Unmount cleanup
  useEffect(() => () => {
    stopRec();
    window.speechSynthesis?.cancel();
    clearTimeout(tipTRef.current);
    clearTimeout(affirmTRef.current);
  }, []);

  function handleQuit() {
    stopRec();
    window.speechSynthesis?.cancel();
    clearTimeout(tipTRef.current);
    onQuit(resultsRef.current);
  }
  if (quitRef) quitRef.current = handleQuit;

  function toggleAutoSub() {
    const n = !autoSub;
    setAutoSub(n);
    localStorage.setItem('wm_vauto', n ? 'on' : 'off');
  }

  if (!SR) return <NotSupported onBack={() => onQuit([])} />;

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }} ref={settingsPanelRef}>
          <button onClick={handleQuit} style={S.backBtn}>✕ Quit</button>
          <button
            onClick={() => setSettingsOpen(p => !p)}
            style={{ ...S.backBtn, fontSize: 15, padding: '7px 10px', color: settingsOpen ? '#212427' : '#6B7280', background: settingsOpen ? '#F2F2F2' : 'transparent' }}
            title="Settings"
          >⚙️</button>
          <label style={S.autoLabel}>
            <input
              type="checkbox"
              checked={autoSub}
              onChange={toggleAutoSub}
              style={{ accentColor: '#D97706', width: 14, height: 14 }}
            />
            Auto-submit
          </label>
          {settingsOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', borderRadius: 14, border: '1px solid #DCD5CE', padding: '14px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 30, minWidth: 260 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FFFBEB', borderRadius: 8, padding: '6px 10px', marginBottom: 10 }}>
                ⏸ Game paused — mic and timer are off while this is open
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#212427', marginBottom: 2 }}>🌐 Voice accent</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>Applies to spoken questions and voice recognition, everywhere in the app</div>
              <select
                value={voiceLang}
                onChange={e => changeVoiceLang(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD5CE', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#212427', background: '#fff' }}
              >
                {VOICE_LANG_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {availVoices.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#9CA3AF', margin: '8px 0 4px' }}>
                    Specific voice — pick this if the accent above still sounds like the wrong/muddled voice
                  </div>
                  <select
                    value={voiceName}
                    onChange={e => changeVoiceName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD5CE', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#212427', background: '#fff' }}
                  >
                    <option value="">Auto (browser default)</option>
                    {availVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name}{v.localService ? '' : ' (online)'}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...S.pill, background: '#E3FDDB', color: '#197A56' }}>✓ {correctCount}</div>
          <div style={{ ...S.pill, background: '#FEF2F2', color: '#DC2626' }}>✗ {idx - correctCount}</div>
          <div style={{ ...S.pill, background: '#FFFBEB', color: '#D97706', fontFamily: "'Fredoka', cursive" }}>🪙 {points}</div>
          <div style={{ ...S.pill, background: '#F2F2F2', color: '#212427' }}>{idx + 1}/{questions.length}</div>
          <button
            onClick={() => setBlackScreen(true)}
            style={S.blackScreenToggle}
            title="Turn the screen black to avoid eye strain — the quiz keeps running by audio"
          >
            🌑
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 5, background: 'rgba(0,0,0,0.06)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, #E85D26)`, transition: 'width 0.4s ease' }} />
      </div>

      {/* ── Card ── */}
      <div style={S.body}>
        <div style={S.card} key={idx} className="pop-in">

          {/* Card header: topic badge + timer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ ...S.badge, background: meta.bg, color: meta.color }}>
              {meta.icon} {meta.name} · 🎤 Voice
            </span>
            {phase === 'listening' && (
              <div style={{ fontFamily: "'Fredoka', cursive", fontSize: 18, fontWeight: 500, color: timeLeft <= 5 ? '#DC2626' : '#9CA3AF' }}>
                {timeLeft}s
              </div>
            )}
          </div>

          {/* Meaning */}
          <div style={S.label}>{voiceLabel(q.topicId).question}</div>
          <div style={S.meaning}>{q.prompt}</div>
          <button onClick={() => ttsSay(q.ttsPrompt || q.prompt)} style={S.replayBtn}>🔉 Hear again</button>

          {/* Phase-specific UI */}
          <div style={{ marginTop: 24 }}>

            {phase === 'ready' && (
              <div style={S.center}>
                <span style={{ fontSize: 44 }}>🔊</span>
                <div style={S.stateLabel}>Listening to the meaning…</div>
                <button onClick={() => startListening()} style={S.ghostBtn}>
                  Skip → 🎤 Speak now
                </button>
              </div>
            )}

            {phase === 'listening' && (
              <div>
                <div style={S.center}>
                  <span style={{ fontSize: 52, display: 'inline-block', animation: 'micPulse 1s ease-in-out infinite' }}>🎤</span>
                  <div style={{ ...S.stateLabel, color: '#DC2626', fontWeight: 700 }}>
                    {q.instruction || voiceLabel(q.topicId).instruction}…
                  </div>
                </div>
                <div style={S.txBox}>
                  <span style={{ color: transcript ? '#212427' : '#9CA3AF', fontStyle: transcript ? 'normal' : 'italic' }}>
                    {transcript || 'Listening…'}
                  </span>
                </div>
              </div>
            )}

            {phase === 'reviewing' && (
              <div>
                <div style={{ ...S.label, marginBottom: 6 }}>You said:</div>
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  style={S.txInput}
                  rows={2}
                  placeholder="Edit transcription here, or re-record…"
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button onClick={() => startListening()} style={S.reRecordBtn}>
                    🎤 Re-record
                  </button>
                  <button
                    onClick={() => submitAnswer(transcript)}
                    disabled={!transcript.trim()}
                    style={{ ...S.submitBtn, opacity: transcript.trim() ? 1 : 0.45, cursor: transcript.trim() ? 'pointer' : 'not-allowed' }}
                  >
                    Submit →
                  </button>
                </div>
                {transcript.trim() && (
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#C4C2B9' }}>
                    <kbd style={{ background: '#F1EFE8', border: '1px solid #D3D1C7', borderRadius: 5, padding: '2px 8px', fontFamily: 'monospace', fontSize: 11, color: '#7A7870' }}>Enter</kbd>
                    {' '}to submit
                  </div>
                )}
              </div>
            )}

            {phase === 'mic-blocked' && (
              <div style={{ ...S.center, gap: 6 }}>
                <span style={{ fontSize: 36 }}>🚫</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
                  Microphone access blocked
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                  Allow microphone access in your browser settings, then reload.
                </div>
              </div>
            )}

            {phase === 'result' && <div style={{ height: 60 }} />}
          </div>
        </div>
      </div>

      {/* ── 3-second tip overlay ── */}
      {tipData && (
        <div style={S.overlay}>
          <div style={S.tipCard} className="pop-in">
            <div style={{ fontSize: 36, marginBottom: 6 }}>
              {tipData.correct ? '🎉' : '😔'}
            </div>
            <div style={{ fontFamily: "'Fredoka', cursive", fontSize: 22, fontWeight: 500, marginBottom: 4, color: tipData.correct ? '#197A56' : '#DC2626' }}>
              {tipData.correct ? `+${tipData.coins} 🪙  Correct!` : 'Not quite!'}
            </div>
            {!tipData.correct && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                {Math.round(tipData.score * 100)}% match — need {Math.round(tipData.threshold * 100)}%
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9CA3AF', margin: '10px 0 8px' }}>
              {tipData.correct ? 'You got it:' : 'Correct answer:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {tipData.wordResults.map((w, i) => (
                <span key={i} style={{
                  background:   w.matched ? '#E3FDDB' : '#FEF2F2',
                  color:        w.matched ? '#197A56' : '#DC2626',
                  border:       `1.5px solid ${w.matched ? '#21BF61' : '#DC2626'}`,
                  borderRadius: 8, padding: '5px 12px', fontSize: 15, fontWeight: 700,
                  textTransform: 'capitalize',
                }}>
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Affirmative pop ── */}
      {affirmMsg && (
        <div style={{
          position: 'fixed', top: '42%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60, pointerEvents: 'none',
          animation: 'affirmPop 1.6s ease forwards',
          fontFamily: "'Fredoka', cursive",
          fontSize: 28, fontWeight: 600,
          color: meta.color,
          background: meta.bg,
          padding: '11px 22px',
          borderRadius: 18,
          boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
          whiteSpace: 'nowrap',
          border: `1.5px solid ${meta.color}30`,
        }}>
          {affirmMsg}
        </div>
      )}

      {/* ── Black screen (eye-strain relief — quiz keeps running by audio) ── */}
      {blackScreen && (
        <div style={S.blackOverlay}>
          <button
            onClick={() => setBlackScreen(false)}
            style={S.blackCloseBtn}
            aria-label="Exit black screen"
          >
            ✕
          </button>
          <div style={S.blackMsg}>Press <kbd style={S.blackKbd}>Esc</kbd> to view quiz</div>
          <button onClick={() => setBlackScreen(false)} style={S.blackViewBtn}>
            View Quiz →
          </button>
        </div>
      )}

      <style>{`
        @keyframes micPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.2); opacity: 0.85; }
        }
        @keyframes affirmPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.72); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1.12); }
          38%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          68%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(0.88); }
        }
      `}</style>

      <VoiceFooter />
    </div>
  );
}

const S = {
  page:       { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header:     { background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:    { background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6B7280' },
  autoLabel:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer', userSelect: 'none' },
  pill:       { borderRadius: 999, padding: '5px 11px', fontSize: 13, fontWeight: 700 },
  body:       { padding: '20px 16px 40px', maxWidth: 600, margin: '0 auto' },
  card:       { background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #DCD5CE', padding: '24px 22px' },
  badge:      { borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
  label:      { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 8, display: 'block' },
  meaning:    { fontSize: 20, fontWeight: 700, color: '#212427', lineHeight: 1.6, marginBottom: 8 },
  replayBtn:  { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: '#D97706', fontWeight: 700, padding: '2px 0' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '8px 0' },
  stateLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ghostBtn:   { background: 'transparent', border: '1.5px dashed #DCD5CE', borderRadius: 12, padding: '8px 18px', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', marginTop: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  txBox:      { background: '#F9F8F6', borderRadius: 14, padding: '14px 16px', border: '1px solid #E8E4DF', marginTop: 14, fontSize: 15, fontWeight: 600, minHeight: 48 },
  txInput:    { width: '100%', background: '#F9F8F6', border: '1px solid #E8E4DF', borderRadius: 14, padding: '12px 16px', fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, color: '#212427', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' },
  reRecordBtn:{ borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#FFF7ED', color: '#D97706', border: '1.5px solid #D97706', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  submitBtn:  { flex: 1, borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#D97706', color: '#fff', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0 16px 48px' },
  tipCard:    { background: '#fff', borderRadius: 24, padding: '24px 28px', textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
  blackScreenToggle: {
    background: '#212427', color: '#fff', border: 'none', borderRadius: 999,
    width: 30, height: 30, fontSize: 14, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  blackOverlay: {
    position: 'fixed', inset: 0, background: '#000', zIndex: 200,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 22,
  },
  blackCloseBtn: {
    position: 'fixed', top: 18, right: 18, background: 'rgba(255,255,255,0.08)',
    color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 999,
    width: 44, height: 44, fontSize: 18, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  blackMsg: {
    color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8,
  },
  blackKbd: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 6, padding: '2px 9px', fontFamily: 'monospace', fontSize: 13, color: '#fff',
  },
  blackViewBtn: {
    background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.35)',
    borderRadius: 15, padding: '12px 32px', fontFamily: "'Fredoka', cursive",
    fontWeight: 500, fontSize: 16, cursor: 'pointer',
  },
};
