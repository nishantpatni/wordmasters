import STATES_CAPITALS from './geo/states_capitals.json';

export const GEO_TOPIC_META = {
  statesCapitals: {
    id: 'statesCapitals', name: 'States & Capitals',
    icon: '🗺️', color: '#0891B2', bg: '#F0F9FF',
    subject: 'geography',
  },
};

export const GEO_TOPIC_ORDER = ['statesCapitals'];

export const ALL_GEO_DATA = {
  statesCapitals: STATES_CAPITALS,
};
