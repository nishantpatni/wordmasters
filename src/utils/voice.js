// ── Shared voice-accent preference for TTS + speech recognition ───────────────
// Persisted in localStorage so every screen (Test, VoiceTest, TeachAndAsk) reads
// the same value even though only Test.jsx exposes a settings UI for it.

export const VOICE_LANG_OPTIONS = [
  { value: 'en-US', label: 'US English' },
  { value: 'en-IN', label: 'Indian English' },
  { value: 'en-GB', label: 'British English' },
];

const STORAGE_KEY = 'wm_voice_lang';
const VOICE_NAME_KEY = 'wm_voice_name';
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

// Explicit voice override — lets a user pick a specific installed voice (e.g. a
// higher-quality one they downloaded) since Chrome's getVoices() order is not
// guaranteed to follow the OS-level default voice, especially on macOS.
export function getVoiceName() {
  return localStorage.getItem(VOICE_NAME_KEY) || '';
}

export function setVoiceName(name) {
  if (name) localStorage.setItem(VOICE_NAME_KEY, name);
  else localStorage.removeItem(VOICE_NAME_KEY);
}

// Chrome loads voices asynchronously; cache + refresh on the onvoiceschanged event.
let cachedVoices = [];
const voiceListeners = new Set();

function loadVoices() {
  cachedVoices = window.speechSynthesis.getVoices();
  voiceListeners.forEach(cb => cb(cachedVoices));
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Subscribe to voice-list updates (fires once immediately with current list).
export function onVoicesChanged(cb) {
  voiceListeners.add(cb);
  cb(cachedVoices);
  return () => voiceListeners.delete(cb);
}

export function getVoicesForLang(lang) {
  const prefix = lang.split('-')[0];
  return cachedVoices.filter(v => v.lang.startsWith(prefix));
}

function pickVoice(lang) {
  const chosenName = getVoiceName();
  if (chosenName) {
    const chosen = cachedVoices.find(v => v.name === chosenName);
    if (chosen) return chosen;
  }
  const exact = cachedVoices.find(v => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split('-')[0];
  return cachedVoices.find(v => v.lang.startsWith(prefix)) || null;
}

// Info about the voice that will actually be used right now — for display
// (e.g. a footer showing which accent/voice is active) and debugging.
export function getCurrentVoiceInfo() {
  const lang = getVoiceLang();
  const voice = pickVoice(lang);
  return voice ? { name: voice.name, lang: voice.lang } : { name: null, lang };
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

// Chrome/Android's speechSynthesis is known to get stuck after the screen
// locks/sleeps a few times in a row — queued utterances silently never fire
// onend again, and the shared voice list can go stale. There's no real
// "reload" API; the practical fix is cancelling anything pending, nudging
// the engine with pause/resume, and re-reading the voice list. Exposed for
// the Voice Quiz settings panel's manual "reload" button.
export function resetVoiceEngine() {
  if (!window.speechSynthesis) return;
  try { window.speechSynthesis.cancel(); } catch {}
  try { window.speechSynthesis.resume(); } catch {}
  loadVoices();
}

// Same root cause as above — auto-recover as soon as the tab/screen comes
// back from being hidden (screen lock, app switch), so most people never
// need the manual button at all.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetVoiceEngine();
  });
}
