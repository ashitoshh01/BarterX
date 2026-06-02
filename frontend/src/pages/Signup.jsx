import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [accountType, setAccountType] = useState('individual');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // OTP Verification States
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signup, sendOTP } = useAuth();
  const navigate = useNavigate();

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    // Frontend validation
    const tempErrors = {};
    
    if (!displayName.trim()) {
      tempErrors.display_name = [
        accountType === 'individual' ? 'Full name is required.' : 'Business name is required.'
      ];
    }
    
    if (accountType === 'individual') {
      if (!username.trim()) {
        tempErrors.username = ['Username is required.'];
      }
    } else {
      if (!businessCategory) {
        tempErrors.business_category = ['Business category is required.'];
      }
    }
    
    if (!email) {
      tempErrors.email = ['Email is required.'];
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = ['Please enter a valid email address.'];
    }
    
    if (!password) {
      tempErrors.password = ['Password is required.'];
    } else {
      if (password.length < 8) {
        tempErrors.password = ['Password must be at least 8 characters.'];
      } else if (!/[A-Z]/.test(password)) {
        tempErrors.password = ['Password must contain at least 1 uppercase letter.'];
      } else if (!/[a-z]/.test(password)) {
        tempErrors.password = ['Password must contain at least 1 lowercase letter.'];
      } else if (!/\d/.test(password)) {
        tempErrors.password = ['Password must contain at least 1 numeric digit.'];
      }
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      setLoading(false);
      return;
    }

    const payload = {
      account_type: accountType,
      display_name: displayName,
      email,
      password,
      ...(accountType === 'individual' ? { username } : { business_category: businessCategory })
    };

    const result = await sendOTP(payload);
    setLoading(false);
    if (result.success) {
      setStep('otp');
      setTimer(30);
      setResendDisabled(true);
      setSuccessMessage('A 6-digit verification code has been sent to your email.');
    } else {
      setErrors(result.error);
    }
  };

  const handleResendOTP = async () => {
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    const payload = {
      account_type: accountType,
      display_name: displayName,
      email,
      password,
      ...(accountType === 'individual' ? { username } : { business_category: businessCategory })
    };

    const result = await sendOTP(payload);
    setLoading(false);
    if (result.success) {
      setTimer(30);
      setResendDisabled(true);
      setSuccessMessage('A new verification code has been sent to your email.');
    } else {
      setErrors(result.error);
    }
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: ['Please enter a complete 6-digit verification code.'] });
      setLoading(false);
      return;
    }

    const signupData = {
      account_type: accountType,
      display_name: displayName,
      email,
      password,
      otp,
      ...(accountType === 'individual'
        ? { username }
        : { business_category: businessCategory }
      )
    };

    const result = await signup(signupData);
    setLoading(false);
    if (result.success) {
      navigate('/login');
    } else {
      setErrors(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-sand-400 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Rings */}
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
          Join <span className="italic font-semibold">BarterX</span>
        </h2>
        <p className="mt-2 text-center text-sm text-sand-500 font-medium">
          Create your account and start swapping today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-wine-900 border-2 border-sand-300/10 shadow-2xl rounded-[32px] py-10 px-6 sm:px-10 text-sand-100 relative">
          
          {/* Account Type Selection (Only editable in first step) */}
          <div className="flex gap-4 p-1.5 rounded-2xl bg-sand-100/10 border border-sand-400/20 mb-6">
            <button
              type="button"
              disabled={step === 'otp'}
              onClick={() => {
                setAccountType('individual');
                setErrors({});
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-75 ${
                accountType === 'individual'
                  ? 'bg-sand-100 text-wine-900 shadow-md'
                  : 'text-sand-300 hover:text-sand-100 hover:bg-white/5'
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              disabled={step === 'otp'}
              onClick={() => {
                setAccountType('business');
                setErrors({});
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-75 ${
                accountType === 'business'
                  ? 'bg-sand-100 text-wine-900 shadow-md'
                  : 'text-sand-300 hover:text-sand-100 hover:bg-white/5'
              }`}
            >
              Business
            </button>
          </div>

          {step === 'form' ? (
            <form className="space-y-5" onSubmit={handleRequestOTP}>
              <div>
                <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                  {accountType === 'individual' ? 'Full Name' : 'Business Name'}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.display_name ? 'border-red-500' : 'border-sand-300'} text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors`}
                  placeholder={accountType === 'individual' ? 'e.g. John Doe' : 'e.g. ABC Electronics'}
                />
                {errors.display_name && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {Array.isArray(errors.display_name) ? errors.display_name[0] : errors.display_name}
                  </p>
                )}
              </div>

              {accountType === 'individual' && (
                <div>
                  <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.username ? 'border-red-500' : 'border-sand-300'} text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors`}
                    placeholder="Choose a unique username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-[10px] text-red-300">
                      {Array.isArray(errors.username) ? errors.username[0] : errors.username}
                    </p>
                  )}
                </div>
              )}

              {accountType === 'business' && (
                <div>
                  <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                    Business Category
                  </label>
                  <select
                    required
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.business_category ? 'border-red-500' : 'border-sand-300'} text-wine-950 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors cursor-pointer`}
                  >
                    <option value="" disabled>Select business category</option>
                    <option value="Marketing & Advertising">Marketing & Advertising</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Operations & Supply Chain">Operations & Supply Chain</option>
                    <option value="Human Resources & Recruitment">Human Resources & Recruitment</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Sales & Business Development">Sales & Business Development</option>
                    <option value="Technology & IT Services">Technology & IT Services</option>
                    <option value="Agriculture & Farming">Agriculture & Farming</option>
                    <option value="Construction & Real Estate">Construction & Real Estate</option>
                    <option value="Transport & Logistics">Transport & Logistics</option>
                    <option value="Household & Craftsman Services">Household & Craftsman Services</option>
                  </select>
                  {errors.business_category && (
                    <p className="mt-1 text-[10px] text-red-300">
                      {Array.isArray(errors.business_category) ? errors.business_category[0] : errors.business_category}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.email ? 'border-red-500' : 'border-sand-300'} text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                  </p>
                )}
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
                  className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.password ? 'border-red-500' : 'border-sand-300'} text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm transition-colors`}
                  placeholder="Min. 8 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-sand-100 hover:bg-sand-200 text-wine-900 font-bold text-sm tracking-wider hover:scale-[1.01] transition-all duration-200 shadow-md uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-wine-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </>
                  ) : 'Get Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmitSignup}>
              {successMessage && (
                <div className="bg-sand-100/10 border border-green-500/30 text-green-300 px-4 py-3 bg-green-950/20 rounded-2xl text-xs font-medium">
                  {successMessage}
                </div>
              )}
              {errors.detail && (
                <div className="bg-sand-100/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-xs font-medium">
                  {errors.detail}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-sand-200 uppercase tracking-widest mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 rounded-2xl bg-sand-50 border ${errors.otp ? 'border-red-500' : 'border-sand-300'} text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-200 focus:ring-1 focus:ring-wine-200 text-sm tracking-[0.5em] text-center font-bold transition-colors`}
                  placeholder="000000"
                />
                {errors.otp && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {Array.isArray(errors.otp) ? errors.otp[0] : errors.otp}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-sand-100 hover:bg-sand-200 text-wine-900 font-bold text-sm tracking-wider hover:scale-[1.01] transition-all duration-200 shadow-md uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-wine-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : 'Verify & Create Account'}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setErrors({});
                      setSuccessMessage('');
                    }}
                    className="text-sand-300 hover:text-sand-100 transition-colors font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to edit info
                  </button>

                  <button
                    type="button"
                    disabled={resendDisabled || loading}
                    onClick={handleResendOTP}
                    className="text-sand-300 hover:text-sand-100 disabled:text-sand-500/50 transition-colors font-bold uppercase tracking-wider text-[10px]"
                  >
                    {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sand-400/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-wine-900 text-sand-300 font-medium">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3.5 px-4 border-2 border-sand-200/20 hover:border-sand-200/50 rounded-2xl text-xs font-bold text-sand-100 uppercase tracking-wider transition-colors"
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
