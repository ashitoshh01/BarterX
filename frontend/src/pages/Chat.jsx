import React, { useState } from "react";
import { Link, Outlet, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Edit } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { EmptyState } from "@/components/UI";

const Chat = () => {
  const { chats, users, startUserChat } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredChats = chats.filter(c => {
    const other = users[c.with] || c.other || {};
    const name = other.name || other.username || c.with || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex w-full h-full bg-[var(--bg-2)] overflow-hidden">
      {/* Left Panel: Chat List */}
      <div className={`w-full md:w-[320px] lg:w-[360px] flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] ${id ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono2 text-[var(--text-3)] uppercase tracking-wider mb-1">Messages</p>
              <h1 className="text-2xl font-display">Chats.</h1>
            </div>
            <button className="w-8 h-8 rounded-full bg-[var(--lime)] flex items-center justify-center hover:brightness-110 transition-all text-black">
              <Edit size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={16} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface-2)] rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--lime)] transition-all placeholder:text-[var(--text-3)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6">
              <EmptyState emoji="💬" title="No chats yet" subtitle="Propose a swap and start chatting." />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {filteredChats.map((c) => {
                const other = users[c.with] || c.other || {};
                const displayName = other.name || other.username || c.with || "Barter User";
                const avatarUrl = other.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop";
                const lastMsgText = c.lastMessage || "No messages yet";
                const lastTimeText = c.lastTime || "";
                const isSelected = id === c.id;

                return (
                  <Link
                    to={`/app/chat/${c.id}`}
                    key={c.id}
                    className={`flex items-center gap-3 p-4 transition-colors ${isSelected ? 'bg-[var(--lime)]/10' : 'hover:bg-[var(--surface-2)]'}`}
                    data-testid={`chat-item-${c.id}`}
                  >
                    <div className="relative">
                      <img src={avatarUrl} className="w-12 h-12 rounded-full border border-[var(--border)] object-cover" alt={displayName} />
                      {other.onlineStatus === 'online' && (
                        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-[var(--lime)] border-2 border-white dark:border-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="font-display text-base truncate text-[var(--text)]">{displayName}</div>
                        <div className="text-[10px] font-mono2 text-[var(--text-3)] flex-shrink-0">{lastTimeText}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.isTyping ? (
                          <p className="text-xs text-[var(--lime)] font-bold italic animate-pulse flex-1">typing...</p>
                        ) : (
                          <p className="text-xs text-[var(--text-2)] truncate flex-1 font-medium">{lastMsgText}</p>
                        )}
                        {c.unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 bg-[var(--lime)] text-black rounded-full text-[9px] font-bold flex items-center justify-center shrink-0">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {search.trim() !== "" && (
                <button
                  onClick={async () => {
                    try {
                      const newChatId = await startUserChat(search.trim());
                      setSearch("");
                      navigate(`/app/chat/${newChatId}`);
                    } catch (e) {
                      // Error is handled by context
                    }
                  }}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-2)] text-left w-full"
                >
                  <div className="w-12 h-12 rounded-full border border-[var(--lime)] bg-[var(--lime)]/10 flex items-center justify-center shrink-0">
                    <Search size={20} className="text-[var(--lime)]" />
                  </div>
                  <div>
                    <div className="font-display text-base text-[var(--text)]">Start new chat</div>
                    <div className="text-xs text-[var(--text-2)]">with @{search.trim()}</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Workspace */}
      <div className={`flex-1 flex-col bg-[var(--bg-2)] relative ${!id ? 'hidden md:flex' : 'flex'}`}>
        {id ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="w-24 h-24 mb-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-sm">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-2xl font-display mb-2 text-[var(--text)]">Select a chat to start</h2>
            <p className="text-[var(--text-2)] mb-8 max-w-sm">Choose from your existing conversations or start a new one.</p>
            <button className="nb-btn px-6 py-2.5 bg-[var(--lime)] text-black rounded-full font-bold text-sm flex items-center gap-2">
              <Edit size={16} strokeWidth={2.5} />
              New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
