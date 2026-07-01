import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, MessageSquare, HandshakeIcon, List,
  Heart, Clock, Shield, Bell, Wallet, Settings, Crown, Menu, X
} from 'lucide-react';

interface SidebarProps {
  unreadMessages: number;
  pendingOffers: number;
  onListClick?: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/browse', label: 'Browse', icon: Search },
  { path: '/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'messages' as const },
  { path: '/offers', label: 'Offers', icon: HandshakeIcon, badgeKey: 'offers' as const },
  { path: '/my-listings', label: 'My Listings', icon: List },
  { path: '/saved', label: 'Saved', icon: Heart },
  { path: '/swap-history', label: 'Swap History', icon: Clock },
  { path: '/trust-reviews', label: 'Trust & Reviews', icon: Shield },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ unreadMessages, pendingOffers }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const badges: Record<string, number> = {
    messages: unreadMessages,
    offers: pendingOffers,
  };

  const renderNav = () => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 group relative
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
              }
              ${desktopCollapsed ? 'justify-center px-0' : 'px-3'}
            `}
            title={desktopCollapsed ? item.label : undefined}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={desktopCollapsed ? 'min-w-[18px]' : ''} />
            {!desktopCollapsed && <span>{item.label}</span>}
            {!desktopCollapsed && badge > 0 && (
              <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
            {desktopCollapsed && badge > 0 && (
               <span className="absolute top-1 right-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderPremiumCard = () => {
    if (desktopCollapsed) return null;
    return (
      <div className="mx-3 mb-4 p-4 bg-white rounded-2xl border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Crown size={18} className="text-warning" />
          <span className="text-sm font-bold text-text-primary">Go Premium</span>
        </div>
        <p className="text-xs text-text-secondary mb-3 leading-relaxed">
          Get more visibility, premium badges and exclusive benefits.
        </p>
        <button className="w-full h-9 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition-colors">
          Upgrade Now
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl border border-border flex items-center justify-center shadow-sm"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-border
          flex flex-col transition-all duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${desktopCollapsed ? 'w-[80px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-[72px] px-5 border-b border-border flex-shrink-0 ${desktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className={`flex items-center gap-2.5 no-underline ${desktopCollapsed ? 'justify-center' : ''}`} onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            {!desktopCollapsed && <span className="text-lg font-extrabold text-text-primary tracking-tight">BarterX</span>}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center shrink-0"
          >
            <X size={18} />
          </button>
          {!desktopCollapsed && (
            <button
              onClick={() => setDesktopCollapsed(true)}
              className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-gray-100 items-center justify-center text-text-secondary hover:text-text-primary transition-colors ml-auto shrink-0"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
        
        {desktopCollapsed && (
          <div className="hidden lg:flex items-center justify-center pt-4">
             <button
              onClick={() => setDesktopCollapsed(false)}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          {renderNav()}
        </div>

        {/* Premium Card */}
        {renderPremiumCard()}
      </aside>
    </>
  );
}
