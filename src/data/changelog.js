export const USER_CHANGELOG = [
  {
    date: '20 Jul 2026',
    entries: [
      { icon: '🎤', topic: 'Voice Quiz', text: 'Similes, Antonyms & Synonyms now ask for every correct completion in one go (e.g. "As bright as ___" expects diamond, flame, and sun — any order) instead of quizzing each one separately or accepting just one. The mic listening window now also scales with how much you need to say — longer answers get more time.' },
      { icon: '🌙', topic: 'Dark Mode', text: 'The quiz-taking flow (MCQ quiz, Voice Quiz, Revise, Review, Results) now defaults to a dark theme to cut down on eye strain — toggle it off anytime in Quiz Settings (⚙️) during a quiz.' },
      { icon: '⬅️', topic: 'Back Button', text: 'Pressing Back no longer exits the app outright — it now steps back one screen at a time (quitting an in-progress quiz first, then topic selection, then home) before actually leaving.' },
      { icon: '📘', topic: 'New Topic: Vocabopedia Similes', text: 'Split off a new topic containing the 70 similes from the Vocabopedia list (MCQ, Voice Quiz, Revise, Teach & Ask). The original Similes topic keeps the rest.' },
    ],
  },
  {
    date: '13 Jul 2026',
    entries: [
      { icon: '🔤', topic: 'Voice Quiz Matching', text: 'Articles ("a", "an", "the") are no longer required or penalized when speaking your answer — say them or skip them, it won\'t affect scoring.' },
      { icon: '🔊', topic: 'Voice Settings', text: 'New "specific voice" picker in Quiz Settings (⚙️) — if the accent dropdown still uses the wrong-sounding voice (a known Chrome/macOS quirk where the OS default voice isn\'t always what Chrome picks), you can now choose the exact installed voice by name. Voice quizzes also show a footer at the bottom with the voice/accent currently speaking.' },
      { icon: '🎤', topic: 'Voice Quiz', text: 'Now available for Synonyms, Antonyms & Collective Nouns too. For words with more than one valid synonym or collective noun, saying any one of them counts as correct.' },
      { icon: '⏸️', topic: 'Quiz Settings', text: 'Opening Settings (⚙️) mid-quiz now pauses gameplay — the countdown timer freezes and the mic stops listening — in both MCQ and Voice quizzes, so you can change the voice accent or pick a specific voice without losing time.' },
    ],
  },
  {
    date: '11 Jul 2026',
    entries: [
      { icon: '🪙', topic: 'Voice Quiz Sounds', text: 'The correct-answer ding is now a brighter "coin win" sound.' },
      { icon: '🗺️', topic: 'Geography Voice Quiz', text: 'For capitals shared by more than one state/UT (e.g. Chandigarh — Haryana, Punjab, and Chandigarh UT), the voice quiz now asks you to name all of them and only marks it correct once you’ve said every one, in any order.' },
    ],
  },
  {
    date: '10 Jul 2026',
    entries: [
      { icon: '🎤', topic: 'Voice Quiz', text: 'Now defaults to US English pronunciation and speech recognition instead of Indian English, which was mispronouncing some words. You can still switch accents in Quiz Settings (⚙️).' },
      { icon: '🔊', topic: 'Voice Quiz Sounds', text: 'New audio cues so you can play eyes-off-screen: a chime when a new question loads, a beep when the mic starts listening, and a correct/incorrect ding after you answer. On a miss, it now speaks back what it heard before reading out the correct answer.' },
      { icon: '✅', topic: 'Voice Quiz Review', text: 'If speech recognition misheard you but you actually said the right answer, tap "✓ I spoke correctly" on that question in the Review screen to mark it correct.' },
      { icon: '🌑', topic: 'Voice Quiz Black Screen', text: 'New button turns the screen black so you can rest your eyes — the quiz keeps running by audio underneath. Tap Esc or "View Quiz" to come back.' },
      { icon: '🔄', topic: 'Oxymorons', text: 'Refreshed all 100 meanings with clearer wording, added "Almost Done", merged the two "Clearly Confused/Misunderstood" questions into one, and renamed a few phrases (Alone Together, Deceptively Honest, Awfully Good/Nice/Pretty/Delicious).' },
    ],
  },
  {
    date: '4 Jul 2026',
    entries: [
      { icon: '🌐', topic: 'Voice Accent', text: 'New setting in Quiz Settings (⚙️) — choose US, Indian, or British English for spoken questions/answers and voice recognition. Remembered across the whole app.' },
      { icon: '📝', topic: 'One Word Substitutions', text: 'Smarter wrong answers for 50+ more words (scientists, places, ranks, personality types, literary terms and more) — distractors now come from the same confusable family instead of random words.' },
    ],
  },
  {
    date: '3 Jul 2025',
    entries: [
      { icon: '🗺️', topic: 'Indian Geography', text: 'New subject! States & Capitals of India — all 28 states and 8 Union Territories. MCQ (both directions: name→capital and capital→name) and Voice Quiz modes. Tricky multi-capital questions (e.g. Chandigarh is capital of Haryana, Punjab, and the Chandigarh UT). Progress tracked separately from English Vocabulary. Access via "🗺️ Indian Geography →" on the home screen.' },
      { icon: '🐾', topic: 'Collective Nouns', text: 'Fixed 6 incorrect answers in the tricky questions: "musicians" now correctly accepts "band" (not "team"); "roses" is single-select with "bouquet"; "chickens" question wording fixed; "clothes" accepts only "pile"; "lions" accepts only "pride"; "troop of ___" no longer includes lions as a valid answer.' },
    ],
  },
  {
    date: '26 Jun 2025',
    entries: [
      { icon: '📖', topic: 'Teach & Ask', text: 'New learning mode — tap 📖 9 on any topic to study 9 items before being quizzed. Cards show the term and meaning with voice-over. Then you answer MCQ, speak your answer (voice topics), and unscramble word-order puzzles. Each item must be answered correctly 3 times before the session ends.' },
    ],
  },
  {
    date: '25 Jun 2025',
    entries: [
      { icon: '🎤', topic: 'Voice Quiz', text: 'New quiz mode for Idioms, One Word Subs, Proverbs, Oxymorons & Similes — hear the clue, speak the answer. Auto-submits when you stop talking. Chrome on desktop only.' },
      { icon: '🗣️', topic: 'MCQ Voice Input', text: 'Turn on 🎤 Voice Input in quiz settings (⚙️) — say "one", "two", "three" or speak the answer text to pick an option hands-free.' },
      { icon: '⚙️', topic: 'Quiz Settings', text: 'New settings panel in every quiz — toggle speaking the key term, speaking the correct answer, and voice input. All remembered between sessions.' },
      { icon: '🎉', topic: 'Affirmatives', text: 'Correct answers now animate with a random cheer — "Nice one!", "You nailed it!", "Spot on!", "Boom, correct!" and 16 more.' },
    ],
  },
  {
    date: '20 Jun 2025',
    entries: [
      { icon: '📝', topic: 'One Word Substitutions', text: '27 new words added — scientists (astronomer, botanist, geologist…), places (monastery, zoo), and more.' },
      { icon: '🐾', topic: 'Collective Nouns', text: '35 hand-picked tricky questions added as Extra Practice. These always appear first in your session.' },
      { icon: '🔤', topic: 'Synonyms', text: 'Harder questions — wrong choices now come from the same meaning family, so you have to really know the word.' },
    ],
  },
  {
    date: 'Earlier',
    entries: [
      { icon: '↔️',  topic: 'All Topics', text: 'Questions now test both directions — given the answer, find the word; and vice versa.' },
      { icon: '✅', topic: 'Multiple Answers', text: 'Some questions ask you to select ALL correct answers (e.g. a word can have more than one synonym or collective noun).' },
      { icon: '🔄', topic: 'Oxymorons', text: 'Fill-in-the-blank questions added: "Complete the oxymoron: Act ___".' },
    ],
  },
];

export const TECH_CHANGELOG = [
  {
    date: '11 Jul 2026',
    entries: [
      'VoiceTest.jsx — playCorrectCue() switched from sine two-note chime to square-wave B5→E6 "coin win" ding',
      'geoQuiz.js buildGeoVoiceTest() — reverse questions ("X is capital of?") now generated once per unique capital instead of once per item; capitals shared by >1 state/UT (only Chandigarh currently) get answer = comma-joined names, isMulti prompt/ttsPrompt/instruction. scoreMatch() in VoiceTest.jsx is already order-independent bag-of-words matching, so no scoring changes needed — all names must be spoken to hit the 0.9 MATCH_THRESHOLD',
    ],
  },
  {
    date: '10 Jul 2026',
    entries: [
      'src/utils/voice.js — default voice accent is en-US; one-time localStorage migration (wm_voice_lang_us_default_migrated) bumps any browser with a saved en-IN preference back to en-US',
      'results now carry a quizType field ("mcq" | "voice") set in Test.jsx and VoiceTest.jsx',
      'VoiceTest.jsx — Web Audio cues (playNewQuestionCue/playListenCue/playCorrectCue/playWrongCue) at question-load, mic-start, and answer time; on a miss, chains two ttsSay() calls ("You said: X." → "The answer is Y.") before advancing; TIP_MS_WRONG (5200ms) replaces TIP_MS for wrong answers to give the extra TTS time to finish',
      'App.jsx — score/coin/streak persistence (batchUpdateScores etc.) deferred from quiz-complete time to Review-screen-exit time, so Review screen corrections apply before scores are saved; extracted into persistComplete/persistPartial',
      'src/screens/Review.jsx — onMarkCorrect prop; shows "✓ I spoke correctly" per wrong voice-quiz question, flips results[i].correct via App\'s handleMarkCorrect',
      'src/data/topics/oxymorons.json — regenerated from data/pdfs/oxymorons examples UPDATED.pdf (still 100 entries): new almost-done id; along-together → alone-together; awfully-nice → awfully-good-nice-pretty-delicious; deceptive-honesty → deceptively-honest; clearly-confused + clearly-misunderstood merged into clearly-confused-misunderstood',
    ],
  },
  {
    date: '4 Jul 2026',
    entries: [
      'src/utils/voice.js — shared TTS/STT accent preference (wm_voice_lang in localStorage); speak() replaces the per-screen ttsSpeak/ttsSay helpers in Test.jsx, VoiceTest.jsx, TeachAndAsk.jsx',
      'confusionSets.json — +10 new OWS groups (53 words) + Psychologist/Philologist added to the geologist group, sourced from confusion set one word subs.xlsx; overrides a few filler-only groups (old Monarch/Aristocrat/Autocrat, old Biography/Memoir/Hagiography) since those filler words were never real topic answers',
      'one_word_substitutions.json confusion-group coverage: 31/151 → 81/151 entries now get thematically-related distractors',
    ],
  },
  {
    date: '20 Jun 2025',
    entries: [
      'src/data/topics/ — consolidated all 9 topic JSONs (was split across two data/pdfs/ subfolders)',
      'src/data/tricky/ — new per-topic folder for pre-built tricky questions (different schema: options array + correctOptionIds)',
      'quiz.js — buildTrickyQ() converter; tricky items surface first via two-loop buildTest(); buildRepractice() handles tricky pool too',
      'confusionSets.json — +30 synonym family groups from confusion_set_synonyms.xlsx (same-meaning distractors)',
      'confusionSets.json — +7 OWS groups for new professions (-ologist words, monarch, spectator etc.)',
      'one_word_substitutions.json — +27 entries from Missing_One_Word_Substitutions.pdf',
      'Git repo: github.com/nishantpatni/wordmasters; .gitattributes enforces LF line endings',
      'Netlify deploy linked to master branch (npm run build → dist/)',
    ],
  },
  {
    date: 'Earlier',
    entries: [
      'SM-2 spaced repetition engine: prioritiseItems (unseen → weak → strong); memoryScore = 70% accuracy + 30% EF',
      'correctIndices pattern for multi-select questions; enforceMultiselectRatio ensures ≥20% multi-select per session',
      'Post-quiz Review screen with re-practice of incorrect answers (buildRepractice)',
      'Admin dashboard: per-user score tables, attempt logs tab, CSV export, Google Sheets sync via GAS',
      'Bidirectional question generation for all 9 topics; confusion sets for smarter distractors',
      'confusionSets.json: OWS, sound-alike, synonym groups + proverb confusion groups',
    ],
  },
];
