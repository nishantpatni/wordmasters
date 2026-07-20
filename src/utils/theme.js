// ── Quiz-flow dark/light theme ──────────────────────────────────────────────
// Covers Test, Revise, Review, and Results — the screens someone stares at
// for a whole quiz session. Defaults to dark to cut down on eye strain;
// toggled from the Quiz Settings panel on the main quiz screen.

const STORAGE_KEY = 'wm_dark';

export function getDarkMode() {
  return localStorage.getItem(STORAGE_KEY) !== 'off';
}

export function setDarkMode(on) {
  localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
}

const LIGHT = {
  pageBg:        '#F1EEEA',
  headerBg:      '#fff',
  headerBorder:  '#DCD5CE',
  cardBg:        '#fff',
  cardBorder:    '#DCD5CE',
  cardShadow:    '0 2px 12px rgba(0,0,0,0.06)',
  textPrimary:   '#212427',
  textMuted:     '#6B7280',
  textFaint:     '#9CA3AF',
  textFainter:   '#C4C2B9',
  optionBg:      '#FAFAF9',
  optionBorder:  '#DCD5CE',
  optionHoverBg: '#F2F2F2',
  pillNeutralBg: '#F2F2F2',
  kbdBg:         '#F1EFE8',
  kbdBorder:     '#D3D1C7',
  kbdText:       '#7A7870',
  letterBg:      'rgba(0,0,0,0.06)',
  letterText:    '#7A7870',
  ringTrack:     'rgba(0,0,0,0.08)',
  progressTrack: 'rgba(0,0,0,0.06)',
  panelBg:       '#fff',
  panelBorder:   '#DCD5CE',
  panelDivider:  '#EEE9E2',
  panelShadow:   '0 4px 20px rgba(0,0,0,0.1)',
  selectBg:      '#fff',

  correctBg:     '#E3FDDB', correctBorder: '#21BF61', correctText: '#197A56',
  wrongBg:       '#FEF2F2', wrongBorder:   '#DC2626', wrongText:   '#DC2626',
  warnBg:        '#FFF9E6', warnBorder:    '#F59E0B', warnText:    '#B45309',
  selectedBg:    '#E3FDDB', selectedBorder:'#96F878', selectedText:'#197A56',
  selectedHoverBg: '#A8F0B8',
};

const DARK = {
  pageBg:        '#15171B',
  headerBg:      '#1D2025',
  headerBorder:  '#2C3038',
  cardBg:        '#1D2025',
  cardBorder:    '#2C3038',
  cardShadow:    '0 2px 12px rgba(0,0,0,0.4)',
  textPrimary:   '#EDEDEF',
  textMuted:     '#A6ACB8',
  textFaint:     '#7D8590',
  textFainter:   '#5B6270',
  optionBg:      '#22262D',
  optionBorder:  '#333941',
  optionHoverBg: '#2A2F38',
  pillNeutralBg: '#2A2F38',
  kbdBg:         '#262A32',
  kbdBorder:     '#383E48',
  kbdText:       '#9AA1AC',
  letterBg:      'rgba(255,255,255,0.08)',
  letterText:    '#9AA1AC',
  ringTrack:     'rgba(255,255,255,0.12)',
  progressTrack: 'rgba(255,255,255,0.08)',
  panelBg:       '#22262D',
  panelBorder:   '#333941',
  panelDivider:  '#333941',
  panelShadow:   '0 4px 20px rgba(0,0,0,0.5)',
  selectBg:      '#1B1E23',

  correctBg:     'rgba(33,191,97,0.16)',  correctBorder: '#21BF61', correctText: '#4ADE80',
  wrongBg:       'rgba(220,38,38,0.18)',  wrongBorder:   '#DC2626', wrongText:   '#F87171',
  warnBg:        'rgba(245,158,11,0.16)', warnBorder:    '#F59E0B', warnText:    '#FBBF24',
  selectedBg:    'rgba(150,248,120,0.14)',selectedBorder:'#96F878', selectedText:'#B6F5A0',
  selectedHoverBg: 'rgba(150,248,120,0.24)',
};

export function getTheme(dark) {
  return dark ? DARK : LIGHT;
}
