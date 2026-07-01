import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useDashboard } from '../hooks/useDashboard';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, unreadMessages, unreadNotifications, pendingOffers } = useDashboard();

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar unreadMessages={unreadMessages} pendingOffers={pendingOffers} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          profile={profile}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
