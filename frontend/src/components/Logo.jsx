import React from "react";

/**
 * BAARTER Logo — abstract "swap" glyph
 * Two arrows locked in a rotating exchange, formed by a stylized "B"
 * whose counter (inside of B) is a chevron pointing right (give)
 * and the outer stroke forms a chevron pointing left (receive).
 * Distinctive, memorable, works at any size, monochrome or accent.
 */
export const LogoMark = ({ size = 40, className = "", accent = "#C8F000", ink = "#1a1a1a" }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 64 64"
    fill="none" xmlns="http://www.w3.org/2000/svg"
    className={`logo-swap ${className}`}
    data-testid="logo-mark"
    aria-label="BAARTER"
  >
    <defs>
      <linearGradient id="lg-glow" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor={accent} />
        <stop offset="100%" stopColor="#4F6AFF" />
      </linearGradient>
    </defs>
    {/* Ring */}
    <circle cx="32" cy="32" r="29" stroke="url(#lg-glow)" strokeWidth="2.5" fill={ink} />
    {/* Upper arrow (give →) */}
    <path
      d="M18 25 L38 25 L34 20 M38 25 L34 30"
      stroke={accent}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Lower arrow (receive ←) */}
    <path
      d="M46 39 L26 39 L30 34 M26 39 L30 44"
      stroke="#ffffff"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Accent dot */}
    <circle cx="32" cy="32" r="1.6" fill={accent} />
  </svg>
);

export const LogoWordmark = ({ className = "", size = "text-2xl", showDot = true, markSize = 32 }) => (
  <div className={`flex items-center gap-2.5 ${className}`} data-testid="logo-wordmark">
    <LogoMark size={markSize} />
    <span className={`font-display ${size} tracking-tight leading-none text-[var(--text)]`}>
      baarter{showDot && <span className="text-[var(--lime)]">.</span>}
    </span>
  </div>
);

export default LogoWordmark;
