import React from "react";
import { Link } from "react-router-dom";
import { Repeat, Clock, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import ListingCard from "@/components/ListingCard";

const ServiceSwap = () => {
  const { listings, users } = useApp();
  const services = listings.filter((l) => l.type === "service");

  const skillTrades = [
    { a: "Spanish tutoring", b: "Logo design", scoreA: services[0]?.owner, scoreB: services[1]?.owner },
    { a: "Portfolio website", b: "Portrait shoot", scoreA: services[3]?.owner, scoreB: services[2]?.owner },
  ];

  return (
    <div className="space-y-6" data-testid="service-swap-page">
      <div className="nb-card p-8 md:p-10 relative overflow-hidden">
        <div className="aurora" style={{ opacity: 0.3 }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 tint-blue border px-3 py-1 rounded-full mb-4 font-mono2 uppercase text-[10px] tracking-widest">
            <Repeat size={12} strokeWidth={2.5} /> SERVICE ↔ SERVICE
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-white">
            Skills for <span className="font-serif-i italic text-[var(--lime)]">skills</span>.
          </h1>
          <p className="mt-4 max-w-md text-[var(--text-2)]">
            Trade an hour of design for an hour of tutoring. No coins, no cash — just time and talent.
          </p>
        </div>
      </div>

      <SectionTitle kicker="OPEN SERVICE TRADES">Live skill trades.</SectionTitle>

      <div className="grid md:grid-cols-2 gap-4">
        {skillTrades.map((t, i) => {
          const a = users[t.scoreA];
          const b = users[t.scoreB];
          return (
            <div key={i} className="nb-card p-5 bg-[var(--surface)]" data-testid={`skill-trade-${i}`}>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-3">
                <div className="nb-border-2 rounded-lg p-3 tint-amber">
                  <div className="text-[10px] font-mono2 uppercase text-[var(--text-3)]">OFFER</div>
                  <div className="font-display text-lg leading-tight">{t.a}</div>
                  {a && <div className="text-xs font-mono2 mt-1">{a.handle}</div>}
                </div>
                <Repeat size={20} strokeWidth={3} />
                <div className="nb-border-2 rounded-lg p-3 tint-lime">
                  <div className="text-[10px] font-mono2 uppercase text-[var(--text-3)]">WANT</div>
                  <div className="font-display text-lg leading-tight">{t.b}</div>
                  {b && <div className="text-xs font-mono2 mt-1">{b.handle}</div>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="nb-tag bg-[var(--surface)] flex items-center gap-1"><Clock size={11} strokeWidth={3} /> 1-2 HRS</span>
                <NbButton className="text-xs px-3 py-2" data-testid={`skill-propose-${i}`}>
                  Propose <ArrowRight size={12} strokeWidth={3} />
                </NbButton>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle>All service listings.</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </div>
  );
};

export default ServiceSwap;
