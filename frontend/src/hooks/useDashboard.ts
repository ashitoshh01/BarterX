import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  UserProfile,
  BarterItem,
  Category,
  DashboardStats,
  NearbyTrader,
  RecentOffer,
  TrendingSwap,
} from '../types';
import type { VerificationStatus } from '../services/api';
import {
  fetchProfile,
  fetchDashboardStats,
  fetchRecommendations,
  fetchTrendingSwaps,
  fetchNearbyTraders,
  fetchRecentOffers,
  fetchCategories,
  fetchUnreadCount,
  fetchUnreadMessagesCount,
  fetchPendingOffersCount,
  computeVerificationStatus,
} from '../services/api';

// ─── useDashboard ──────────────────────────────────────────────────────────

interface DashboardData {
  profile: UserProfile | null;
  stats: DashboardStats | null;
  recommendations: BarterItem[];
  trending: TrendingSwap[];
  nearbyTraders: NearbyTrader[];
  recentOffers: RecentOffer[];
  categories: Category[];
  verification: VerificationStatus | null;
  unreadMessages: number;
  unreadNotifications: number;
  pendingOffers: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): DashboardData {
  const { tokens } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<BarterItem[]>([]);
  const [trending, setTrending] = useState<TrendingSwap[]>([]);
  const [nearbyTraders, setNearbyTraders] = useState<NearbyTrader[]>([]);
  const [recentOffers, setRecentOffers] = useState<RecentOffer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!tokens?.access) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        profileData,
        statsData,
        recsData,
        trendingData,
        tradersData,
        offersData,
        catsData,
        unreadMsgs,
        unreadNotifs,
        pendingCount,
      ] = await Promise.all([
        fetchProfile(tokens.access).catch(() => null),
        fetchDashboardStats(tokens.access).catch(() => null),
        fetchRecommendations(tokens.access).catch(() => []),
        fetchTrendingSwaps(tokens.access).catch(() => []),
        fetchNearbyTraders(tokens.access).catch(() => []),
        fetchRecentOffers(tokens.access).catch(() => []),
        fetchCategories().catch(() => []),
        fetchUnreadMessagesCount(tokens.access).catch(() => 0),
        fetchUnreadCount(tokens.access).catch(() => 0),
        fetchPendingOffersCount(tokens.access).catch(() => 0),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setRecommendations(recsData);
      setTrending(trendingData);
      setNearbyTraders(tradersData);
      setRecentOffers(offersData);
      setCategories(catsData);
      setUnreadMessages(unreadMsgs);
      setUnreadNotifications(unreadNotifs);
      setPendingOffers(pendingCount);

      if (profileData && statsData) {
        setVerification(computeVerificationStatus(profileData, statsData.successfulSwaps));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [tokens?.access]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for real-time badge counts
  useEffect(() => {
    if (!tokens?.access) return;
    const interval = setInterval(async () => {
      try {
        const [msgs, notifs, offers] = await Promise.all([
          fetchUnreadMessagesCount(tokens.access),
          fetchUnreadCount(tokens.access),
          fetchPendingOffersCount(tokens.access),
        ]);
        setUnreadMessages(msgs);
        setUnreadNotifications(notifs);
        setPendingOffers(offers);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [tokens?.access]);

  return {
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
    error,
    refresh: loadData,
  };
}
