import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  CURRENT_USER, USERS, LISTINGS, CATEGORIES, AI_MATCHES,
  PROPOSALS, CHATS, NOTIFICATIONS, SWAP_TRACKER, CONTRACTS,
  DISPUTES, WALLET_HISTORY, REVIEWS,
} from "@/mock/data";

const AppContext = createContext(null);

// ─── Schema Mapping Helpers ──────────────────────────────────────────────────

const getAbsoluteUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const backendBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
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
  avatar: getAbsoluteUrl(profile.profile_picture_url) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  location: profile.location || "Remote",
  coins: profile.coin_balance ?? 0,
  trustScore: profile.trust_score ?? 50,
  swapsCompleted: profile.reward_points ? Math.floor(profile.reward_points / 50) : 0,
  rating: profile.average_rating ?? 0.0,
  verified: profile.is_verified ?? false,
  joined: profile.member_since || "",
  badges: profile.badges || ["Swap Star", "Trusted Trader"],
  coverPicture: getAbsoluteUrl(profile.cover_picture_url) || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
  college: profile.college_organization || "",
  department: profile.department_branch || "",
  yearOfStudy: profile.year_of_study || "",
  github: profile.github_profile || "",
  linkedin: profile.linkedin_profile || "",
  portfolio: profile.portfolio_website || "",
  resume: getAbsoluteUrl(profile.resume_url) || "",
  proofOfWork: profile.proof_of_work || [],
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
    images.push("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800");
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
    location: item.location,
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
  };
};

const mapNotification = (n) => ({
  id: n.id,
  type: n.notification_type === "interest_received" ? "offer" : "match",
  title: n.title,
  body: n.message,
  time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "recently",
  read: n.is_read,
});

const mapConversation = (conv, currentUser) => {
  const otherParticipant = conv.other_participant || {};
  const lastMsg = conv.last_message || {};
  
  return {
    id: String(conv.id),
    with: otherParticipant.username || "anonymous",
    lastMessage: lastMsg.text || (lastMsg.message_type === 'IMAGE' ? "📷 Image" : lastMsg.message_type === 'FILE' ? "📁 Attachment" : ""),
    lastTime: lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "",
    unread: conv.unread_count || 0,
    messages: [],
    other: {
      username: otherParticipant.username,
      name: otherParticipant.display_name || otherParticipant.username,
      avatar: getAbsoluteUrl(otherParticipant.avatar) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
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

const mapWalletTransaction = (t) => ({
  id: String(t.id),
  type: (t.transaction_type === 'earned' || t.transaction_type === 'purchased') ? 'earn' : 'spend',
  amount: (t.transaction_type === 'earned' || t.transaction_type === 'purchased') ? Math.abs(t.amount) : -Math.abs(t.amount),
  reason: t.description || (t.transaction_type === 'purchased' ? 'Coins purchased' : 'Coins spent'),
  time: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'recently',
});

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
  const [user, setUser] = useState(CURRENT_USER);
  const [isAuthed, setIsAuthed] = useState(false);
  const [listings, setListings] = useState([]);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [proposals, setProposals] = useState(PROPOSALS);
  const [chats, setChats] = useState([]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [saved, setSaved] = useState(new Set(["l_3", "l_5"]));
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
    const host = process.env.REACT_APP_WS_URL || "localhost:8001";
    const wsUrl = `${wsScheme}//${host}/ws/chat/?token=${token}`;

    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected successfully!");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;
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
      } catch (err) {
        console.error("Error parsing socket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
      setWsConnected(false);
      setTimeout(() => {
        const currentToken = localStorage.getItem("barter_token");
        if (currentToken) {
          connectWebSocket(currentToken);
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("barter_token");
    localStorage.removeItem("barter_refresh_token");
    setIsAuthed(false);
    setUser(CURRENT_USER);
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
      const mappedCategories = catRes.data.map(mapCategory);
      setCategoriesList(mappedCategories);

      // Fetch items feed
      const itemsRes = await api.get("/items/");
      const mappedListings = itemsRes.data.map(mapItemToListing);
      setListings(mappedListings);

      // Fetch interests/proposals
      const interestsRes = await api.get("/interests/");
      const mappedProposals = interestsRes.data.map((i) => mapInterestToProposal(i, profileRes.data.username));
      setProposals(mappedProposals);

      // Fetch notifications
      const notifRes = await api.get("/notifications/");
      const mappedNotifications = notifRes.data.map(mapNotification);
      setNotifications(mappedNotifications);

      // Fetch chats
      const chatsRes = await api.get("/chatrooms/");
      const mappedChats = chatsRes.data.map(c => mapConversation(c, profileRes.data));
      setChats(mappedChats);

      // Fetch wallet transactions
      try {
        const walletRes = await api.get("/wallet/transactions/");
        setWallet(walletRes.data.map(mapWalletTransaction));
      } catch (err) {
        console.warn("Failed to fetch wallet transactions", err);
        setWallet(WALLET_HISTORY); // Fallback to mock for now
      }

      // Fetch reviews
      try {
        const reviewsRes = await api.get("/reviews/");
        setReviewsList(reviewsRes.data.map(mapReview));
      } catch (err) {
        console.warn("Failed to fetch reviews", err);
        setReviewsList(REVIEWS); // Fallback to mock for now
      }

      // Fetch contracts
      try {
        const contractsRes = await api.get("/contracts/");
        setContracts(contractsRes.data.map(c => mapContract(c, profileRes.data.username)));
      } catch (err) {
        console.warn("Failed to fetch contracts", err);
      }

      // Fetch trades (Logistics)
      try {
        const tradesRes = await api.get("/trades/");
        setTrades(tradesRes.data);
      } catch (err) {
        console.warn("Failed to fetch trades", err);
      }

      // Fetch disputes
      try {
        const disputesRes = await api.get("/disputes/");
        setDisputes(disputesRes.data.map(mapDispute));
      } catch (err) {
        console.warn("Failed to fetch disputes", err);
      }
      
      // Fetch AI Matches
      try {
        const matchesRes = await api.get("/recommendations/matches/");
        setAiMatches(matchesRes.data);
      } catch (err) {
        console.warn("Failed to fetch AI matches", err);
        setAiMatches(AI_MATCHES); // fallback to mock
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
      initializeApp(token);
    } else {
      setLoading(false);
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


  const toggleSave = useCallback((id) => {
    setSaved((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }, []);

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
      const mappedListings = itemsRes.data.map(mapItemToListing);
      setListings(mappedListings);
    } catch (err) {
      console.error("Failed to refresh feed:", err);
      setError("Failed to refresh feed listings.");
    } finally {
      setLoading(false);
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
      setListings(itemsRes.data.map(mapItemToListing));

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
      const mappedMsgs = res.data.map(mapMessage);
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
        })
        .catch((err) => {
          toast.error("Failed to send message.");
        });
    }
  }, [user]);

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

  const value = useMemo(() => ({
    user, setUser, isAuthed, login, logout, updateProfile,
    listings, setListings, addListing, editListing, deleteListing, refreshFeed,
    proposals, respondProposal, createProposal,
    chats, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, startListingChat, wsConnected, sendAttachment,
    notifications, markAllRead,
    saved, toggleSave,
    contracts, setContracts,
    trades, setTrades,
    disputes, setDisputes,
    wallet, setWallet,
    users: dynamicUsers, categories: categoriesList,
    aiMatches: aiMatches.length > 0 ? aiMatches : AI_MATCHES, tracker: SWAP_TRACKER, reviews: reviewsList,
    loading, error, boostListing,
  }), [user, isAuthed, listings, proposals, chats, notifications, saved, contracts, trades, disputes, wallet, reviewsList, categoriesList, aiMatches, loading, error, login, logout, updateProfile, addListing, editListing, deleteListing, refreshFeed, respondProposal, createProposal, sendMessage, loadChatMessages, joinChatRoom, leaveChatRoom, setTypingStatus, startListingChat, wsConnected, sendAttachment, markAllRead, toggleSave, boostListing, dynamicUsers]);

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

