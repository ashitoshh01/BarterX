import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, AtSign, CheckCircle2, AlertCircle, KeyRound, ArrowLeft, RotateCcw } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { LogoWordmark } from "@/components/Logo";
import { NbButton } from "@/components/UI";
import { useApp, parseBackendError } from "@/context/AppContext";
import api from "@/lib/api";
import { toast } from "sonner";

const rawClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_ID = rawClientId.replace(/["']/g, "").trim();
const isPlaceholder = (id) => {
  const lower = id.toLowerCase();
  return (
    lower.includes("your-google-client-id") ||
    lower.includes("your_google_client_id") ||
    lower.includes("your-client-id") ||
    lower.includes("your_client_id")
  );
};
const isGoogleAuthEnabled = Boolean(GOOGLE_CLIENT_ID && !isPlaceholder(GOOGLE_CLIENT_ID));

// ─── Input Field Component ─────────────────────────────────────────────────
const AuthInput = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">
      {label}
    </label>
    <div className={`flex items-center nb-input gap-3 p-0 overflow-hidden transition-all ${error ? "border-red-500/60" : ""}`}>
      <span className="flex items-center justify-center w-11 h-full shrink-0 border-r border-white/8 text-[var(--text-3)]">
        <Icon size={15} strokeWidth={2} />
      </span>
      <input
        className="flex-1 bg-transparent outline-none py-[0.9rem] pr-4 text-[var(--text)] placeholder:text-[var(--text-3)] font-medium"
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
const Auth = () => {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  
  // OTP Verification state
  const [signupStep, setSignupStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── helpers ──────────────────────────────────────────────────────────────
  const afterAuth = (token, refresh) => {
    localStorage.setItem("barter_token", token);
    localStorage.setItem("barter_refresh_token", refresh);
  };

  const setError = (field, msg) => setErrors(prev => ({ ...prev, [field]: msg }));
  const clearErrors = () => setErrors({});

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!loginForm.identifier) { setError("identifier", "Email or username required"); return; }
    if (!loginForm.password) { setError("password", "Password required"); return; }

    setLoading(true);
    const result = await login(loginForm.identifier, loginForm.password);
    setLoading(false);

    if (result.success) {
      toast.success("Welcome back! 🎉");
      nav("/app/feed");
    } else {
      toast.error(result.error || "Login failed");
      setError("password", result.error || "Invalid credentials");
    }
  };

  // ── Signup Step 1: Send OTP ────────────────────────────────────────────────
  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    clearErrors();

    let hasError = false;
    if (!signupForm.name.trim()) { setError("name", "Full name is required"); hasError = true; }
    if (!signupForm.username.trim()) { setError("username", "Username is required"); hasError = true; }
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(signupForm.username)) {
      setError("username", "3–30 chars: letters, numbers, underscores"); hasError = true;
    }
    if (!signupForm.email.includes("@")) { setError("email", "Valid email required"); hasError = true; }
    if (signupForm.password.length < 8) { setError("password", "At least 8 characters"); hasError = true; }
    if (signupForm.password !== signupForm.confirm) { setError("confirm", "Passwords don't match"); hasError = true; }
    if (hasError) return;

    setLoading(true);
    try {
      const res = await api.post("/register/send-otp/", {
        name: signupForm.name.trim(),
        username: signupForm.username.trim().toLowerCase(),
        email: signupForm.email.trim().toLowerCase(),
      });

      if (res.data?.dev_otp) {
        toast.success(`Verification Code: ${res.data.dev_otp} 🔑`);
        setOtp(res.data.dev_otp);
      } else {
        toast.success(`Verification code sent to ${signupForm.email} 📧`);
      }
      setSignupStep("otp");
      setResendCooldown(60);
    } catch (err) {
      const data = err.response?.data || {};
      if (data.username) setError("username", Array.isArray(data.username) ? data.username[0] : data.username);
      if (data.email) setError("email", Array.isArray(data.email) ? data.email[0] : data.email);
      if (data.password) setError("password", Array.isArray(data.password) ? data.password[0] : data.password);
      if (data.name) setError("name", Array.isArray(data.name) ? data.name[0] : data.name);
      if (data.detail) toast.error(data.detail);
      if (!Object.keys(data).length) toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup Step 2: Verify OTP & Register ───────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    clearErrors();

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("otp", "Enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/register/verify-otp/", {
        name: signupForm.name.trim(),
        username: signupForm.username.trim().toLowerCase(),
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password,
        otp: otp.trim(),
      });

      afterAuth(res.data.access, res.data.refresh);
      const result = await login(signupForm.username.trim().toLowerCase(), signupForm.password);
      if (result.success) {
        toast.success("Email verified! Welcome to Baarter 🎊");
        nav("/app/feed");
      }
    } catch (err) {
      const data = err.response?.data || {};
      if (data.otp) setError("otp", Array.isArray(data.otp) ? data.otp[0] : data.otp);
      else if (data.email) setError("otp", Array.isArray(data.email) ? data.email[0] : data.email);
      else toast.error("Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    try {
      const res = await api.post("/auth/google/", {
        credential: credentialResponse.credential,
      });
      afterAuth(res.data.access, res.data.refresh);
      localStorage.setItem("barter_token", res.data.access);
      localStorage.setItem("barter_refresh_token", res.data.refresh);

      const result = await login("__google__", "__google__", res.data.access);
      if (result?.success !== false) {
        toast.success(res.data.created ? "Welcome to Baarter! 🎊" : "Welcome back! 🎉");
        nav("/app/feed");
      }
    } catch (err) {
      const msg = parseBackendError(err, "Google sign-in failed. Try again.");
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in was cancelled or failed.");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "disabled-google-client-id"}>
      <div className="min-h-screen grid md:grid-cols-2 relative overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* Left decorative panel */}
        <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden border-r border-white/5">
          <div className="aurora" style={{ opacity: 0.5 }} />
          <div className="grid-bg absolute inset-0" />
          <Link to="/" className="relative z-10"><LogoWordmark size="text-lg" /></Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h1 className="font-display text-6xl lg:text-7xl leading-[0.9] text-white">
              Trade<br />like it's<br />
              <span className="font-serif-i italic text-[var(--lime)]">1892.</span>
            </h1>
            <p className="mt-5 max-w-md text-[var(--text-2)] text-lg">
              Money-free marketplace. Real people. Real swaps. Gamified for you.
            </p>
          </motion.div>
          <div className="relative z-10 flex gap-2 flex-wrap">
            <span className="nb-tag tint-lime">◆ SKATE</span>
            <span className="nb-tag tint-amber">◆ CAMERAS</span>
            <span className="nb-tag tint-mint">◆ PLANTS</span>
            <span className="nb-tag tint-purple">◆ ART</span>
            <span className="nb-tag tint-blue">◆ CODE</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-6 md:p-10 relative overflow-y-auto">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="w-full max-w-md relative py-8">
            <div className="md:hidden mb-10"><Link to="/"><LogoWordmark /></Link></div>

            {/* Tab switcher */}
            <div className="backdrop-blur bg-white/[0.03] border border-white/8 rounded-full p-1 flex mb-8 w-fit">
              {["signup", "login"].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setSignupStep("form"); clearErrors(); }}
                  className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${mode === tab ? "bg-[var(--lime)] text-black" : "text-[var(--text-2)] hover:text-white"}`}
                  data-testid={`auth-tab-${tab}`}
                >
                  {tab === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-[var(--lime)]" />
                {mode === "login" ? "WELCOME BACK" : signupStep === "otp" ? "VERIFY EMAIL" : "NEW HERE"}
              </div>
              <h2 className="font-display text-5xl md:text-6xl text-white leading-[0.95]">
                {mode === "login" ? (
                  <>Log <span className="font-serif-i italic">back</span> in.</>
                ) : signupStep === "otp" ? (
                  <>Check <span className="font-serif-i italic text-[var(--lime)]">your</span> inbox.</>
                ) : (
                  <><span className="font-serif-i italic text-[var(--lime)]">Join</span> the swap.</>
                )}
              </h2>
            </div>

            {/* Google Sign-In (only shown during login or step 1 signup) */}
            {mode === "login" || signupStep === "form" ? (
              <>
                <div className="mb-6">
                  {isGoogleAuthEnabled ? (
                    <div className="w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="100%"
                        text={mode === "signup" ? "signup_with" : "signin_with"}
                      />
                    </div>
                  ) : (
                    <button
                      className="w-full nb-btn bg-white/5 border border-white/10 hover:bg-white/10 py-3 rounded-full text-sm font-medium text-white flex items-center justify-center gap-3 transition-all"
                      onClick={() => toast.info("Add your REACT_APP_GOOGLE_CLIENT_ID in frontend/.env to enable Google Sign-In")}
                      type="button"
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107"/>
                        <path d="M6.3 14.7l7 5.1C15.2 16.5 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.4 0-13.8 4-17.7 10z" fill="#FF3D00"/>
                        <path d="M24 45c5.5 0 10.5-2 14.3-5.2l-6.6-5.4C29.7 36.1 27 37 24 37c-6 0-11-4.1-12.8-9.6l-7 5.4C8.1 40.7 15.5 45 24 45z" fill="#4CAF50"/>
                        <path d="M44.5 20H24v8.5h11.8c-.8 2.5-2.4 4.7-4.5 6.2l6.6 5.4C41.5 37 45 31 45 24c0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </>
            ) : null}

            {/* Forms */}
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                  data-testid="auth-form"
                >
                  <AuthInput
                    label="Email or Username"
                    icon={AtSign}
                    type="text"
                    value={loginForm.identifier}
                    onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    placeholder="you@example.com or your_username"
                    autoComplete="username"
                    error={errors.identifier}
                    data-testid="auth-email"
                  />
                  <div>
                    <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Password</label>
                    <div className={`flex items-center nb-input gap-3 p-0 overflow-hidden ${errors.password ? "border-red-500/60" : ""}`}>
                      <span className="flex items-center justify-center w-11 h-full shrink-0 border-r border-white/8 text-[var(--text-3)]">
                        <Lock size={15} strokeWidth={2} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="flex-1 bg-transparent outline-none py-[0.9rem] text-[var(--text)] placeholder:text-[var(--text-3)] font-medium"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        data-testid="auth-password"
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="pr-4 text-[var(--text-3)] hover:text-white">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>}
                  </div>

                  <NbButton type="submit" disabled={loading} className="w-full py-4 text-base" data-testid="auth-submit">
                    {loading ? "Signing in..." : "Log in"} <ArrowRight size={18} strokeWidth={2.5} />
                  </NbButton>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("barter_token", "demo-token");
                        toast.success("Welcome to Demo Mode! 🎉");
                        window.location.href = "/app/feed";
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[var(--yellow)] text-black font-bold text-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      ⚡ Quick Demo Mode (Explore All Products)
                    </button>
                  </div>
                </motion.form>
              ) : signupStep === "form" ? (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRequestOTP}
                  className="space-y-4"
                  data-testid="auth-form"
                >
                  <AuthInput
                    label="Full Name"
                    icon={User}
                    type="text"
                    value={signupForm.name}
                    onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="Your full name"
                    autoComplete="name"
                    error={errors.name}
                    data-testid="auth-name"
                  />
                  <AuthInput
                    label="Username"
                    icon={AtSign}
                    type="text"
                    value={signupForm.username}
                    onChange={e => setSignupForm({ ...signupForm, username: e.target.value.replace(/\s/g, "_") })}
                    placeholder="your_username"
                    autoComplete="username"
                    error={errors.username}
                    data-testid="auth-username"
                  />
                  <AuthInput
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email}
                    data-testid="auth-email"
                  />
                  <div>
                    <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Password</label>
                    <div className={`flex items-center nb-input gap-3 p-0 overflow-hidden ${errors.password ? "border-red-500/60" : ""}`}>
                      <span className="flex items-center justify-center w-11 h-full shrink-0 border-r border-white/8 text-[var(--text-3)]">
                        <Lock size={15} strokeWidth={2} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signupForm.password}
                        onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                        className="flex-1 bg-transparent outline-none py-[0.9rem] text-[var(--text)] placeholder:text-[var(--text-3)] font-medium"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        data-testid="auth-password"
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="pr-4 text-[var(--text-3)] hover:text-white">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Confirm Password</label>
                    <div className={`flex items-center nb-input gap-3 p-0 overflow-hidden ${errors.confirm ? "border-red-500/60" : signupForm.confirm && signupForm.confirm === signupForm.password ? "border-green-500/40" : ""}`}>
                      <span className="flex items-center justify-center w-11 h-full shrink-0 border-r border-white/8 text-[var(--text-3)]">
                        {signupForm.confirm && signupForm.confirm === signupForm.password
                          ? <CheckCircle2 size={15} className="text-green-400" />
                          : <Lock size={15} strokeWidth={2} />}
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signupForm.confirm}
                        onChange={e => setSignupForm({ ...signupForm, confirm: e.target.value })}
                        className="flex-1 bg-transparent outline-none py-[0.9rem] pr-4 text-[var(--text)] placeholder:text-[var(--text-3)] font-medium"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        data-testid="auth-confirm"
                      />
                    </div>
                    {errors.confirm && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.confirm}</p>}
                  </div>

                  <NbButton type="submit" disabled={loading} className="w-full py-4 text-base" data-testid="auth-submit">
                    {loading ? "Sending OTP..." : "Send Verification Code"} <Mail size={18} strokeWidth={2.5} />
                  </NbButton>
                </motion.form>
              ) : (
                /* Step 2: OTP Verification Screen */
                <motion.form
                  key="signup-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-5"
                  data-testid="auth-otp-form"
                >
                  <div className="backdrop-blur bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">Verification Sent To</p>
                      <p className="text-sm font-bold text-white font-mono2">{signupForm.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSignupStep("form"); setOtp(""); clearErrors(); }}
                      className="text-xs text-[var(--lime)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft size={13} /> Change
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">
                      6-Digit OTP Code
                    </label>
                    <div className={`flex items-center nb-input gap-3 p-0 overflow-hidden ${errors.otp ? "border-red-500/60" : ""}`}>
                      <span className="flex items-center justify-center w-11 h-full shrink-0 border-r border-white/8 text-[var(--text-3)]">
                        <KeyRound size={16} strokeWidth={2} />
                      </span>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 bg-transparent outline-none py-[0.9rem] pr-4 text-white text-xl font-bold font-mono2 tracking-[0.4em] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-[var(--text-3)]"
                        placeholder="123456"
                        autoFocus
                        data-testid="auth-otp-input"
                      />
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.otp}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
                    <span>Code expires in 5 minutes</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={() => handleRequestOTP(null)}
                      className="text-[var(--lime)] hover:underline disabled:opacity-50 flex items-center gap-1 font-medium"
                    >
                      <RotateCcw size={12} /> {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>

                  <NbButton type="submit" disabled={loading} className="w-full py-4 text-base" data-testid="auth-otp-submit">
                    {loading ? "Verifying..." : "Verify Code & Create Account"} <ArrowRight size={18} strokeWidth={2.5} />
                  </NbButton>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-8 text-[10px] font-mono2 uppercase tracking-widest text-center text-[var(--text-3)]">
              By continuing you agree to our <a href="#" className="text-white/80 underline">terms</a> and <a href="#" className="text-white/80 underline">privacy</a>.
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Auth;
