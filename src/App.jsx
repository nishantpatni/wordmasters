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
import { buildTest, buildRepractice, buildVoiceTest, batchUpdateScores, updateStreak, getScores, saveScores, addCoins } from './engine/quiz.js';
import { loadScoresFromSheets, saveScoresToSheets, logQuizAttempts } from './services/sheetsService.js';

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

// screen: 'login' | 'home' | 'topic-select' | 'test' | 'voice-test' | 'review' | 'results' | 'admin'
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
    setTestConfig({ topicId, count });
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
    setTestConfig({ topicId, count });
    setIsPracticeMode(false);
    setScreen('test');
  }, [user]);

  const goHome = useCallback(() => {
    setIsPracticeMode(false);
    setPracticeItems([]);
    setHomeKey(k => k + 1);
    setScreen('home');
  }, []);

  const handleTestComplete = useCallback((results) => {
    if (!isPracticeMode) {
      batchUpdateScores(user.username, results);
      updateStreak(user.username);
      addCoins(user.username, results.filter(r => r.correct).length * 10);
      saveScoresToSheets(user.username, getScores(user.username));
      logQuizAttempts(toLogRows(user.username, results));
    }
    setTestResults(results);
    const hasWrong = results.some(r => !r.correct);
    if (!isPracticeMode && hasWrong) {
      setReviewDest('results');
      setScreen('review');
    } else {
      setScreen('results');
    }
  }, [user, isPracticeMode]);

  const handleQuit = useCallback((partialResults) => {
    if (!isPracticeMode && partialResults.length > 0) {
      batchUpdateScores(user.username, partialResults);
      addCoins(user.username, partialResults.filter(r => r.correct).length * 10);
      saveScoresToSheets(user.username, getScores(user.username));
      logQuizAttempts(toLogRows(user.username, partialResults));
    }
    setTestResults(partialResults);
    const hasWrong = partialResults.some(r => !r.correct);
    if (!isPracticeMode && partialResults.length > 0 && hasWrong) {
      setReviewDest('home');
      setScreen('review');
    } else {
      goHome();
    }
  }, [user, goHome, isPracticeMode]);

  const handleReviewContinue = useCallback(() => {
    if (reviewDest === 'results') setScreen('results');
    else goHome();
  }, [reviewDest, goHome]);

  const handleRepractice = useCallback((wrongResults) => {
    const qs = buildRepractice(wrongResults);
    if (!qs.length) return;
    setPracticeItems(wrongResults);
    setQuestions(qs);
    setIsPracticeMode(true);
    setScreen('test');
  }, []);

  const handleRevise = useCallback((topicId) => {
    setReviseTopicId(topicId);
    setScreen('revise');
  }, []);

  const handleRetry = useCallback(() => {
    if (isPracticeMode) {
      const qs = buildRepractice(practiceItems);
      if (qs.length) { setQuestions(qs); setScreen('test'); }
      return;
    }
    if (!testConfig) return setScreen('topic-select');
    const qs = buildTest(testConfig.topicId, testConfig.count, getScores(user.username));
    setQuestions(qs);
    setScreen('test');
  }, [testConfig, user, isPracticeMode, practiceItems]);

  return (
    <>
      {screen === 'login'        && <Login onLogin={handleLogin} />}
      {screen === 'home'         && <Home key={homeKey} user={user} syncing={syncing} onStartTest={() => setScreen('topic-select')} onRevise={handleRevise} onAdmin={() => setScreen('admin')} onLogout={handleLogout} />}
      {screen === 'topic-select' && <TopicSelect onStart={handleStartTest} onVoiceStart={handleStartVoiceTest} onRevise={handleRevise} onBack={goHome} syncing={syncing} />}
      {screen === 'voice-test'   && <VoiceTest questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} />}
      {screen === 'revise'       && <Revise topicId={reviseTopicId} username={user.username} onBack={() => setScreen('topic-select')} />}
      {screen === 'test'         && <TestScreen questions={questions} onComplete={handleTestComplete} onQuit={handleQuit} />}
      {screen === 'review'       && <ReviewScreen results={testResults} onContinue={handleReviewContinue} continueLabel={reviewDest === 'results' ? 'See Results →' : 'Back to Home →'} onRepractice={handleRepractice} />}
      {screen === 'results'      && <Results results={testResults} topicId={testConfig?.topicId} onRetry={handleRetry} onHome={goHome} onRepractice={handleRepractice} isPractice={isPracticeMode} />}
      {screen === 'admin'        && <Admin onBack={user?.role === 'admin' ? handleLogout : goHome} />}
    </>
  );
}
