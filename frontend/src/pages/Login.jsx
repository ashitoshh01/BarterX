import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter',-apple-system,sans-serif", position: 'relative', overflow: 'hidden' },
  blob1: { position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,113,227,0.07)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: -100, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(0,113,227,0.05)', pointerEvents: 'none' },
  card: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardTop: { padding: '36px 36px 0', textAlign: 'center' },
  iconWrap: { width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#0071e3,#0055b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 14px rgba(0,113,227,0.3)' },
  title: { fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: '0 0 6px', letterSpacing: '-0.02em' },
  subtitle: { fontSize: 13.5, color: '#6e6e73', margin: '0 0 28px' },
  form: { padding: '0 36px 36px', display: 'flex', flexDirection: 'column', gap: 15 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 },
  input: { width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid #d2d2d7', backgroundColor: '#f5f5f7', fontSize: 14, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', height: 46, borderRadius: 10, background: '#0071e3', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' },
  divLine: { flex: 1, height: 1, backgroundColor: '#e8e8ed' },
  divText: { fontSize: 12, color: '#86868b', fontWeight: 500 },
  outlineBtn: { width: '100%', height: 44, borderRadius: 10, background: '#fff', color: '#1d1d1f', border: '1.5px solid #d2d2d7', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s' },
  error: { backgroundColor: '#fff2f2', border: '1.5px solid #ffd2d2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#cc0000', fontWeight: 500 },
};
const onFocus = e => { e.target.style.borderColor = '#0071e3'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.14)'; };
const onBlur = e => { e.target.style.borderColor = '#d2d2d7'; e.target.style.backgroundColor = '#f5f5f7'; e.target.style.boxShadow = 'none'; };

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.card}>
        <div style={S.cardTop}>
          <div style={S.iconWrap}>
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h1 style={S.title}>Welcome back</h1>
          <p style={S.subtitle}>Sign in to your BarterX account</p>
        </div>

        <form style={S.form} onSubmit={handleSubmit}>
          {error && <div style={S.error}>{error}</div>}

          <div>
            <label style={S.label}>Username</label>
            <input type="text" required placeholder="Enter your username" value={username}
              onChange={e => setUsername(e.target.value)} style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label style={S.label}>Password</label>
            <input type="password" required placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <button type="submit" style={S.primaryBtn}
            onMouseEnter={e => e.currentTarget.style.background = '#0064d0'}
            onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}>
            Sign In
          </button>

          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divText}>New to BarterX?</span>
            <div style={S.divLine} />
          </div>

          <Link to="/signup" style={S.outlineBtn}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            Create an Account
          </Link>
        </form>
      </div>
    </div>
  );
}
