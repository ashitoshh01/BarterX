import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    account_type: 'individual',
    business_category: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOTP, signup } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await sendOTP({
      email: formData.email,
      username: formData.username,
      account_type: formData.account_type,
    });
    setLoading(false);
    if (result.success) {
      setStep('otp');
    } else {
      const err = result.error;
      if (typeof err === 'object') {
        setError(Object.values(err).flat().join(' '));
      } else {
        setError(String(err));
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signup({ ...formData, otp });
    setLoading(false);
    if (result.success) {
      navigate('/login');
    } else {
      const err = result.error;
      if (typeof err === 'object') {
        setError(Object.values(err).flat().join(' '));
      } else {
        setError(String(err));
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 no-underline transition-colors">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="bg-white rounded-[20px] border border-border p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-text-primary tracking-tight">BarterX</span>
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-1">Create your account</h1>
          <p className="text-sm text-text-secondary mb-6">Join the barter community today</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  className="w-full h-11 px-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Choose a username"
                  required
                  className="w-full h-11 px-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="w-full h-11 px-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                    required
                    className="w-full h-11 px-4 pr-11 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="h-11 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary">We sent a verification code to <strong>{formData.email}</strong></p>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full h-11 px-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-center tracking-[0.3em] text-lg font-bold"
                />
              </div>
              <button type="submit" disabled={loading} className="h-11 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setStep('form')} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                ← Back to form
              </button>
            </form>
          )}

          <p className="text-sm text-text-secondary text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold no-underline hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
