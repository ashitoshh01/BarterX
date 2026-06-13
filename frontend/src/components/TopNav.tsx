import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, Bell, MessageSquare, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types';

interface TopNavProps {
  profile: UserProfile | null;
  unreadNotifications: number;
  unreadMessages: number;
  onListClick?: () => void;
}

export default function TopNav({ profile, unreadNotifications, unreadMessages, onListClick }: TopNavProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const location = profile?.location || 'Mumbai, India';

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate('/search');
      }
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Spacer for mobile hamburger */}
      <div className="lg:hidden w-10" />

      {/* Search Bar */}
      <div className="flex-1 max-w-[480px] relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search for items, services or users..."
          className="w-full h-10 pl-10 pr-4 rounded-[14px] border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none transition-all
            focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Location Dropdown */}
      <button className="hidden md:flex items-center gap-2 h-10 px-4 rounded-[14px] border border-border bg-white text-sm text-text-primary hover:bg-bg transition-colors">
        <MapPin size={14} className="text-text-muted" />
        <span>{location}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* List an Item CTA */}
        <button
          onClick={onListClick || (() => navigate('/?create=true'))}
          className="hidden sm:flex items-center gap-2 h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors no-underline border-none cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>List an Item</span>
        </button>

        {/* Notification Icon */}
        <Link
          to="/notifications"
          className="relative w-10 h-10 rounded-xl border border-border bg-white hover:bg-bg flex items-center justify-center transition-colors no-underline text-text-secondary"
        >
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Message Icon */}
        <Link
          to="/messages"
          className="relative w-10 h-10 rounded-xl border border-border bg-white hover:bg-bg flex items-center justify-center transition-colors no-underline text-text-secondary"
        >
          <MessageSquare size={18} />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Profile Avatar & Dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile?.display_name || profile?.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-sm font-medium text-text-primary">
                Hi, {profile?.display_name?.split(' ')[0] || profile?.username || 'User'}
              </span>
              <ChevronDown size={14} className="text-text-muted transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </div>
          </button>

          {/* Premium Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-[16px] bg-white border border-border shadow-xl py-2 z-50 animate-scaleUp">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-bg no-underline transition-colors"
              >
                <User size={16} className="text-text-secondary" />
                <span>Profile</span>
              </Link>
              
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-bg no-underline transition-colors"
              >
                <Settings size={16} className="text-text-secondary" />
                <span>Settings</span>
              </Link>
              
              <div className="border-t border-border my-1" />
              
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer text-left transition-colors font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
