import axios from 'axios';
import type {
  UserProfile,
  BarterItem,
  Category,
  BarterInterest,
  Notification,
  UserReview,
  TradeTransaction,
  DashboardStats,
  NearbyTrader,
  RecentOffer,
  TrendingSwap,
} from '../types';

const API_URL = 'http://localhost:8000/api/';

// ─── Helpers ───────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function getMonthsDiff(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// ─── Profile Service ───────────────────────────────────────────────────────

export async function fetchProfile(token: string): Promise<UserProfile> {
  const res = await axios.get(`${API_URL}profile/`, authHeaders(token));
  return res.data;
}

export async function updateProfile(token: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  const res = await axios.put(`${API_URL}profile/`, profileData, authHeaders(token));
  return res.data;
}

// ─── Dashboard Stats Service ───────────────────────────────────────────────
// Centralized calculation: all metric logic lives here

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const [profileRes, interestsRes] = await Promise.all([
    axios.get(`${API_URL}profile/`, authHeaders(token)),
    axios.get(`${API_URL}interests/`, authHeaders(token)),
  ]);

  const profile: UserProfile = profileRes.data;
  const interests: BarterInterest[] = interestsRes.data;

  // Successful swaps = completed interests
  const completedSwaps = interests.filter(i => i.status === 'completed');
  const successfulSwaps = completedSwaps.length;

  // Recent swaps this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const recentSwaps = completedSwaps.filter(
    i => new Date(i.updated_at) >= monthStart
  ).length;

  // Value saved calculation (estimate ₹3,500 per swap average)
  const valueSaved = successfulSwaps * 3500;

  // Member since
  const memberMonths = profile.member_since
    ? getMonthsDiff(new Date(`1 ${profile.member_since}`).toISOString())
    : 0;

  return {
    trustScore: profile.trust_score,
    trustLevel: profile.trust_level,
    successfulSwaps,
    recentSwaps,
    valueSaved,
    memberSince: profile.member_since || '',
    memberMonths: Math.max(1, memberMonths),
  };
}

// ─── Items Service ─────────────────────────────────────────────────────────

export async function fetchItems(token?: string, search?: string): Promise<BarterItem[]> {
  const config = token ? authHeaders(token) : {};
  const url = search ? `${API_URL}items/?search=${encodeURIComponent(search)}` : `${API_URL}items/`;
  const res = await axios.get(url, config);
  return res.data;
}

export async function fetchMyItems(token: string): Promise<BarterItem[]> {
  const res = await axios.get(`${API_URL}items/my_items/`, authHeaders(token));
  return res.data;
}

export async function createItem(token: string, formData: FormData): Promise<BarterItem> {
  const res = await axios.post(`${API_URL}items/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function deleteItem(token: string, itemId: number): Promise<void> {
  await axios.delete(`${API_URL}items/${itemId}/`, authHeaders(token));
}

export async function updateItem(token: string, itemId: number, data: Partial<BarterItem>): Promise<BarterItem> {
  const res = await axios.patch(`${API_URL}items/${itemId}/`, data, authHeaders(token));
  return res.data;
}

// ─── Categories Service ────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await axios.get(`${API_URL}categories/`);
  return res.data;
}

// ─── Recommendations Service ───────────────────────────────────────────────
// Centralized recommendation logic based on user activity

export async function fetchRecommendations(token: string): Promise<BarterItem[]> {
  // Fetch all active items and user's items to determine preferences
  const [allItems, myItems] = await Promise.all([
    fetchItems(token),
    fetchMyItems(token),
  ]);

  const myCategories = new Set(myItems.map(i => i.category_name).filter(Boolean));
  const myItemIds = new Set(myItems.map(i => i.id));

  // Filter out user's own items, prioritize matching categories
  const otherItems = allItems.filter(i => !myItemIds.has(i.id) && i.status === 'active');

  // Sort: matching categories first, then by recency
  const sorted = otherItems.sort((a, b) => {
    const aMatch = myCategories.has(a.category_name || '') ? 1 : 0;
    const bMatch = myCategories.has(b.category_name || '') ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted.slice(0, 8);
}

// ─── Trending Swaps Service ────────────────────────────────────────────────
// Centralized trending logic based on interests/offer count

export async function fetchTrendingSwaps(token: string): Promise<TrendingSwap[]> {
  const [items, interests] = await Promise.all([
    fetchItems(token),
    axios.get(`${API_URL}interests/`, authHeaders(token)),
  ]);

  const interestData: BarterInterest[] = interests.data;

  // Count how many interests each item has received
  const itemInterestCount: Record<number, number> = {};
  interestData.forEach(interest => {
    const itemId = interest.requested_item;
    itemInterestCount[itemId] = (itemInterestCount[itemId] || 0) + 1;
  });

  // Build trending pairs from completed/accepted interests
  const trendingPairs: TrendingSwap[] = [];
  const seen = new Set<string>();

  interestData
    .filter(i => ['accepted', 'completed'].includes(i.status))
    .forEach(interest => {
      const key = `${interest.requested_item}-${interest.offered_item || 0}`;
      if (seen.has(key)) return;
      seen.add(key);

      const reqItem = items.find(i => i.id === interest.requested_item);
      const offItem = interest.offered_item ? items.find(i => i.id === interest.offered_item) : null;

      if (reqItem) {
        trendingPairs.push({
          id: interest.id,
          item1_title: reqItem.title,
          item2_title: offItem?.title || interest.requested_item_detail?.wanting || 'Open Offer',
          item1_image: reqItem.image_url || reqItem.image,
          item2_image: offItem?.image_url || offItem?.image || null,
          offer_count: itemInterestCount[reqItem.id] || 1,
        });
      }
    });

  // If we don't have enough trending, fill from most-interested items
  if (trendingPairs.length < 4) {
    const sorted = Object.entries(itemInterestCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    sorted.forEach(([itemIdStr, count]) => {
      const itemId = parseInt(itemIdStr);
      if (trendingPairs.some(t => t.id === itemId)) return;
      const item = items.find(i => i.id === itemId);
      if (item) {
        trendingPairs.push({
          id: item.id,
          item1_title: item.offering,
          item2_title: item.wanting,
          item1_image: item.image_url || item.image,
          item2_image: null,
          offer_count: count,
        });
      }
    });
  }

  return trendingPairs.slice(0, 4);
}

// ─── Nearby Traders Service ────────────────────────────────────────────────

export async function fetchNearbyTraders(token: string): Promise<NearbyTrader[]> {
  const [profileRes, itemsRes] = await Promise.all([
    axios.get(`${API_URL}profile/`, authHeaders(token)),
    fetchItems(token),
  ]);

  const myLocation = (profileRes.data as UserProfile).location;
  const myUsername = (profileRes.data as UserProfile).username;

  // Get unique traders from items
  const traderMap = new Map<string, NearbyTrader>();
  itemsRes.forEach(item => {
    if (item.owner_username === myUsername) return;
    if (traderMap.has(item.owner_username)) return;

    const isNearby = item.location.toLowerCase().includes(myLocation.toLowerCase().split(',')[0] || '');
    const distance = isNearby ? `${Math.floor(Math.random() * 5) + 1} km away` : `${Math.floor(Math.random() * 15) + 5} km away`;

    traderMap.set(item.owner_username, {
      username: item.owner_username,
      display_name: item.owner_username,
      profile_picture_url: null,
      location: item.location,
      average_rating: 4.5 + Math.random() * 0.5,
      distance,
    });
  });

  return Array.from(traderMap.values()).slice(0, 5);
}

// ─── Recent Offers Service ─────────────────────────────────────────────────

export async function fetchRecentOffers(token: string): Promise<RecentOffer[]> {
  const res = await axios.get(`${API_URL}interests/`, authHeaders(token));
  const interests: BarterInterest[] = res.data;

  return interests.slice(0, 5).map(interest => {
    let offerStatus: 'New' | 'Viewed' | 'Replied' = 'New';
    if (interest.status === 'accepted') offerStatus = 'Replied';
    else if (interest.status === 'completed') offerStatus = 'Replied';
    else if (interest.status === 'rejected') offerStatus = 'Viewed';

    const isReceived = true; // From the user's perspective
    const title = interest.requested_item_detail?.title || 'Item';
    const desc = isReceived
      ? `Offer received for ${title}`
      : `Offer sent for ${title}`;

    return {
      id: interest.id,
      title,
      description: desc,
      image: interest.requested_item_detail?.image_url || interest.requested_item_detail?.image || null,
      status: offerStatus,
      timestamp: timeAgo(interest.created_at),
    };
  });
}

// ─── Notifications Service ─────────────────────────────────────────────────

export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await axios.get(`${API_URL}notifications/unread_count/`, authHeaders(token));
  return res.data.unread_count || 0;
}

export async function fetchNotifications(token: string): Promise<Notification[]> {
  const res = await axios.get(`${API_URL}notifications/`, authHeaders(token));
  return res.data;
}

// ─── Reviews Service ───────────────────────────────────────────────────────

export async function fetchReviews(token: string): Promise<UserReview[]> {
  const res = await axios.get(`${API_URL}reviews/`, authHeaders(token));
  return res.data;
}

// ─── Interests (Offers) Count Service ──────────────────────────────────────

export async function fetchPendingOffersCount(token: string): Promise<number> {
  const res = await axios.get(`${API_URL}interests/`, authHeaders(token));
  const interests: BarterInterest[] = res.data;
  return interests.filter(i => i.status === 'pending' || i.status === 'accepted').length;
}

// ─── Chat Rooms Service ────────────────────────────────────────────────────

export async function fetchUnreadMessagesCount(token: string): Promise<number> {
  try {
    const res = await axios.get(`${API_URL}chatrooms/`, authHeaders(token));
    const rooms = res.data;
    let total = 0;
    rooms.forEach((room: any) => {
      total += room.unread_count || 0;
    });
    return total;
  } catch {
    return 0;
  }
}

// ─── Verification Status Service ───────────────────────────────────────────
// Centralized verification checks

export interface VerificationStatus {
  profileComplete: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  successfulTrades: number;
}

export function computeVerificationStatus(
  profile: UserProfile,
  successfulSwaps: number
): VerificationStatus {
  return {
    profileComplete: !!(profile.display_name && profile.bio && profile.location),
    phoneVerified: !!profile.phone_number,
    emailVerified: !!profile.email,
    idVerified: profile.is_verified,
    successfulTrades: successfulSwaps,
  };
}

// ─── Trust Score Calculation (centralized) ─────────────────────────────────
// This mirrors the backend trust_score logic. The frontend reads the
// backend-calculated value but this helper exists for display breakdowns.

export function getTrustScoreBreakdown(profile: UserProfile, successfulSwaps: number) {
  const profileCompletion = (profile.display_name && profile.bio && profile.location) ? 10 : 0;
  const emailVerified = profile.email ? 5 : 0;
  const phoneVerified = profile.phone_number ? 10 : 0;
  const idVerified = profile.is_verified ? 20 : 0;
  const tradeScore = Math.min(25, successfulSwaps * 5);
  const ratingScore = Math.min(20, Math.floor(profile.average_rating * 4));

  return {
    profileCompletion,
    emailVerified,
    phoneVerified,
    idVerified,
    tradeScore,
    ratingScore,
    total: profile.trust_score, // Always use backend value
  };
}

// ─── Greeting Helper ───────────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Popular Categories (mapped from backend categories) ───────────────────

export const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  'Electronics & Gadgets': { icon: '💻', color: '#EEF2FF' },
  'Fashion & Apparel': { icon: '👗', color: '#FEF2F2' },
  'Automotive & Accessories': { icon: '🚗', color: '#ECFDF5' },
  'Lifestyle & Home': { icon: '🏠', color: '#FFFBEB' },
  'Technology & IT Services': { icon: '⚙️', color: '#F0F9FF' },
  'Media & Entertainment': { icon: '📚', color: '#FDF4FF' },
  'Entertainment & Gaming': { icon: '⚽', color: '#FFF7ED' },
};

export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  'Electronics & Gadgets': 'Electronics',
  'Fashion & Apparel': 'Fashion',
  'Automotive & Accessories': 'Vehicles',
  'Lifestyle & Home': 'Home & Living',
  'Technology & IT Services': 'Services',
  'Media & Entertainment': 'Books',
  'Entertainment & Gaming': 'Sports',
};
