import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-sand-400 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Editorial Decorative Arches / Shapes */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-sand-200/40 rounded-full blur-2xl -z-10"></div>
      <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-wine-200/20 rounded-full blur-3xl -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-wine-900 border-2 border-sand-200 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-sand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-4xl font-normal text-wine-900 font-serif-aesthetic tracking-wide">
          Welcome back to <span className="italic font-semibold">BarterX</span>
        </h2>
        <p className="mt-2 text-center text-sm text-sand-500 font-medium">
          Enter your credentials to enter the gallery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-wine-900 border-2 border-sand-300/10 shadow-2xl rounded-[32px] py-10 px-6 sm:px-10 text-sand-100 relative">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-sand-100/10 border border-wine-200/30 text-wine-100 px-4 py-3 rounded-2xl text-xs font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-300 text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-300 text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-sand-100 hover:bg-sand-200 text-wine-900 font-bold text-sm tracking-wider hover:scale-[1.01] transition-all duration-200 shadow-md uppercase"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sand-400/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-wine-900 text-sand-300 font-medium">New to BarterX?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/signup"
                className="w-full flex justify-center py-3.5 px-4 border-2 border-sand-200/20 hover:border-sand-200/50 rounded-2xl text-xs font-bold text-sand-100 uppercase tracking-wider transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
