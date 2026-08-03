export const USER_CHANGELOG = [
  {
    date: '03 Aug 2026',
    entries: [
      { icon: '📘', topic: 'Core vs. Vocabo, Split on Home', text: 'Home now has two separate "Start a Test" sections instead of one combined list: Core Topics (Synonyms, Antonyms, One Word Subs, Proverbs, Idioms, Similes, Oxymorons) and Vocabo Topics (all the Vocabopedia-sourced ones, plus Vocabo Collective Nouns and Vocabo Homophones). Mixed Test is now scoped to whichever section you started from. Nothing about your existing scores or history changed — this is just how topics are organized for browsing.' },
    ],
  },
  {
    date: '01 Aug 2026',
    entries: [
      { icon: '📘', topic: 'New Topics: Vocabopedia Synonyms & Antonyms', text: 'Split off two new topics containing the Vocabopedia lists — 30 synonyms and 15 antonyms (MCQ, Voice Quiz, Revise, Teach & Ask). The original Synonyms and Antonyms topics keep the rest. Also renamed Collective Nouns and Homophones/Homonyms/Homographs to "Vocabo Collective Nouns" and "Vocabo Homophones, Homonyms & Homographs" to match.' },
      { icon: '🔢', topic: 'Quizzes Now Fill the Requested Count', text: 'Topics with fewer items than the quiz size you picked (e.g. Vocabopedia One Word Substitutions has 60 items) used to cap out early — a "100 questions" quiz would quietly stop at 60. Since most of these topics test each item both ways (e.g. word→meaning and meaning→word), the quiz now uses both directions to fill the count you asked for, up to however many distinct questions actually exist.' },
      { icon: '☁️', topic: 'Moved to Supabase', text: 'Practice data (scores, quiz history, streaks/coins) now syncs to a proper database instead of Google Sheets — same offline-first behavior as before, nothing lost in the move. Indian Geography scores now sync to the cloud too, which they never did before.' },
      { icon: '👂', topic: 'Homophones: 17 More Sets', text: 'Added rain/reign/rein, deer/dear, ate/eight, for/four/fore, by/buy/bye, one/won, sun/son, blue/blew, made/maid, week/weak, wood/would, board/bored, our/hour, so/sew/sow, new/knew, which/witch, and wear/where — 38 new questions, every word tested. 69 → 107 questions.' },
      { icon: '📖', topic: 'Homographs: Full Coverage', text: 'bark, bat, bank, light, match, spring, wave, plain, and key were only testing 2 of their 4 listed meanings (fixed to 2 of 4 yesterday, should have been all 4). Now every meaning of every homograph is tested. 107 → 125 questions.' },
    ],
  },
  {
    date: '31 Jul 2026',
    entries: [
      { icon: '🎤', topic: 'Voice Quiz: Multi-Answer Mic Cutoff', text: 'Questions needing several spoken answers in a row (e.g. a simile with more than one valid completion) were getting cut off after the first answer — the mic stopped listening at the first pause in speech, submitting early. It now keeps listening through pauses for these questions, with a new "✓ Said them all — submit" button so you\'re not stuck waiting out the full timer once you\'re done.' },
      { icon: '👂', topic: 'Homophones, Homonyms & Homographs: More Coverage', text: 'Added 25 new questions so every word in every homophone set (e.g. "hare" and "heir", not just "hair") gets tested, not just one member of the group — and each homograph (bark, bat, bank, light, match, spring, wave, plain, key) now tests 2 of its 4 meanings instead of just 1. 44 → 69 questions.' },
    ],
  },
  {
    date: '30 Jul 2026',
    entries: [
      { icon: '🐾', topic: 'Collective Nouns Voice Quiz', text: 'For nouns with more than one valid collective (e.g. Flowers → Bouquet or Bunch) and collectives with more than one valid noun, the voice quiz was only ever asking for one answer instead of every valid one — inconsistent with the MCQ version, which already requires picking all of them. Now the voice quiz requires every correct answer to be spoken, matching the MCQ.' },
    ],
  },
  {
    date: '29 Jul 2026',
    entries: [
      { icon: '📘', topic: 'New Topic: Vocabopedia One Word Substitutions', text: 'Split off a new topic containing the 60 one-word substitutions from the Grade 4 Vocabopedia list (MCQ, Voice Quiz, Revise, Teach & Ask). The original One Word Substitutions topic keeps the rest.' },
    ],
  },
  {
    date: '28 Jul 2026',
    entries: [
      { icon: '📘', topic: 'New Topics: Vocabopedia Oxymorons, Idioms & Proverbs', text: 'Split off three new topics containing the Vocabopedia lists — 51 oxymorons, 40 idioms, and 40 proverbs (MCQ, Voice Quiz, Revise, Teach & Ask). The original Oxymorons, Idioms, and Proverbs topics keep the rest.' },
      { icon: '🚫', topic: 'Voice Quiz Anti-Guessing, Round 2', text: 'The anti-guessing fix from Jul 25 only covered Collective Nouns. Similes, Antonyms, and Synonyms voice questions ask you to say every correct answer at once, and that mode had no guessing protection at all — rattling off extra words alongside the right one still passed. Now fixed the same way, and the result screen shows exactly what was heard (and which extra word got you flagged) so it\'s no longer a black box.' },
    ],
  },
  {
    date: '25 Jul 2026',
    entries: [
      { icon: '🔀', topic: 'Question Ordering Fix', text: 'Practice questions for items with tied scores (e.g. several Collective Nouns you\'ve gotten wrong equally often) were quietly falling back to the underlying data\'s alphabetical order instead of being shuffled. Fixed across MCQ, Voice Quiz, and Teach & Ask.' },
      { icon: '🔢', topic: '"Select All" Answer Count', text: 'Multi-answer MCQ questions now show how many options to pick, e.g. "Select ALL collective nouns for a group of Flowers: (2 answers)".' },
      { icon: '🚫', topic: 'Voice Quiz Anti-Guessing', text: 'Rattling off several guesses in one go (e.g. "pride, herd, flock, string...") no longer counts as correct just because one of them matched — Collective Nouns voice questions now mark it wrong if another real collective noun is detected alongside the right answer.' },
    ],
  },
  {
    date: '22 Jul 2026',
    entries: [
      { icon: '🔀', topic: 'Repractice Multi-Answer Questions', text: 'Retrying incorrect answers at the end of a quiz ("Try Again") now includes multi-answer questions again (e.g. similes like "as ___ as a lion?" where more than one adjective is correct) — it was silently only ever generating single-answer questions during repractice.' },
      { icon: '🇺🇸', topic: 'Voice Recognition Language', text: 'Confirmed speech recognition (listening to your spoken answers) defaults to American English everywhere, matching spoken questions — same accent setting in Quiz Settings (⚙️) controls both.' },
      { icon: '🔁', topic: 'Voice Quiz Repractice: Direction & Alt Answers', text: 'Retrying wrong answers from a Voice Quiz was silently reverting Collective Nouns, Similes, and Antonyms questions back to the forward direction and a single answer, even if the original question was a reverse one (e.g. "A pride of ___?") or had multiple valid answers. Repractice now preserves the exact question and full answer set you were originally asked.' },
    ],
  },
  {
    date: '21 Jul 2026',
    entries: [
      { icon: '🔗', topic: 'Deep Links', text: 'Links like /revise/similes or /quiz/synonyms/voice now open straight into that topic\'s browse list or a fresh quiz once you\'re logged in, instead of always landing on Home.' },
      { icon: '🔄', topic: 'Voice Quiz Repractice', text: 'Repracticing wrong answers (or hitting "Try Again") after a Voice Quiz now stays a voice quiz — it was silently switching to the MCQ quiz before.' },
      { icon: '📋', topic: 'Voice Quiz Ordering', text: 'Voice Quiz questions now prioritize what you haven\'t seen yet, then what you got wrong, then what you\'ve mastered — same as the MCQ quiz already did. Previously it was pure random shuffle regardless of your history.' },
      { icon: '↔️', topic: 'Voice Quiz: Similes & Collective Nouns', text: 'Both topics now also ask the reverse direction in Voice Quiz — "As ___ as the sun?" (answer: bright) and "A pride of ___?" (answer: lions) — not just the forward direction.' },
      { icon: '🔁', topic: 'Voice Fix', text: 'If the mic or TTS voice stops responding after your screen locks/sleeps a few times, it should now often recover on its own. If not, there\'s a new "Reload voice engine" button in Quiz Settings (⚙️) on both the Voice Quiz and MCQ quiz.' },
    ],
  },
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
    date: '03 Aug 2026',
    entries: [
      'topicData.js — VOCABO_TOPIC_IDS (Set) + derived CORE_TOPIC_ORDER/VOCABO_TOPIC_ORDER (filtered subsets of TOPIC_ORDER). Pure UI grouping, not a new subject: same localStorage keys, same Supabase subject=\'english\', no data migration.',
      'App.jsx — new topicGroup state (\'core\'|\'vocabo\'), set by two Home CTAs (onStartTest/onStartVocabo), passed to TopicSelect as `group` and used to scope the Mixed Test topic list (both on start and on Retry) via buildTest\'s new optional 4th param.',
      'quiz.js buildTest(topicId, count, scores, mixedTopicIds) — mixedTopicIds optionally replaces the "loop every live topic" default for topicId===\'mixed\', so it can be scoped to just Core or just Vocabo.',
      'TopicSelect.jsx — new `group` prop (default \'core\') filters which topics render, using CORE_TOPIC_ORDER/VOCABO_TOPIC_ORDER instead of the full TOPIC_ORDER; Mixed Test card count/label follows the same scoping.',
      'Home.jsx — extracted TopicList sub-component (was inline), rendered twice (Core / Vocabo) with a CTA each; top summary (mastery ring, coins, AsanScore) stays a combined all-topics aggregate, unchanged.',
      'utils/routes.js — /topics/vocabo deep link (mirrors the existing /topics/geography pattern), parses to { screen: \'topic-select\', group: \'vocabo\' }.',
    ],
  },
  {
    date: '01 Aug 2026',
    entries: [
      'homophones.json — 69 → 107 entries. Added 17 more common Grade-4-level homophone sets flagged as missing (rain/reign/rein, deer/dear, ate/eight, for/four/fore, by/buy/bye, one/won, sun/son, blue/blew, made/maid, week/weak, wood/would, board/bored, our/hour, so/sew/sow, new/knew, which/witch, wear/where) — no source PDF exists for this topic (unlike other topics, homophones.json was hand-authored, not extracted from a PDF), so this list is curated directly rather than checked against a reference document.',
      'homophones.json — 107 → 125 entries. The 31 Jul meaning_identify (homograph/homonym) fix only went from 1/4 to 2/4 senses tested per word — finished the job: bark/bat/bank/light/match/spring/wave/plain/key now all test 4/4 listed senses.',
      'src/data/topics/vocabopediaSynonyms.json (30) and vocabopediaAntonyms.json (75) — new topics sourced from data/pdfs/GRADE 4 Synonyms and Antonyms (1).pdf. 24/30 synonyms and 70/75 antonym pairs reused existing ids/content moved out of synonyms.json/antonyms.json (score history carries over); 6 new synonym entries (Frigid, Sullied, Amusing, Petrified, Effortless, Arduous) and 5 new antonym pairs (Enormous -> minuscule/tiny/slight/diminutive/microscopic) added. synonyms.json 118->94, antonyms.json 183->113 (antonym data is one row per word+antonym pair, so only the matched pairs moved, not whole words). quiz.js: genSynonym/genSynonymForward/genSynonymReverse/genSynonymForced and genAntonym/genAntonymForward/genAntonymReverse take a topicId param now; GENERATORS, SUBTYPE_COUNTER_RESETTERS, genForcedMulti, itemToVoiceQ (synonyms/antonyms cases now read ALL_TOPIC_DATA[topicId] instead of a hardcoded topic), GROUPED_VOICE_BUILDERS, and buildVoiceTest\'s antonym branch all extended for the vocabopedia variants, mirroring the established split pattern.',
      'topicData.js — renamed collectiveNouns/homophones display names to "Vocabo Collective Nouns"/"Vocabo Homophones, Homonyms & Homographs" (no id/data change, display name only).',
      'quiz.js addRegularQuestions() — was single-pass over prioritiseItems(), capping question count at pool.length regardless of the requested count. Now multi-pass (up to 4) for topics with a subtype-alternating generator (all except homophones, which has no "other direction" per item — qType is fixed per item in the data). SUBTYPE_COUNTER_RESETTERS resets the relevant module-level counter (synSubIdx/antSubIdx/idiomSubIdx/owsSubIdx/simileSubIdx/oxySubIdx/proverbSubIdx/collectiveSubIdx) to the pass number before each pass, not letting it carry over naturally — this matters because letting it carry over means pass N+1 exactly repeats pass N\'s per-item subtype assignment whenever pool.length is a multiple of the subtype count (e.g. the reported bug case: 60-item pool, 2 subtypes, 60%2=0). Resetting to the pass number makes subtype a pure function of (item position, pass), guaranteeing pass N+1 gives every item a genuinely different subtype from pass N while preserving intra-pass alternating variety. Verified via simulation against real data: vocabopediaOneWordSubs (60 items x2) fills a 100-question request with 0 exact-duplicate prompts; vocabopediaOxymorons (51 items x3) fills 150 with 0 repeated subtypes per item.',
      'Migrated practice-data storage from Google Sheets/Apps Script to Supabase (Postgres). New schema (supabase/migrations/): scores (username, subject, item_id) composite PK, attempt_logs, user_meta — subject (\'english\'|\'geography\') replaces the old geo_<username> sheet-tab-naming hack server-side (client-side localStorage convention unchanged). RLS enabled on all three tables, permissive SELECT/INSERT/UPDATE for anon, deliberately no DELETE policy (defense-in-depth against a stray unfiltered .delete() — verified anon delete attempts affect 0 rows).',
      'src/services/dataService.js replaces sheetsService.js — loadScores/saveScores (per-item upsert, never delete-then-replace — fixes a latent multi-device data-loss bug the old GAS writeScores() had) / logAttempts / loadLogs / loadMeta / saveMeta, all subject-aware.',
      'App.jsx — merge-on-load logic (remote scores merged with local, local wins when its reps is higher) factored into one syncSubject(username, subject) helper, now also called for Geography (previously English-only — handleStartGeoTest/handleStartGeoVoiceTest never synced remotely at all). persistComplete/persistPartial sync both subjects now, plus newly-wired attempt_logs and user_meta sync (previously fully broken — the client posted action=log but gas/Code.gs never implemented it server-side).',
      'One-time scripts/migrate-sheets-to-supabase.mjs backfilled existing English scores from the live GAS endpoint: NP_test 170, PB_test 522, ATV 739 rows — verified via row-count match in Supabase. Had to normalize dates during backfill: Sheets had silently coerced the app\'s clean "YYYY-MM-DD" strings into Date cells, so Apps Script read them back as full Date.toString() output (e.g. "Thu Jun 18 2026 00:00:00 GMT+0530 (India Standard Time)") — parsed the calendar date directly out of that string rather than round-tripping through new Date(...).toISOString(), which would have silently shifted the date backward a day for the +0530 offset.',
      'Verified end-to-end against the live Supabase project with the real anon key (not just service role): read path (ATV\'s 739 backfilled items render correctly on Home after login sync, 0 console errors), write path (upsert only touches the item(s) in the payload, sibling items survive), and that the anon role genuinely cannot delete rows.',
      'gas/Code.gs and src/config.js (GAS_URL) left in the repo, just unreferenced — not deleted.',
    ],
  },
  {
    date: '31 Jul 2026',
    entries: [
      'VoiceTest.jsx startListening() — r.continuous now true whenever q.requiredAnswers.length > 1; SpeechRecognition (non-continuous) finalizes and fires onend at the first detected pause, which was auto-submitting multi-answer questions after only the first spoken answer. r.onresult concatenation also now joins result segments with a space (was string-concatenated with none, risking merged words once continuous mode produces multiple finalized segments).',
      'VoiceTest.jsx — manual "✓ Said them all — submit" button added during the listening phase for requiredAnswers.length > 1 questions (calls recogRef.current.stop()), since continuous mode no longer auto-ends at the first pause and would otherwise wait out the full listenSecsFor() timer.',
      'homophones.json — 44 → 69 entries. Added 16 fill_blank items so every word in every homophone label group (grouped by normalized/sorted word-set, not literal label string — same set was previously written in 3 different word orders across its 3 sibling items) is tested as the answer at least once (to, rite, hare, heir, pear, pare, sale, tail, flower, whole, piece, night, male, meat, stare, steal were previously untested — only ever appeared as MCQ decoys). Added 9 meaning_identify items testing a 2nd sense per homograph (bark, bat, bank, light, match, spring, wave, plain, key) — each still has 2 of its 4 listed senses untested (available for a future round).',
    ],
  },
  {
    date: '30 Jul 2026',
    entries: [
      'quiz.js buildCollectiveVoiceQs() — forward/reverse groups now emit requiredAnswers (was answer/altAnswers, i.e. any-one-accepted via scoreMatchAny) so multi-valid nouns/collectives use scoreMatchAll like Similes/Antonyms/Synonyms already do; decoys (hedging detection) kept as-is. 8 nouns in collective_nouns.json currently have >1 valid collective (flowers, students, houses, stars, cards, …).',
      'VoiceTest.jsx TOPIC_VOICE_LABELS.collectiveNouns.instruction — "Speak the collective noun" → "Speak every correct answer" to match the new all-required behavior.',
    ],
  },
  {
    date: '29 Jul 2026',
    entries: [
      'src/data/topics/vocabopediaOneWordSubs.json — new topic (60 entries) sourced from data/pdfs/Grade 4 One Word Substitution.pdf; 56 items reuse existing ids/content moved out of one_word_substitutions.json (score history carries over), 4 new (Philologist, Dictator, Patriot, Dockyard) added',
      'one_word_substitutions.json — 57 entries removed (56 words now exclusive to vocabopediaOneWordSubs, incl. a duplicate "Bilingual" entry that existed twice)',
      'quiz.js — genOneWord() takes topicId param; vocabopediaOneWordSubs generator/voice-quiz mapping added, mirroring the vocabopediaSimiles/Idioms/Oxymorons/Proverbs split pattern',
      'quizTopicConfig.json, topicData.js, Revise.jsx, TeachAndAsk.jsx, TopicSelect.jsx — wired up vocabopediaOneWordSubs alongside oneWordSubs',
    ],
  },
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
