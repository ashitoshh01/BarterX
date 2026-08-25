import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Home, Compass, PlusSquare, MessageCircle, User, Bell, Wallet, Sparkles, Repeat, Flame } from "lucide-react";
import { useApp } from "@/context/AppContext";

const nav = [
  { to: "/app/feed", label: "Feed", icon: Home, testid: "nav-feed" },
  { to: "/app/explore", label: "Explore", icon: Compass, testid: "nav-explore" },
  { to: "/app/matches", label: "Matches", icon: Sparkles, testid: "nav-matches" },
  { to: "/app/chat", label: "Chat", icon: MessageCircle, testid: "nav-chat" },
];

const secondaryNav = [
  { to: "/app/proposals", label: "Proposals", icon: Repeat, testid: "nav-proposals" },
  { to: "/app/wallet", label: "Wallet", icon: Wallet, testid: "nav-wallet" },
  { to: "/app/notifications", label: "Notifications", icon: Bell, testid: "nav-notifications" },
  { to: "/app/profile", label: "Profile", icon: User, testid: "nav-profile" },
];

const TopBar = () => {
  const { user, notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[var(--border)]"
      data-testid="top-bar"
    >
      <div className="app-container h-16 flex items-center justify-between gap-4">
        <Link to="/app/feed" className="flex items-center gap-2" data-testid="top-logo">
          <span className="font-display text-xl tracking-tight text-[var(--text)]">
            baarter<span className="text-[var(--lime)]">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-[var(--text)] text-white"
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                }`
              }
            >
              <item.icon size={16} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <Link
            to="/app/create"
            data-testid="nav-create"
            className="ml-2 nb-btn px-4 py-2 bg-[var(--lime)] text-black text-sm rounded-full flex items-center gap-1.5 font-semibold"
          >
            <PlusSquare size={14} strokeWidth={2.5} /> Post
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 tint-amber px-3 py-1.5 rounded-full text-xs font-mono2 font-bold" data-testid="top-streak">
            <Flame size={12} strokeWidth={2.5} /> 7
          </div>
          <Link
            to="/app/wallet"
            className="hidden sm:flex items-center gap-1.5 tint-lime px-3 py-1.5 rounded-full text-xs font-mono2 font-bold"
            data-testid="top-coins"
          >
            <span>◈</span> {user.coins}
          </Link>
          <Link
            to="/app/notifications"
            className="relative p-2 hover:bg-[var(--surface-3)] rounded-full text-[var(--text-2)] hover:text-[var(--text)] transition"
            data-testid="top-notifications"
          >
            <Bell size={18} strokeWidth={2} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[var(--pink)] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
          <Link to="/app/profile" data-testid="top-avatar" className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-[var(--border)] object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--lime)] border-2 border-white rounded-full" />
          </Link>
        </div>
      </div>
    </header>
  );
};

const BottomBar = () => {
  const location = useLocation();
  const items = [
    { to: "/app/feed", label: "Feed", icon: Home, testid: "bottom-feed" },
    { to: "/app/explore", label: "Explore", icon: Compass, testid: "bottom-explore" },
    { to: "/app/create", label: "Post", icon: PlusSquare, testid: "bottom-create", primary: true },
    { to: "/app/chat", label: "Chat", icon: MessageCircle, testid: "bottom-chat" },
    { to: "/app/profile", label: "Me", icon: User, testid: "bottom-profile" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 border-t border-[var(--border)]"
      data-testid="bottom-nav"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className="flex flex-col items-center justify-center gap-0.5 relative"
            >
              {item.primary ? (
                <div className="w-11 h-11 -mt-3 bg-[var(--lime)] rounded-full flex items-center justify-center shadow-md">
                  <PlusSquare size={20} strokeWidth={2.5} className="text-black" />
                </div>
              ) : (
                <>
                  <item.icon
                    size={20} strokeWidth={2}
                    className={active ? "text-[var(--text)]" : "text-[var(--text-3)]"}
                  />
                  <span className={`text-[10px] font-medium ${active ? "text-[var(--text)]" : "text-[var(--text-3)]"}`}>
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const SideRail = () => {
  const { user } = useApp();
  const level = 4;
  const xp = 340;
  const xpMax = 500;

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
      <div className="space-y-0.5">
        {[...nav, { to: "/app/create", label: "Create", icon: PlusSquare, testid: "nav-create-side" }, ...secondaryNav].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`side-${item.testid}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? "bg-[var(--surface-3)] text-[var(--text)] font-semibold"
                  : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`
            }
          >
            <item.icon size={16} strokeWidth={2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Level card */}
      <div className="mt-6 nb-card p-4 relative overflow-hidden" data-testid="side-level">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">Level</span>
            <span className="font-display text-2xl text-[var(--text)]">{level}</span>
          </div>
          <div className="tint-lime px-2 py-0.5 rounded-full text-[9px] font-mono2 font-bold">SWAPPER</div>
        </div>
        <div className="xp-bar mb-1.5">
          <div className="xp-fill" style={{ width: `${(xp / xpMax) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono2 text-[var(--text-3)]">
          <span>{xp} XP</span>
          <span>{xpMax - xp} to LVL {level + 1}</span>
        </div>
      </div>
    </aside>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen text-[var(--text)] flex flex-col overflow-x-hidden w-full max-w-full relative bg-[var(--bg-2)]">
      <TopBar />
      <div className="app-container w-full flex-1 flex gap-8 py-6 pb-24 md:pb-8">
        <SideRail />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomBar />
    </div>
  );
};

export default AppLayout;
