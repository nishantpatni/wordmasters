import { useState, useEffect, useRef } from 'react';
import { TOPIC_META } from '../data/topicData.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const TIMER_SECS     = 10;
const FEEDBACK_DELAY = 2500; // time to read the explanation before advancing

const AFFIRMATIVES = [
  'Nice one!', "That's good!", 'Love it!', "Yep, that's right!", 'You got it!',
  'You nailed it!', 'Great going!', 'Well played!', "That's the way!", 'Perfect!',
  'Spot on!', 'Exactly!', 'Looking good!', 'Solid work!', 'Boom, correct!',
  "That's a win!", 'Nicely done!', "You're getting it!", 'So good!', 'Keep going!',
];

// ── Web Audio sounds ──────────────────────────────────────────────────────────
function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Ascending two-note chime: C5 → G5
    [[523.25, 0], [783.99, 0.13]].forEach(([freq, t]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.22);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch {}
}

function playWrong() {
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

function playRetry() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[480, 0], [480, 0.16]].forEach(([freq, t]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.08);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.1);
    });
  } catch {}
}

function playTimeout() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [380, 320, 260].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.13, ctx.currentTime + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.14 + 0.1);
      osc.start(ctx.currentTime + i * 0.14);
      osc.stop(ctx.currentTime + i * 0.14 + 0.12);
    });
  } catch {}
}

// ── Circular countdown ring shown in the card header ──────────────────────────
function TimerRing({ timeLeft, total, answered }) {
  const r     = 18;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (circ * timeLeft / total);
  const color  = timeLeft > 6 ? '#21BF61' : timeLeft > 3 ? '#F59E0B' : '#DC2626';
  const urgent = timeLeft <= 3 && !answered;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ flexShrink: 0 }}>
      <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
      <circle cx="23" cy="23" r={r} fill="none" stroke={answered ? '#21BF61' : color}
        strokeWidth="3.5" strokeDasharray={circ} strokeDashoffset={answered ? 0 : offset}
        strokeLinecap="round" transform="rotate(-90 23 23)"
        style={{ transition: answered ? 'stroke-dashoffset 0.3s ease' : 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
      <text x="23" y="28" textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 800, fill: answered ? '#21BF61' : color,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          animation: urgent ? 'timerPulse 0.6s infinite' : 'none' }}>
        {answered ? '✓' : timeLeft}
      </text>
    </svg>
  );
}

// ── TTS helpers ───────────────────────────────────────────────────────────────
function ttsSpeak(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.replace(/_{2,}/g, 'blank'));
  utt.rate = 0.88;
  utt.lang = 'en-US';
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Voice-input option matching ───────────────────────────────────────────────
function matchTranscriptToOption(transcript, q) {
  const t     = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const words = new Set(t.split(/\s+/).filter(Boolean));

  // Number / ordinal matching — checked first (most common usage)
  const aliases = [
    ['1', 'one', 'won', 'first'],
    ['2', 'two', 'second'],
    ['3', 'three', 'third'],
    ['4', 'four', 'fourth'],
  ];
  for (let i = 0; i < aliases.length; i++) {
    if (i >= q.options.length) break;
    if (aliases[i].some(kw => words.has(kw))) return i;
  }

  // Word-overlap: content words (length > 2) in spoken text vs each option
  let best = -1, bestScore = 0;
  q.options.forEach((opt, i) => {
    const optW = opt.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    if (!optW.length) return;
    const score = optW.filter(w => words.has(w)).length / optW.length;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return bestScore >= 0.5 ? best : null;
}

function getKeyTerm(prompt) {
  // Extract the quoted term/phrase — most prompts wrap the key word in "..."
  const m = prompt.match(/"([^"]+)"/);
  if (m) return m[1].replace(/___/g, 'blank');
  // Tricky fill-in format: "a _____ of X"
  if (/_{3,}/.test(prompt)) return prompt.replace(/_{3,}/g, 'blank');
  // Fallback: first line, strip trailing question mark
  return prompt.split('\n')[0].replace(/\?$/, '').trim();
}

export default function TestScreen({ questions, onComplete, onQuit }) {
  const [idx,           setIdx]          = useState(0);
  const [sel,           setSel]          = useState(null);       // single-select option idx
  const [multiSel,      setMultiSel]     = useState(new Set());  // multi-select
  const [multiSubmitted,setMultiSubmitted] = useState(false);
  const [timedOut,      setTimedOut]     = useState(false);
  const [showExp,       setShowExp]      = useState(false);
  const [timeLeft,      setTimeLeft]     = useState(TIMER_SECS);
  const [points,        setPoints]       = useState(0);
  const [flash,         setFlash]        = useState(null);
  const [results,       setResults]      = useState([]);
  const [ttsOn,         setTtsOn]        = useState(() => localStorage.getItem('wm_tts') !== 'off');
  const [speakAns,      setSpeakAns]     = useState(() => localStorage.getItem('wm_speak_ans') !== 'off');
  const [settingsOpen,   setSettingsOpen]  = useState(false);
  const [affirmMsg,      setAffirmMsg]     = useState(null);
  const [voiceInput,     setVoiceInput]    = useState(() => localStorage.getItem('wm_voice_mcq') === 'on');
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceNoMatch,   setVoiceNoMatch]  = useState(false);

  const q       = questions[idx];
  const isMulti = q.correctIndices != null && q.correctIndices.length > 1;
  const answered = isMulti ? (multiSubmitted || timedOut) : (sel !== null || timedOut);

  const fillPct  = ((TIMER_SECS - timeLeft) / TIMER_SECS) * 100;
  const meta     = TOPIC_META[q.topicId] || { color: '#212427', bg: '#E3FDDB', name: q.topicId, icon: '📖' };
  const correctCount = results.filter(r => r.correct).length;
  const pct          = (idx / questions.length) * 100;

  // Refs — updated each render so timer callbacks always see fresh values
  const answeredRef   = useRef(false);
  const idxRef        = useRef(0);
  const resultsRef    = useRef([]);
  const multiSelRef   = useRef(new Set());
  const intervalRef   = useRef(null);
  const feedbackRef   = useRef(null);
  const flashTRef     = useRef(null);
  const ttsOnRef      = useRef(ttsOn);
  ttsOnRef.current    = ttsOn;
  const speakAnsRef   = useRef(speakAns);
  speakAnsRef.current = speakAns;
  const affirmTRef       = useRef(null);
  const settingsPanelRef = useRef(null);
  const voiceInputRef    = useRef(false);   voiceInputRef.current  = voiceInput;
  const isMultiRef       = useRef(false);   isMultiRef.current     = isMulti;
  const voiceRecogRef    = useRef(null);
  const startVoiceRef    = useRef(null);

  idxRef.current     = idx;
  resultsRef.current = results;
  multiSelRef.current = multiSel;

  // ── Navigation helpers ────────────────────────────────────────────────────
  function advance(updated) {
    if (idxRef.current + 1 >= questions.length) {
      onComplete(updated);
    } else {
      setResults(updated);
      setIdx(idxRef.current + 1);
    }
  }

  function handleQuit() {
    clearInterval(intervalRef.current);
    clearTimeout(feedbackRef.current);
    stopVoiceInput();
    window.speechSynthesis?.cancel();
    onQuit(resultsRef.current);
  }

  function toggleTts() {
    const next = !ttsOnRef.current;
    setTtsOn(next);
    localStorage.setItem('wm_tts', next ? 'on' : 'off');
    if (!next) window.speechSynthesis?.cancel();
  }

  function toggleSpeakAns() {
    const next = !speakAnsRef.current;
    setSpeakAns(next);
    localStorage.setItem('wm_speak_ans', next ? 'on' : 'off');
  }

  function showAffirmative(correctAnswer) {
    const msg = AFFIRMATIVES[Math.floor(Math.random() * AFFIRMATIVES.length)];
    setAffirmMsg(msg);
    clearTimeout(affirmTRef.current);
    affirmTRef.current = setTimeout(() => setAffirmMsg(null), 1600);
    if (speakAnsRef.current) {
      setTimeout(() => ttsSpeak(correctAnswer), 450);
    }
  }

  function stopVoiceInput() {
    setVoiceListening(false);
    setVoiceNoMatch(false);
    if (voiceRecogRef.current) {
      try {
        voiceRecogRef.current.onend = voiceRecogRef.current.onresult = voiceRecogRef.current.onerror = null;
        voiceRecogRef.current.stop();
      } catch {}
      voiceRecogRef.current = null;
    }
  }

  function startVoiceInput() {
    if (!SR || !voiceInputRef.current || answeredRef.current || isMultiRef.current) return;
    stopVoiceInput();
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    voiceRecogRef.current = r;
    let handled = false;

    r.onresult = e => {
      handled = true;
      voiceRecogRef.current = null;
      const spoken = e.results[0]?.[0]?.transcript || '';
      const matchIdx = matchTranscriptToOption(spoken, questions[idxRef.current]);
      if (matchIdx !== null && !answeredRef.current) {
        setVoiceListening(false);
        handleSelectRef.current(matchIdx);
      } else {
        playRetry();
        setVoiceListening(false);
        setVoiceNoMatch(true);
        setTimeout(() => { setVoiceNoMatch(false); startVoiceRef.current?.(); }, 1400);
      }
    };

    r.onend = () => {
      if (voiceRecogRef.current === r) voiceRecogRef.current = null;
      if (!handled && !answeredRef.current && voiceInputRef.current && !isMultiRef.current) {
        setTimeout(() => startVoiceRef.current?.(), 300);
      } else if (!handled) {
        setVoiceListening(false);
      }
    };

    r.onerror = e => {
      voiceRecogRef.current = null;
      setVoiceListening(false);
      if (e.error !== 'not-allowed' && !answeredRef.current && voiceInputRef.current && !isMultiRef.current) {
        setTimeout(() => startVoiceRef.current?.(), 500);
      }
    };

    try { r.start(); setVoiceListening(true); } catch { setVoiceListening(false); }
  }

  function toggleVoiceInput() {
    const next = !voiceInputRef.current;
    setVoiceInput(next);
    localStorage.setItem('wm_voice_mcq', next ? 'on' : 'off');
    if (!next) stopVoiceInput();
  }

  startVoiceRef.current = startVoiceInput;

  // ── Timer fires when 10s runs out ─────────────────────────────────────────
  function triggerTimeout() {
    if (answeredRef.current) return;
    answeredRef.current = true;
    stopVoiceInput();
    playTimeout();
    setTimedOut(true);
    setShowExp(true);

    const cur     = questions[idxRef.current];
    const isMultiQ = cur.correctIndices != null && cur.correctIndices.length > 1;
    let correct = false;
    let selectedOption = 'timeout';
    let correctAnswer  = cur.options[cur.correctIndex] ?? '';

    if (isMultiQ) {
      const ms = multiSelRef.current;
      const allCorrect = cur.correctIndices.every(i => ms.has(i));
      const noExtra    = [...ms].every(i => cur.correctIndices.includes(i));
      correct = ms.size > 0 && allCorrect && noExtra;
      selectedOption   = ms.size > 0 ? [...ms].map(i => cur.options[i]).join(', ') : 'timeout';
      correctAnswer    = cur.correctIndices.map(i => cur.options[i]).join(' / ');
    }

    const updated = [...resultsRef.current, {
      itemId: cur.itemId, topicId: cur.topicId, correct,
      selectedOption,
      correctAnswer,
      prompt: cur.prompt,
    }];
    feedbackRef.current = setTimeout(() => advance(updated), FEEDBACK_DELAY);
  }

  // ── Single-select: user taps an option ───────────────────────────────────
  function handleSelect(optIdx) {
    if (answeredRef.current || isMulti) return;
    answeredRef.current = true;
    stopVoiceInput();
    clearInterval(intervalRef.current);

    const correct = optIdx === q.correctIndex;
    correct ? playCorrect() : playWrong();
    setSel(optIdx);
    setShowExp(true);

    if (correct) {
      setPoints(p => p + 10);
      setFlash('+10');
      clearTimeout(flashTRef.current);
      flashTRef.current = setTimeout(() => setFlash(null), 1600);
      showAffirmative(q.options[q.correctIndex] ?? '');
    }

    const updated = [...resultsRef.current, {
      itemId: q.itemId, topicId: q.topicId, correct,
      selectedOption: q.options[optIdx] ?? '',
      correctAnswer:  q.options[q.correctIndex] ?? '',
      prompt:         q.prompt,
    }];
    feedbackRef.current = setTimeout(() => advance(updated), FEEDBACK_DELAY);
  }

  // ── Multi-select: toggle an option ───────────────────────────────────────
  function handleMultiToggle(optIdx) {
    if (answeredRef.current) return;
    setMultiSel(prev => {
      const next = new Set(prev);
      next.has(optIdx) ? next.delete(optIdx) : next.add(optIdx);
      return next;
    });
  }

  // ── Multi-select: submit chosen options ──────────────────────────────────
  function handleMultiSubmit() {
    if (answeredRef.current || multiSel.size === 0) return;
    answeredRef.current = true;
    clearInterval(intervalRef.current);

    const allCorrect = q.correctIndices.every(i => multiSel.has(i));
    const noExtra    = [...multiSel].every(i => q.correctIndices.includes(i));
    const correct    = allCorrect && noExtra;

    correct ? playCorrect() : playWrong();
    setMultiSubmitted(true);
    setShowExp(true);

    if (correct) {
      setPoints(p => p + 10);
      setFlash('+10');
      clearTimeout(flashTRef.current);
      flashTRef.current = setTimeout(() => setFlash(null), 1600);
      showAffirmative(q.correctIndices.map(i => q.options[i]).join(' and '));
    }

    const updated = [...resultsRef.current, {
      itemId: q.itemId, topicId: q.topicId, correct,
      selectedOption: [...multiSel].map(i => q.options[i]).join(', '),
      correctAnswer:  q.correctIndices.map(i => q.options[i]).join(' / '),
      prompt:         q.prompt,
    }];
    feedbackRef.current = setTimeout(() => advance(updated), FEEDBACK_DELAY);
  }

  // ── Per-question: reset state + start countdown ───────────────────────────
  useEffect(() => {
    answeredRef.current = false;
    setSel(null);
    setMultiSel(new Set());
    setMultiSubmitted(false);
    setTimedOut(false);
    setShowExp(false);
    setTimeLeft(TIMER_SECS);
    clearInterval(intervalRef.current);
    clearTimeout(feedbackRef.current);

    stopVoiceInput();
    let voiceDelayT;
    const keyTerm = getKeyTerm(questions[idxRef.current]?.prompt ?? '');
    if (ttsOnRef.current) {
      ttsSpeak(keyTerm, () => {
        if (voiceInputRef.current && !isMultiRef.current) startVoiceRef.current?.();
      });
    } else if (voiceInputRef.current && !isMultiRef.current) {
      voiceDelayT = setTimeout(() => startVoiceRef.current?.(), 300);
    }

    const doTimeout = () => triggerTimeout();

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          doTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(feedbackRef.current);
      clearTimeout(voiceDelayT);
      stopVoiceInput();
    };
  }, [idx]);

  // Close settings panel on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    function onOutside(e) {
      if (!settingsPanelRef.current?.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [settingsOpen]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearTimeout(feedbackRef.current);
    clearTimeout(flashTRef.current);
    clearTimeout(affirmTRef.current);
    stopVoiceInput();
    window.speechSynthesis?.cancel();
  }, []);

  // Set body background so the red fill shows through the transparent page on desktop
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#F1EEEA';
    return () => { document.body.style.background = prev; };
  }, []);

  // ── Keyboard: 1-4 selects/toggles options; Enter submits multi ────────────
  const handleSelectRef      = useRef(null);
  const handleMultiToggleRef = useRef(null);
  const handleMultiSubmitRef = useRef(null);
  handleSelectRef.current      = handleSelect;
  handleMultiToggleRef.current = handleMultiToggle;
  handleMultiSubmitRef.current = handleMultiSubmit;

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        if (isMulti) handleMultiToggleRef.current(n - 1);
        else         handleSelectRef.current(n - 1);
      }
      if (e.key === 'Enter' && isMulti) handleMultiSubmitRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMulti]);

  // ── Option styling ────────────────────────────────────────────────────────
  function optStyle(oi) {
    if (isMulti) {
      const isCorrectIdx = q.correctIndices.includes(oi);
      const isSelected   = multiSel.has(oi);
      let bg = '#FAFAF9', border = '#DCD5CE', color = '#212427', anim = 'none';
      if (answered) {
        if (isCorrectIdx && isSelected)       { bg = '#E3FDDB'; border = '#21BF61'; color = '#197A56'; anim = 'correctPop 0.45s ease'; }
        else if (isCorrectIdx && !isSelected) { bg = '#FFF9E6'; border = '#F59E0B'; color = '#B45309'; }
        else if (!isCorrectIdx && isSelected) { bg = '#FEF2F2'; border = '#DC2626'; color = '#DC2626'; anim = 'wrongShake 0.4s ease'; }
      } else if (isSelected) {
        bg = '#E3FDDB'; border = '#96F878'; color = '#197A56';
      }
      return { background: bg, border: `1.5px solid ${border}`, color, animation: anim };
    }

    // Single-select
    const isCorrect  = oi === q.correctIndex;
    const isSelected = oi === sel;
    let bg = '#FAFAF9', border = '#DCD5CE', color = '#212427', anim = 'none';
    if (answered) {
      if (isCorrect)                  { bg = '#E3FDDB'; border = '#21BF61'; color = '#197A56'; if (isSelected) anim = 'correctPop 0.45s ease'; }
      else if (isSelected)            { bg = '#FEF2F2'; border = '#DC2626'; color = '#DC2626'; anim = 'wrongShake 0.4s ease'; }
      else if (timedOut && isCorrect) { bg = '#E3FDDB'; border = '#21BF61'; color = '#197A56'; }
    }
    return { background: bg, border: `1.5px solid ${border}`, color, animation: anim };
  }

  function optIcon(oi) {
    if (isMulti) {
      const isCorrectIdx = q.correctIndices.includes(oi);
      const isSelected   = multiSel.has(oi);
      if (answered) {
        if (isCorrectIdx && isSelected)       return <span style={{ fontSize: 18 }}>✓</span>;
        if (isCorrectIdx && !isSelected)      return <span style={{ fontSize: 18 }}>!</span>;
        if (!isCorrectIdx && isSelected)      return <span style={{ fontSize: 18 }}>✗</span>;
      } else {
        return <span style={{ fontSize: 16, opacity: 0.5 }}>{isSelected ? '☑' : '☐'}</span>;
      }
      return null;
    }
    // Single-select icons
    if (answered && oi === q.correctIndex)              return <span style={{ fontSize: 18 }}>✓</span>;
    if (answered && oi === sel && oi !== q.correctIndex) return <span style={{ fontSize: 18 }}>✗</span>;
    return null;
  }

  return (
    <div style={styles.page} className="test-page">

      {/* Red urgency fill — grows top→down as time runs out, desktop only */}
      <div className="timer-fill" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: `${fillPct}vh`,
        background: '#DC2626',
        opacity: answered ? 0 : 1,
        transition: answered ? 'opacity 0.4s ease' : 'height 0.9s linear',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <style>{`
        @keyframes correctPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.03); box-shadow: 0 0 0 4px rgba(16,160,122,0.2); }
          70%  { transform: scale(0.99); }
          100% { transform: scale(1); }
        }
        @keyframes wrongShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes timerPulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
        @keyframes coinFloat {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          40%  { opacity: 1; transform: translateY(-22px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-44px) scale(0.8); }
        }
        @keyframes coinSpin {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes micPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.25); opacity: 0.8; }
        }
        @keyframes affirmPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.72); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1.12); }
          38%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          68%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(0.88); }
        }
        @media (min-width: 768px) {
          .test-page { background: transparent !important; }
          .timer-fill { display: block; }
        }
        @media (max-width: 767px) {
          .timer-fill { display: none; }
        }
        @media (min-width: 640px) {
          .quiz-body  { padding: 28px 24px 56px !important; }
          .quiz-card  { padding: 32px 30px !important; }
          .quiz-prompt { font-size: 20px !important; }
          .quiz-option { padding: 16px 20px !important; font-size: 16px !important; }
        }
        @media (min-width: 1024px) {
          .quiz-body  { max-width: 800px !important; padding: 40px 0 64px !important; }
          .quiz-card  { padding: 44px 44px !important; border-radius: 28px !important; }
          .quiz-prompt { font-size: 24px !important; margin-bottom: 28px !important; }
          .quiz-option { padding: 20px 26px !important; font-size: 18px !important; border-radius: 16px !important; min-height: 68px !important; }
          .quiz-opt-letter { width: 36px !important; height: 36px !important; font-size: 14px !important; }
          .quiz-submit { font-size: 18px !important; padding: 16px 24px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ ...styles.header, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', display: 'flex', gap: 8 }} ref={settingsPanelRef}>
          <button onClick={handleQuit} style={styles.backBtn}>✕ Quit</button>
          <button onClick={toggleTts} style={{ ...styles.backBtn, fontSize: 16, padding: '7px 10px' }}
            title={ttsOn ? 'Mute voice' : 'Unmute voice'}>
            {ttsOn ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setSettingsOpen(p => !p)}
            style={{ ...styles.backBtn, fontSize: 15, padding: '7px 10px', color: settingsOpen ? '#212427' : '#6B7280', background: settingsOpen ? '#F2F2F2' : 'transparent' }}
            title="Settings"
          >⚙️</button>
          {settingsOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', borderRadius: 14, border: '1px solid #DCD5CE', padding: '14px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 30, minWidth: 240 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 12 }}>Quiz Settings</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                <input type="checkbox" checked={ttsOn} onChange={toggleTts} style={{ accentColor: '#21BF61', width: 15, height: 15, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#212427' }}>Speak key term</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Read the question term aloud</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                <input type="checkbox" checked={speakAns} onChange={toggleSpeakAns} style={{ accentColor: '#21BF61', width: 15, height: 15, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#212427' }}>Speak correct answer</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Hear the answer after each correct pick</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: SR ? 'pointer' : 'default', opacity: SR ? 1 : 0.5 }}>
                <input type="checkbox" checked={voiceInput} onChange={toggleVoiceInput} disabled={!SR} style={{ accentColor: '#21BF61', width: 15, height: 15, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#212427' }}>🎤 Voice input{!SR ? ' (Chrome only)' : ''}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Say a number or the option text to answer</div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...styles.pill, background: '#E3FDDB', color: '#197A56' }}>✓ {correctCount}</div>
          <div style={{ ...styles.pill, background: '#FEF2F2', color: '#DC2626' }}>✗ {idx - correctCount}</div>

          <div style={{ position: 'relative' }}>
            {flash && (
              <div style={styles.coinFloat}>
                <span style={{ animation: 'coinSpin 0.5s ease', display: 'inline-block' }}>🪙</span>
                {' '}{flash}
              </div>
            )}
            <div style={{ ...styles.pill, background: '#E3FDDB', color: '#197A56',
              fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 15,
              boxShadow: flash ? '0 0 0 3px rgba(180,83,9,0.2)' : 'none',
              transition: 'box-shadow 0.2s' }}>
              🪙 {points} pts
            </div>
          </div>

          <div style={{ ...styles.pill, background: '#F2F2F2', color: '#212427' }}>
            {idx + 1}/{questions.length}
          </div>
        </div>
      </div>

      {/* ── Overall progress bar ── */}
      <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', position: 'relative', zIndex: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${meta.color}, #E85D26)`,
          transition: 'width 0.4s ease' }} />
      </div>

      {/* ── Question card ── */}
      <div style={{ ...styles.body, position: 'relative', zIndex: 2 }} className="quiz-body">
        <div style={styles.card} className="pop-in quiz-card" key={idx}>

          {/* Card header: topic badge + timer ring */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ ...styles.badge, background: meta.bg, color: meta.color }}>
              {meta.icon} {meta.name}
            </span>
            <TimerRing timeLeft={timeLeft} total={TIMER_SECS} answered={answered} />
          </div>

          {/* Prompt */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ ...styles.prompt, flex: 1 }} className="quiz-prompt">{q.prompt}</div>
            {ttsOn && (
              <button
                onClick={() => ttsSpeak(getKeyTerm(q.prompt))}
                style={styles.replayBtn}
                title="Replay"
              >🔉</button>
            )}
          </div>

          {/* Multi-select hint */}
          {isMulti && !answered && (
            <div style={styles.multiHint}>
              ☑ Select all correct answers, then tap Submit
            </div>
          )}

          {/* Options */}
          <div style={styles.options}>
            {q.options.map((opt, oi) => {
              const os = optStyle(oi);
              return (
                <button
                  key={oi}
                  onClick={() => isMulti ? handleMultiToggle(oi) : handleSelect(oi)}
                  style={{ ...styles.optionBtn, ...os, cursor: answered ? 'default' : 'pointer' }}
                  className="quiz-option"
                  onMouseEnter={e => { if (!answered) e.currentTarget.style.background = isMulti && multiSel.has(oi) ? '#A8F0B8' : '#F2F2F2'; }}
                  onMouseLeave={e => { if (!answered) e.currentTarget.style.background = isMulti && multiSel.has(oi) ? '#E3FDDB' : '#FAFAF9'; }}
                >
                  <span className="quiz-opt-letter" style={{ ...styles.optLetter,
                    background: answered && (isMulti ? q.correctIndices.includes(oi) : oi === q.correctIndex)
                      ? 'rgba(16,160,122,0.2)'
                      : answered && (isMulti ? (!q.correctIndices.includes(oi) && multiSel.has(oi)) : oi === sel)
                      ? 'rgba(220,38,38,0.15)'
                      : !answered && isMulti && multiSel.has(oi)
                      ? 'rgba(124,77,238,0.2)'
                      : 'rgba(0,0,0,0.06)',
                    color: answered && ((isMulti ? q.correctIndices.includes(oi) : oi === q.correctIndex) || (isMulti ? (!q.correctIndices.includes(oi) && multiSel.has(oi)) : oi === sel)) ? 'inherit' : '#7A7870',
                  }}>
                    {oi + 1}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                  {optIcon(oi)}
                </button>
              );
            })}
          </div>

          {/* Multi-select Submit button */}
          {isMulti && !answered && (
            <button
              onClick={handleMultiSubmit}
              disabled={multiSel.size === 0}
              className="quiz-submit"
              style={{
                ...styles.submitBtn,
                opacity: multiSel.size === 0 ? 0.45 : 1,
                cursor: multiSel.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Submit ({multiSel.size} selected)
            </button>
          )}

          {/* Voice input status — shown when voice mode is on for single-select */}
          {voiceInput && !answered && !isMulti && (
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {voiceNoMatch
                ? <><span>🔁</span><span style={{ color: '#DC2626' }}>Couldn't catch that — try again</span></>
                : voiceListening
                  ? <><span style={{ display: 'inline-block', animation: 'micPulse 1s ease-in-out infinite' }}>🎤</span><span style={{ color: '#197A56' }}>Listening…</span></>
                  : <span style={{ color: '#C4C2B9' }}>⏳ Voice ready…</span>}
            </div>
          )}

          {/* Keyboard hint — only shown before answering */}
          {!answered && !isMulti && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C4C2B9' }}>
                  <kbd style={{ background: '#F1EFE8', border: '1px solid #D3D1C7', borderRadius: 5,
                    padding: '2px 7px', fontFamily: 'monospace', fontSize: 11, color: '#7A7870' }}>{n}</kbd>
                </div>
              ))}
            </div>
          )}
          {!answered && isMulti && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10, fontSize: 11, color: '#C4C2B9' }}>
              {[1,2,3,4].map(n => (
                <kbd key={n} style={{ background: '#F1EFE8', border: '1px solid #D3D1C7', borderRadius: 5,
                  padding: '2px 7px', fontFamily: 'monospace', fontSize: 11, color: '#7A7870' }}>{n}</kbd>
              ))}
              <span style={{ marginLeft: 4 }}>toggle · </span>
              <kbd style={{ background: '#F1EFE8', border: '1px solid #D3D1C7', borderRadius: 5,
                padding: '2px 7px', fontFamily: 'monospace', fontSize: 11, color: '#7A7870' }}>Enter</kbd>
              <span>submit</span>
            </div>
          )}

          {/* Explanation panel */}
          {showExp && (
            <div style={{ ...styles.explanation, background: meta.bg,
              borderColor: `${meta.color}30`, color: meta.color }} className="fade-in">
              {timedOut
                ? <><strong>⏱ Time&apos;s up!</strong> {q.explanation}</>
                : <>💡 {q.explanation}</>}
            </div>
          )}
        </div>
      </div>

      {/* ── Affirmative pop ── */}
      {affirmMsg && (
        <div style={{
          position: 'fixed', top: '42%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50, pointerEvents: 'none',
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
    </div>
  );
}

const styles = {
  page:       { minHeight: '100vh', background: '#F1EEEA', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header:     { background: '#fff', borderBottom: '1px solid #DCD5CE', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:    { background: 'transparent', border: '1px solid #DCD5CE', borderRadius: 10,
                padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6B7280' },
  pill:       { borderRadius: 999, padding: '5px 11px', fontSize: 13, fontWeight: 700 },
  body:       { padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto' },
  card:       { background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #DCD5CE', padding: '24px 22px' },
  badge:      { borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
  prompt:     { fontSize: 17, fontWeight: 700, color: '#212427', lineHeight: 1.6,
                marginBottom: 22, whiteSpace: 'pre-line' },
  multiHint:  { fontSize: 12, fontWeight: 700, color: '#197A56', background: '#E3FDDB',
                borderRadius: 8, padding: '6px 12px', marginBottom: 14, textAlign: 'center' },
  options:    { display: 'flex', flexDirection: 'column', gap: 10 },
  optionBtn:  { display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '13px 16px',
                fontSize: 15, fontWeight: 600, transition: 'background 0.12s', textAlign: 'left',
                width: '100%' },
  optLetter:  { width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  submitBtn:  { marginTop: 14, width: '100%', background: '#96F878',
                color: '#212427', border: 'none', borderRadius: 14, padding: '13px 20px',
                fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 16, transition: 'background 0.15s' },
  explanation:{ marginTop: 18, borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 600,
                border: '1px solid', lineHeight: 1.6 },
  replayBtn:  { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20,
                padding: '2px 4px', flexShrink: 0, opacity: 0.55, marginTop: 2,
                transition: 'opacity 0.15s' },
  coinFloat:  { position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)',
                fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 18, color: '#197A56',
                whiteSpace: 'nowrap', animation: 'coinFloat 1.5s ease forwards',
                pointerEvents: 'none', zIndex: 10 },
};
