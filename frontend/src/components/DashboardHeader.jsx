import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Hyderabad, India', 'Pune, India', 'Chennai, India', 'Remote'];

export default function DashboardHeader({ stats, onListItem }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState('Mumbai, India');
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center gap-4">
      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Search for items, services or users..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 focus:border-wine-900/40 transition-all"
        />
      </div>

      {/* Location Picker */}
      <div className="relative">
        <button
          onClick={() => setShowLocationMenu(v => !v)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600 hover:border-wine-900/40 hover:bg-sand-100 transition-all"
        >
          <svg className="w-4 h-4 text-wine-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span className="font-medium">{location}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {showLocationMenu && (
          <div className="absolute top-full mt-2 left-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => { setLocation(city); setShowLocationMenu(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${location === city ? 'text-wine-900 font-semibold bg-sand-100' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List an Item */}
      <button
        onClick={onListItem}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine-900 text-white text-sm font-semibold hover:bg-wine-800 transition-colors shadow-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
        </svg>
        List an Item
      </button>

      {/* Notification Bell */}
      <button className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-sand-100 hover:border-wine-900/30 transition-all">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {stats?.unread_messages > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {stats.unread_messages}
          </span>
        )}
      </button>

      {/* Messages */}
      <button className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-sand-100 hover:border-wine-900/30 transition-all">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </button>

      {/* User Avatar + Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(v => !v)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-gray-50 border border-gray-200 hover:bg-sand-100 hover:border-wine-900/30 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-wine-900 flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-semibold text-gray-700">Hi, {user?.username || 'User'}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {showUserMenu && (
          <div className="absolute top-full mt-2 right-0 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            <button onClick={() => navigate('/dashboard')} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-wine-900">Dashboard</button>
            <button onClick={() => navigate('/my-listings')} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-wine-900">My Listings</button>
            <hr className="my-1 border-gray-100"/>
            <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
