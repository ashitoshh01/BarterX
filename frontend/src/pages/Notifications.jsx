import React from "react";
import { Sparkles, MessageCircle, Coins, Repeat, Shield, CheckCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";

const icons = {
  match: Sparkles,
  proposal: Repeat,
  chat: MessageCircle,
  coins: Coins,
  system: Shield,
};

const bg = {
  match: "tint-purple",
  proposal: "tint-amber",
  chat: "tint-blue",
  coins: "tint-lime",
  system: "tint-pink",
};

const Notifications = () => {
  const { notifications, markAllRead } = useApp();

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex items-center justify-between">
        <SectionTitle kicker="INBOX" className="mb-0">Notifications.</SectionTitle>
        <NbButton variant="light" onClick={markAllRead} className="text-xs px-3 py-2" data-testid="notif-mark-all">
          <CheckCheck size={14} strokeWidth={3} /> Mark all read
        </NbButton>
      </div>

      {notifications.length === 0 ? (
        <EmptyState emoji="🔔" title="All caught up" subtitle="You're up to date on everything." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = icons[n.type] || Sparkles;
            return (
              <div
                key={n.id}
                className={`nb-card p-4 flex items-center gap-3 ${n.read ? "bg-[var(--surface)]" : "tint-amber"}`}
                data-testid={`notif-${n.id}`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${bg[n.type]}`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{n.text}</div>
                  <div className="text-xs font-mono2 text-[var(--text-3)]">{n.time} ago</div>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-[var(--lime)] nb-border-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
