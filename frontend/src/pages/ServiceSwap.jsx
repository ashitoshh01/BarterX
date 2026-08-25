import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Repeat, Clock, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import ListingCard from "@/components/ListingCard";

const ServiceSwap = () => {
  const { listings, user } = useApp();
  const nav = useNavigate();
  const services = listings.filter((l) => l.type === "service" && l.status !== "traded");

  // Build real skill trade pairs from available service listings
  // Pair services that want what the other offers (based on category/wants)
  const skillTrades = useMemo(() => {
    const myServices = services.filter((l) => l.owner?.username === user.id);
    const otherServices = services.filter((l) => l.owner?.username !== user.id);

    const pairs = [];
    for (const mine of myServices) {
      for (const theirs of otherServices) {
        // Check if they want each other's category
        const theyWantMine = theirs.wants?.some((w) =>
          mine.category === w || mine.title.toLowerCase().includes(w.toLowerCase())
        );
        const iWantTheirs = mine.wants?.some((w) =>
          theirs.category === w || theirs.title.toLowerCase().includes(w.toLowerCase())
        );

        if (theyWantMine || iWantTheirs) {
          pairs.push({
            myService: mine,
            theirService: theirs,
            mutual: theyWantMine && iWantTheirs,
          });
        }
      }
    }

    // If no matches from user's services, show top pairs from all services
    if (pairs.length === 0 && otherServices.length >= 2) {
      for (let i = 0; i < Math.min(otherServices.length - 1, 3); i++) {
        pairs.push({
          myService: otherServices[i],
          theirService: otherServices[i + 1],
          mutual: false,
        });
      }
    }

    return pairs.slice(0, 4);
  }, [services, user.id]);

  return (
    <div className="space-y-6" data-testid="service-swap-page">
      <div className="nb-card p-8 md:p-10 relative overflow-hidden">
        <div className="aurora" style={{ opacity: 0.3 }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 tint-blue border px-3 py-1 rounded-full mb-4 font-mono2 uppercase text-[10px] tracking-widest">
            <Repeat size={12} strokeWidth={2.5} /> SERVICE ↔ SERVICE
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-[var(--text)]">
            Skills for <span className="font-serif-i italic text-[var(--lime)]">skills</span>.
          </h1>
          <p className="mt-4 max-w-md text-[var(--text-2)]">
            Trade an hour of design for an hour of tutoring. No coins, no cash — just time and talent.
          </p>
        </div>
      </div>

      <SectionTitle kicker="OPEN SERVICE TRADES">Live skill trades.</SectionTitle>

      {skillTrades.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="No skill trades available"
          subtitle="Post a service listing to start swapping skills."
          action={
            <NbButton onClick={() => nav("/app/create")} data-testid="service-create">
              Post a Service <ArrowRight size={14} strokeWidth={3} />
            </NbButton>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {skillTrades.map((t, i) => (
            <div key={i} className="nb-card p-5 bg-[var(--surface)]" data-testid={`skill-trade-${i}`}>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-3">
                <Link
                  to={`/app/listing/${t.myService.id}`}
                  className="nb-border-2 rounded-lg p-3 tint-amber hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="text-[10px] font-mono2 uppercase text-[var(--text-3)]">OFFER</div>
                  <div className="font-display text-lg leading-tight line-clamp-2">{t.myService.title}</div>
                  <div className="text-xs font-mono2 mt-1">{t.myService.owner?.handle || ""}</div>
                </Link>
                <Repeat size={20} strokeWidth={3} />
                <Link
                  to={`/app/listing/${t.theirService.id}`}
                  className="nb-border-2 rounded-lg p-3 tint-lime hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="text-[10px] font-mono2 uppercase text-[var(--text-3)]">WANT</div>
                  <div className="font-display text-lg leading-tight line-clamp-2">{t.theirService.title}</div>
                  <div className="text-xs font-mono2 mt-1">{t.theirService.owner?.handle || ""}</div>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="nb-tag bg-[var(--surface)] flex items-center gap-1"><Clock size={11} strokeWidth={3} /> SERVICE</span>
                  {t.mutual && <span className="nb-tag tint-lime text-[10px]">MUTUAL ✓</span>}
                </div>
                <Link to={`/app/listing/${t.theirService.id}`}>
                  <NbButton className="text-xs px-3 py-2" data-testid={`skill-propose-${i}`}>
                    Propose <ArrowRight size={12} strokeWidth={3} />
                  </NbButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionTitle>All service listings.</SectionTitle>
      {services.length === 0 ? (
        <EmptyState emoji="🛠️" title="No services listed" subtitle="Be the first to offer a service on the marketplace." />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
};

export default ServiceSwap;
