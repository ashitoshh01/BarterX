import { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { getGreeting } from '../services/api';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import StatsCards from '../components/StatsCards';
import TrustPanel from '../components/TrustPanel';
import RecommendedCards from '../components/RecommendedCards';
import NearbyTraders from '../components/NearbyTraders';
import TrendingSwaps from '../components/TrendingSwaps';
import RecentOffers from '../components/RecentOffers';
import PopularCategories from '../components/PopularCategories';
import CreateListingModal from '../components/CreateListingModal';
import ItemDetailModal from '../components/ItemDetailModal';
import type { BarterItem } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    profile,
    stats,
    recommendations,
    trending,
    nearbyTraders,
    recentOffers,
    categories,
    verification,
    unreadMessages,
    unreadNotifications,
    pendingOffers,
    loading,
    refreshData,
  } = useDashboard();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BarterItem | null>(null);

  // If query parameter create=true is set, open listing modal
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Clean up search param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const displayName = profile?.display_name?.split(' ')[0] || user?.display_name?.split(' ')[0] || user?.username || 'User';
  const greeting = getGreeting();

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar 
        unreadMessages={unreadMessages} 
        pendingOffers={pendingOffers} 
        onListClick={() => setShowCreateModal(true)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          profile={profile}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          onListClick={() => setShowCreateModal(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Dashboard Grid: Main + Right Sidebar */}
            <div className="flex gap-6">
              {/* Main Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between animate-fadeUp">
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                      {greeting}, {displayName}! 👋
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                      Ready to make your next great swap?
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-2 h-10 px-5 rounded-xl border border-border bg-white hover:bg-bg text-sm font-medium text-text-primary no-underline transition-colors"
                  >
                    <UserIcon size={16} className="text-text-secondary" />
                    View your profile
                  </Link>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={stats} loading={loading} />

                {/* Recommended For You */}
                <RecommendedCards 
                  items={recommendations} 
                  loading={loading} 
                  onItemClick={(item) => setSelectedItem(item)}
                />

                {/* Trending Swaps */}
                <TrendingSwaps swaps={trending} loading={loading} />

                {/* Popular Categories */}
                <PopularCategories categories={categories} loading={loading} />
              </div>

              {/* Right Sidebar Widgets */}
              <div className="hidden xl:flex flex-col gap-5 w-[280px] flex-shrink-0">
                {/* Trust Panel */}
                <TrustPanel stats={stats} verification={verification} loading={loading} />

                {/* Nearby Traders */}
                <NearbyTraders traders={nearbyTraders} loading={loading} />

                {/* Recent Offers */}
                <RecentOffers offers={recentOffers} loading={loading} />
              </div>
            </div>

            {/* Mobile: Right sidebar widgets stack below */}
            <div className="xl:hidden flex flex-col gap-5 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <TrustPanel stats={stats} verification={verification} loading={loading} />
                <NearbyTraders traders={nearbyTraders} loading={loading} />
                <RecentOffers offers={recentOffers} loading={loading} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Listing Modal */}
      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshData();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
