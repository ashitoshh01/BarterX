import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, EmptyState } from "@/components/UI";

const Chat = () => {
  const { chats, users } = useApp();

  return (
    <div className="space-y-4" data-testid="chat-list">
      <SectionTitle kicker="MESSAGES">Chats.</SectionTitle>
      {chats.length === 0 ? (
        <EmptyState emoji="💬" title="No chats yet" subtitle="Propose a swap and start chatting." />
      ) : (
        <div className="nb-card overflow-hidden divide-y-[3px] divide-white/8">
          {chats.map((c) => {
            const other = users[c.with];
            return (
              <Link
                to={`/app/chat/${c.id}`}
                key={c.id}
                className="flex items-center gap-3 p-4 hover:tint-amber transition-colors bg-[var(--surface)]"
                data-testid={`chat-item-${c.id}`}
              >
                <div className="relative">
                  <img src={other?.avatar} className="w-12 h-12 rounded-full nb-border-2 object-cover" alt={other?.name} />
                  {other?.onlineStatus === 'online' && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-[var(--lime)] border-2 border-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="font-display text-lg">{other?.name}</div>
                    <div className="text-[10px] font-mono2 text-[var(--text-3)]">{c.lastTime}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.isTyping ? (
                      <p className="text-sm text-[var(--lime)] font-bold italic animate-pulse flex-1">typing...</p>
                    ) : (
                      <p className="text-sm text-[var(--text-2)] truncate flex-1">{c.lastMessage}</p>
                    )}
                    {c.unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-[var(--lime)] text-black rounded-full text-[10px] font-bold flex items-center justify-center nb-border-2">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={18} strokeWidth={3} className="text-[var(--text-3)]" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Chat;
