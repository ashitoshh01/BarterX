// ─── Core Types ────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  date_joined: string;
}

export interface UserProfile {
  bio: string | null;
  location: string;
  phone_number: string | null;
  profile_picture_url: string | null;
  is_verified: boolean;
  average_rating: number;
  account_type: 'individual' | 'business';
  display_name: string;
  business_category: string | null;
  username: string;
  email: string;
  member_since: string;
  trust_score: number;
  trust_level: 'high' | 'medium' | 'low';
  reward_points: number;
  coin_balance: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_service: boolean;
}

export interface BarterItem {
  id: number;
  title: string;
  description: string | null;
  offering: string;
  wanting: string;
  category: number | null;
  category_name: string | null;
  image_url: string | null;
  image: string | null;
  condition: string;
  owner: number;
  owner_username: string;
  location: string;
  status: 'active' | 'draft' | 'archived' | 'traded' | 'reserved';
  created_at: string;
  updated_at: string;
  age_months?: number;
  purchase_price?: string;
  item_score?: number;
  additional_images?: Array<{ id: number; image: string }>;
}

export interface BarterInterest {
  id: number;
  requester: number;
  receiver: number;
  requester_username: string;
  receiver_username: string;
  requester_display_name: string;
  receiver_display_name: string;
  requested_item: number;
  offered_item: number | null;
  requested_item_detail: BarterItem;
  offered_item_detail: BarterItem | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  chat_room_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user: number;
  notification_type: string;
  title: string;
  message: string;
  barter_interest_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface UserReview {
  id: number;
  reviewer: number;
  reviewed_user: number;
  reviewer_username: string;
  reviewed_user_username: string;
  offer: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface TradeTransaction {
  id: number;
  offer: number;
  item_1: number | null;
  item_2: number | null;
  user_1: number;
  user_2: number;
  user_1_username: string;
  user_2_username: string;
  item_1_title: string | null;
  item_2_title: string | null;
  completed_at: string;
}

export interface DashboardStats {
  trustScore: number;
  trustLevel: string;
  successfulSwaps: number;
  recentSwaps: number;
  valueSaved: number;
  memberSince: string;
  memberMonths: number;
}

export interface NearbyTrader {
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  location: string;
  average_rating: number;
  distance: string;
}

export interface RecentOffer {
  id: number;
  title: string;
  description: string;
  image: string | null;
  status: 'New' | 'Viewed' | 'Replied';
  timestamp: string;
}

export interface TrendingSwap {
  id: number;
  item1_title: string;
  item2_title: string;
  item1_image: string | null;
  item2_image: string | null;
  offer_count: number;
}

export interface PopularCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
