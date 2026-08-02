import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, MoreVertical, Shield, Paperclip } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";

const ChatThread = () => {
  const { id } = useParams();
  const { chats, users, user, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, sendAttachment } = useApp();
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chat = chats.find((c) => c.id === String(id));

  useEffect(() => {
    if (id) {
      loadChatMessages(id);
      joinChatRoom(id);

      // Fast polling interval (every 3s) for real-time sync
      const interval = setInterval(() => {
        loadChatMessages(id);
      }, 3000);

      return () => {
        clearInterval(interval);
        leaveChatRoom(id);
      };
    }
  }, [id, loadChatMessages, joinChatRoom, leaveChatRoom]);

  useEffect(() => {
    // Keep scrolled to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages, chat?.isTyping]);

  if (!chat) return <div className="p-10 text-center font-display text-3xl">Chat not found.</div>;
  const other = users[chat.with];

  const handleInputChange = (e) => {
    setText(e.target.value);
    
    // Broadcast typing indicator
    setTypingStatus(chat.id, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chat.id, false);
    }, 2000);
  };

  const send = () => {
    if (!text.trim()) return;
    sendMessage(chat.id, text.trim());
    
    // Stop typing immediately on send
    setTypingStatus(chat.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setText("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendAttachment(chat.id, file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] nb-card bg-[var(--surface)] overflow-hidden" data-testid="chat-thread">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b-[3px] border-white/10 bg-[var(--surface)]">
        <Link to="/app/chat" className="p-2 hover:bg-black/5 rounded-lg"><ArrowLeft size={18} strokeWidth={3} /></Link>
        
        <div className="relative">
          <img src={other?.avatar} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt={other?.name} />
          {other?.onlineStatus === 'online' && (
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-[var(--lime)] border-[1.5px] border-black" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg">{other?.name}</div>
          <div className="text-xs font-mono2 text-[var(--text-3)] flex items-center gap-1">
            <Shield size={10} strokeWidth={3} /> Trust {other?.trustScore ?? 50} · {other?.onlineStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        
        <Link to="/app/proposals" className="nb-btn tint-amber px-3 py-2 rounded-lg text-xs font-bold" data-testid="chat-see-proposal">
          SWAP DETAILS
        </Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--surface-2)]">
        {chat.messages && chat.messages.map((m, i) => {
          const isMe = m.from === user.id || m.from === "u_me";
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${i}`}>
              <div className={`max-w-[75%] px-4 py-2 nb-border-2 rounded-2xl ${isMe ? "bg-[var(--lime)] text-black rounded-br-sm" : "bg-[var(--surface)] rounded-bl-sm"}`}>
                
                {m.text && <div className="text-sm font-medium">{m.text}</div>}
                
                {m.messageType === 'IMAGE' && m.attachmentUrl && (
                  <div className="mt-1">
                    <img src={m.attachmentUrl} className="max-w-xs max-h-48 rounded-lg object-cover nb-border-2" alt="Uploaded Attachment" />
                  </div>
                )}
                
                {m.messageType === 'FILE' && m.attachmentUrl && (
                  <div className="mt-1">
                    <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs underline font-bold text-black/80">
                      📁 View Attachment
                    </a>
                  </div>
                )}
                
                <div className={`text-[10px] mt-1 font-mono2 ${isMe ? "text-black/50" : "text-[var(--text-3)]"}`}>{m.time}</div>
              </div>
            </div>
          );
        })}
        {chat.isTyping && (
          <div className="flex justify-start">
            <div className="text-xs text-[var(--lime)] font-bold italic animate-pulse px-4 py-1">
              typing...
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-3 border-t-[3px] border-white/10 bg-[var(--surface)] flex gap-2 items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,application/zip,application/msword"
        />
        <NbButton onClick={() => fileInputRef.current?.click()} className="px-3 py-2.5 h-full" title="Attach file">
          <Paperclip size={16} strokeWidth={3} />
        </NbButton>
        <input
          value={text}
          onChange={handleInputChange}
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
