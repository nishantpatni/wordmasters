import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import Login        from './screens/Login.jsx';
import Home         from './screens/Home.jsx';
import TopicSelect  from './screens/TopicSelect.jsx';
import TestScreen   from './screens/Test.jsx';
import Results      from './screens/Results.jsx';
import ReviewScreen from './screens/Review.jsx';
import Admin        from './screens/Admin.jsx';
import Revise       from './screens/Revise.jsx';
import VoiceTest    from './screens/VoiceTest.jsx';
import TeachAndAsk  from './screens/TeachAndAsk.jsx';
import { buildTest, buildRepractice, buildVoiceTest, buildVoiceRepractice, batchUpdateScores, updateStreak, getScores, saveScores, addCoins, saveAttemptLogs, getMeta } from './engine/quiz.js';
import { buildGeoTest, buildGeoVoiceTest, buildGeoRepractice, buildGeoVoiceRepractice } from './engine/geoQuiz.js';
import {
  loadScores as loadRemoteScores, saveScores as saveRemoteScores,
  logAttempts as logRemoteAttempts, saveMeta as saveRemoteMeta,
} from './services/dataService.js';
import GeoTopicSelect from './screens/GeoTopicSelect.jsx';
import { getDarkMode, setDarkMode as persistDarkMode } from './utils/theme.js';
import { TOPIC_META, CORE_TOPIC_ORDER, VOCABO_TOPIC_ORDER } from './data/topicData.js';
import { GEO_TOPIC_META } from './data/geoTopicData.js';
import { pathForScreen, parseRoute } from './utils/routes.js';

const DEFAULT_QUIZ_COUNT = 50; // used when a deep link starts a quiz directly

function toLogRows(username, results, ts = new Date().toISOString()) {
  return results.map(r => ({
    ts, username,
    itemId:         r.itemId,
    topicId:        r.topicId,
    correct:        r.correct,
    selectedOption: r.selectedOption || '',
    correctAnswer:  r.correctAnswer  || '',
    prompt:         r.prompt         || '',
  }));
}

// screen: 'login' | 'home' | 'topic-select' | 'geo-topic-select' | 'test' | 'voice-test' | 'review' | 'results' | 'admin'
// testConfig.subject: 'english' | 'geography'
export default function App() {
  const [screen,          setScreen]          = useState('login');
  const [user,            setUser]            = useState(null);
  const [questions,       setQuestions]       = useState([]);
  const [testConfig,      setTestConfig]      = useState(null); // { topicId, count }
  const [testResults,     setTestResults]     = useState([]);
  const [reviewDest,      setReviewDest]      = useState('home'); // 'results' | 'home'
  const [homeKey,         setHomeKey]         = useState(0);
  const [syncing,         setSyncing]         = useState(false);
  const [reviseTopicId,   setReviseTopicId]   = useState(null);
  const [topicGroup,      setTopicGroup]      = useState('core'); // 'core' | 'vocabo' — which Home CTA opened topic-select (scopes the Mixed Test)
  const [teachTopicId,    setTeachTopicId]    = useState(null);
  const [isPracticeMode,  setIsPracticeMode]  = useState(false);
  const [practiceItems,   setPracticeItems]   = useState([]); // wrong results to repractice
  const [darkMode,        setDarkModeState]   = useState(getDarkMode); // quiz-flow theme; defaults on

  const toggleDarkMode = useCallback(() => {
    setDarkModeState(prev => {
      const next = !prev;
      persistDarkMode(next);
      return next;
    });
  }, []);

  // Screens with genuine in-progress state (a quiz being answered) expose
  // their own quit handler here so browser Back can trigger it directly —
  // it already knows the partial results, App.jsx doesn't.
  const quitRef = useRef(null);

  // ── Crash-safety for in-progress quizzes ────────────────────────────────
  // A quiz's answers used to only get saved (locally AND remotely) at the
  // very end — on natural completion, on Quit, or after the Review screen.
  // If the app/tab was killed any other way (swiped away, force-closed) all
  // of that session's answers were lost with no record anywhere. Now every
  // answer is saved locally as it happens, and synced to Supabase every 5
  // answers (plus a best-effort flush when the tab is hidden/closing) — see
  // handleProgress/flushRemaining below.
  const sessionTsRef          = useRef(null); // shared ts for every log row in this session, so Admin's Sessions view still groups them as one
  const localLoggedIdxRef     = useRef(0);    // results.length already written to local wm_logs_*
  const remoteSyncedIdxRef    = useRef(0);    // results.length already flushed to Supabase attempt_logs
  const latestResultsRef      = useRef([]);   // mirrors the in-progress quiz's results, for the visibilitychange flush below

  // Captures a deep link's intended destination (e.g. opening /revise/similes
  // directly) from the very first render, before login rewrites the URL.
  // Consumed once, after login, by the redirect effect further down.
  const deepLinkRef = useRef(parseRoute(window.location.pathname));

  // Pulls remote scores for one subject and merges them into the local copy —
  // remote wins per-item unless the local record has more reps (i.e. this
  // device has practiced that item more recently/often than what's synced).
  // `subject` maps to the local storage key convention quiz.js already uses
  // (geo_<username> for geography, plain username for english).
  const syncSubject = useCallback(async (username, subject) => {
    const localKey = subject === 'geography' ? `geo_${username}` : username;
    const remote = await loadRemoteScores(username, subject);
    if (remote) {
      const local = getScores(localKey);
      const merged = { ...remote };
      for (const [id, loc] of Object.entries(local)) {
        if (!merged[id] || (loc.reps ?? 0) > (merged[id].reps ?? 0)) merged[id] = loc;
      }
      saveScores(localKey, merged);
    }
  }, []);

  const handleLogin = useCallback(async (u) => {
    setUser(u);
    if (u.role === 'admin') { setScreen('admin'); return; }
    setScreen('home');
    setSyncing(true);
    await Promise.all([syncSubject(u.username, 'english'), syncSubject(u.username, 'geography')]);
    setSyncing(false);
  }, [syncSubject]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setScreen('login');
  }, []);

  const handleStartVoiceTest = useCallback((topicId, count) => {
    const qs = buildVoiceTest(topicId, count, getScores(user.username));
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'english', voice: true });
    setIsPracticeMode(false);
    setScreen('voice-test');
  }, [user]);

  const handleStartGeoVoiceTest = useCallback((topicId, count) => {
    const geoUser = `geo_${user.username}`;
    const qs = buildGeoVoiceTest(topicId, count, getScores(geoUser));
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'geography', voice: true });
    setIsPracticeMode(false);
    setScreen('voice-test');
  }, [user]);

  const handleStartTest = useCallback(async (topicId, count) => {
    setSyncing(true);
    await syncSubject(user.username, 'english');
    setSyncing(false);
    const mixedTopicIds = topicId === 'mixed' ? (topicGroup === 'vocabo' ? VOCABO_TOPIC_ORDER : CORE_TOPIC_ORDER) : undefined;
    const qs = buildTest(topicId, count, getScores(user.username), mixedTopicIds);
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'english', voice: false });
    setIsPracticeMode(false);
    setScreen('test');
  }, [user, syncSubject, topicGroup]);

  const handleStartGeoTest = useCallback(async (topicId, count) => {
    const geoUser = `geo_${user.username}`;
    setSyncing(true);
    await syncSubject(user.username, 'geography');
    setSyncing(false);
    const qs = buildGeoTest(topicId, count, getScores(geoUser));
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'geography', voice: false });
    setIsPracticeMode(false);
    setScreen('test');
  }, [user, syncSubject]);

  const goHome = useCallback(() => {
    setIsPracticeMode(false);
    setPracticeItems([]);
    setHomeKey(k => k + 1);
    setScreen('home');
  }, []);

  // Called after EVERY answered question (mid-quiz, not just at the end) —
  // see the crash-safety comment above. Local writes happen every time
  // (cheap); Supabase gets a batch every 5 answers to avoid hammering it.
  // Deliberately does NOT touch scores/streak/coins here — those still
  // commit only at the existing end-of-session checkpoints below, so the
  // Review screen's "I spoke correctly" self-correction (which re-derives
  // scores from the final, possibly-edited results array) keeps working
  // exactly as before. What this protects is the answer *record* — which
  // questions were asked and how they went — not the SM-2 mastery state.
  const handleProgress = useCallback((results) => {
    if (isPracticeMode || !user || !results.length) return;
    if (results.length === 1) { // first answer of a fresh session
      sessionTsRef.current = new Date().toISOString();
      localLoggedIdxRef.current = 0;
      remoteSyncedIdxRef.current = 0;
    }
    latestResultsRef.current = results;

    try {
      localStorage.setItem(`wm_pending_${user.username}`, JSON.stringify({
        results, topicId: testConfig?.topicId, subject: testConfig?.subject, ts: sessionTsRef.current,
      }));
    } catch {}

    if (results.length > localLoggedIdxRef.current) {
      const newRows = toLogRows(user.username, results.slice(localLoggedIdxRef.current), sessionTsRef.current);
      saveAttemptLogs(user.username, newRows);
      localLoggedIdxRef.current = results.length;
    }

    if (results.length - remoteSyncedIdxRef.current >= 5) {
      const subject = testConfig?.subject === 'geography' ? 'geography' : 'english';
      const rows = toLogRows(user.username, results.slice(remoteSyncedIdxRef.current), sessionTsRef.current);
      logRemoteAttempts(user.username, subject, rows);
      remoteSyncedIdxRef.current = results.length;
    }
  }, [user, testConfig, isPracticeMode]);

  // Sends whatever hasn't made it to Supabase yet (0-4 answers normally,
  // more if handleProgress never got a chance to run) — used at every
  // proper session end, and as a best-effort save when the tab is hidden.
  const flushRemaining = useCallback((results) => {
    if (isPracticeMode || !user || !results || results.length <= remoteSyncedIdxRef.current) return;
    const subject = testConfig?.subject === 'geography' ? 'geography' : 'english';
    const rows = toLogRows(user.username, results.slice(remoteSyncedIdxRef.current), sessionTsRef.current || new Date().toISOString());
    logRemoteAttempts(user.username, subject, rows);
    remoteSyncedIdxRef.current = results.length;
  }, [user, testConfig, isPracticeMode]);

  // Clears crash-safety tracking once a session has properly finished
  // (its results are now fully committed through the normal path below).
  function clearPendingSession() {
    try { localStorage.removeItem(`wm_pending_${user.username}`); } catch {}
    sessionTsRef.current = null;
    localLoggedIdxRef.current = 0;
    remoteSyncedIdxRef.current = 0;
    latestResultsRef.current = [];
  }

  // Best-effort save if the app is closed/backgrounded mid-quiz without
  // going through Quit/Back — 'visibilitychange' fires reliably on mobile
  // (unlike 'beforeunload'), including when a tab is swiped away.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flushRemaining(latestResultsRef.current);
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [flushRemaining]);

  // Persists results to scores/coins/streak/Supabase. Called either immediately
  // (perfect score, no review shown) or after the user has had a chance to
  // fix voice-quiz mis-hears on the Review screen via "I spoke correctly".
  // Both subjects sync now (geography used to be local-only).
  const persistComplete = useCallback((results) => {
    const isGeo = testConfig?.subject === 'geography';
    const subject = isGeo ? 'geography' : 'english';
    const scoreUser = isGeo ? `geo_${user.username}` : user.username;
    batchUpdateScores(scoreUser, results);
    updateStreak(user.username);
    addCoins(user.username, results.filter(r => r.correct).length * 10);
    saveRemoteScores(user.username, subject, getScores(scoreUser));
    flushRemaining(results);
    saveRemoteMeta(user.username, getMeta(user.username));
    clearPendingSession();
  }, [user, testConfig, flushRemaining]);

  const persistPartial = useCallback((results) => {
    const isGeo = testConfig?.subject === 'geography';
    const subject = isGeo ? 'geography' : 'english';
    const scoreUser = isGeo ? `geo_${user.username}` : user.username;
    batchUpdateScores(scoreUser, results);
    addCoins(user.username, results.filter(r => r.correct).length * 10);
    saveRemoteScores(user.username, subject, getScores(scoreUser));
    flushRemaining(results);
    saveRemoteMeta(user.username, getMeta(user.username));
    clearPendingSession();
  }, [user, testConfig, flushRemaining]);

  const handleTestComplete = useCallback((results) => {
    setTestResults(results);
    const hasWrong = results.some(r => !r.correct);
    if (!isPracticeMode && hasWrong) {
      setReviewDest('results');
      setScreen('review');
    } else {
      if (!isPracticeMode) persistComplete(results);
      setScreen('results');
    }
  }, [isPracticeMode, persistComplete]);

  const handleQuit = useCallback((partialResults) => {
    setTestResults(partialResults);
    const hasWrong = partialResults.some(r => !r.correct);
    if (!isPracticeMode && partialResults.length > 0 && hasWrong) {
      setReviewDest('home');
      setScreen('review');
    } else {
      if (!isPracticeMode && partialResults.length > 0) persistPartial(partialResults);
      goHome();
    }
  }, [goHome, isPracticeMode, persistPartial]);

  // Fires once the user leaves the Review screen — persists using the current
  // testResults, which may include "I spoke correctly" corrections made there.
  const handleReviewContinue = useCallback(() => {
    if (!isPracticeMode) {
      if (reviewDest === 'results') persistComplete(testResults);
      else persistPartial(testResults);
    }
    if (reviewDest === 'results') setScreen('results');
    else goHome();
  }, [reviewDest, goHome, isPracticeMode, testResults, persistComplete, persistPartial]);

  const handleMarkCorrect = useCallback((idx) => {
    setTestResults(prev => prev.map((r, i) => i === idx ? { ...r, correct: true, selfCorrected: true } : r));
  }, []);

  const handleRepractice = useCallback((wrongResults) => {
    const isGeo   = testConfig?.subject === 'geography';
    const isVoice = wrongResults[0]?.quizType === 'voice';
    const qs = isVoice
      ? (isGeo ? buildGeoVoiceRepractice(wrongResults) : buildVoiceRepractice(wrongResults))
      : (isGeo ? buildGeoRepractice(wrongResults)      : buildRepractice(wrongResults));
    if (!qs.length) return;
    setPracticeItems(wrongResults);
    setQuestions(qs);
    setIsPracticeMode(true);
    setScreen(isVoice ? 'voice-test' : 'test');
  }, [testConfig]);

  const handleRevise = useCallback((topicId) => {
    setReviseTopicId(topicId);
    setScreen('revise');
  }, []);

  const handleStartTeach = useCallback((topicId) => {
    setTeachTopicId(topicId);
    setScreen('teach-ask');
  }, []);

  const handleRetry = useCallback(() => {
    if (isPracticeMode) {
      const isGeo   = testConfig?.subject === 'geography';
      const isVoice = practiceItems[0]?.quizType === 'voice';
      const qs = isVoice
        ? (isGeo ? buildGeoVoiceRepractice(practiceItems) : buildVoiceRepractice(practiceItems))
        : (isGeo ? buildGeoRepractice(practiceItems)      : buildRepractice(practiceItems));
      if (qs.length) { setQuestions(qs); setScreen(isVoice ? 'voice-test' : 'test'); }
      return;
    }
    if (!testConfig) return setScreen('topic-select');
    const isGeo = testConfig.subject === 'geography';
    if (testConfig.voice) {
      const qs = isGeo
        ? buildGeoVoiceTest(testConfig.topicId, testConfig.count, getScores(`geo_${user.username}`))
        : buildVoiceTest(testConfig.topicId, testConfig.count, getScores(user.username));
      setQuestions(qs);
      setScreen('voice-test');
    } else {
      const mixedTopicIds = testConfig.topicId === 'mixed' ? (topicGroup === 'vocabo' ? VOCABO_TOPIC_ORDER : CORE_TOPIC_ORDER) : undefined;
      const qs = isGeo
        ? buildGeoTest(testConfig.topicId, testConfig.count, getScores(`geo_${user.username}`))
        : buildTest(testConfig.topicId, testConfig.count, getScores(user.username), mixedTopicIds);
      setQuestions(qs);
      setScreen('test');
    }
  }, [testConfig, user, isPracticeMode, practiceItems, topicGroup]);

  // If the app was opened via a deep link (e.g. /revise/similes or
  // /quiz/synonyms/voice), jump straight there once login completes instead
  // of landing on Home. useLayoutEffect (not useEffect) so the redirect
  // happens before paint — no visible flash of Home first.
  useLayoutEffect(() => {
    const dl = deepLinkRef.current;
    if (!user || user.role === 'admin' || !dl) return;
    deepLinkRef.current = null;
    const isGeo = dl.subject === 'geography';
    if (dl.screen === 'revise' && TOPIC_META[dl.topicId])                        return handleRevise(dl.topicId);
    if (dl.screen === 'test' && isGeo && GEO_TOPIC_META[dl.topicId])             return handleStartGeoTest(dl.topicId, DEFAULT_QUIZ_COUNT);
    if (dl.screen === 'voice-test' && isGeo && GEO_TOPIC_META[dl.topicId])       return handleStartGeoVoiceTest(dl.topicId, DEFAULT_QUIZ_COUNT);
    if (dl.screen === 'test' && TOPIC_META[dl.topicId])                         return handleStartTest(dl.topicId, DEFAULT_QUIZ_COUNT);
    if (dl.screen === 'voice-test' && TOPIC_META[dl.topicId])                    return handleStartVoiceTest(dl.topicId, DEFAULT_QUIZ_COUNT);
    if (dl.screen === 'topic-select')                                           { setTopicGroup(dl.group === 'vocabo' ? 'vocabo' : 'core'); return setScreen('topic-select'); }
    if (dl.screen === 'geo-topic-select')                                       return setScreen('geo-topic-select');
  }, [user, handleRevise, handleStartGeoTest, handleStartGeoVoiceTest, handleStartTest, handleStartVoiceTest]);

  // Back-press handling: this app has no router/URL, so the browser history
  // stack never grows past the initial page load and one Back press exits
  // entirely. We fake a stack instead — push a single "guard" entry whenever
  // we're on a non-root screen (replacing it, not stacking more, while we
  // stay non-root) so Back always has something to consume first. Popping it
  // fires popstate, and we map the screen we were just on to the same "go up
  // one level" action its own on-screen Back/Quit control already performs.
  const guardActiveRef = useRef(false);
  useEffect(() => {
    const path = pathForScreen(screen, {
      topicId: screen === 'revise' ? reviseTopicId : screen === 'teach-ask' ? teachTopicId : testConfig?.topicId,
      subject: testConfig?.subject,
      group: topicGroup,
    });
    const isRoot = screen === 'home' || screen === 'login';
    if (isRoot) { guardActiveRef.current = false; window.history.replaceState({ screen }, '', path); return; }
    if (guardActiveRef.current) window.history.replaceState({ screen }, '', path);
    else { window.history.pushState({ screen }, '', path); guardActiveRef.current = true; }
  }, [screen, reviseTopicId, teachTopicId, testConfig, topicGroup]);

  useEffect(() => {
    function onPopState() {
      guardActiveRef.current = false; // the guard entry, if any, was just consumed
      switch (screen) {
        case 'topic-select':
        case 'geo-topic-select':
        case 'teach-ask':
        case 'results':
          goHome(); break;
        case 'revise':
          setScreen('topic-select'); break;
        case 'admin':
          (user?.role === 'admin' ? handleLogout : goHome)(); break;
        case 'test':
        case 'voice-test':
          quitRef.current?.(); break;
        case 'review':
          handleReviewContinue(); break;
        default:
          break; // 'home' / 'login' — nothing to intercept, let Back leave the app
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [screen, user, goHome, handleLogout, handleReviewContinue]);

  return (
    <>
      {screen === 'login'        && <Login onLogin={handleLogin} />}
      {screen === 'home'          && <Home key={homeKey} user={user} syncing={syncing} onStartTest={() => { setTopicGroup('core'); setScreen('topic-select'); }} onStartVocabo={() => { setTopicGroup('vocabo'); setScreen('topic-select'); }} onStartGeo={() => setScreen('geo-topic-select')} onRevise={handleRevise} onAdmin={() => setScreen('admin')} onLogout={handleLogout} />}
      {screen === 'topic-select'  && <TopicSelect group={topicGroup} onStart={handleStartTest} onVoiceStart={handleStartVoiceTest} onTeachStart={handleStartTeach} onRevise={handleRevise} onBack={goHome} syncing={syncing} />}
      {screen === 'geo-topic-select' && <GeoTopicSelect username={user.username} onStart={handleStartGeoTest} onVoiceStart={handleStartGeoVoiceTest} onBack={goHome} syncing={syncing} />}
      {screen === 'voice-test'   && <VoiceTest questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} onProgress={handleProgress} quitRef={quitRef} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />}
      {screen === 'revise'       && <Revise topicId={reviseTopicId} username={user.username} onBack={() => setScreen('topic-select')} darkMode={darkMode} />}
      {screen === 'test'         && <TestScreen questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} onProgress={handleProgress} quitRef={quitRef} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />}
      {screen === 'review'       && <ReviewScreen results={testResults} onContinue={handleReviewContinue} continueLabel={reviewDest === 'results' ? 'See Results →' : 'Back to Home →'} onRepractice={handleRepractice} onMarkCorrect={handleMarkCorrect} darkMode={darkMode} />}
      {screen === 'results'      && <Results results={testResults} topicId={testConfig?.topicId} onRetry={handleRetry} onHome={goHome} onRepractice={handleRepractice} isPractice={isPracticeMode} darkMode={darkMode} />}
      {screen === 'teach-ask'    && <TeachAndAsk topicId={teachTopicId} username={user?.username} onQuit={goHome} />}
      {screen === 'admin'        && <Admin onBack={user?.role === 'admin' ? handleLogout : goHome} />}
    </>
  );
}
