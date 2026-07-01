import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { LogoWordmark } from "@/components/Logo";
import { NbButton } from "@/components/UI";
import { CATEGORIES } from "@/mock/data";
import { toast } from "sonner";

const steps = [
  { key: "vibe", title: "What's your vibe?", subtitle: "Pick 3 or more — we'll tune the feed." },
  { key: "have", title: "What do you have?", subtitle: "Things you'd trade away." },
  { key: "want", title: "What do you want?", subtitle: "Categories you're hunting." },
  { key: "location", title: "Where are you at?", subtitle: "For local pickups. Change any time." },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ vibe: [], have: [], want: [], location: "" });
  const nav = useNavigate();

  const toggle = (key, val) => {
    setSelections((s) => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter((v) => v !== val) : [...s[key], val],
    }));
  };

  const next = () => {
    if (step === steps.length - 1) {
      toast.success("You're in. Let's swap.");
      nav("/app/feed");
    } else setStep(step + 1);
  };

  const back = () => step > 0 ? setStep(step - 1) : nav("/auth");

  const current = steps[step];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="grid-bg fixed inset-0 opacity-40 pointer-events-none" />
      <header className="border-b border-white/5 relative">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/"><LogoWordmark size="text-lg" /></Link>
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 rounded-full transition-all ${i <= step ? "bg-[var(--lime)] w-10 shadow-[0_0_12px_var(--lime-glow)]" : "bg-white/10 w-6"}`}
                data-testid={`onboard-progress-${i}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-16 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
            data-testid={`onboard-step-${current.key}`}
          >
            <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">
              STEP {step + 1} OF {steps.length}
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-white mb-4">{current.title}</h1>
            <p className="text-lg text-[var(--text-2)] mb-10">{current.subtitle}</p>

            {current.key === "location" ? (
              <input
                value={selections.location}
                onChange={(e) => setSelections({ ...selections, location: e.target.value })}
                placeholder="e.g. Brooklyn, NY"
                className="nb-input text-lg max-w-md"
                data-testid="onboard-location"
              />
            ) : (
              <div className="flex flex-wrap gap-2 max-w-3xl">
                {CATEGORIES.map((c) => {
                  const active = selections[current.key].includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(current.key, c.id)}
                      className={`nb-btn px-4 py-2.5 rounded-full text-sm flex items-center gap-2 transition-all ${
                        active
                          ? "bg-[var(--lime)] text-black shadow-[0_0_20px_-4px_var(--lime-glow)]"
                          : "bg-white/5 text-white border border-white/10 hover:border-white/25"
                      }`}
                      data-testid={`onboard-${current.key}-${c.id}`}
                    >
                      <span className="text-base">{c.emoji}</span>
                      <span className="font-medium">{c.name}</span>
                      {active && <Check size={13} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 relative" style={{ background: "var(--bg-2)" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <button onClick={back} className="text-sm text-[var(--text-2)] hover:text-white flex items-center gap-1" data-testid="onboard-back">
            <ArrowLeft size={14} strokeWidth={2.5} /> Back
          </button>
          <NbButton onClick={next} data-testid="onboard-next">
            {step === steps.length - 1 ? "Finish" : "Continue"} <ArrowRight size={16} strokeWidth={2.5} />
          </NbButton>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
