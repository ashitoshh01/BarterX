import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Clock, Package, MapPin, MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import api from "@/lib/api";
import { toast } from "sonner";

const stageIcon = (stage) => {
  if (stage.includes("Proposal")) return "📝";
  if (stage.includes("Accepted")) return "🤝";
  if (stage.includes("Contract")) return "✍️";
  if (stage.includes("Shipped")) return "📦";
  if (stage.includes("Received") || stage.includes("Delivered")) return "🎁";
  if (stage.includes("Rated")) return "⭐";
  return "•";
};

const SwapTracker = () => {
  const { trades, setTrades, tracker } = useApp();
  const { id } = useParams(); // Using id as the trade id
  const [updating, setUpdating] = useState(false);

  const trade = trades.find(t => String(t.id) === id);

  const handleUpdateLogistics = async (status) => {
    if (!trade) return;
    setUpdating(true);
    try {
      const res = await api.post(`/trades/${trade.id}/update_logistics/`, {
        logistics_status: status
      });
      setTrades(prev => prev.map(t => t.id === trade.id ? { ...t, logistics_status: res.data.logistics_status } : t));
      toast.success(`Logistics updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update logistics");
    } finally {
      setUpdating(false);
    }
  };

  if (!trade) {
    return (
      <div className="space-y-6">
        <SectionTitle>Track this swap.</SectionTitle>
        <div>Trade not found.</div>
      </div>
    );
  }

  const STAGES = ["preparing", "shipped", "out_for_delivery", "delivered"];
  const currentStageIndex = STAGES.indexOf(trade.logistics_status);

  const displayStages = STAGES.map((s, i) => {
    let status = "pending";
    if (i < currentStageIndex) status = "done";
    else if (i === currentStageIndex) status = "current";

    const labels = {
      preparing: "Preparing for Shipment",
      shipped: "Items Shipped",
      out_for_delivery: "Out for Delivery",
      delivered: "Items Received (Delivered)"
    };
    
    return {
      id: s,
      stage: labels[s],
      time: i <= currentStageIndex ? new Date(trade.created_at).toLocaleDateString() : "--",
      status
    };
  });

  return (
    <div className="space-y-6" data-testid="tracker-page">
      <SectionTitle kicker={`SWAP #${trade.id}`}>Track this swap.</SectionTitle>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 nb-card p-6 bg-[var(--surface)]">
          <div className="space-y-0">
            {displayStages.map((s, i) => {
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
                    {i < displayStages.length - 1 && (
                      <div className={`w-1 flex-1 my-1 min-h-[40px] ${isDone ? "bg-black" : "bg-neutral-300"}`} />
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <div className={`font-display text-xl ${!isDone && !isCurrent ? "text-[var(--text-3)]" : ""}`}>
                      {s.stage}
                    </div>
                    <div className="text-xs font-mono2 mt-0.5 text-[var(--text-3)]">{s.time}</div>
                    {isCurrent && (
                      <div className="mt-2 p-2 text-xs font-medium max-w-md">
                        {s.id === 'preparing' && <NbButton size="sm" onClick={() => handleUpdateLogistics('shipped')} disabled={updating}>Mark as Shipped</NbButton>}
                        {s.id === 'shipped' && <NbButton size="sm" onClick={() => handleUpdateLogistics('out_for_delivery')} disabled={updating}>Mark Out for Delivery</NbButton>}
                        {s.id === 'out_for_delivery' && <NbButton size="sm" onClick={() => handleUpdateLogistics('delivered')} disabled={updating}>Mark as Delivered</NbButton>}
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
            <div className="font-display text-lg mt-1">Trade #{trade.id}</div>
          </div>
          <Link to="/app/chat">
            <NbButton variant="light" className="w-full" data-testid="tracker-chat">
              <MessageCircle size={16} strokeWidth={3} /> Message swapper
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
