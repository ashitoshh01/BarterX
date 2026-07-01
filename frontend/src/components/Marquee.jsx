import React from "react";

export const Marquee = ({
  items = ["SWAP INSTEAD OF PAY", "BARTER YOUR SKILLS", "NO MONEY ALLOWED", "TRADE WHAT YOU HAVE"],
  className = "",
  reverse = false,
  speed = "",
  size = "text-4xl md:text-6xl",
  variant = "line", // "line" (thin ticker) | "hero" (huge chunky)
}) => {
  const track = [...items, ...items, ...items];

  if (variant === "line") {
    return (
      <div className={`ticker overflow-hidden py-3 ${className}`} data-testid="marquee">
        <div className={`marquee-track ${reverse ? "reverse" : ""} ${speed}`}>
          {track.map((t, i) => (
            <div key={i} className="flex items-center gap-8 font-mono2 text-xs uppercase tracking-[0.3em] text-[var(--text-3)]">
              <span>{t}</span>
              <span className="text-[var(--lime)]">✦</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden py-6 relative ${className}`} data-testid="marquee">
      <div className={`marquee-track ${reverse ? "reverse" : ""} ${speed}`}>
        {track.map((t, i) => (
          <div key={i} className={`flex items-center gap-10 font-display ${size} uppercase text-white/85`}>
            <span>{t}</span>
            <span className="text-[var(--lime)]">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
