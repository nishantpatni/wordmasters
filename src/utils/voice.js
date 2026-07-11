// ── Shared voice-accent preference for TTS + speech recognition ───────────────
// Persisted in localStorage so every screen (Test, VoiceTest, TeachAndAsk) reads
// the same value even though only Test.jsx exposes a settings UI for it.

export const VOICE_LANG_OPTIONS = [
  { value: 'en-US', label: 'US English' },
  { value: 'en-IN', label: 'Indian English' },
  { value: 'en-GB', label: 'British English' },
];

const STORAGE_KEY = 'wm_voice_lang';
// One-time migration: Indian English was mispronouncing some words, so any
// browser that had it saved from before gets bumped back to the US default.
const MIGRATION_KEY = 'wm_voice_lang_us_default_migrated';

export function getVoiceLang() {
  if (!localStorage.getItem(MIGRATION_KEY)) {
    localStorage.setItem(MIGRATION_KEY, '1');
    if (localStorage.getItem(STORAGE_KEY) === 'en-IN') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return localStorage.getItem(STORAGE_KEY) || 'en-US';
}

export function setVoiceLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
}

// Chrome loads voices asynchronously; cache + refresh on the onvoiceschanged event.
let cachedVoices = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(lang) {
  const exact = cachedVoices.find(v => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split('-')[0];
  return cachedVoices.find(v => v.lang.startsWith(prefix)) || null;
}

// Drop-in replacement for the per-screen ttsSpeak/ttsSay helpers.
export function speak(text, { rate = 0.88, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance((text || '').replace(/_{2,}/g, 'blank'));
  utt.rate = rate;
  const lang = getVoiceLang();
  utt.lang = lang;
  const voice = pickVoice(lang);
  if (voice) utt.voice = voice;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}
