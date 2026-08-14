import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, MoreVertical, Shield, Paperclip, Coins } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";
import { toast } from "sonner";

const ChatThread = () => {
  const { id } = useParams();
  const { chats, users, user, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, sendAttachment, transferCoins, wsConnected } = useApp();
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Send Coins Modal State
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinNote, setCoinNote] = useState("");
  const [isSendingCoins, setIsSendingCoins] = useState(false);

  const chat = chats.find((c) => c.id === String(id));

  const handleSendChatCoins = async () => {
    const amt = parseInt(coinAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid coin amount.");
      return;
    }
    if (user.coins < amt) {
      toast.error("Insufficient coin balance.");
      return;
    }

    try {
      setIsSendingCoins(true);
      const recipientUsername = other.username || chat.with;
      await transferCoins(recipientUsername, amt, coinNote);
      
      // Auto-post verification message to chat thread
      const systemMessage = `◈ Sent ${amt} coins${coinNote ? `: "${coinNote}"` : ""}`;
      sendMessage(chat.id, systemMessage);
      
      setShowCoinModal(false);
      setCoinAmount("");
      setCoinNote("");
    } catch (err) {
      // handled
    } finally {
      setIsSendingCoins(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadChatMessages(id);
      joinChatRoom(id);

      return () => {
        leaveChatRoom(id);
      };
    }
  }, [id, loadChatMessages, joinChatRoom, leaveChatRoom]);

  // Refetch chat messages upon WS connection/reconnection as a safety net
  useEffect(() => {
    if (id && wsConnected) {
      loadChatMessages(id);
    }
  }, [id, wsConnected, loadChatMessages]);

  useEffect(() => {
    // Keep scrolled to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages, chat?.isTyping]);

  if (!chat) return <div className="p-10 text-center font-display text-3xl">Chat not found.</div>;
  const other = users[chat.with] || chat.other || {};
  const displayName = other.name || other.username || chat.with || "Barter User";

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
          <img src={other.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt={displayName} />
          {other?.onlineStatus === 'online' && (
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-[var(--lime)] border-[1.5px] border-black" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg text-white">{displayName}</div>
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
        <NbButton onClick={() => setShowCoinModal(true)} className="px-3 py-2.5 h-full tint-pink" title="Send Coins" data-testid="chat-send-coins-btn">
          <Coins size={16} strokeWidth={3} />
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

      {/* Coin Transfer Modal */}
      {showCoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] nb-border-3 p-6 text-white shadow-2xl space-y-4">
            <h4 className="font-display text-2xl flex items-center gap-2">
              <Coins className="text-[var(--lime)]" size={24} strokeWidth={2.5} />
              Send Coins to {displayName}
            </h4>
            <p className="text-xs font-mono2 text-[var(--text-3)]">
              This will instantly transfer coins from your wallet to their wallet.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono2 uppercase text-[var(--text-3)] mb-1">Amount (◈)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  className="nb-input py-2 text-sm w-full bg-[var(--surface-2)]"
                  data-testid="chat-coin-amount-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono2 uppercase text-[var(--text-3)] mb-1">Optional Note</label>
                <input
                  type="text"
                  placeholder="e.g. Thanks for the quick swap!"
                  value={coinNote}
                  onChange={(e) => setCoinNote(e.target.value)}
                  className="nb-input py-2 text-sm w-full bg-[var(--surface-2)]"
                  data-testid="chat-coin-note-input"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <NbButton variant="dark" size="sm" onClick={() => setShowCoinModal(false)}>
                Cancel
              </NbButton>
              <NbButton
                size="sm"
                disabled={isSendingCoins}
                onClick={handleSendChatCoins}
                data-testid="chat-coin-confirm-btn"
              >
                {isSendingCoins ? "Sending..." : "Send Coins"}
              </NbButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
