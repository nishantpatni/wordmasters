import SYNONYMS_DATA       from './topics/synonyms.json';
import VOCABOPEDIA_SYNONYMS_DATA from './topics/vocabopediaSynonyms.json';
import ANTONYMS_DATA       from './topics/antonyms.json';
import VOCABOPEDIA_ANTONYMS_DATA from './topics/vocabopediaAntonyms.json';
import ONE_WORD_DATA       from './topics/one_word_substitutions.json';
import VOCABOPEDIA_ONE_WORD_DATA from './topics/vocabopediaOneWordSubs.json';
import PROVERBS_DATA       from './topics/proverbs.json';
import VOCABOPEDIA_PROVERBS_DATA from './topics/vocabopediaProverbs.json';
import IDIOMS_DATA         from './topics/idioms.json';
import VOCABOPEDIA_IDIOMS_DATA from './topics/vocabopediaIdioms.json';
import SIMILES_DATA        from './topics/similes.json';
import VOCABOPEDIA_SIMILES_DATA from './topics/vocabopediaSimiles.json';
import OXYMORONS_DATA      from './topics/oxymorons.json';
import VOCABOPEDIA_OXYMORONS_DATA from './topics/vocabopediaOxymorons.json';
import COLLECTIVE_DATA     from './topics/collective_nouns.json';
import HOMOPHONES_DATA     from './topics/homophones.json';

import TRICKY_SYNONYMS     from './tricky/synonyms.json';
import TRICKY_VOCABOPEDIA_SYNONYMS from './tricky/vocabopediaSynonyms.json';
import TRICKY_ANTONYMS     from './tricky/antonyms.json';
import TRICKY_VOCABOPEDIA_ANTONYMS from './tricky/vocabopediaAntonyms.json';
import TRICKY_ONE_WORD     from './tricky/one_word_substitutions.json';
import TRICKY_VOCABOPEDIA_ONE_WORD from './tricky/vocabopediaOneWordSubs.json';
import TRICKY_PROVERBS     from './tricky/proverbs.json';
import TRICKY_VOCABOPEDIA_PROVERBS from './tricky/vocabopediaProverbs.json';
import TRICKY_IDIOMS       from './tricky/idioms.json';
import TRICKY_VOCABOPEDIA_IDIOMS from './tricky/vocabopediaIdioms.json';
import TRICKY_SIMILES      from './tricky/similes.json';
import TRICKY_VOCABOPEDIA_SIMILES from './tricky/vocabopediaSimiles.json';
import TRICKY_OXYMORONS    from './tricky/oxymorons.json';
import TRICKY_VOCABOPEDIA_OXYMORONS from './tricky/vocabopediaOxymorons.json';
import TRICKY_COLLECTIVE   from './tricky/collective_nouns.json';
import TRICKY_HOMOPHONES   from './tricky/homophones.json';

export const TOPIC_META = {
  synonyms:       { id: 'synonyms',       name: 'Synonyms',                          icon: '🔤', color: '#7C3AED', bg: '#F5F3FF' },
  vocabopediaSynonyms: { id: 'vocabopediaSynonyms', name: 'Vocabopedia Synonyms',     icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  antonyms:       { id: 'antonyms',       name: 'Antonyms',                          icon: '↔️',  color: '#DC2626', bg: '#FEF2F2' },
  vocabopediaAntonyms: { id: 'vocabopediaAntonyms', name: 'Vocabopedia Antonyms',     icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  oneWordSubs:    { id: 'oneWordSubs',    name: 'One Word Substitutions',             icon: '📝', color: '#059669', bg: '#ECFDF5' },
  vocabopediaOneWordSubs: { id: 'vocabopediaOneWordSubs', name: 'Vocabopedia One Word Substitutions', icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  proverbs:       { id: 'proverbs',       name: 'Proverbs',                          icon: '📜', color: '#B45309', bg: '#FFFBEB' },
  vocabopediaProverbs: { id: 'vocabopediaProverbs', name: 'Vocabopedia Proverbs',     icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  idioms:         { id: 'idioms',         name: 'Idioms & Phrases',                  icon: '💬', color: '#D97706', bg: '#FFFBEB' },
  vocabopediaIdioms: { id: 'vocabopediaIdioms', name: 'Vocabopedia Idioms',          icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  similes:        { id: 'similes',        name: 'Similes',                           icon: '🦁', color: '#2563EB', bg: '#EFF6FF' },
  vocabopediaSimiles: { id: 'vocabopediaSimiles', name: 'Vocabopedia Similes',        icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  oxymorons:      { id: 'oxymorons',      name: 'Oxymorons',                         icon: '🔄', color: '#9333EA', bg: '#FDF4FF' },
  vocabopediaOxymorons: { id: 'vocabopediaOxymorons', name: 'Vocabopedia Oxymorons',  icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  collectiveNouns:{ id: 'collectiveNouns',name: 'Vocabo Collective Nouns',                  icon: '🐾', color: '#0891B2', bg: '#F0F9FF' },
  homophones:     { id: 'homophones',     name: 'Vocabo Homophones, Homonyms & Homographs', icon: '👂', color: '#DB2777', bg: '#FDF2F8' },
};

export const TOPIC_ORDER = [
  'synonyms', 'vocabopediaSynonyms', 'antonyms', 'vocabopediaAntonyms', 'oneWordSubs', 'vocabopediaOneWordSubs', 'proverbs', 'vocabopediaProverbs',
  'idioms', 'vocabopediaIdioms', 'similes', 'vocabopediaSimiles',
  'oxymorons', 'vocabopediaOxymorons', 'collectiveNouns', 'homophones',
];

// Pure UI grouping for Home/TopicSelect — "Vocabo" topics (the vocabopedia*
// splits, plus Collective Nouns and Homophones which were only renamed, not
// split) vs. everything else ("Core"). This is a browsing/organizational
// split only: subject stays 'english' for both, same sync/scoring/local
// storage as before — no data migration, no separate progress tracking.
export const VOCABO_TOPIC_IDS = new Set([
  'vocabopediaSynonyms', 'vocabopediaAntonyms', 'vocabopediaOneWordSubs',
  'vocabopediaProverbs', 'vocabopediaIdioms', 'vocabopediaSimiles', 'vocabopediaOxymorons',
  'collectiveNouns', 'homophones',
]);
export const CORE_TOPIC_ORDER   = TOPIC_ORDER.filter(tid => !VOCABO_TOPIC_IDS.has(tid));
export const VOCABO_TOPIC_ORDER = TOPIC_ORDER.filter(tid => VOCABO_TOPIC_IDS.has(tid));

export const ALL_TOPIC_DATA = {
  synonyms:        SYNONYMS_DATA,
  vocabopediaSynonyms: VOCABOPEDIA_SYNONYMS_DATA,
  antonyms:        ANTONYMS_DATA,
  vocabopediaAntonyms: VOCABOPEDIA_ANTONYMS_DATA,
  oneWordSubs:     ONE_WORD_DATA,
  vocabopediaOneWordSubs: VOCABOPEDIA_ONE_WORD_DATA,
  proverbs:        PROVERBS_DATA,
  vocabopediaProverbs: VOCABOPEDIA_PROVERBS_DATA,
  idioms:          IDIOMS_DATA,
  vocabopediaIdioms: VOCABOPEDIA_IDIOMS_DATA,
  similes:         SIMILES_DATA,
  vocabopediaSimiles: VOCABOPEDIA_SIMILES_DATA,
  oxymorons:       OXYMORONS_DATA,
  vocabopediaOxymorons: VOCABOPEDIA_OXYMORONS_DATA,
  collectiveNouns: COLLECTIVE_DATA,
  homophones:      HOMOPHONES_DATA,
};

// Tricky questions per topic — extra practice items that surface first in every session.
// Add items to src/data/tricky/<topic>.json; they'll automatically appear with priority.
export const TRICKY_TOPIC_DATA = {
  synonyms:        TRICKY_SYNONYMS,
  vocabopediaSynonyms: TRICKY_VOCABOPEDIA_SYNONYMS,
  antonyms:        TRICKY_ANTONYMS,
  vocabopediaAntonyms: TRICKY_VOCABOPEDIA_ANTONYMS,
  oneWordSubs:     TRICKY_ONE_WORD,
  vocabopediaOneWordSubs: TRICKY_VOCABOPEDIA_ONE_WORD,
  proverbs:        TRICKY_PROVERBS,
  vocabopediaProverbs: TRICKY_VOCABOPEDIA_PROVERBS,
  idioms:          TRICKY_IDIOMS,
  vocabopediaIdioms: TRICKY_VOCABOPEDIA_IDIOMS,
  similes:         TRICKY_SIMILES,
  vocabopediaSimiles: TRICKY_VOCABOPEDIA_SIMILES,
  oxymorons:       TRICKY_OXYMORONS,
  vocabopediaOxymorons: TRICKY_VOCABOPEDIA_OXYMORONS,
  collectiveNouns: TRICKY_COLLECTIVE,
  homophones:      TRICKY_HOMOPHONES,
};
