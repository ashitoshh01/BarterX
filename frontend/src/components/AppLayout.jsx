import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Home, Compass, PlusSquare, MessageCircle, User, Bell, Wallet, Sparkles, Repeat, Flame } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LogoWordmark } from "@/components/Logo";

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
      className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg)]/70 border-b border-white/5"
      data-testid="top-bar"
    >
      <div className="app-container h-16 flex items-center justify-between gap-4">
        <Link to="/app/feed" className="flex items-center gap-2" data-testid="top-logo">
          <LogoWordmark size="text-lg" />
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
                    ? "bg-white/10 text-white"
                    : "text-[var(--text-2)] hover:text-white hover:bg-white/5"
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
            className="ml-2 nb-btn px-4 py-2 bg-[var(--lime)] text-black text-sm rounded-full flex items-center gap-1.5"
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
            className="relative p-2 hover:bg-white/5 rounded-full text-[var(--text-2)] hover:text-white transition"
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
              className="w-9 h-9 rounded-full border border-white/15 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--lime)] border-2 border-[var(--bg)] rounded-full" />
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-[var(--bg)]/85 border-t border-white/5"
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
                <div className="w-11 h-11 -mt-3 bg-[var(--lime)] rounded-full flex items-center justify-center shadow-[0_0_24px_-4px_var(--lime-glow)]">
                  <PlusSquare size={20} strokeWidth={2.5} className="text-black" />
                </div>
              ) : (
                <>
                  <item.icon
                    size={20} strokeWidth={2}
                    className={active ? "text-[var(--lime)]" : "text-[var(--text-3)]"}
                  />
                  <span className={`text-[10px] font-medium ${active ? "text-white" : "text-[var(--text-3)]"}`}>
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
    <aside className="hidden lg:block w-60 shrink-0 sticky top-20 self-start">
      <div className="space-y-0.5">
        {[...nav, { to: "/app/create", label: "Create", icon: PlusSquare, testid: "nav-create-side" }, ...secondaryNav].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`side-${item.testid}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-[var(--text-2)] hover:text-white hover:bg-white/5"
              }`
            }
          >
            <item.icon size={16} strokeWidth={2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Level card — gamified */}
      <div className="mt-6 nb-card p-4 relative overflow-hidden" data-testid="side-level">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono2 uppercase tracking-widest text-[var(--text-3)]">Level</span>
            <span className="font-display text-2xl text-white">{level}</span>
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

      <Link
        to="/app/wallet"
        className="mt-3 block nb-card p-4 relative overflow-hidden group hover:border-[var(--lime)]/40 transition"
        data-testid="side-invite"
      >
        <div className="text-[9px] font-mono2 uppercase tracking-widest text-[var(--text-3)] mb-1">
          Referral bonus
        </div>
        <div className="font-display text-lg leading-tight text-white">
          Invite a friend<br />
          <span className="text-[var(--lime)]">+100 ◈</span>
        </div>
      </Link>
    </aside>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen text-white flex flex-col overflow-x-hidden w-full max-w-full relative" style={{ background: "var(--bg)" }}>
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
