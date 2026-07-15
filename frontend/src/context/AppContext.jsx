import React, { createContext, useContext, useState, useMemo } from "react";
import {
  CURRENT_USER, USERS, LISTINGS, CATEGORIES, AI_MATCHES,
  PROPOSALS, CHATS, NOTIFICATIONS, SWAP_TRACKER, CONTRACTS,
  DISPUTES, WALLET_HISTORY, REVIEWS,
} from "@/mock/data";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(CURRENT_USER);
  const [isAuthed, setIsAuthed] = useState(false);
  const [listings, setListings] = useState(LISTINGS);
  const [proposals, setProposals] = useState(PROPOSALS);
  const [chats, setChats] = useState(CHATS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [saved, setSaved] = useState(new Set(["l_3", "l_5"]));
  const [contracts, setContracts] = useState(CONTRACTS);
  const [disputes, setDisputes] = useState(DISPUTES);
  const [wallet, setWallet] = useState(WALLET_HISTORY);

  const login = () => setIsAuthed(true);
  const logout = () => setIsAuthed(false);

  const toggleSave = (id) => {
    setSaved((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const addListing = (listing) => {
    const newL = {
      ...listing,
      id: `l_${Date.now()}`,
      owner: user.id,
      posted: "just now",
      views: 0, saves: 0,
    };
    setListings((prev) => [newL, ...prev]);
    return newL;
  };

  const respondProposal = (id, status) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const sendMessage = (chatId, text) => {
    setChats((prev) => prev.map((c) => c.id === chatId ? {
      ...c,
      lastMessage: text,
      lastTime: "just now",
      messages: [...c.messages, { from: user.id, text, time: "just now" }],
    } : c));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const value = useMemo(() => ({
    user, setUser, isAuthed, login, logout,
    listings, addListing,
    proposals, respondProposal,
    chats, sendMessage,
    notifications, markAllRead,
    saved, toggleSave,
    contracts, setContracts,
    disputes, setDisputes,
    wallet, setWallet,
    users: USERS, categories: CATEGORIES,
    aiMatches: AI_MATCHES, tracker: SWAP_TRACKER, reviews: REVIEWS,
  }), [user, isAuthed, listings, proposals, chats, notifications, saved, contracts, disputes, wallet]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
