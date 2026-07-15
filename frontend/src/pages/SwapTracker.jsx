import React from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Clock, Package, MapPin, MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";

const stageIcon = (stage) => {
  if (stage.includes("Proposal")) return "📝";
  if (stage.includes("Accepted")) return "🤝";
  if (stage.includes("Contract")) return "✍️";
  if (stage.includes("Shipped")) return "📦";
  if (stage.includes("Received")) return "🎁";
  if (stage.includes("Rated")) return "⭐";
  return "•";
};

const SwapTracker = () => {
  const { tracker } = useApp();
  const { id } = useParams();

  return (
    <div className="space-y-6" data-testid="tracker-page">
      <SectionTitle kicker={`SWAP #${id?.toUpperCase() || "S_1"}`}>Track this swap.</SectionTitle>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 nb-card p-6 bg-[var(--surface)]">
          <div className="space-y-0">
            {tracker.map((s, i) => {
              const isDone = s.status === "done";
              const isCurrent = s.status === "current";
              return (
                <div key={s.id} className="flex gap-4" data-testid={`tracker-stage-${i}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full nb-border-2 flex items-center justify-center text-xl shrink-0 ${
                      isDone ? "tint-lime" : isCurrent ? "tint-amber nb-shadow" : "bg-[var(--surface)]"
                    }`}>
                      {isDone ? <Check size={22} strokeWidth={3} /> : <span>{stageIcon(s.stage)}</span>}
                    </div>
                    {i < tracker.length - 1 && (
                      <div className={`w-1 flex-1 my-1 min-h-[40px] ${isDone ? "bg-black" : "bg-neutral-300"}`} />
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <div className={`font-display text-xl ${!isDone && !isCurrent ? "text-[var(--text-3)]" : ""}`}>
                      {s.stage}
                    </div>
                    <div className="text-xs font-mono2 mt-0.5 text-[var(--text-3)]">{s.time}</div>
                    {isCurrent && (
                      <div className="mt-2 nb-border-2 rounded-lg tint-amber p-2 text-xs font-medium max-w-md">
                        <b>In transit</b> · Package left LA yesterday. Est. arrival: 2 days.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="nb-card p-4 tint-amber">
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">SWAP</div>
            <div className="font-display text-lg mt-1">Monstera ↔ Skateboard</div>
            <div className="text-xs font-mono2 mt-1">with @kaiwave</div>
          </div>
          <Link to="/app/chat">
            <NbButton variant="light" className="w-full" data-testid="tracker-chat">
              <MessageCircle size={16} strokeWidth={3} /> Message swapper
            </NbButton>
          </Link>
          <Link to="/app/logistics">
            <NbButton variant="light" className="w-full" data-testid="tracker-logistics">
              <Package size={16} strokeWidth={3} /> Logistics
            </NbButton>
          </Link>
          <Link to="/app/contracts">
            <NbButton variant="light" className="w-full" data-testid="tracker-contract">
              📄 View contract
            </NbButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SwapTracker;
