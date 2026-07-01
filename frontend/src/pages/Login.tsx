import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 no-underline transition-colors">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[20px] border border-border p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-text-primary tracking-tight">BarterX</span>
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-text-secondary mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-11 px-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none
                  focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-4 pr-11 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none
                    focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold no-underline hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
