import { useState, useCallback } from 'react';
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
import { buildTest, buildRepractice, buildVoiceTest, batchUpdateScores, updateStreak, getScores, saveScores, addCoins, saveAttemptLogs } from './engine/quiz.js';
import { buildGeoTest, buildGeoVoiceTest, buildGeoRepractice } from './engine/geoQuiz.js';
import { loadScoresFromSheets, saveScoresToSheets, logQuizAttempts } from './services/sheetsService.js';
import GeoTopicSelect from './screens/GeoTopicSelect.jsx';

function toLogRows(username, results) {
  const ts = new Date().toISOString();
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
  const [teachTopicId,    setTeachTopicId]    = useState(null);
  const [isPracticeMode,  setIsPracticeMode]  = useState(false);
  const [practiceItems,   setPracticeItems]   = useState([]); // wrong results to repractice

  const handleLogin = useCallback(async (u) => {
    setUser(u);
    if (u.role === 'admin') { setScreen('admin'); return; }
    setScreen('home');
    setSyncing(true);
    const remote = await loadScoresFromSheets(u.username);
    if (remote) {
      const local = getScores(u.username);
      const merged = { ...remote };
      for (const [id, loc] of Object.entries(local)) {
        if (!merged[id] || (loc.reps ?? 0) > (merged[id].reps ?? 0)) merged[id] = loc;
      }
      saveScores(u.username, merged);
    }
    setSyncing(false);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setScreen('login');
  }, []);

  const handleStartVoiceTest = useCallback((topicId, count) => {
    const qs = buildVoiceTest(topicId, count);
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'english' });
    setIsPracticeMode(false);
    setScreen('voice-test');
  }, []);

  const handleStartGeoVoiceTest = useCallback((topicId, count) => {
    const qs = buildGeoVoiceTest(topicId, count);
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'geography' });
    setIsPracticeMode(false);
    setScreen('voice-test');
  }, []);

  const handleStartTest = useCallback(async (topicId, count) => {
    setSyncing(true);
    const remote = await loadScoresFromSheets(user.username);
    if (remote) {
      const local = getScores(user.username);
      const merged = { ...remote };
      for (const [id, loc] of Object.entries(local)) {
        if (!merged[id] || (loc.reps ?? 0) > (merged[id].reps ?? 0)) merged[id] = loc;
      }
      saveScores(user.username, merged);
    }
    setSyncing(false);
    const qs = buildTest(topicId, count, getScores(user.username));
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'english' });
    setIsPracticeMode(false);
    setScreen('test');
  }, [user]);

  const handleStartGeoTest = useCallback((topicId, count) => {
    const geoUser = `geo_${user.username}`;
    const qs = buildGeoTest(topicId, count, getScores(geoUser));
    setQuestions(qs);
    setTestConfig({ topicId, count, subject: 'geography' });
    setIsPracticeMode(false);
    setScreen('test');
  }, [user]);

  const goHome = useCallback(() => {
    setIsPracticeMode(false);
    setPracticeItems([]);
    setHomeKey(k => k + 1);
    setScreen('home');
  }, []);

  // Persists results to scores/coins/streak/sheets. Called either immediately
  // (perfect score, no review shown) or after the user has had a chance to
  // fix voice-quiz mis-hears on the Review screen via "I spoke correctly".
  const persistComplete = useCallback((results) => {
    const isGeo = testConfig?.subject === 'geography';
    const scoreUser = isGeo ? `geo_${user.username}` : user.username;
    batchUpdateScores(scoreUser, results);
    updateStreak(user.username);
    addCoins(user.username, results.filter(r => r.correct).length * 10);
    if (!isGeo) {
      saveScoresToSheets(user.username, getScores(user.username));
      const logRows = toLogRows(user.username, results);
      saveAttemptLogs(user.username, logRows);
      logQuizAttempts(logRows);
    }
  }, [user, testConfig]);

  const persistPartial = useCallback((results) => {
    const isGeo = testConfig?.subject === 'geography';
    const scoreUser = isGeo ? `geo_${user.username}` : user.username;
    batchUpdateScores(scoreUser, results);
    addCoins(user.username, results.filter(r => r.correct).length * 10);
    if (!isGeo) {
      saveScoresToSheets(user.username, getScores(user.username));
      const logRows = toLogRows(user.username, results);
      saveAttemptLogs(user.username, logRows);
      logQuizAttempts(logRows);
    }
  }, [user, testConfig]);

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
    const isGeo = testConfig?.subject === 'geography';
    const qs = isGeo ? buildGeoRepractice(wrongResults) : buildRepractice(wrongResults);
    if (!qs.length) return;
    setPracticeItems(wrongResults);
    setQuestions(qs);
    setIsPracticeMode(true);
    setScreen('test');
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
      const isGeo = testConfig?.subject === 'geography';
      const qs = isGeo ? buildGeoRepractice(practiceItems) : buildRepractice(practiceItems);
      if (qs.length) { setQuestions(qs); setScreen('test'); }
      return;
    }
    if (!testConfig) return setScreen('topic-select');
    if (testConfig.subject === 'geography') {
      const geoUser = `geo_${user.username}`;
      const qs = buildGeoTest(testConfig.topicId, testConfig.count, getScores(geoUser));
      setQuestions(qs);
    } else {
      const qs = buildTest(testConfig.topicId, testConfig.count, getScores(user.username));
      setQuestions(qs);
    }
    setScreen('test');
  }, [testConfig, user, isPracticeMode, practiceItems]);

  return (
    <>
      {screen === 'login'        && <Login onLogin={handleLogin} />}
      {screen === 'home'          && <Home key={homeKey} user={user} syncing={syncing} onStartTest={() => setScreen('topic-select')} onStartGeo={() => setScreen('geo-topic-select')} onRevise={handleRevise} onAdmin={() => setScreen('admin')} onLogout={handleLogout} />}
      {screen === 'topic-select'  && <TopicSelect onStart={handleStartTest} onVoiceStart={handleStartVoiceTest} onTeachStart={handleStartTeach} onRevise={handleRevise} onBack={goHome} syncing={syncing} />}
      {screen === 'geo-topic-select' && <GeoTopicSelect username={user.username} onStart={handleStartGeoTest} onVoiceStart={handleStartGeoVoiceTest} onBack={goHome} syncing={syncing} />}
      {screen === 'voice-test'   && <VoiceTest questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} />}
      {screen === 'revise'       && <Revise topicId={reviseTopicId} username={user.username} onBack={() => setScreen('topic-select')} />}
      {screen === 'test'         && <TestScreen questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} />}
      {screen === 'review'       && <ReviewScreen results={testResults} onContinue={handleReviewContinue} continueLabel={reviewDest === 'results' ? 'See Results →' : 'Back to Home →'} onRepractice={handleRepractice} onMarkCorrect={handleMarkCorrect} />}
      {screen === 'results'      && <Results results={testResults} topicId={testConfig?.topicId} onRetry={handleRetry} onHome={goHome} onRepractice={handleRepractice} isPractice={isPracticeMode} />}
      {screen === 'teach-ask'    && <TeachAndAsk topicId={teachTopicId} username={user?.username} onQuit={goHome} />}
      {screen === 'admin'        && <Admin onBack={user?.role === 'admin' ? handleLogout : goHome} />}
    </>
  );
}
