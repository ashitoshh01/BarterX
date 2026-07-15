import React from "react";

export const EmptyState = ({ emoji = "◇", title, subtitle, action, testid = "empty-state" }) => (
  <div
    className="nb-card p-12 text-center flex flex-col items-center gap-3 relative overflow-hidden"
    data-testid={testid}
  >
    <div className="text-5xl mb-2 opacity-70">{emoji}</div>
    <div className="font-display text-2xl">{title}</div>
    {subtitle && <p className="text-sm text-[var(--text-2)] max-w-sm">{subtitle}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const SectionTitle = ({ children, kicker, className = "" }) => (
  <div className={`mb-6 ${className}`}>
    {kicker && (
      <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-2 flex items-center gap-2">
        <span className="w-6 h-px bg-[var(--lime)]" />
        {kicker}
      </div>
    )}
    <h2 className="font-display text-3xl md:text-4xl text-white">{children}</h2>
  </div>
);

export const Chip = ({ children, active = false, onClick, testid, className = "" }) => (
  <button
    onClick={onClick}
    data-testid={testid}
    className={`nb-tag transition-all cursor-pointer ${active ? "!bg-[var(--lime)] !text-black !border-transparent" : "hover:!border-white/20"} ${className}`}
  >
    {children}
  </button>
);

export const NbButton = React.forwardRef(({ className = "", variant = "primary", children, ...props }, ref) => {
  const variants = {
    primary: "bg-[var(--lime)] text-black hover:brightness-110 hover:shadow-[0_0_40px_-8px_var(--lime-glow)]",
    dark: "bg-white text-black hover:bg-white/90",
    ghost: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
    outline: "bg-transparent text-white border border-white/15 hover:border-white/40 hover:bg-white/5",
    pink: "bg-[var(--pink)] text-white hover:brightness-110 hover:shadow-[0_0_40px_-8px_var(--pink-glow)]",
    danger: "bg-[var(--pink)]/15 text-[var(--pink)] border border-[var(--pink)]/30 hover:bg-[var(--pink)]/25",
  };
  return (
    <button
      ref={ref}
      className={`nb-btn px-5 py-3 text-sm inline-flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
NbButton.displayName = "NbButton";

export const Card = ({ children, className = "", ...props }) => (
  <div className={`nb-card p-6 ${className}`} {...props}>{children}</div>
);

/** Gamified XP / progress bar */
export const XPBar = ({ value = 40, max = 100, label, className = "", testid }) => (
  <div className={className} data-testid={testid}>
    {label && (
      <div className="flex justify-between mb-1.5 text-[10px] font-mono2 uppercase tracking-wider">
        <span className="text-[var(--text-2)]">{label}</span>
        <span className="text-[var(--lime)]">{value}/{max}</span>
      </div>
    )}
    <div className="xp-bar">
      <div className="xp-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);

/** Gamified level badge */
export const LevelBadge = ({ level = 4, className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 tint-lime px-2.5 py-1 rounded-full border font-mono2 text-[11px] font-bold ${className}`}>
    <span className="text-[9px]">LVL</span>
    <span className="text-white">{level}</span>
  </div>
);
