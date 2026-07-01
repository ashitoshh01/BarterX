import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Sparkles } from "lucide-react";
import { LogoWordmark, LogoMark } from "@/components/Logo";
import { NbButton } from "@/components/UI";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const Auth = () => {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { login } = useApp();
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    login();
    toast.success(mode === "signup" ? "Welcome to baarter" : "Welcome back");
    nav(mode === "signup" ? "/onboarding" : "/app/feed");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Left visual */}
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
          <p className="mt-5 max-w-md text-[var(--text-2)] text-lg">Money-free marketplace. Real people. Real swaps. Gamified for you.</p>
        </motion.div>
        <div className="relative z-10 flex gap-2 flex-wrap">
          <span className="nb-tag tint-lime">◆ SKATE</span>
          <span className="nb-tag tint-amber">◆ CAMERAS</span>
          <span className="nb-tag tint-mint">◆ PLANTS</span>
          <span className="nb-tag tint-purple">◆ ART</span>
          <span className="nb-tag tint-blue">◆ CODE</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-10 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="w-full max-w-md relative">
          <div className="md:hidden mb-10"><Link to="/"><LogoWordmark /></Link></div>
          <div className="mb-8">
            <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-[var(--lime)]" />
              {mode === "signup" ? "NEW HERE" : "WELCOME BACK"}
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-white leading-[0.95]">
              {mode === "signup" ? (
                <>Make it <span className="font-serif-i italic text-[var(--lime)]">yours</span>.</>
              ) : (
                <>Log <span className="font-serif-i italic">back</span> in.</>
              )}
            </h2>
          </div>

          <div className="backdrop-blur bg-white/[0.03] border border-white/8 rounded-full p-1 flex mb-8 w-fit">
            <button
              onClick={() => setMode("signup")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${mode === "signup" ? "bg-[var(--lime)] text-black" : "text-[var(--text-2)]"}`}
              data-testid="auth-tab-signup"
            >
              Sign up
            </button>
            <button
              onClick={() => setMode("login")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${mode === "login" ? "bg-[var(--lime)] text-black" : "text-[var(--text-2)]"}`}
              data-testid="auth-tab-login"
            >
              Log in
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Name</label>
                <div className="relative">
                  <User size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="nb-input pl-10"
                    placeholder="Your name"
                    data-testid="auth-name"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Email</label>
              <div className="relative">
                <Mail size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  required type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="nb-input pl-10"
                  placeholder="you@baarter.app"
                  data-testid="auth-email"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-2 block">Password</label>
              <div className="relative">
                <Lock size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  required type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="nb-input pl-10"
                  placeholder="••••••••"
                  data-testid="auth-password"
                />
              </div>
            </div>
            <NbButton type="submit" className="w-full py-4 text-base" data-testid="auth-submit">
              {mode === "signup" ? "Create account" : "Log in"} <ArrowRight size={18} strokeWidth={2.5} />
            </NbButton>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="nb-btn bg-white/5 border border-white/10 hover:bg-white/10 py-3 rounded-full text-xs font-medium text-white" data-testid="auth-google">
              Continue with Google
            </button>
            <button className="nb-btn bg-white/5 border border-white/10 hover:bg-white/10 py-3 rounded-full text-xs font-medium text-white" data-testid="auth-apple">
              Continue with Apple
            </button>
          </div>

          <p className="mt-8 text-[10px] font-mono2 uppercase tracking-widest text-center text-[var(--text-3)]">
            By continuing you agree to our <a href="#" className="text-white/80 underline">terms</a> and <a href="#" className="text-white/80 underline">privacy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
