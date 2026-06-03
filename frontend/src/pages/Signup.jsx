import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const f = { fontFamily: "'Inter',-apple-system,sans-serif" };
const onFocus = e => { e.target.style.borderColor = '#0071e3'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.14)'; };
const onBlur  = e => { e.target.style.borderColor = '#d2d2d7'; e.target.style.backgroundColor = '#f5f5f7'; e.target.style.boxShadow = 'none'; };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid #d2d2d7', backgroundColor: '#f5f5f7', fontSize: 14, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 };
const errStyle = { fontSize: 11, color: '#cc0000', marginTop: 4, fontWeight: 500 };

const BCAT = ['Marketing & Advertising','Finance & Accounting','Operations & Supply Chain','Human Resources & Recruitment','Legal & Compliance','Sales & Business Development','Technology & IT Services','Agriculture & Farming','Construction & Real Estate','Transport & Logistics','Household & Craftsman Services'];

export default function Signup() {
  const [accountType, setAccountType] = useState('individual');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signup, sendOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(p => p - 1), 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const getPayload = () => ({ account_type: accountType, display_name: displayName, email, password, ...(accountType === 'individual' ? { username } : { business_category: businessCategory }) });

  const handleRequestOTP = async (e) => {
    e.preventDefault(); setErrors({}); setSuccessMessage(''); setLoading(true);
    const t = {};
    if (!displayName.trim()) t.display_name = [accountType === 'individual' ? 'Full name is required.' : 'Business name is required.'];
    if (accountType === 'individual' && !username.trim()) t.username = ['Username is required.'];
    if (accountType === 'business' && !businessCategory) t.business_category = ['Business category is required.'];
    if (!email) t.email = ['Email is required.']; else if (!/\S+@\S+\.\S+/.test(email)) t.email = ['Invalid email address.'];
    if (!password) t.password = ['Password is required.'];
    else if (password.length < 8) t.password = ['Minimum 8 characters.'];
    else if (!/[A-Z]/.test(password)) t.password = ['Needs an uppercase letter.'];
    else if (!/[a-z]/.test(password)) t.password = ['Needs a lowercase letter.'];
    else if (!/\d/.test(password)) t.password = ['Needs a digit.'];
    if (Object.keys(t).length > 0) { setErrors(t); setLoading(false); return; }
    const result = await sendOTP(getPayload()); setLoading(false);
    if (result.success) { setStep('otp'); setTimer(30); setResendDisabled(true); setSuccessMessage('A 6-digit code has been sent to your email.'); }
    else setErrors(result.error);
  };

  const handleResendOTP = async () => {
    setErrors({}); setSuccessMessage(''); setLoading(true);
    const result = await sendOTP(getPayload()); setLoading(false);
    if (result.success) { setTimer(30); setResendDisabled(true); setSuccessMessage('New code sent to your email.'); }
    else setErrors(result.error);
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault(); setErrors({}); setLoading(true);
    if (!otp.trim() || otp.length !== 6) { setErrors({ otp: ['Enter the complete 6-digit code.'] }); setLoading(false); return; }
    const result = await signup({ ...getPayload(), otp }); setLoading(false);
    if (result.success) navigate('/login');
    else setErrors(result.error);
  };

  const Spinner = () => (
    <svg style={{ animation: 'spin 0.8s linear infinite', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
      <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, ...f, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,113,227,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(0,113,227,0.05)', pointerEvents: 'none' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: '36px 36px 0', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#0071e3,#0055b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 14px rgba(0,113,227,0.3)' }}>
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Join BarterX</h1>
          <p style={{ fontSize: 13.5, color: '#6e6e73', margin: '0 0 24px' }}>Create your account and start swapping</p>
        </div>

        <div style={{ padding: '0 36px 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Account type toggle */}
          <div style={{ display: 'flex', gap: 6, backgroundColor: '#f5f5f7', borderRadius: 10, padding: 4, border: '1.5px solid #e8e8ed' }}>
            {['individual', 'business'].map(t => (
              <button key={t} type="button" disabled={step === 'otp'}
                onClick={() => { setAccountType(t); setErrors({}); }}
                style={{ flex: 1, height: 36, borderRadius: 7, border: 'none', cursor: step === 'otp' ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.18s', backgroundColor: accountType === t ? '#fff' : 'transparent', color: accountType === t ? '#1d1d1f' : '#6e6e73', boxShadow: accountType === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {step === 'form' ? (
            <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Full Name / Business Name */}
              <div>
                <label style={labelStyle}>{accountType === 'individual' ? 'Full Name' : 'Business Name'}</label>
                <input type="text" required placeholder={accountType === 'individual' ? 'e.g. John Doe' : 'e.g. ABC Electronics'} value={displayName} onChange={e => setDisplayName(e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.display_name ? '#cc0000' : '#d2d2d7' }} onFocus={onFocus} onBlur={onBlur} />
                {errors.display_name && <p style={errStyle}>{Array.isArray(errors.display_name) ? errors.display_name[0] : errors.display_name}</p>}
              </div>

              {accountType === 'individual' && (
                <div>
                  <label style={labelStyle}>Username</label>
                  <input type="text" required placeholder="Choose a unique username" value={username} onChange={e => setUsername(e.target.value)}
                    style={{ ...inputStyle, borderColor: errors.username ? '#cc0000' : '#d2d2d7' }} onFocus={onFocus} onBlur={onBlur} />
                  {errors.username && <p style={errStyle}>{Array.isArray(errors.username) ? errors.username[0] : errors.username}</p>}
                </div>
              )}

              {accountType === 'business' && (
                <div>
                  <label style={labelStyle}>Business Category</label>
                  <select required value={businessCategory} onChange={e => setBusinessCategory(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.business_category ? '#cc0000' : '#d2d2d7' }}>
                    <option value="" disabled>Select category</option>
                    {BCAT.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.business_category && <p style={errStyle}>{Array.isArray(errors.business_category) ? errors.business_category[0] : errors.business_category}</p>}
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.email ? '#cc0000' : '#d2d2d7' }} onFocus={onFocus} onBlur={onBlur} />
                {errors.email && <p style={errStyle}>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" required placeholder="Min. 8 characters with uppercase & digit" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.password ? '#cc0000' : '#d2d2d7' }} onFocus={onFocus} onBlur={onBlur} />
                {errors.password && <p style={errStyle}>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', height: 46, borderRadius: 10, background: loading ? '#86868b' : '#0071e3', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><Spinner /> Sending Code...</> : 'Get Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {successMessage && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 500 }}>{successMessage}</div>
              )}
              {errors.detail && (
                <div style={{ backgroundColor: '#fff2f2', border: '1.5px solid #ffd2d2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#cc0000', fontWeight: 500 }}>{errors.detail}</div>
              )}

              <div>
                <label style={labelStyle}>Enter 6-Digit Code</label>
                <input type="text" required maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.5em', fontSize: 22, fontWeight: 700, borderColor: errors.otp ? '#cc0000' : '#d2d2d7', height: 56 }} onFocus={onFocus} onBlur={onBlur} />
                {errors.otp && <p style={errStyle}>{Array.isArray(errors.otp) ? errors.otp[0] : errors.otp}</p>}
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', height: 46, borderRadius: 10, background: loading ? '#86868b' : '#0071e3', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><Spinner /> Creating Account...</> : 'Verify & Create Account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => { setStep('form'); setErrors({}); setSuccessMessage(''); }}
                  style={{ fontSize: 13, fontWeight: 500, color: '#0071e3', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Edit info
                </button>
                <button type="button" disabled={resendDisabled || loading} onClick={handleResendOTP}
                  style={{ fontSize: 12, fontWeight: 600, color: resendDisabled ? '#86868b' : '#0071e3', background: 'none', border: 'none', cursor: resendDisabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e8e8ed' }} />
            <span style={{ fontSize: 12, color: '#86868b', fontWeight: 500 }}>Already have an account?</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e8e8ed' }} />
          </div>
          <Link to="/login" style={{ width: '100%', height: 44, borderRadius: 10, background: '#fff', color: '#1d1d1f', border: '1.5px solid #d2d2d7', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
