import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Phone, Video, MoreVertical, 
  ShieldAlert, Paperclip, Smile, Send, Star, CheckCircle,
  Flag, ChevronDown, ChevronUp, Clock, Shield, Menu,
  Image as ImageIcon,
  Check, CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { 
  fetchChatRooms, 
  fetchChatRoomMessages, 
  sendChatMessage,
  requestDealConfirmation,
  respondDealConfirmation,
  fetchDealConfirmationStatus
} from '../services/api';

export default function Messages() {
  const { user, tokens } = useAuth();
  const token = tokens?.access;
  const {
    profile,
    unreadMessages,
    pendingOffers,
    unreadNotifications,
    loading: dashLoading,
  } = useDashboard();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [dealStatus, setDealStatus] = useState<any>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(true);
  const [isTradeDetailsExpanded, setIsTradeDetailsExpanded] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileTradeDetails, setShowMobileTradeDetails] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      loadRooms();
    }
  }, [token]);

  useEffect(() => {
    if (activeRoomId && token) {
      loadMessages(activeRoomId);
      loadDealStatus(activeRoomId);
    }
  }, [activeRoomId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await fetchChatRooms(token!);
      setRooms(data);
      if (data.length > 0 && !activeRoomId) {
        setActiveRoomId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId: number) => {
    try {
      setLoadingMessages(true);
      const data = await fetchChatRoomMessages(token!, roomId);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadDealStatus = async (roomId: number) => {
    try {
      const data = await fetchDealConfirmationStatus(token!, roomId);
      setDealStatus(data);
    } catch (err) {
      console.error('Error fetching deal status:', err);
      setDealStatus(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !fileInputRef.current?.files?.length) || !activeRoomId || !token) return;

    try {
      setSending(true);
      const formData = new FormData();
      if (messageInput.trim()) formData.append('message', messageInput.trim());
      
      if (fileInputRef.current?.files?.length) {
        formData.append('media', fileInputRef.current.files[0]);
      }

      const newMsg = await sendChatMessage(token, activeRoomId, formData);
      setMessages(prev => [...prev, newMsg]);
      setMessageInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Update room last message locally
      setRooms(prev => prev.map(r => {
        if (r.id === activeRoomId) {
          return {
            ...r,
            last_message: {
              message: newMsg.message || '📷 Image',
              sender_username: newMsg.sender_username,
              created_at: newMsg.created_at,
              is_read: false
            }
          };
        }
        return r;
      }));
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeRoomId || !token) return;
    try {
      await respondDealConfirmation(token, activeRoomId, 'accept');
      loadDealStatus(activeRoomId);
      loadMessages(activeRoomId); // refresh messages if system msg added
    } catch (err) {
      console.error('Error accepting offer:', err);
    }
  };
  
  const handleRejectOffer = async () => {
    if (!activeRoomId || !token) return;
    try {
      await respondDealConfirmation(token, activeRoomId, 'decline');
      loadDealStatus(activeRoomId);
      loadMessages(activeRoomId);
    } catch (err) {
      console.error('Error rejecting offer:', err);
    }
  };

  const handleRequestConfirmation = async () => {
    if (!activeRoomId || !token) return;
    try {
      await requestDealConfirmation(token, activeRoomId);
      loadDealStatus(activeRoomId);
      loadMessages(activeRoomId);
    } catch (err) {
      console.error('Error requesting confirmation:', err);
      alert('Error: Rate limit may be active or action not allowed.');
    }
  };

  // Derived active state
  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const otherUserUsername = activeRoom ? (activeRoom.user1_username === user?.username ? activeRoom.user2_username : activeRoom.user1_username) : null;
  const otherUserDisplayName = activeRoom ? (activeRoom.user1_username === user?.username ? activeRoom.user2_display_name : activeRoom.user1_display_name) : null;
  
  const isUser1 = activeRoom?.barter_interest_detail?.requester_username === user?.username;
  const offeringItem = isUser1 ? activeRoom?.barter_interest_detail?.offered_item_detail : activeRoom?.barter_interest_detail?.requested_item_detail;
  const seekingItem = isUser1 ? activeRoom?.barter_interest_detail?.requested_item_detail : activeRoom?.barter_interest_detail?.offered_item_detail;
  
  const interestStatus = activeRoom?.barter_interest_detail?.status || 'pending';
  const dealCompleted = dealStatus?.is_completed || interestStatus === 'completed';

  const filteredRooms = rooms.filter(room => {
    const searchMatch = (
      room.user1_display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.user2_display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.barter_interest_detail?.requested_item_detail?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.barter_interest_detail?.offered_item_detail?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!searchMatch) return false;
    
    if (filterTab === 'unread') return room.unread_count > 0;
    if (filterTab === 'archived') return false; // We don't have archived logic yet
    return true;
  });

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans">
      <Sidebar 
        unreadMessages={unreadMessages} 
        pendingOffers={pendingOffers} 
        onListClick={() => {}}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen relative">
        <TopNav
          profile={profile}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          onListClick={() => {}}
        />

        <main className="flex-1 overflow-hidden flex bg-white relative">
          
          {/* Column 1: Conversations Panel */}
          <div 
            className={`border-r border-border bg-bg/30 flex-col ${activeRoomId ? 'hidden lg:flex' : 'flex w-full'}`}
            style={{ width: window.innerWidth >= 1024 ? '350px' : undefined, flexShrink: 0, minWidth: window.innerWidth >= 1024 ? '350px' : undefined, maxWidth: window.innerWidth >= 1024 ? '350px' : undefined }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-white flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">Messages</h2>
              {unreadMessages > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="p-4 bg-white pb-2 border-b border-border/50">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-text-secondary" />
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button className="absolute right-3 text-text-secondary hover:text-text-primary transition-colors">
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 mt-4">
                <button 
                  onClick={() => setFilterTab('all')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${filterTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterTab('unread')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors flex items-center gap-1 ${filterTab === 'unread' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  Unread
                  {unreadMessages > 0 && (
                    <span className="bg-bg text-text-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setFilterTab('archived')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${filterTab === 'archived' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {loadingRooms ? (
                <div className="p-8 text-center text-text-secondary text-sm">Loading conversations...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center text-text-secondary text-sm">No conversations found.</div>
              ) : (
                filteredRooms.map(room => {
                  const isActive = room.id === activeRoomId;
                  const isUnread = room.unread_count > 0;
                  const otherName = room.user1_username === user?.username ? room.user2_display_name : room.user1_display_name;
                  const title = room.barter_interest_detail?.requested_item_detail?.title || 'Swap';
                  
                  const lastMsg = room.last_message;
                  const lastMsgText = lastMsg ? lastMsg.message : (room.barter_interest_detail?.status === 'accepted' ? 'Chat started' : 'Interest raised');
                  
                  const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`w-full text-left p-4 flex items-start gap-3 transition-colors border-b border-border/50 relative
                        ${isActive ? 'bg-primary/5' : 'hover:bg-bg/50'}`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                      
                      <div className="relative shrink-0 mt-1">
                        <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                          {otherName.charAt(0).toUpperCase()}
                        </div>
                        {/* Online Indicator Placeholder */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className={`font-semibold truncate pr-2 ${isUnread ? 'text-text-primary' : 'text-text-primary'}`}>
                            {otherName}
                          </h3>
                          <span className={`text-xs whitespace-nowrap ${isUnread ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                            {lastMsgTime}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate mb-1">
                          {title}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className={`text-sm truncate pr-2 ${isUnread ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                            {lastMsgText}
                          </p>
                          {isUnread && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {room.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Chat Area */}
          <div className={`flex-1 flex-col min-w-0 relative ${activeRoomId ? 'flex w-full' : 'hidden lg:flex'}`}>
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <button 
                      className="lg:hidden p-2 -ml-2 text-text-secondary hover:bg-bg rounded-lg shrink-0"
                      onClick={() => setActiveRoomId(null)}
                    >
                      <ChevronUp size={24} className="-rotate-90" />
                    </button>
                    <div className="w-10 h-10 bg-bg rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                      {otherUserDisplayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-text-primary">{otherUserDisplayName}</h2>
                        {/* Verification badge placeholder */}
                        <div className="flex items-center gap-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle size={12} />
                          Verified
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-text-secondary">
                        <span className="flex items-center gap-1 text-yellow-500 font-medium">
                          <Star size={12} fill="currentColor" /> 4.8
                        </span>
                        <span>•</span>
                        <span>15 Successful Trades</span>
                        <span>•</span>
                        <span>Trust Score: 89</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="hidden sm:block p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-xl transition-colors">
                      <Phone size={20} />
                    </button>
                    <button className="hidden sm:block p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-xl transition-colors">
                      <Video size={20} />
                    </button>
                    <button 
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-xl transition-colors"
                      onClick={() => {
                        if (window.innerWidth >= 1024) {
                          setIsTradeDetailsExpanded(!isTradeDetailsExpanded);
                        } else {
                          setShowMobileTradeDetails(true);
                        }
                      }}
                    >
                      <Menu size={20} />
                    </button>
                    <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-xl transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Safety Banner */}
                {showSafetyBanner && (
                  <div className="bg-[#FFFBEB] border-b border-yellow-200/50 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0">
                    <ShieldAlert size={16} className="text-yellow-600" />
                    <p className="text-xs text-yellow-800 font-medium">
                      Always communicate and exchange within BarterX. Stay safe!
                    </p>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] flex flex-col gap-4">
                  {loadingMessages ? (
                    <div className="text-center text-text-secondary py-10">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-text-secondary py-10">
                      No messages yet. Send a message to start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender_username === user?.username;
                      const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      // Show date separator if different from previous message
                      let showDate = false;
                      const currDate = new Date(msg.created_at).toLocaleDateString();
                      if (idx === 0) {
                        showDate = true;
                      } else {
                        const prevDate = new Date(messages[idx-1].created_at).toLocaleDateString();
                        if (currDate !== prevDate) showDate = true;
                      }

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary bg-border/40 px-3 py-1 rounded-full">
                                {currDate === new Date().toLocaleDateString() ? 'Today' : currDate}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Simple text message */}
                            {msg.message && (
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 mb-1 shadow-sm ${
                                isMe 
                                  ? 'bg-[#E3F2FD] text-text-primary rounded-tr-sm' 
                                  : 'bg-white text-text-primary border border-border/50 rounded-tl-sm'
                              }`}>
                                <p className="text-[15px] leading-relaxed">{msg.message}</p>
                              </div>
                            )}
                            
                            {/* Image message */}
                            {msg.media_url && (
                              <div className={`max-w-[70%] rounded-2xl p-1 shadow-sm mb-1 ${
                                isMe 
                                  ? 'bg-[#E3F2FD] rounded-tr-sm' 
                                  : 'bg-white border border-border/50 rounded-tl-sm'
                              }`}>
                                <img src={msg.media_url} alt="Attached media" className="rounded-xl max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                              </div>
                            )}

                            {/* Timestamp & Read Receipt */}
                            <div className={`flex items-center gap-1 text-[11px] text-text-secondary mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span>{time}</span>
                              {isMe && (
                                msg.is_read ? <CheckCheck size={14} className="text-primary" /> : <Check size={14} />
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-border shrink-0 z-10">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-[900px] mx-auto relative">
                    <div className="flex-1 bg-bg border border-border rounded-2xl flex items-end p-1 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-text-secondary hover:text-text-primary transition-colors shrink-0"
                      >
                        <Paperclip size={20} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                           if (e.target.files?.length && !messageInput) {
                              setMessageInput("Sent an image");
                           }
                        }}
                      />
                      
                      <button 
                        type="button"
                        className="p-2.5 text-text-secondary hover:text-text-primary transition-colors shrink-0"
                      >
                        <Smile size={20} />
                      </button>

                      <textarea 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-[15px] max-h-[120px] min-h-[44px]"
                        rows={1}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={sending || (!messageInput.trim() && !fileInputRef.current?.files?.length)}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                    >
                      <Send size={22} className="ml-1" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-secondary bg-[#FAFAFA]">
                <div className="w-20 h-20 bg-bg rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-border" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Select a conversation</h3>
                <p className="text-sm max-w-xs text-center">
                  Choose a conversation from the sidebar to view details or start a new one by searching for users or items.
                </p>
              </div>
            )}
          </div>

          {/* Column 3: Trade Details Panel (Static on lg, Drawer on smaller screens) */}
          {activeRoom && (
            <>
              {/* Mobile Overlay */}
              {showMobileTradeDetails && (
                <div 
                  className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                  onClick={() => setShowMobileTradeDetails(false)}
                />
              )}
              
              <div className={`
                flex flex-col shrink-0 border-l border-border bg-white transition-all duration-300
                lg:translate-x-0 lg:static lg:z-auto
                ${isTradeDetailsExpanded ? 'lg:w-[320px]' : 'lg:w-0 lg:overflow-hidden'}
                fixed top-0 right-0 h-screen z-50 w-[320px] shadow-2xl
                ${showMobileTradeDetails ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
              `}>
                <div className="flex-1 overflow-y-auto">
                  
                  {/* Offer / Swap Details Section */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-text-primary">Offer / Swap Details</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowMobileTradeDetails(false)}
                          className="lg:hidden text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <ChevronDown size={20} className="rotate-90" />
                        </button>
                        <button 
                          className="hidden lg:block text-text-secondary hover:text-text-primary transition-colors"
                          onClick={() => setIsTradeDetailsExpanded(false)}
                        >
                          <ChevronUp size={20} className="rotate-90" />
                        </button>
                      </div>
                    </div>

                  <div className="bg-[#FAFAFA] border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-text-primary">Current Swap</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md
                        ${dealCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                      `}>
                        {dealCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>

                    {/* Offering Item */}
                    <div className="mb-4">
                      <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-semibold">You are offering</p>
                      <div className="flex gap-3 items-center">
                        {offeringItem?.image_url || offeringItem?.image ? (
                          <img src={offeringItem?.image_url || offeringItem?.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                        ) : (
                          <div className="w-14 h-14 bg-bg rounded-lg border border-border flex items-center justify-center text-text-secondary">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-text-primary truncate">{offeringItem?.title || 'Open Offer'}</h4>
                          <p className="text-xs text-text-secondary truncate mt-0.5">{offeringItem?.category_name || 'Category'}</p>
                          {/* Placeholder Value */}
                          <p className="text-xs font-semibold text-text-primary mt-1">Est. Value: ₹85,000</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center my-3 relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border border-dashed" />
                      </div>
                      <div className="bg-[#FAFAFA] px-2 relative">
                        <div className="w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center">
                          <Search size={12} className="text-text-secondary transform rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Seeking Item */}
                    <div className="mb-5">
                      <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-semibold">You are seeking</p>
                      <div className="flex gap-3 items-center">
                        {seekingItem?.image_url || seekingItem?.image ? (
                          <img src={seekingItem?.image_url || seekingItem?.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                        ) : (
                          <div className="w-14 h-14 bg-bg rounded-lg border border-border flex items-center justify-center text-text-secondary">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-text-primary truncate">{seekingItem?.title || 'Item'}</h4>
                          <p className="text-xs text-text-secondary truncate mt-0.5">{seekingItem?.category_name || 'Category'}</p>
                          {/* Placeholder Value */}
                          <p className="text-xs font-semibold text-text-primary mt-1">Est. Value: ₹80,000</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!dealCompleted && (
                      <div className="flex flex-col gap-2 mt-2">
                        {isUser1 ? (
                          // Requester views
                          <>
                            <button 
                              onClick={handleRequestConfirmation}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                            >
                              Request Confirmation
                            </button>
                            <button className="w-full bg-white hover:bg-bg border border-border text-text-primary font-medium py-2.5 rounded-xl transition-colors text-sm">
                              Cancel Offer
                            </button>
                          </>
                        ) : (
                          // Receiver views (if they need to accept)
                          <>
                            <button 
                              onClick={handleAcceptOffer}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                            >
                              Accept Offer
                            </button>
                            <button className="w-full bg-white hover:bg-bg border border-primary text-primary font-medium py-2.5 rounded-xl transition-colors text-sm">
                              Counter Offer
                            </button>
                            <button 
                              onClick={handleRejectOffer}
                              className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-500 font-medium py-2.5 rounded-xl transition-colors text-sm"
                            >
                              Reject Offer
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust & Activity Section */}
                <div className="p-5">
                  <h3 className="font-semibold text-text-primary mb-4">Trust & Activity</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Trust Score</span>
                      <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-xs">
                        89 / 100
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Successful Trades</span>
                      <span className="font-semibold text-text-primary">15</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Response Rate</span>
                      <span className="font-semibold text-text-primary">98%</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Member Since</span>
                      <span className="font-semibold text-text-primary">Jan 2024</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Last Active</span>
                      <span className="flex items-center gap-1.5 font-semibold text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span>
                        Online
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-6 bg-white hover:bg-red-50 border border-red-200 text-red-500 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                    <Flag size={16} />
                    Report User
                  </button>
                </div>
              </div>
            </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
