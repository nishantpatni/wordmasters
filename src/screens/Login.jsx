import { useState } from 'react';

const USERS = {
  NP_test: { password: 'NP_test', role: 'student', display: 'NP' },
  PB_test: { password: 'PB_test', role: 'student', display: 'PB' },
  ATV:     { password: 'ATV',     role: 'student', display: 'ATV' },
  admin:   { password: 'admin',   role: 'admin',   display: 'Admin' },
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const u = USERS[username.trim()];
    if (!u || u.password !== password) {
      setError('Invalid username or password.');
      return;
    }
    setError('');
    onLogin({ username: username.trim(), role: u.role, display: u.display });
  }

  function quickLogin(name) {
    const u = USERS[name];
    onLogin({ username: name, role: u.role, display: u.display });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="pop-in">
        <img src="/logo.png" alt="asaniSe" style={{ width: 72, height: 72, marginBottom: 8, objectFit: 'contain' }} />
        <div style={styles.logo}>Word <span style={{ color: '#96F878' }}>Masters</span></div>
        <div style={styles.sub}>Build your vocabulary, one word at a time</div>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            placeholder="Enter your username"
            autoFocus
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            style={styles.input}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.btn}
            onMouseEnter={e => e.currentTarget.style.background = '#71DC68'}
            onMouseLeave={e => e.currentTarget.style.background = '#96F878'}
          >Sign In →</button>
        </form>

        <div style={styles.divider}><span style={{ background: '#fff', padding: '0 12px', position: 'relative', zIndex: 1 }}>or quick login</span></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {['NP_test','PB_test','ATV'].map(name => (
            <button key={name} onClick={() => quickLogin(name)} style={styles.quickBtn}
              onMouseEnter={e => e.currentTarget.style.background = '#A8F0B8'}
              onMouseLeave={e => e.currentTarget.style.background = '#E3FDDB'}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#F1EEEA',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: 28, padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400,
    textAlign: 'center', border: '1px solid #DCD5CE',
  },
  logo: {
    fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 30, color: '#212427', letterSpacing: 0.5,
  },
  sub:   { fontSize: 14, color: '#6B7280', marginTop: 6, fontWeight: 500 },
  label: { display: 'block', textAlign: 'left', fontSize: 12, fontWeight: 700,
    color: '#212427', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 16 },
  input: {
    width: '100%', border: '1.5px solid #DCD5CE', borderRadius: 12,
    padding: '11px 14px', fontSize: 15, outline: 'none', background: '#FAFAF9',
    color: '#212427', transition: 'border-color 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  error: {
    background: '#FEF2F2', color: '#DC2626', borderRadius: 10, padding: '8px 12px',
    fontSize: 13, fontWeight: 600, marginTop: 12, textAlign: 'left',
  },
  btn: {
    marginTop: 20, width: '100%', background: '#96F878',
    color: '#212427', border: 'none', borderRadius: 15, padding: '14px',
    fontFamily: "'Fredoka', cursive", fontWeight: 500, fontSize: 18, cursor: 'pointer',
    transition: 'background 0.15s',
  },
  divider: {
    display: 'flex', alignItems: 'center', margin: '24px 0 16px',
    color: '#B4B2A9', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
    borderTop: '1px solid #DCD5CE', position: 'relative', textAlign: 'center',
  },
  quickBtn: {
    flex: 1, background: '#E3FDDB', color: '#212427', border: '1.5px solid #A8F0B8',
    borderRadius: 10, padding: '9px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
