import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, Shield, Coins, Repeat, MessageCircle, Zap, Star, Flame, Trophy, ChevronDown } from "lucide-react";
import { LogoWordmark, LogoMark } from "@/components/Logo";
import Marquee from "@/components/Marquee";
import { NbButton, XPBar, LevelBadge } from "@/components/UI";
import { LISTINGS, USERS } from "@/mock/data";

/* --- Live cursor spotlight --- */
const CursorSpotlight = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="spotlight fixed hidden md:block" />;
};

/* --- Floating listing card --- */
const FloatCard = ({ listing, rotate, delay, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, rotate: 0 }}
    animate={{ opacity: 1, y: 0, rotate }}
    transition={{ duration: 0.9, delay, ease: [0.2, 0.9, 0.2, 1] }}
    className={`absolute nb-card overflow-hidden w-56 ${className}`}
  >
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, delay: delay + 0.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <img src={listing.images[0]} alt={listing.title} className="w-full h-40 object-cover" />
      <div className="p-3">
        <div className="text-[10px] font-mono2 uppercase text-[var(--text-3)] mb-1">{listing.condition}</div>
        <div className="font-display text-sm text-white leading-tight line-clamp-1">{listing.title}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-mono2 text-[var(--lime)]">~${listing.estValue}</span>
          <span className="text-[10px] font-mono2 text-[var(--text-3)]">◈ SWAP</span>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const Landing = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "var(--bg)" }}>
      <CursorSpotlight />

      {/* Nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl" data-testid="landing-header">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/8 rounded-full pl-4 pr-2 py-2 flex items-center justify-between">
          <Link to="/" data-testid="landing-logo"><LogoWordmark size="text-lg" /></Link>
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-[var(--text-2)]">
            <a href="#how" className="px-3 py-1.5 hover:text-white rounded-full transition">How it works</a>
            <a href="#features" className="px-3 py-1.5 hover:text-white rounded-full transition">Features</a>
            <a href="#levels" className="px-3 py-1.5 hover:text-white rounded-full transition">Levels</a>
            <a href="#faq" className="px-3 py-1.5 hover:text-white rounded-full transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:block text-sm font-medium text-[var(--text-2)] hover:text-white px-3" data-testid="landing-login">Sign in</Link>
            <Link to="/auth" data-testid="landing-signup">
              <NbButton variant="primary" className="text-xs px-4 py-2">Start Trading <ArrowUpRight size={14} strokeWidth={2.5} /></NbButton>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────── HERO ─────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden pt-24">
        <div className="aurora" />
        <div className="grid-bg absolute inset-0" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto px-4 md:px-6 relative w-full">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 backdrop-blur-md bg-white/5 border border-white/10 pl-1 pr-4 py-1 rounded-full text-[11px] font-mono2 uppercase tracking-widest mb-8"
                data-testid="hero-badge"
              >
                <span className="tint-lime px-2 py-0.5 rounded-full text-[10px] font-bold">v2</span>
                <span className="text-[var(--text-2)]">The money-free marketplace · Now live</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.9, 0.2, 1] }}
                className="font-display text-[15vw] md:text-[8rem] lg:text-[9.5rem] leading-[0.85] tracking-[-0.05em]"
                data-testid="hero-title"
              >
                Trade<br />
                stuff.{" "}
                <span className="font-serif-i text-[var(--lime)] italic">Skip</span><br />
                cash.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 max-w-lg text-lg text-[var(--text-2)] leading-relaxed"
                data-testid="hero-subtitle"
              >
                Baarter is the gamified marketplace where you swap products, skills, and services — no money required. Level up, earn coins, build trust, trade the wildest deals.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link to="/auth" data-testid="hero-cta-primary">
                  <NbButton variant="primary" className="text-base px-6 py-4">
                    Start trading <ArrowRight size={18} strokeWidth={2.5} />
                  </NbButton>
                </Link>
                <Link to="/app/explore" data-testid="hero-cta-secondary">
                  <NbButton variant="ghost" className="text-base px-6 py-4">
                    Peek the feed
                  </NbButton>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-12 flex items-center gap-4"
              >
                <div className="flex -space-x-2">
                  {Object.values(USERS).slice(0, 5).map((u) => (
                    <img key={u.id} src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full border-2 border-[var(--bg)] object-cover" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-[var(--lime)] text-[var(--lime)]" />)}
                    <span className="ml-1 text-sm font-medium">4.9</span>
                  </div>
                  <div className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">12,400+ swappers online</div>
                </div>
              </motion.div>
            </div>

            {/* Visual */}
            <div className="lg:col-span-5 relative h-[560px] hidden lg:block">
              <FloatCard listing={LISTINGS[2]} rotate={5}  delay={0.2} className="top-4  right-4" />
              <FloatCard listing={LISTINGS[1]} rotate={-6} delay={0.4} className="top-44 left-0" />
              <FloatCard listing={LISTINGS[0]} rotate={4}  delay={0.6} className="bottom-4 right-16" />

              {/* Central swap ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: "conic-gradient(from 0deg, var(--lime), var(--pink), var(--blue), var(--lime))", boxShadow: "0 0 80px -10px var(--lime-glow)" }}
              >
                <div className="w-28 h-28 rounded-full bg-[var(--bg)] flex items-center justify-center border border-white/10">
                  <Repeat size={40} strokeWidth={1.5} className="text-[var(--lime)]" />
                </div>
              </motion.div>

              {/* Achievement sticker */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                className="absolute top-8 left-8 tint-lime border rounded-2xl px-3 py-2 backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <Trophy size={14} strokeWidth={2.5} />
                  <div>
                    <div className="text-[9px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">Streak</div>
                    <div className="font-mono2 text-sm font-bold text-white">7 days</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
                className="absolute bottom-16 left-8 nb-card px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <LevelBadge level={4} />
                  <div className="min-w-[100px]">
                    <XPBar value={340} max={500} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2"
          >
            SCROLL <ChevronDown size={14} strokeWidth={2} className="animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Ticker */}
      <Marquee variant="line" speed="slow" items={["◈ SWAP INSTEAD OF PAY", "◈ EARN XP FROM EVERY TRADE", "◈ LEVEL UP YOUR TRUST", "◈ COINS FOR UNEVEN DEALS", "◈ NO MONEY ALLOWED"]} />

      {/* ─────── STATS ─────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: "12.4K", l: "Traders", accent: "var(--lime)" },
            { n: "47K", l: "Swaps closed", accent: "var(--pink)" },
            { n: "$2.1M", l: "Value moved", accent: "var(--blue)" },
            { n: "4.9★", l: "Avg. rating", accent: "var(--purple)" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="nb-card p-8 relative overflow-hidden group"
              data-testid={`stat-${i}`}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition" style={{ background: s.accent }} />
              <div className="font-display text-5xl md:text-6xl text-white relative">{s.n}</div>
              <div className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mt-2 relative">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────── HOW ─────── */}
      <section id="how" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="mb-14 max-w-3xl">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-[var(--lime)]" /> HOW IT WORKS
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Four steps.<br />
            <span className="font-serif-i italic text-[var(--lime)]">Zero</span> dollars.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: "01", t: "List what you have", d: "Snap it, name it, drop it. Products, skills, hours — anything trade-worthy.", icon: "◇" },
            { n: "02", t: "AI matches you", d: "Our engine finds swappers whose wants align with your haves. Instantly.", icon: "✦" },
            { n: "03", t: "Chat & sign", d: "Negotiate in-app. Sign a mini-contract. Lock the deal in seconds.", icon: "⤳" },
            { n: "04", t: "Trade & rate", d: "Ship or meet. Rate your swapper. Earn XP, coins, and trust.", icon: "★" },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="nb-card p-6 relative overflow-hidden group"
              data-testid={`how-step-${i}`}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono2 text-xs text-[var(--text-3)]">{step.n}</span>
                <span className="text-4xl text-[var(--lime)] font-serif-i italic opacity-70 group-hover:opacity-100 transition">{step.icon}</span>
              </div>
              <h3 className="font-display text-2xl leading-tight text-white mb-2">{step.t}</h3>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{step.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────── FEATURES BENTO ─────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="mb-14 max-w-3xl">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-[var(--lime)]" /> FEATURES
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Built for<br />
            <span className="font-serif-i italic">obsessive</span> swappers.
          </h2>
        </div>
        <div className="grid md:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-4 nb-card p-8 relative overflow-hidden min-h-[280px]"
          >
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "var(--lime)" }} />
            <div className="tint-lime inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono2 font-bold mb-4 uppercase tracking-widest">AI Powered</div>
            <h3 className="font-display text-4xl leading-tight mb-3">Match engine that <span className="font-serif-i italic text-[var(--lime)]">actually</span> gets you.</h3>
            <p className="text-sm text-[var(--text-2)] max-w-lg mb-6">Reads your wants + haves and finds 2-way, 3-way, and community swaps in real-time.</p>
            <div className="space-y-2 max-w-md">
              {[
                { s: 96, t: "Your Monstera ↔ Zoe's book", ok: true },
                { s: 88, t: "Your Monstera ↔ Dex's headphones", ok: true },
                { s: 74, t: "Your Monstera ↔ Kai's skateboard", ok: false },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 backdrop-blur bg-white/[0.03] border border-white/5 rounded-full pr-4 pl-1 py-1">
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono2 font-bold ${m.ok ? "tint-lime" : "tint-amber"}`}>{m.s}%</div>
                  <div className="text-xs text-white/90 flex-1">{m.t}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-2 nb-card p-8 relative overflow-hidden"
          >
            <Coins size={28} strokeWidth={1.5} className="text-[var(--lime)] mb-4" />
            <h3 className="font-display text-3xl leading-tight mb-2">Baarter<br />Coins.</h3>
            <p className="text-sm text-[var(--text-2)]">Balance uneven trades. Earn from swaps.</p>
            <div className="mt-6 font-mono2 text-4xl font-bold text-white flex items-baseline gap-1">
              1,240<span className="text-sm text-[var(--text-3)]">◈</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-2 nb-card p-8 relative overflow-hidden"
          >
            <Trophy size={28} strokeWidth={1.5} className="text-[var(--pink)] mb-4" />
            <h3 className="font-display text-3xl leading-tight mb-2">XP,<br />Levels,<br />Streaks.</h3>
            <p className="text-sm text-[var(--text-2)] mb-4">Every swap earns XP. Level up unlocks perks.</p>
            <XPBar value={340} max={500} label="Level 4 · Swapper" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-2 nb-card p-8 relative overflow-hidden"
          >
            <Shield size={28} strokeWidth={1.5} className="text-[var(--blue)] mb-4" />
            <h3 className="font-display text-3xl leading-tight mb-2">Trust<br />score.</h3>
            <p className="text-sm text-[var(--text-2)]">Verified swappers get priority matches.</p>
            <div className="mt-6 font-display text-4xl text-white">92<span className="text-lg text-[var(--text-3)]">/100</span></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-2 nb-card p-8 relative overflow-hidden"
          >
            <MessageCircle size={28} strokeWidth={1.5} className="text-[var(--purple)] mb-4" />
            <h3 className="font-display text-3xl leading-tight mb-2">Chat +<br />contracts.</h3>
            <p className="text-sm text-[var(--text-2)]">Negotiate in-app. Sign to lock. No ghosting.</p>
          </motion.div>
        </div>
      </section>

      <Marquee variant="line" reverse items={["◈ 47K SWAPS DONE", "◈ AVG MATCH TIME: 8 MINUTES", "◈ 4.9 STARS ACROSS 8K RATINGS", "◈ ZERO DOLLARS. INFINITE VIBES."]} />

      {/* ─────── LEVELS (gamified showcase) ─────── */}
      <section id="levels" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="mb-14 max-w-3xl">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-[var(--lime)]" /> RANK UP
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            The more you swap,<br />
            the more you <span className="font-serif-i italic text-[var(--lime)]">unlock</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { l: 1, name: "Rookie", req: "0 swaps", perk: "Basic listings", color: "var(--text-3)" },
            { l: 4, name: "Swapper", req: "10+ swaps", perk: "Priority matches", color: "var(--lime)", active: true },
            { l: 7, name: "Trader", req: "50+ swaps", perk: "Boost 2× cheaper", color: "var(--pink)" },
            { l: 10, name: "Baaron", req: "200+ swaps", perk: "Exclusive events", color: "var(--purple)" },
          ].map((lv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`nb-card p-6 relative ${lv.active ? "border-[var(--lime)]/40" : ""}`}
            >
              {lv.active && <div className="absolute top-3 right-3 tint-lime text-[9px] px-2 py-0.5 rounded-full font-mono2 font-bold">YOU</div>}
              <div className="font-display text-6xl mb-2" style={{ color: lv.color }}>LVL {lv.l}</div>
              <div className="font-display text-xl text-white mb-1">{lv.name}</div>
              <div className="text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-3">{lv.req}</div>
              <div className="text-xs text-[var(--text-2)] border-t border-white/5 pt-3">→ {lv.perk}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────── TESTIMONIALS ─────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="mb-14 max-w-3xl">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-[var(--lime)]" /> COMMUNITY
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Real people.<br />
            <span className="font-serif-i italic">Wild</span> trades.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Got a portrait shoot for teaching Spanish. Best trade I've ever made.", a: "u_zoe", swap: "PHOTO ↔ SPANISH" },
            { t: "Traded my old Canon for a rooted Monstera + a hand-painted canvas. Zero regrets.", a: "u_ren", swap: "CAMERA ↔ PLANTS" },
            { t: "My side hustle logo cost me 0 dollars and 1 skateboard.", a: "u_kai", swap: "SKATE ↔ LOGO" },
          ].map((r, i) => {
            const u = USERS[r.a];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="nb-card p-6"
                data-testid={`testimonial-${i}`}
              >
                <div className="text-[var(--lime)] font-serif-i text-5xl italic leading-none mb-4">"</div>
                <p className="text-lg leading-tight mb-6 text-white/90">{r.t}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} className="w-8 h-8 rounded-full border border-white/10 object-cover" alt={u.name} />
                    <div>
                      <div className="text-xs font-medium text-white">{u.name}</div>
                      <div className="text-[10px] font-mono2 text-[var(--text-3)]">{u.handle}</div>
                    </div>
                  </div>
                  <span className="nb-tag tint-lime">{r.swap}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─────── FAQ ─────── */}
      <section id="faq" className="max-w-4xl mx-auto px-4 md:px-6 py-24">
        <div className="mb-12">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">FAQ</div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            The <span className="font-serif-i italic">basics</span>.
          </h2>
        </div>
        <div className="space-y-3">
          {[
            { q: "Is it actually free?", a: "Yep. No listing fees. No transaction fees. Just swaps and optional Baarter Coins for boosts." },
            { q: "How do you prevent scams?", a: "Verified profiles, trust scores, signed mini-contracts, in-app mediation. Every swap is tracked end-to-end." },
            { q: "Can I trade services too?", a: "Absolutely. Tutoring, design, dev work, photography, cooking — swap skills like a pro." },
            { q: "What if the trade isn't equal?", a: "Add Baarter Coins to balance it. Or agree to a 2-part swap. Or throw in extras. You decide." },
            { q: "Who's on Baarter?", a: "Gen-Z creatives, students, thrifters, side-hustlers, hobbyists. Anyone with something worth trading." },
          ].map((f, i) => (
            <details key={i} className="nb-card px-6 py-5 group cursor-pointer" data-testid={`faq-${i}`}>
              <summary className="font-display text-xl md:text-2xl list-none flex items-center justify-between text-white">
                {f.q}
                <span className="text-2xl text-[var(--lime)] group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-[var(--text-2)] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─────── FINAL CTA ─────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="nb-card p-10 md:p-20 text-center relative overflow-hidden">
          <div className="aurora" style={{ opacity: 0.3 }} />
          <div className="grid-bg absolute inset-0" />
          <div className="relative">
            <LogoMark size={64} className="mx-auto mb-6" />
            <h2 className="font-display text-5xl md:text-8xl leading-[0.9]">
              Ready to <span className="font-serif-i italic text-[var(--lime)]">swap</span><br />
              the whole game?
            </h2>
            <p className="mt-6 text-[var(--text-2)] text-lg max-w-lg mx-auto">Join thousands trading stuff, skills, and services — no money required.</p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link to="/auth" data-testid="final-cta">
                <NbButton variant="primary" className="text-base px-6 py-4">
                  Claim your account <ArrowRight size={18} strokeWidth={2.5} />
                </NbButton>
              </Link>
              <Link to="/app/explore" data-testid="final-cta-secondary">
                <NbButton variant="ghost" className="text-base px-6 py-4">
                  Just browse
                </NbButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid md:grid-cols-4 gap-10">
          <div>
            <LogoWordmark size="text-lg" />
            <p className="mt-4 text-sm text-[var(--text-2)] max-w-xs">The money-free marketplace, gamified for the next generation of traders.</p>
          </div>
          {[
            { t: "Product", l: ["Feed", "Explore", "Matches", "Wallet"] },
            { t: "Company", l: ["About", "Careers", "Press", "Contact"] },
            { t: "Legal", l: ["Terms", "Privacy", "Safety", "Community"] },
          ].map((col, i) => (
            <div key={i}>
              <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">{col.t}</div>
              <ul className="space-y-2.5 text-sm">
                {col.l.map((x) => <li key={x}><a href="#" className="text-[var(--text-2)] hover:text-white transition">{x}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 py-5 text-center text-[10px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">
          © 2025 BAARTER · NO MONEY WAS USED IN THE MAKING OF THIS SITE
        </div>
      </footer>
    </div>
  );
};

export default Landing;
