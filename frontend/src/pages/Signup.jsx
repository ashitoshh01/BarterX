import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const result = await signup(username, email, password);
    if (result.success) {
      navigate('/login');
    } else {
      setErrors(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <svg className="w-8 h-8 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Join <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">BarterX</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Create your account and start swapping today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-md py-8 px-4 border border-slate-800 shadow-2xl sm:rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-slate-950 border ${errors.username ? 'border-red-500' : 'border-slate-800'} text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors`}
                placeholder="Choose a unique username"
              />
              {errors.username && <p className="mt-1 text-[10px] text-red-500">{errors.username[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-slate-950 border ${errors.email ? 'border-red-500' : 'border-slate-800'} text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-slate-950 border ${errors.password ? 'border-red-500' : 'border-slate-800'} text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors`}
                placeholder="Min. 8 characters"
              />
              {errors.password && <p className="mt-1 text-[10px] text-red-500">{errors.password[0]}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-teal-500/20 uppercase tracking-wider"
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
