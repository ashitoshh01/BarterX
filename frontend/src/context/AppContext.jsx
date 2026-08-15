import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { USERS, SWAP_TRACKER } from "@/mock/data";

// Default user shape for pre-auth state
const DEFAULT_USER = {
  id: "",
  handle: "",
  name: "",
  bio: "",
  avatar: "",
  location: "",
  coins: 0,
  trustScore: 0,
  swapsCompleted: 0,
  rating: 0,
  verified: false,
  joined: "",
  badges: [],
};

const FALLBACK_LISTINGS = [
  {
    id: 1,
    type: "product",
    category: 6,
    categoryName: "Electronics & Gadgets",
    title: "Sony A7 III Camera",
    description: "Mint condition body. Shutter count ~12k. Includes 2 batteries.",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Mumbai, MH",
    owner: "alex_m",
    offering: "Sony A7 III Body",
    wanting: "DJI Mavic 3 Pro or similar drone",
    status: "active",
    value: 120000,
    tags: ["Electronics", "Camera", "Sony"],
  },
  {
    id: 2,
    type: "product",
    category: 6,
    categoryName: "Electronics & Gadgets",
    title: "iPad Pro 12.9\" (M1)",
    description: "128GB, Space Gray, Wi-Fi. Always used with screen protector.",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Bengaluru, KA",
    owner: "sarah_k",
    offering: "iPad Pro + Apple Pencil 2",
    wanting: "MacBook Pro M1 (16GB RAM preferred)",
    status: "active",
    value: 75000,
    tags: ["Electronics", "Apple", "Tablet"],
  },
  {
    id: 3,
    type: "product",
    category: 1,
    categoryName: "Fashion & Apparel",
    title: "Vintage Leather Jacket",
    description: "Genuine brown leather, size L. Excellent patina, minor wear on cuffs.",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"],
    condition: "Good",
    location: "New Delhi, DL",
    owner: "marcus_t",
    offering: "Leather Jacket (Size L)",
    wanting: "Doc Martens Boots (Size 10)",
    status: "active",
    value: 12000,
    tags: ["Fashion", "Jacket", "Vintage"],
  },
  {
    id: 4,
    type: "product",
    category: 3,
    categoryName: "Media & Entertainment",
    title: "Fender Stratocaster",
    description: "Player Series Strat in 3-Color Sunburst. Maple fingerboard.",
    images: ["https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80"],
    condition: "Good",
    location: "Pune, MH",
    owner: "elena_r",
    offering: "Fender Stratocaster",
    wanting: "Analog Synthesizer / Drum Machine",
    status: "active",
    value: 55000,
    tags: ["Music", "Guitar", "Fender"],
  },
  {
    id: 5,
    type: "product",
    category: 2,
    categoryName: "Lifestyle & Home",
    title: "Ergonomic Office Chair",
    description: "High-back mesh chair with 3D armrests and lumbar support.",
    images: ["https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80"],
    condition: "Good",
    location: "Hyderabad, TS",
    owner: "david_l",
    offering: "Ergonomic Office Chair",
    wanting: "Mechanical Keyboard (Custom/Hot-swap)",
    status: "active",
    value: 18000,
    tags: ["Furniture", "Office", "Chair"],
  },
  {
    id: 6,
    type: "product",
    category: 2,
    categoryName: "Lifestyle & Home",
    title: "Espresso Machine (Breville Barista Express)",
    description: "Built-in grinder, barely used. Makes café-quality espresso at home.",
    images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Bengaluru, KA",
    owner: "chloe_w",
    offering: "Breville Barista Express Espresso Machine",
    wanting: "Air fryer or high-end blender",
    status: "active",
    value: 45000,
    tags: ["Home", "Coffee", "Appliance"],
  },
  {
    id: 7,
    type: "product",
    category: 4,
    categoryName: "Jewellery & Accessories",
    title: "Gold Plated Watch (Fossil)",
    description: "Fossil Gen 5 smartwatch, gold plated stainless steel. Excellent condition.",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Jaipur, RJ",
    owner: "riya_s",
    offering: "Fossil Gen 5 Gold Smartwatch",
    wanting: "Garmin sports watch or Apple Watch",
    status: "active",
    value: 15000,
    tags: ["Watch", "Accessories", "Fossil"],
  },
  {
    id: 8,
    type: "product",
    category: 1,
    categoryName: "Fashion & Apparel",
    title: "Nike Air Jordan 1 Retro High",
    description: "Size UK 9, Chicago colorway. Worn twice, comes with original box.",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Chennai, TN",
    owner: "arjun_p",
    offering: "Air Jordan 1 Chicago UK9",
    wanting: "Adidas Yeezy Boost 350 (any colorway, UK9)",
    status: "active",
    value: 28000,
    tags: ["Fashion", "Sneakers", "Nike"],
  },
  {
    id: 9,
    type: "product",
    category: 5,
    categoryName: "Automotive & Accessories",
    title: "Car Dash Cam (Garmin 67W)",
    description: "1440p front camera, GPS. 6 months old, with all accessories.",
    images: ["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Ahmedabad, GJ",
    owner: "vikram_s",
    offering: "Garmin 67W Dash Cam",
    wanting: "OBD2 scanner or car emergency kit",
    status: "active",
    value: 14000,
    tags: ["Automotive", "DashCam", "Garmin"],
  },
  {
    id: 10,
    type: "product",
    category: 6,
    categoryName: "Electronics & Gadgets",
    title: "Custom Mechanical Keyboard (Keychron Q1)",
    description: "75% layout, hot-swappable Gateron Pro switches, RGB backlighting.",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80"],
    condition: "Like New",
    location: "Kolkata, WB",
    owner: "neha_g",
    offering: "Keychron Q1 Mechanical Keyboard",
    wanting: "Wireless Noise Cancelling Headphones",
    status: "active",
    value: 16000,
    tags: ["Electronics", "Keyboard", "Keychron"],
  }
];

const AppContext = createContext(null);

// ─── Schema Mapping Helpers ──────────────────────────────────────────────────

const getAbsoluteUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const backendBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const slashPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendBase}${slashPath}`;
};

export const parseBackendError = (err, fallbackMsg) => {
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (typeof data === "object") {
      const messages = [];
      for (const [field, errors] of Object.entries(data)) {
        const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        if (Array.isArray(errors)) {
          messages.push(`${fieldName}: ${errors.join(", ")}`);
        } else if (typeof errors === "string") {
          messages.push(`${fieldName}: ${errors}`);
        } else {
          messages.push(`${fieldName}: ${JSON.stringify(errors)}`);
        }
      }
      if (messages.length > 0) return messages.join(" | ");
    }
  }
  return err.message || fallbackMsg;
};

const mapUserProfile = (profile) => ({
  id: profile.username,
  handle: `@${profile.username}`,
  name: profile.display_name || profile.username,
  bio: profile.bio || "",
  avatar: profile.profile_picture_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  city: profile.city || "",
  state: profile.state || "",
  country: profile.country || "",
  profession: profile.profession || "",
  location: profile.location_name || (profile.city && profile.state ? `${profile.city}, ${profile.state}` : (profile.location || "Location not set")),
  location_name: profile.location_name || "",
  latitude: profile.latitude ?? null,
  longitude: profile.longitude ?? null,
  coins: profile.coin_balance ?? 0,
  trustScore: profile.trust_score ?? 20,
  swapsCompleted: profile.reward_points ? Math.floor(profile.reward_points / 50) : 0,
  rating: profile.average_rating ?? 0.0,
  verified: profile.is_verified ?? false,
  joined: profile.member_since || "",
  badges: profile.badges || [],
});

const mapCategory = (cat) => {
  const nameLower = cat.name.toLowerCase();
  let tint = "tint-mint";
  let emoji = "✦";
  if (nameLower.includes("book") || nameLower.includes("note")) {
    tint = "tint-pink"; emoji = "📚";
  } else if (nameLower.includes("electronic") || nameLower.includes("tech")) {
    tint = "tint-blue"; emoji = "💻";
  } else if (nameLower.includes("hostel") || nameLower.includes("essential")) {
    tint = "tint-amber"; emoji = "🛏️";
  } else if (nameLower.includes("cloth") || nameLower.includes("wear") || nameLower.includes("apparel") || nameLower.includes("accessor")) {
    tint = "tint-purple"; emoji = "👕";
  } else if (nameLower.includes("sport") || nameLower.includes("hobby") || nameLower.includes("game")) {
    tint = "tint-mint"; emoji = "⚽";
  } else if (nameLower.includes("service")) {
    tint = "tint-lime"; emoji = "🛠️";
  } else {
    tint = "tint-pink"; emoji = "📦";
  }
  return {
    id: cat.id,
    name: cat.name,
    tint,
    emoji,
    type: cat.is_service ? "service" : "product",
  };
};

const mapItemToListing = (item) => {
  const images = [];
  if (item.image) {
    images.push(getAbsoluteUrl(item.image));
  } else if (item.image_url) {
    images.push(getAbsoluteUrl(item.image_url));
  } else {
    images.push("https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800");
  }
  if (item.additional_images && item.additional_images.length > 0) {
    item.additional_images.forEach(img => {
      images.push(getAbsoluteUrl(img.image));
    });
  }

  const conditionLabels = {
    brand_new: "New",
    like_new: "Like New",
    used: "Good",
    refurbished: "Fair",
    not_applicable: "Service"
  };

  return {
    id: item.id,
    type: item.category_name ? (item.category_name.toLowerCase().includes("service") ? "service" : "product") : "product",
    category: item.category,
    title: item.title,
    description: item.description,
    images: images,
    owner: (typeof item.owner === "object" && item.owner !== null)
      ? {
          id: item.owner.id,
          username: item.owner.username,
          name: item.owner.display_name || item.owner.username,
          handle: `@${item.owner.username}`,
          avatar: getAbsoluteUrl(item.owner.avatar) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
          verified: item.owner.verified || false,
          trustScore: item.owner.trust_score || 50,
          rating: item.owner.rating || 0.0,
          coinBalance: item.owner.coin_balance || 0,
        }
      : {
          id: item.owner_username || "anonymous",
          username: item.owner_username || "anonymous",
          name: item.owner_username || "anonymous",
          handle: `@${item.owner_username || "anonymous"}`,
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
          verified: false,
          trustScore: 50,
          rating: 0.0,
          coinBalance: 0,
        },
    condition: conditionLabels[item.condition] || "Good",
    estValue: parseFloat(item.purchase_price) || 0,
    wants: item.wanting ? item.wanting.split(",").map(x => x.trim()) : ["anything"],
    tags: [item.category_name].filter(Boolean),
    location: item.location_name || item.location,
    location_name: item.location_name || "",
    city: item.city || "",
    state: item.state || "",
    country: item.country || "",
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    distance_km: item.distance_km ?? null,
    distance_formatted: item.distance_formatted || (item.distance_km !== null && item.distance_km !== undefined ? `${item.distance_km} km away` : null),
    posted: item.created_at ? new Date(item.created_at).toLocaleDateString() : "recently",
    views: item.views_count ?? 0,
    saves: 0,
    item_score: item.item_score,
    status: item.status,
    isBoosted: item.is_boosted,
    boostExpiresAt: item.boost_expires_at,
    proposalCount: item.proposal_count ?? 0,
    chatCount: item.chat_count ?? 0,
    history: item.history_logs || [],
  };
};

const mapInterestToProposal = (interest, currentUserUsername) => {
  const isIncoming = interest.receiver_username === currentUserUsername;
  const requestedItemId = interest.requested_item ?? interest.requested_item_detail?.id;
  const offeredItemId = interest.offered_item ?? interest.offered_item_detail?.id;
  const theirItemId = isIncoming ? offeredItemId : requestedItemId;
  const yourItemId = isIncoming ? requestedItemId : offeredItemId;

  return {
    id: interest.id,
    direction: isIncoming ? "incoming" : "outgoing",
    from: interest.requester_username,
    to: interest.receiver_username,
    fromName: interest.requester_display_name || interest.requester_username,
    toName: interest.receiver_display_name || interest.receiver_username,
    theirItem: theirItemId,
    yourItem: yourItemId,
    status: interest.status,
    message: interest.proposal_message || (isIncoming
      ? `Hey! Would love the ${interest.requested_item_detail?.title || "requested item"} for my ${interest.offered_item_detail?.title || "item"}.`
      : `Proposed swap of my ${interest.offered_item_detail?.title || "item"} for your ${interest.requested_item_detail?.title || "requested item"}.`),
    created: interest.created_at ? new Date(interest.created_at).toLocaleDateString() : "recently",
    canAccept: Boolean(interest.can_accept),
    canCounter: Boolean(interest.can_counter),
    canDecline: Boolean(interest.can_decline),
    canCancel: Boolean(interest.can_cancel),
    isReadOnly: Boolean(interest.is_read_only),
    chatRoomId: interest.chat_room_id,
    requestedItemDetail: interest.requested_item_detail,
    offeredItemDetail: interest.offered_item_detail,
    coinsOffered: interest.coins_offered || 0,
  };
};

// Map backend notification_type to frontend icon type
const NOTIF_TYPE_MAP = {
  interest_received: "proposal",
  interest_accepted: "proposal",
  interest_rejected: "proposal",
  match_found: "match",
  chat_message: "chat",
  coin_earned: "coins",
  coin_spent: "coins",
  system: "system",
};

const mapNotification = (n) => ({
  id: n.id,
  type: NOTIF_TYPE_MAP[n.notification_type] || "system",
  text: n.title || n.message || "Notification",
  title: n.title,
  body: n.message,
  time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "recently",
  read: n.is_read,
});


const mapConversation = (conv, currentUser) => {
  const currentUsername = typeof currentUser === 'string' ? currentUser : (currentUser?.id || currentUser?.username);
  const participants = conv.participants_detail || [];
  const otherParticipant = conv.other_participant || participants.find((p) => p.username !== currentUsername) || participants[0] || {};
  
  const lastMsg = conv.last_message_detail || (typeof conv.last_message === 'object' ? conv.last_message : {}) || {};
  
  const lastMsgText = lastMsg.text || (lastMsg.message_type === 'IMAGE' ? "📷 Image" : lastMsg.message_type === 'FILE' ? "📁 Attachment" : "");
  const lastTimeText = lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";

  return {
    id: String(conv.id),
    with: otherParticipant.username || "anonymous",
    lastMessage: lastMsgText,
    lastTime: lastTimeText,
    unread: conv.unread_count || 0,
    messages: [],
    other: {
      username: otherParticipant.username || "user",
      name: otherParticipant.display_name || otherParticipant.username || "User",
      avatar: getAbsoluteUrl(otherParticipant.avatar),
      trustScore: otherParticipant.trust_score || 50,
      onlineStatus: otherParticipant.online_status || 'offline',
      lastSeen: otherParticipant.last_seen || ''
    }
  };
};

const mapMessage = (msg) => ({
  id: msg.id,
  from: msg.sender_username,
  text: msg.text || (msg.message_type === 'IMAGE' ? "📷 Image" : msg.message_type === 'FILE' ? "📁 Attachment" : ""),
  time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "just now",
  messageType: msg.message_type,
  attachmentUrl: getAbsoluteUrl(msg.attachment),
  replyTo: msg.reply_to,
  isRead: msg.read_at !== null
});

const mapWalletTransaction = (t) => {
  const isEarn = ['earned', 'purchased', 'TRADE_RECEIPT', 'PURCHASE', 'REFUND', 'BONUS'].includes(t.transaction_type);
  return {
    id: String(t.id),
    type: isEarn ? 'earn' : 'spend',
    amount: isEarn ? Math.abs(t.amount) : -Math.abs(t.amount),
    reason: t.description || (t.transaction_type === 'PURCHASE' ? 'Coins purchased' : 'Coins spent'),
    time: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'recently',
  };
};

const mapReview = (r) => ({
  id: String(r.id),
  from: r.reviewer_display_name || r.reviewer_username || 'Anonymous',
  to: r.reviewed_user_username,
  rating: r.rating || 5,
  text: r.comment || '',
  time: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'recently',
});

const mapContract = (c, username) => {
  const isPartyA = c.party_a_username === username;
  return {
    id: String(c.id),
    partyA: c.party_a_username,
    partyB: c.party_b_username,
    partyADisplay: c.party_a_display_name,
    partyBDisplay: c.party_b_display_name,
    status: c.status, // pending, signed
    items: [
      c.barter_interest?.requested_item?.title || "Item",
      c.barter_interest?.offered_item?.title || "Item"
    ].filter(Boolean),
    terms: c.terms || [],
    signedA: c.signed_a,
    signedB: c.signed_b,
    direction: isPartyA ? 'A' : 'B'
  };
};

const mapDispute = (d) => ({
  id: String(d.id),
  against: d.against_username,
  againstDisplay: d.against_name,
  reason: d.reason,
  detail: d.detail,
  status: d.status,
  opened: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'recently',
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [isAuthed, setIsAuthed] = useState(false);
  const [listings, setListings] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [chats, setChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [contracts, setContracts] = useState([]);
  const [trades, setTrades] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socketRef = React.useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const activeRoomIdRef = React.useRef(null);

  const userRef = React.useRef(user);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  const connectWebSocket = useCallback((token) => {
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (e) {}
    }

    const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.REACT_APP_WS_URL || `${window.location.hostname}:8000`;
    // NOTE: token is NOT in the URL — it is sent as the first message after
    // connect to avoid leaking it into server access logs.
    const wsUrl = `${wsScheme}//${host}/ws/chat/`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      // Send auth handshake immediately — server expects this as first message.
      ws.send(JSON.stringify({ type: "authenticate", token }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        // Auth confirmation — upgrade state once server confirms identity.
        if (type === "authenticated") {
          console.log("WebSocket authenticated, user_id:", data?.user_id);
          setWsConnected(true);
          return;
        }

        if (type === "auth_error") {
          console.error("WebSocket auth failed:", data?.message);
          ws.close(4001);
          return;
        }

        console.log("WS Event received:", type, data);


        if (type === "chat.message") {
          const conversationId = String(payload.conversation_id || (data && data.conversation) || "");
          if (!conversationId) return;

          const mappedMsg = {
            id: data.id,
            from: data.sender_username,
            text: data.text,
            time: data.created_at ? new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "just now",
            messageType: data.message_type,
            attachmentUrl: getAbsoluteUrl(data.attachment),
            replyTo: data.reply_to,
            isRead: data.read_at !== null
          };

          setChats((prev) => {
            let roomExists = prev.some((c) => c.id === conversationId);
            if (!roomExists) {
              api.get("/chatrooms/").then((res) => {
                const mappedChats = res.data.map(c => mapConversation(c, userRef.current));
                setChats(mappedChats);
              });
              return prev;
            }

            return prev.map((c) => {
              if (c.id === conversationId) {
                const alreadyExists = c.messages.some((m) => m.id === mappedMsg.id);
                const updatedMessages = alreadyExists ? c.messages : [...c.messages, mappedMsg];
                return {
                  ...c,
                  lastMessage: mappedMsg.text || (mappedMsg.messageType === 'IMAGE' ? "📷 Image" : "📁 Attachment"),
                  lastTime: mappedMsg.time,
                  unread: c.id === activeRoomIdRef.current ? 0 : c.unread + 1,
                  messages: updatedMessages
                };
              }
              return c;
            });
          });

          if (conversationId !== activeRoomIdRef.current) {
            toast.info(`New message from ${data.sender_username}: ${data.text.substring(0, 30)}`);
          }
        }

        else if (type === "chat.edited") {
          const conversationId = String(payload.conversation_id || (data && data.conversation) || "");
          setChats((prev) => prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: c.messages.map((m) => m.id === data.id ? { ...m, text: data.text, edited: true } : m)
              };
            }
            return c;
          }));
        }

        else if (type === "chat.deleted") {
          const conversationId = String(data.conversation_id);
          setChats((prev) => prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: c.messages.map((m) => m.id === data.message_id ? { ...m, text: "This message was deleted.", deleted: true } : m)
              };
            }
            return c;
          }));
        }

        else if (type === "typing.start" || type === "typing.stop") {
          const conversationId = String(data.conversation_id);
          setChats((prev) => prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                isTyping: type === "typing.start",
                typingUser: data.display_name || data.username
              };
            }
            return c;
          }));
        }

        else if (type === "presence.update") {
          setChats((prev) => prev.map((c) => {
            if (c.with === data.username) {
              return {
                ...c,
                other: {
                  ...c.other,
                  onlineStatus: data.online_status,
                  lastSeen: data.last_seen
                }
              };
            }
            return c;
          }));
        }

        else if (type === "notification.created") {
          const mappedNotif = mapNotification(data);
          setNotifications((prev) => [mappedNotif, ...prev]);
          toast.success(`Notification: ${data.title}`);
        }

        else if (type === "proposal.updated") {
          setProposals((prev) => prev.map((p) => {
            if (p.id !== data.id) return p;
            const nextStatus = data.status || p.status;
            return {
              ...p,
              status: nextStatus,
              canAccept: nextStatus === "pending",
              canCounter: nextStatus === "pending" || nextStatus === "negotiating",
              canDecline: ["pending", "negotiating", "countered"].includes(nextStatus),
              canCancel: !["declined", "cancelled"].includes(nextStatus),
              isReadOnly: ["accepted", "declined", "cancelled"].includes(nextStatus),
            };
          }));
        }

        else if (type === "wallet.updated") {
          setUser((prev) => ({ ...prev, coins: data.balance }));
        }

        else if (type === "wallet_updated") {
          setUser((prev) => ({ 
            ...prev, 
            coins: data.available_balance,
            coins_reserved: data.reserved_balance,
            total_coins_earned: data.total_earned,
            total_coins_spent: data.total_spent,
            total_coins_purchased: data.total_purchased
          }));
          api.get("/wallet/ledger/").then((res) => {
            const walletList = res.data.results || res.data;
            setWallet(walletList.map(mapWalletTransaction));
          }).catch(console.warn);
        }

        else if (type === "chat_limit_reached") {
          toast.error(data.message || "You have reached your chat message limit.");
          window.dispatchEvent(new CustomEvent('chat_limit_event', { detail: { reached: true, data } }));
        }

        else if (type === "chat_limit_warning") {
          toast.warning(data.message || "You are approaching your chat message limit.");
          window.dispatchEvent(new CustomEvent('chat_limit_event', { detail: { warning: true, data } }));
        }

        else if (type === "chat_limit_info") {
          window.dispatchEvent(new CustomEvent('chat_limit_event', { detail: { info: true, data } }));
        }
      } catch (err) {
        console.error("Error parsing socket message:", err);
      }
    };

    ws.onclose = (event) => {
      setWsConnected(false);
      // Only retry up to 3 times to prevent log spamming when server is in standard HTTP mode
      if (!ws._retryCount) ws._retryCount = 0;
      if (ws._retryCount < 3) {
        ws._retryCount += 1;
        console.log(`WebSocket disconnected. Retrying (${ws._retryCount}/3) in 5 seconds...`);
        setTimeout(() => {
          const currentToken = localStorage.getItem("barter_token");
          if (currentToken) {
            connectWebSocket(currentToken);
          }
        }, 5000);
      } else {
        console.log("WebSocket max retry limit reached. Real-time updates paused.");
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("barter_token");
    localStorage.removeItem("barter_refresh_token");
    setIsAuthed(false);
    setUser(DEFAULT_USER);
    setListings([]);
    setProposals([]);
    setChats([]);
    setNotifications([]);
    setCategoriesList([]);
    setWallet([]);
    setReviewsList([]);
    setContracts([]);
    setTrades([]);
    setDisputes([]);
    setAiMatches([]);
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (e) {}
      socketRef.current = null;
    }
  }, []);

  const initializeApp = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const profileRes = await api.get("/profile/");
      const mappedUser = mapUserProfile(profileRes.data);
      setUser(mappedUser);
      setIsAuthed(true);

      // Fetch categories
      const catRes = await api.get("/categories/");
      const catList = catRes.data.results || catRes.data;
      const mappedCategories = catList.map(mapCategory);
      setCategoriesList(mappedCategories);

      // Fetch items feed
      try {
        const itemsRes = await api.get("/items/");
        const itemsList = itemsRes.data.results || itemsRes.data;
        const mappedListings = itemsList.map(mapItemToListing);
        setListings(mappedListings.length > 0 ? mappedListings : FALLBACK_LISTINGS);
      } catch (err) {
        console.warn("Failed to fetch items from backend, using fallback listings:", err);
        setListings(FALLBACK_LISTINGS);
      }

      // Fetch interests/proposals
      const interestsRes = await api.get("/interests/");
      const interestsList = interestsRes.data.results || interestsRes.data;
      const mappedProposals = interestsList.map((i) => mapInterestToProposal(i, profileRes.data.username));
      setProposals(mappedProposals);

      // Fetch notifications
      const notifRes = await api.get("/notifications/");
      const notifList = notifRes.data.results || notifRes.data;
      const mappedNotifications = notifList.map(mapNotification);
      setNotifications(mappedNotifications);

      // Fetch chats
      const chatsRes = await api.get("/chatrooms/");
      const chatsList = chatsRes.data.results || chatsRes.data;
      const mappedChats = chatsList.map(c => mapConversation(c, profileRes.data));
      setChats(mappedChats);

      // Fetch wallet transactions
      try {
        const walletRes = await api.get("/wallet/ledger/");
        const walletList = walletRes.data.results || walletRes.data;
        setWallet(walletList.map(mapWalletTransaction));
      } catch (err) {
        console.warn("Failed to fetch wallet transactions", err);
        setWallet([]);
      }

      // Fetch reviews
      try {
        const reviewsRes = await api.get("/reviews/");
        const reviewsList = reviewsRes.data.results || reviewsRes.data;
        setReviewsList(reviewsList.map(mapReview));
      } catch (err) {
        console.warn("Failed to fetch reviews", err);
        setReviewsList([]);
      }

      // Fetch contracts
      try {
        const contractsRes = await api.get("/contracts/");
        const contractsList = contractsRes.data.results || contractsRes.data;
        setContracts(contractsList.map(c => mapContract(c, profileRes.data.username)));
      } catch (err) {
        console.warn("Failed to fetch contracts", err);
      }

      // Fetch trades (Logistics)
      try {
        const tradesRes = await api.get("/trades/");
        setTrades(tradesRes.data.results || tradesRes.data);
      } catch (err) {
        console.warn("Failed to fetch trades", err);
      }

      // Fetch disputes
      try {
        const disputesRes = await api.get("/disputes/");
        const disputesList = disputesRes.data.results || disputesRes.data;
        setDisputes(disputesList.map(mapDispute));
      } catch (err) {
        console.warn("Failed to fetch disputes", err);
      }
      
      // Fetch AI Matches
      try {
        const matchesRes = await api.get("/recommendations/matches/");
        // Map backend to frontend shape
        const mappedMatches = (matchesRes.data || []).map((m) => {
          const userItemId = m.user_item_id || (m.id ? Number((m.id.split("_")[2] || 0)) : null);
          const matchItemId = m.match_item_id || m.item_id;
          return {
            id: m.id,
            yourItem: userItemId,
            theirItem: matchItemId,
            score: m.final_score || m.confidence || 85,
            aiScore: m.ai_score || 85,
            proximityScore: m.proximity_score ?? null,
            trustScore: m.trust_score ?? 50,
            distanceKm: m.distance_km ?? null,
            distanceFormatted: m.distance_formatted || null,
            reason: m.reason || "AI-powered match",
          };
        });
        setAiMatches(mappedMatches);
      } catch (err) {
        console.warn("Failed to fetch AI matches", err);
        setAiMatches([]);
      }

      // Fetch saved items
      try {
        const savedRes = await api.get("/saved-items/");
        const rawSaved = savedRes.data.results || savedRes.data || [];
        const savedIds = new Set(rawSaved.map((s) => s.item));
        setSaved(savedIds);
      } catch (err) {
        console.warn("Failed to fetch saved items", err);
      }

      // Connect WebSocket
      connectWebSocket(token);
    } catch (err) {
      console.error("Failed to initialize app data:", err);
      setError("Failed to load initial app data. Please try again.");
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout, connectWebSocket]);

  useEffect(() => {
    const token = localStorage.getItem("barter_token");
    if (token) {
      if (token === "demo-token") {
        setUser({
          id: 1,
          handle: "alex_m",
          name: "Alex M.",
          bio: "Active trader on BarterX",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          location: "Mumbai, MH",
          coins: 100,
          trustScore: 85,
          swapsCompleted: 12,
          rating: 4.9,
          verified: true,
          joined: "2024",
          badges: ["Verified Swapper", "Power Trader"],
        });
        setListings(FALLBACK_LISTINGS);
        setIsAuthed(true);
        setLoading(false);
      } else {
        initializeApp(token);
      }
    } else {
      // Unauthenticated visitor (e.g. browsing Vercel landing page / feed)
      api.get("/items/").then(res => {
        const list = res.data.results || res.data;
        setListings(list && list.length > 0 ? list.map(mapItemToListing) : FALLBACK_LISTINGS);
      }).catch(() => {
        setListings(FALLBACK_LISTINGS);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [initializeApp]);

  // login(identifier, password) — accepts email OR username
  // login("__google__", "__google__", existingToken) — Google OAuth bypass
  const login = useCallback(async (identifier, password, existingToken = null) => {
    try {
      setError(null);

      // Google OAuth flow — token already obtained externally
      if (existingToken) {
        await initializeApp(existingToken);
        return { success: true };
      }

      // Normal email/username + password flow
      const res = await api.post("/login/", { username: identifier, password });
      localStorage.setItem("barter_token", res.data.access);
      localStorage.setItem("barter_refresh_token", res.data.refresh);

      await initializeApp(res.data.access);
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      const msg =
        err.response?.data?.detail ||
        (err.request
          ? "Server is unreachable. Make sure the backend is running."
          : "Login failed. Please check your credentials.");
      return { success: false, error: msg };
    }
  }, [initializeApp]);


  const toggleSave = useCallback(async (id) => {
    if (!isAuthed) {
      toast.error("Please log in to save items. ❤️");
      return;
    }
    // Optimistic update
    setSaved((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
    try {
      const res = await api.post("/saved-items/toggle/", { item_id: id });
      if (res.data.saved) {
        toast.success("Saved to favorites ❤️");
      } else {
        toast.info("Removed from saved items");
      }
    } catch (err) {
      // Revert on error
      setSaved((prev) => {
        const s = new Set(prev);
        if (s.has(id)) s.delete(id); else s.add(id);
        return s;
      });
      toast.error("Failed to update saved item.");
    }
  }, [isAuthed]);

  const addListing = useCallback(async (listing) => {
    try {
      setError(null);

      const conditionMap = {
        "New": "brand_new",
        "Like New": "like_new",
        "Good": "used",
        "Fair": "used",
        "Needs Repair": "refurbished",
        "Digital Item": "not_applicable",
        "Service": "not_applicable"
      };

      const formData = new FormData();
      formData.append("title", listing.title);
      formData.append("description", listing.description);
      formData.append("offering", listing.title);
      formData.append("wanting", listing.wants && listing.wants.length > 0 ? listing.wants.join(", ") : "anything");
      formData.append("category", listing.category);
      formData.append("condition", conditionMap[listing.condition] || "used");
      formData.append("location", listing.location || "Remote");
      if (listing.latitude !== undefined && listing.latitude !== null) formData.append("latitude", listing.latitude);
      if (listing.longitude !== undefined && listing.longitude !== null) formData.append("longitude", listing.longitude);
      if (listing.location_name) formData.append("location_name", listing.location_name);
      if (listing.city) formData.append("city", listing.city);
      if (listing.state) formData.append("state", listing.state);
      if (listing.country) formData.append("country", listing.country);
      formData.append("age_months", listing.age_months || 0);
      formData.append("purchase_price", listing.estValue || 0.0);

      // Now append the images as Files directly!
      if (listing.images && listing.images.length > 0) {
        listing.images.forEach((file) => {
          formData.append("images", file);
        });
      }

      const res = await api.post("/items/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newListing = mapItemToListing(res.data);
      setListings((prev) => [newListing, ...prev]);
      return newListing;
    } catch (err) {
      console.error("Failed to add listing:", err);
      const msg = err.response?.data?.detail || (err.request ? "Server is unreachable. Please make sure the backend is running." : "Failed to create listing.");
      setError(msg);
      throw err;
    }
  }, []);

  const editListing = useCallback(async (id, listingData) => {
    try {
      setError(null);
      
      const conditionMap = {
        "New": "brand_new",
        "Like New": "like_new",
        "Good": "used",
        "Fair": "used",
        "Needs Repair": "refurbished",
        "Digital Item": "not_applicable",
        "Service": "not_applicable"
      };

      const formData = new FormData();
      formData.append("title", listingData.title);
      formData.append("description", listingData.description);
      formData.append("offering", listingData.title);
      formData.append("wanting", listingData.wants && listingData.wants.length > 0 ? listingData.wants.join(", ") : "anything");
      formData.append("category", listingData.category);
      formData.append("condition", conditionMap[listingData.condition] || "used");
      formData.append("location", listingData.location || "Remote");
      if (listingData.latitude !== undefined && listingData.latitude !== null) formData.append("latitude", listingData.latitude);
      if (listingData.longitude !== undefined && listingData.longitude !== null) formData.append("longitude", listingData.longitude);
      if (listingData.location_name) formData.append("location_name", listingData.location_name);
      if (listingData.city) formData.append("city", listingData.city);
      if (listingData.state) formData.append("state", listingData.state);
      if (listingData.country) formData.append("country", listingData.country);
      formData.append("purchase_price", listingData.estValue || 0.0);
      formData.append("status", listingData.status || "active");

      // Handle image ordering and file categorization
      const order = [];
      let newFileCount = 0;
      if (listingData.images && listingData.images.length > 0) {
        listingData.images.forEach((file) => {
          if (typeof file === "string") {
            order.push(`retained:${file}`);
          } else {
            order.push(`new:${newFileCount}`);
            formData.append("new_images", file);
            newFileCount++;
          }
        });
      }
      formData.append("image_order", JSON.stringify(order));

      const res = await api.put(`/items/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedListing = mapItemToListing(res.data);
      setListings((prev) => prev.map((l) => l.id === id ? updatedListing : l));
      return updatedListing;
    } catch (err) {
      console.error("Failed to edit listing:", err);
      const msg = parseBackendError(err, "Failed to edit listing.");
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const deleteListing = useCallback(async (id) => {
    try {
      setError(null);
      await api.delete(`/items/${id}/`);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete listing:", err);
      const msg = err.response?.data?.detail || (err.request ? "Server is unreachable. Please make sure the backend is running." : "Failed to delete listing.");
      setError(msg);
      throw err;
    }
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      setLoading(true);
      const itemsRes = await api.get("/items/");
      const itemsList = itemsRes.data.results || itemsRes.data;
      const mappedListings = itemsList.map(mapItemToListing);
      setListings(mappedListings);
    } catch (err) {
      console.error("Failed to refresh feed:", err);
      setError("Failed to refresh feed listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getNearbyListings = useCallback(async (params = {}) => {
    try {
      setError(null);
      const res = await api.get("/items/nearby/", { params });
      const rawList = res.data.results || [];
      const mapped = rawList.map(mapItemToListing);
      return {
        count: res.data.count || mapped.length,
        radiusKm: res.data.radius_km || params.radius || 10,
        userLatitude: res.data.user_latitude,
        userLongitude: res.data.user_longitude,
        listings: mapped
      };
    } catch (err) {
      console.error("Failed to fetch nearby listings:", err);
      const msg = parseBackendError(err, "Location is not available. Please set your location first.");
      throw new Error(msg);
    }
  }, []);

  const respondProposal = useCallback(async (id, action, payload = {}) => {
    try {
      setError(null);
      if (action === "accept") {
        await api.post(`/interests/${id}/accept/`);
      } else if (action === "decline") {
        await api.post(`/interests/${id}/decline/`);
      } else if (action === "counter") {
        await api.post(`/interests/${id}/counter/`, payload);
      } else if (action === "cancel") {
        await api.post(`/interests/${id}/cancel/`);
      } else {
        throw new Error(`Unsupported proposal action: ${action}`);
      }

      const nextStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : action === "counter" ? "countered" : action === "cancel" ? "cancelled" : null;
      if (nextStatus) {
        setProposals((prev) => prev.map((p) => p.id === id ? {
          ...p,
          status: nextStatus,
          canAccept: false,
          canCounter: false,
          canDecline: false,
          canCancel: false,
          isReadOnly: true,
        } : p));
      }
      toast.success(`Proposal ${action}!`);
    } catch (err) {
      console.error("Failed to respond to proposal:", err);
      const msg = err.response?.data?.detail || "Failed to update proposal status.";
      toast.error(msg);
      throw err;
    }
  }, []);

  const createProposal = useCallback(async (requestedItemId, offeredItemId, proposalMessage = "", coinsOffered = 0) => {
    try {
      setError(null);
      const res = await api.post("/interests/", {
        requested_item: requestedItemId,
        offered_item: offeredItemId,
        proposal_message: proposalMessage,
        coins_offered: Number(coinsOffered || 0),
      });
      const newProposal = mapInterestToProposal(res.data, user?.id);
      setProposals((prev) => [newProposal, ...prev]);

      const itemsRes = await api.get("/items/");
      const itemsList = itemsRes.data.results || itemsRes.data;
      setListings(itemsList.map(mapItemToListing));

      return newProposal;
    } catch (err) {
      console.error("Failed to send proposal:", err);
      const msg = err.response?.data?.detail || "Failed to send swap proposal.";
      throw new Error(msg);
    }
  }, [user?.id]);

  const loadChatMessages = useCallback(async (chatId) => {
    try {
      const res = await api.get(`/chatrooms/${chatId}/messages/`);
      const msgsList = res.data.results || res.data;
      const mappedMsgs = msgsList.map(mapMessage);
      setChats((prev) => prev.map((c) => c.id === String(chatId) ? { ...c, messages: mappedMsgs } : c));
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    }
  }, []);

  const joinChatRoom = useCallback((chatId) => {
    activeRoomIdRef.current = String(chatId);
    setChats((prev) => prev.map((c) => c.id === String(chatId) ? { ...c, unread: 0 } : c));

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "join_room",
        data: { conversation_id: Number(chatId) }
      }));
    }
  }, []);

  const leaveChatRoom = useCallback((chatId) => {
    if (activeRoomIdRef.current === String(chatId)) {
      activeRoomIdRef.current = null;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "leave_room",
        data: { conversation_id: Number(chatId) }
      }));
    }
  }, []);

  const setTypingStatus = useCallback((chatId, isTyping) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: isTyping ? "typing_start" : "typing_stop",
        data: { conversation_id: Number(chatId) }
      }));
    }
  }, []);

  const startListingChat = useCallback(async (listingId) => {
    try {
      const res = await api.post("/chatrooms/get_or_create_for_listing/", { listing_id: listingId });
      const mapped = mapConversation(res.data, user);
      
      setChats((prev) => {
        const alreadyExists = prev.some((c) => c.id === mapped.id);
        if (alreadyExists) return prev;
        return [mapped, ...prev];
      });
      return mapped.id;
    } catch (err) {
      console.error("Failed to start listing chat:", err);
      const msg = parseBackendError(err, "Failed to start listing chat.");
      toast.error(msg);
      throw new Error(msg);
    }
  }, [user]);

  const sendMessage = useCallback((chatId, text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "send_message",
        data: {
          conversation_id: Number(chatId),
          text: text
        }
      }));

      const optimisticMsg = {
        id: `opt_${Date.now()}`,
        from: user.id,
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isPending: true
      };

      setChats((prev) => prev.map((c) => c.id === String(chatId) ? {
        ...c,
        lastMessage: text,
        lastTime: optimisticMsg.time,
        messages: [...c.messages, optimisticMsg]
      } : c));
    } else {
      api.post(`/chatrooms/${chatId}/send_message/`, { message: text })
        .then((res) => {
          const mapped = mapMessage(res.data);
          setChats((prev) => prev.map((c) => {
            if (c.id === String(chatId)) {
              const cleaned = c.messages.filter((m) => !m.isPending);
              return {
                ...c,
                lastMessage: mapped.text,
                lastTime: mapped.time,
                messages: [...cleaned, mapped]
              };
            }
            return c;
          }));
          loadChatMessages(chatId);
        })
        .catch((err) => {
          toast.error("Failed to send message.");
        });
    }
  }, [user, loadChatMessages]);

  const sendAttachment = useCallback(async (chatId, fileObj) => {
    try {
      const formData = new FormData();
      formData.append("media", fileObj);
      const res = await api.post(`/chatrooms/${chatId}/send_message/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const mapped = mapMessage(res.data);
      setChats((prev) => prev.map((c) => {
        if (c.id === String(chatId)) {
          return {
            ...c,
            lastMessage: mapped.text,
            lastTime: mapped.time,
            messages: [...c.messages, mapped]
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Failed to send attachment:", err);
      toast.error(parseBackendError(err, "Failed to send attachment."));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      setError(null);
      await api.post("/notifications/mark_all_read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error("Failed to mark notifications as read.");
    }
  }, []);

  const boostListing = useCallback(async (listingId) => {
    try {
      setError(null);
      const res = await api.post(`/items/${listingId}/boost/`);
      setUser((prev) => ({ ...prev, coins: res.data.new_balance }));
      setListings((prev) => prev.map((l) => {
        if (l.id === listingId) {
          return {
            ...l,
            isBoosted: true,
            boostExpiresAt: res.data.boost_expires_at,
          };
        }
        return l;
      }));
      toast.success("Listing boosted successfully for 7 days! 🚀");
    } catch (err) {
      console.error("Failed to boost listing:", err);
      const msg = parseBackendError(err, "Failed to boost listing.");
      toast.error(msg);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      const formData = new FormData();
      Object.keys(profileData).forEach((key) => {
        const val = profileData[key];
        if (key === "proofOfWork") {
          formData.append("proof_of_work", JSON.stringify(val));
        } else if (key === "avatarFile" && val) {
          formData.append("profile_picture", val);
        } else if (key === "coverFile" && val) {
          formData.append("cover_picture", val);
        } else if (key === "resumeFile" && val) {
          formData.append("resume", val);
        } else if (val !== undefined && val !== null) {
          const snakeKeys = {
            name: "display_name",
            bio: "bio",
            location: "location",
            location_name: "location_name",
            latitude: "latitude",
            longitude: "longitude",
            country: "country",
            city: "city",
            state: "state",
            phone: "phone_number",
            coverPicture: "cover_picture_url",
            college: "college_organization",
            department: "department_branch",
            yearOfStudy: "year_of_study",
            github: "github_profile",
            linkedin: "linkedin_profile",
            portfolio: "portfolio_website",
          };
          const backendKey = snakeKeys[key] || key;
          formData.append(backendKey, val);
        }
      });

      const res = await api.put("/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const mappedUser = mapUserProfile(res.data);
      setUser(mappedUser);
      return mappedUser;
    } catch (err) {
      console.error("Failed to update profile:", err);
      const msg = parseBackendError(err, "Failed to save profile changes.");
      throw new Error(msg);
    }
  }, []);

  const purchaseCoins = useCallback(async (amount) => {
    try {
      setError(null);
      const res = await api.post("/wallet/purchase-coins/", { amount: Number(amount) });
      setUser((prev) => ({ ...prev, coins: res.data.new_balance }));
      
      // Refresh wallet transaction logs
      try {
        const walletRes = await api.get("/wallet/ledger/");
        const walletList = walletRes.data.results || walletRes.data;
        setWallet(walletList.map(mapWalletTransaction));
      } catch (e) {
        console.warn("Failed to refresh transactions after purchase", e);
      }
      
      toast.success(res.data.message || `Successfully purchased ${amount} coins.`);
      return res.data.new_balance;
    } catch (err) {
      console.error("Failed to purchase coins:", err);
      const msg = parseBackendError(err, "Failed to purchase coins.");
      toast.error(msg);
      throw new Error(msg);
    }
  }, []);

  const createRazorpayOrder = useCallback(async (amount) => {
    try {
      setError(null);
      const res = await api.post("/wallet/create-razorpay-order/", { amount: Number(amount) });
      return res.data; // { order_id, amount_inr, amount_coins, currency }
    } catch (err) {
      console.error("Failed to create Razorpay order:", err);
      const msg = parseBackendError(err, "Failed to initiate payment order.");
      toast.error(msg);
      throw new Error(msg);
    }
  }, []);

  const verifyRazorpayPayment = useCallback(async (paymentDetails) => {
    try {
      setError(null);
      const res = await api.post("/wallet/verify-razorpay-payment/", paymentDetails);
      setUser((prev) => ({ ...prev, coins: res.data.new_balance }));

      // Refresh wallet transaction logs
      try {
        const walletRes = await api.get("/wallet/ledger/");
        const walletList = walletRes.data.results || walletRes.data;
        setWallet(walletList.map(mapWalletTransaction));
      } catch (e) {
        console.warn("Failed to refresh transactions after verification", e);
      }

      toast.success(res.data.message || "Payment verified successfully!");
      return res.data.new_balance;
    } catch (err) {
      console.error("Failed to verify Razorpay payment:", err);
      const msg = parseBackendError(err, "Payment verification failed.");
      toast.error(msg);
      throw new Error(msg);
    }
  }, []);

  const transferCoins = useCallback(async (recipientUsername, amount, note = "") => {
    try {
      setError(null);
      const res = await api.post("/wallet/transfer/", {
        recipient_username: recipientUsername,
        amount: Number(amount),
        description: note
      });
      setUser((prev) => ({ ...prev, coins: res.data.new_balance }));

      try {
        const walletRes = await api.get("/wallet/ledger/");
        const walletList = walletRes.data.results || walletRes.data;
        setWallet(walletList.map(mapWalletTransaction));
      } catch (e) {
        console.warn("Failed to refresh transactions after transfer", e);
      }

      toast.success(res.data.message || "Coins transferred successfully!");
      return res.data.new_balance;
    } catch (err) {
      console.error("Failed to transfer coins:", err);
      const msg = parseBackendError(err, "Failed to transfer coins.");
      toast.error(msg);
      throw new Error(msg);
    }
  }, []);

  const dynamicUsers = useMemo(() => {
    const map = { ...USERS };
    if (user && user.id) {
      map[user.id] = user;
      map[user.name] = user;
    }
    listings.forEach((listing) => {
      if (listing.owner && listing.owner.username) {
        const key = listing.owner.username;
        map[key] = {
          id: key,
          handle: listing.owner.handle,
          name: listing.owner.name,
          avatar: listing.owner.avatar,
          verified: listing.owner.verified,
          trustScore: listing.owner.trustScore,
          rating: listing.owner.rating,
          coins: listing.owner.coinBalance,
          swapsCompleted: 0
        };
      }
    });
    chats.forEach((c) => {
      if (c.other) {
        map[c.with] = c.other;
      }
    });
    return map;
  }, [user, listings, chats]);

  const submitReview = useCallback(async ({ reviewedUserId, rating, comment, tradeId, offerId }) => {
    try {
      const payload = {
        reviewed_user: reviewedUserId,
        rating: Number(rating),
        comment: comment || "",
      };
      if (tradeId) payload.trade = tradeId;
      if (offerId) payload.offer = offerId;

      const res = await api.post("/reviews/", payload);
      setReviewsList((prev) => [res.data, ...prev]);

      const tradesRes = await api.get("/trades/");
      setTrades(tradesRes.data.results || tradesRes.data || []);

      if (user?.id) {
        const profileRes = await api.get("/profile/");
        setUser((prev) => prev ? {
          ...prev,
          rating: profileRes.data.average_rating,
          trustScore: profileRes.data.trust_score,
        } : prev);
      }

      toast.success("Review submitted! Thank you for rating your trade partner. ⭐");
      return res.data;
    } catch (err) {
      console.error("Failed to submit review:", err);
      const msg = err.response?.data?.detail || "Failed to submit review.";
      toast.error(msg);
      throw err;
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    user, setUser, isAuthed, login, logout, updateProfile,
    listings, setListings, addListing, editListing, deleteListing, refreshFeed, getNearbyListings,
    proposals, respondProposal, createProposal,
    chats, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, startListingChat, wsConnected, sendAttachment,
    notifications, markAllRead,
    saved, toggleSave,
    contracts, setContracts,
    trades, setTrades,
    disputes, setDisputes,
    wallet, setWallet, purchaseCoins, createRazorpayOrder, verifyRazorpayPayment, transferCoins,
    users: dynamicUsers, categories: categoriesList,
    aiMatches, tracker: SWAP_TRACKER, reviews: reviewsList, submitReview,
    loading, error, boostListing,
  }), [user, isAuthed, listings, proposals, chats, notifications, saved, contracts, trades, disputes, wallet, reviewsList, categoriesList, aiMatches, loading, error, login, logout, updateProfile, addListing, editListing, deleteListing, refreshFeed, getNearbyListings, respondProposal, createProposal, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, startListingChat, wsConnected, sendAttachment, markAllRead, toggleSave, boostListing, dynamicUsers, purchaseCoins, createRazorpayOrder, verifyRazorpayPayment, transferCoins, submitReview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[var(--lime)] rounded-full animate-spin" />
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export default AppProvider;

