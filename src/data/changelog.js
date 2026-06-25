export const USER_CHANGELOG = [
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
