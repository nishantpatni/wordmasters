import { useState, useEffect } from 'react';
import { onVoicesChanged, getCurrentVoiceInfo, VOICE_LANG_OPTIONS } from '../utils/voice.js';

// Small fixed footer that shows which TTS voice/accent is actually speaking —
// handy for diagnosing "wrong accent" issues since Chrome doesn't always pick
// the OS default voice for a given language.
export default function VoiceFooter() {
  const [info, setInfo] = useState(getCurrentVoiceInfo);

  useEffect(() => onVoicesChanged(() => setInfo(getCurrentVoiceInfo())), []);

  const langLabel = VOICE_LANG_OPTIONS.find(o => o.value === info.lang)?.label || info.lang;

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
      textAlign: 'center', padding: '6px 10px',
      fontSize: 11, color: '#9CA3AF',
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
      borderTop: '1px solid #EEE9E2',
    }}>
      🔊 {info.name || 'Default voice'} · {langLabel}
    </div>
  );
}
