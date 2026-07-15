import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, MoreVertical, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";

const ChatThread = () => {
  const { id } = useParams();
  const { chats, users, user, sendMessage } = useApp();
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  const chat = chats.find((c) => c.id === id);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [chat?.messages]);

  if (!chat) return <div className="p-10 text-center font-display text-3xl">Chat not found.</div>;
  const other = users[chat.with];

  const send = () => {
    if (!text.trim()) return;
    sendMessage(chat.id, text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] nb-card bg-[var(--surface)] overflow-hidden" data-testid="chat-thread">
      <div className="flex items-center gap-3 p-3 border-b-[3px] border-white/10 bg-[var(--surface)]">
        <Link to="/app/chat" className="p-2 hover:bg-black/5 rounded-lg"><ArrowLeft size={18} strokeWidth={3} /></Link>
        <img src={other.avatar} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt={other.name} />
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg">{other.name}</div>
          <div className="text-xs font-mono2 text-[var(--text-3)] flex items-center gap-1">
            <Shield size={10} strokeWidth={3} /> Trust {other.trustScore} · Online
          </div>
        </div>
        <Link to="/app/proposals" className="nb-btn tint-amber px-3 py-2 rounded-lg text-xs font-bold" data-testid="chat-see-proposal">
          SWAP DETAILS
        </Link>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--surface-2)]">
        {chat.messages.map((m, i) => {
          const isMe = m.from === "u_me";
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${i}`}>
              <div className={`max-w-[75%] px-4 py-2 nb-border-2 rounded-2xl ${isMe ? "bg-[var(--lime)] text-black rounded-br-sm" : "bg-[var(--surface)] rounded-bl-sm"}`}>
                <div className="text-sm font-medium">{m.text}</div>
                <div className={`text-[10px] mt-1 font-mono2 ${isMe ? "text-white/70" : "text-[var(--text-3)]"}`}>{m.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t-[3px] border-white/10 bg-[var(--surface)] flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something..."
          className="nb-input flex-1"
          data-testid="chat-input"
        />
        <NbButton onClick={send} className="px-4" data-testid="chat-send">
          <Send size={16} strokeWidth={3} />
        </NbButton>
      </div>
    </div>
  );
};

export default ChatThread;
