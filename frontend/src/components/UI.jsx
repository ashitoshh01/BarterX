import React from "react";

export const EmptyState = ({ emoji = "◇", title, subtitle, action, testid = "empty-state" }) => (
  <div
    className="nb-card p-8 text-center flex flex-col items-center gap-2 relative overflow-hidden max-w-sm mx-auto my-4"
    data-testid={testid}
  >
    <div className="text-4xl mb-1 opacity-70">{emoji}</div>
    <div className="font-display text-xl">{title}</div>
    {subtitle && <p className="text-sm text-[var(--text-2)]">{subtitle}</p>}
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
    <h2 className="font-display text-3xl md:text-4xl text-[var(--text)]">{children}</h2>
  </div>
);

export const Chip = ({ children, active = false, onClick, testid, className = "" }) => (
  <button
    onClick={onClick}
    data-testid={testid}
    className={`nb-tag transition-all cursor-pointer ${active ? "!bg-[var(--text)] !text-white !border-transparent" : "hover:!border-[var(--border-hi)]"} ${className}`}
  >
    {children}
  </button>
);

export const NbButton = React.forwardRef(({ className = "", variant = "primary", children, ...props }, ref) => {
  const variants = {
    primary: "bg-[var(--lime)] text-black hover:brightness-105 hover:shadow-md",
    dark: "bg-[var(--text)] text-white hover:bg-[var(--text)]/90",
    ghost: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)] hover:border-[var(--border-hi)]",
    outline: "bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-[var(--surface-2)]",
    light: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)]",
    pink: "bg-[var(--pink)] text-white hover:brightness-105 hover:shadow-md",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };
  return (
    <button
      ref={ref}
      className={`nb-btn px-5 py-3 text-sm inline-flex items-center justify-center gap-2 ${variants[variant] || variants.primary} ${className}`}
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
        <span className="text-[var(--text)]">{value}/{max}</span>
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
    <span className="text-[var(--text)]">{level}</span>
  </div>
);
