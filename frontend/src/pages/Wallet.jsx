import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Gift, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";

const Wallet = () => {
  const { user, wallet, boostListing } = useApp();

  const boost = () => {
    if (user.coins < 100) { toast.error("Not enough coins"); return; }
    boostListing();
  };

  return (
    <div className="space-y-6" data-testid="wallet-page">
      <SectionTitle kicker="BAARTER COINS">Your wallet.</SectionTitle>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="nb-card p-8 relative overflow-hidden"
        data-testid="wallet-balance"
      >
        <div className="aurora" style={{ opacity: 0.4 }} />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-3">BALANCE</div>
          <div className="font-display text-7xl md:text-8xl leading-none text-white flex items-baseline gap-2">
            {user.coins.toLocaleString()}
            <span className="text-3xl text-[var(--lime)]">◈</span>
          </div>
          <div className="font-mono2 text-[10px] uppercase tracking-widest text-[var(--text-3)] mt-3">BAARTER COINS · BC</div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-2 relative">
          <button className="nb-btn bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-full text-xs font-medium" data-testid="wallet-earn">
            Earn
          </button>
          <button onClick={boost} className="nb-btn bg-[var(--lime)] text-black py-3 rounded-full text-xs font-bold" data-testid="wallet-boost">
            Boost <span className="opacity-60">−100</span>
          </button>
          <button className="nb-btn bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-full text-xs font-medium" data-testid="wallet-gift">
            Gift
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Earned", value: "+775", icon: TrendingUp, tint: "tint-lime" },
          { label: "Spent", value: "-100", icon: TrendingDown, tint: "tint-pink" },
          { label: "Referrals", value: "3", icon: Gift, tint: "tint-amber" },
        ].map((s) => (
          <div key={s.label} className={`nb-card p-4 border ${s.tint}`}>
            <s.icon size={18} strokeWidth={2} className="mb-2 opacity-80" />
            <div className="font-display text-2xl text-white">{s.value}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-2xl mb-3">Recent activity</h3>
        <div className="nb-card overflow-hidden divide-y-[3px] divide-white/8">
          {wallet.map((w) => (
            <div key={w.id} className="p-4 flex items-center gap-3 bg-[var(--surface)]" data-testid={`wallet-tx-${w.id}`}>
              <div className={`w-10 h-10 rounded-full nb-border-2 flex items-center justify-center ${w.type === "earn" ? "tint-lime" : "tint-pink"}`}>
                {w.type === "earn" ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{w.reason}</div>
                <div className="text-xs font-mono2 text-[var(--text-3)]">{w.time}</div>
              </div>
              <div className={`font-display text-xl ${w.type === "earn" ? "text-[var(--lime)]" : ""}`}>
                {w.amount > 0 ? "+" : ""}{w.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nb-card p-6 tint-amber">
        <Zap size={28} strokeWidth={2.5} className="mb-2" />
        <div className="font-display text-2xl mb-2">Earn more coins</div>
        <ul className="space-y-1 text-sm font-medium">
          <li>· Complete a swap: <b>+50 BC</b></li>
          <li>· Refer a friend: <b>+25 BC each</b></li>
          <li>· Verify your ID: <b>+100 BC</b></li>
          <li>· Get 5-star rating: <b>+10 BC</b></li>
        </ul>
      </div>
    </div>
  );
};

export default Wallet;
