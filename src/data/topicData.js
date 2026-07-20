import SYNONYMS_DATA       from './topics/synonyms.json';
import ANTONYMS_DATA       from './topics/antonyms.json';
import ONE_WORD_DATA       from './topics/one_word_substitutions.json';
import PROVERBS_DATA       from './topics/proverbs.json';
import IDIOMS_DATA         from './topics/idioms.json';
import SIMILES_DATA        from './topics/similes.json';
import VOCABOPEDIA_SIMILES_DATA from './topics/vocabopediaSimiles.json';
import OXYMORONS_DATA      from './topics/oxymorons.json';
import COLLECTIVE_DATA     from './topics/collective_nouns.json';
import HOMOPHONES_DATA     from './topics/homophones.json';

import TRICKY_SYNONYMS     from './tricky/synonyms.json';
import TRICKY_ANTONYMS     from './tricky/antonyms.json';
import TRICKY_ONE_WORD     from './tricky/one_word_substitutions.json';
import TRICKY_PROVERBS     from './tricky/proverbs.json';
import TRICKY_IDIOMS       from './tricky/idioms.json';
import TRICKY_SIMILES      from './tricky/similes.json';
import TRICKY_VOCABOPEDIA_SIMILES from './tricky/vocabopediaSimiles.json';
import TRICKY_OXYMORONS    from './tricky/oxymorons.json';
import TRICKY_COLLECTIVE   from './tricky/collective_nouns.json';
import TRICKY_HOMOPHONES   from './tricky/homophones.json';

export const TOPIC_META = {
  synonyms:       { id: 'synonyms',       name: 'Synonyms',                          icon: '🔤', color: '#7C3AED', bg: '#F5F3FF' },
  antonyms:       { id: 'antonyms',       name: 'Antonyms',                          icon: '↔️',  color: '#DC2626', bg: '#FEF2F2' },
  oneWordSubs:    { id: 'oneWordSubs',    name: 'One Word Substitutions',             icon: '📝', color: '#059669', bg: '#ECFDF5' },
  proverbs:       { id: 'proverbs',       name: 'Proverbs',                          icon: '📜', color: '#B45309', bg: '#FFFBEB' },
  idioms:         { id: 'idioms',         name: 'Idioms & Phrases',                  icon: '💬', color: '#D97706', bg: '#FFFBEB' },
  similes:        { id: 'similes',        name: 'Similes',                           icon: '🦁', color: '#2563EB', bg: '#EFF6FF' },
  vocabopediaSimiles: { id: 'vocabopediaSimiles', name: 'Vocabopedia Similes',        icon: '📘', color: '#0D9488', bg: '#F0FDFA' },
  oxymorons:      { id: 'oxymorons',      name: 'Oxymorons',                         icon: '🔄', color: '#9333EA', bg: '#FDF4FF' },
  collectiveNouns:{ id: 'collectiveNouns',name: 'Collective Nouns',                  icon: '🐾', color: '#0891B2', bg: '#F0F9FF' },
  homophones:     { id: 'homophones',     name: 'Homophones, Homonyms & Homographs', icon: '👂', color: '#DB2777', bg: '#FDF2F8' },
};

export const TOPIC_ORDER = [
  'synonyms', 'antonyms', 'oneWordSubs', 'proverbs',
  'idioms', 'similes', 'vocabopediaSimiles', 'oxymorons', 'collectiveNouns', 'homophones',
];

export const ALL_TOPIC_DATA = {
  synonyms:        SYNONYMS_DATA,
  antonyms:        ANTONYMS_DATA,
  oneWordSubs:     ONE_WORD_DATA,
  proverbs:        PROVERBS_DATA,
  idioms:          IDIOMS_DATA,
  similes:         SIMILES_DATA,
  vocabopediaSimiles: VOCABOPEDIA_SIMILES_DATA,
  oxymorons:       OXYMORONS_DATA,
  collectiveNouns: COLLECTIVE_DATA,
  homophones:      HOMOPHONES_DATA,
};

// Tricky questions per topic — extra practice items that surface first in every session.
// Add items to src/data/tricky/<topic>.json; they'll automatically appear with priority.
export const TRICKY_TOPIC_DATA = {
  synonyms:        TRICKY_SYNONYMS,
  antonyms:        TRICKY_ANTONYMS,
  oneWordSubs:     TRICKY_ONE_WORD,
  proverbs:        TRICKY_PROVERBS,
  idioms:          TRICKY_IDIOMS,
  similes:         TRICKY_SIMILES,
  vocabopediaSimiles: TRICKY_VOCABOPEDIA_SIMILES,
  oxymorons:       TRICKY_OXYMORONS,
  collectiveNouns: TRICKY_COLLECTIVE,
  homophones:      TRICKY_HOMOPHONES,
};
