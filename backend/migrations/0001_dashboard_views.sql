-- ============================================================
-- BarterX Dashboard Backend Schema Enhancements
-- ============================================================
-- This migration adds views, indexes, and backend support
-- needed for the new dashboard to function properly.
-- ============================================================

-- ─── PERFORMANCE INDEXES ─────────────────────────────────────

-- Index for faster category lookups on items
CREATE INDEX IF NOT EXISTS idx_barteritem_category_status
ON api_barteritem (category_id, status);

-- Index for faster user item lookups
CREATE INDEX IF NOT EXISTS idx_barteritem_owner_status
ON api_barteritem (owner_id, status);

-- Index for notification lookups
CREATE INDEX IF NOT EXISTS idx_notification_user_read_created
ON api_notification (user_id, is_read, created_at DESC);

-- Index for interests by status
CREATE INDEX IF NOT EXISTS idx_barterinterest_status_created
ON api_barterinterest (status, created_at DESC);

-- Index for chat messages by room
CREATE INDEX IF NOT EXISTS idx_chatmessage_room_created
ON api_chatmessage (room_id, created_at DESC);

-- ─── DASHBOARD STATS VIEW ────────────────────────────────────
-- Centralized view for computing dashboard metrics per user

CREATE VIEW IF NOT EXISTS v_user_dashboard_stats AS
SELECT
  u.id AS user_id,
  u.username,
  u.date_joined,
  COALESCE(up.trust_score, 50) AS trust_score,
  COALESCE(up.trust_level_computed, 'medium') AS trust_level,
  COALESCE(up.display_name, u.username) AS display_name,
  COALESCE(up.location, 'Remote') AS location,
  COALESCE(up.average_rating, 0.0) AS average_rating,
  COALESCE(up.reward_points, 0) AS reward_points,
  -- Successful swap count
  (
    SELECT COUNT(*)
    FROM api_barterinterest bi
    WHERE bi.status = 'completed'
      AND (bi.requester_id = u.id OR bi.receiver_id = u.id)
  ) AS successful_swaps,
  -- Recent swaps this month
  (
    SELECT COUNT(*)
    FROM api_barterinterest bi
    WHERE bi.status = 'completed'
      AND (bi.requester_id = u.id OR bi.receiver_id = u.id)
      AND bi.updated_at >= date('now', 'start of month')
  ) AS recent_swaps_this_month,
  -- Pending offers count
  (
    SELECT COUNT(*)
    FROM api_barterinterest bi
    WHERE bi.status IN ('pending', 'accepted')
      AND (bi.requester_id = u.id OR bi.receiver_id = u.id)
  ) AS pending_offers,
  -- Unread notifications
  (
    SELECT COUNT(*)
    FROM api_notification n
    WHERE n.user_id = u.id AND n.is_read = 0
  ) AS unread_notifications,
  -- Member months
  CAST(
    (julianday('now') - julianday(u.date_joined)) / 30.44 AS INTEGER
  ) AS member_months
FROM auth_user u
LEFT JOIN api_userprofile up ON up.user_id = u.id;

-- ─── TRENDING ITEMS VIEW ────────────────────────────────────
-- Items sorted by interest count for trending feature

CREATE VIEW IF NOT EXISTS v_trending_items AS
SELECT
  bi_item.id AS item_id,
  bi_item.title,
  bi_item.offering,
  bi_item.wanting,
  bi_item.image_url,
  bi_item.location,
  bi_item.status,
  COUNT(bi.id) AS interest_count
FROM api_barteritem bi_item
LEFT JOIN api_barterinterest bi ON bi.requested_item_id = bi_item.id
WHERE bi_item.status = 'active'
  AND bi.created_at >= date('now', '-7 days')
GROUP BY bi_item.id
ORDER BY interest_count DESC;

-- ─── VERIFICATION STATUS (computed from profile) ────────────
-- This can be used by any consumer to get consistent verification data

CREATE VIEW IF NOT EXISTS v_user_verification AS
SELECT
  u.id AS user_id,
  u.username,
  CASE WHEN (up.display_name IS NOT NULL AND up.display_name != ''
             AND up.bio IS NOT NULL AND up.bio != ''
             AND up.location IS NOT NULL AND up.location != '')
       THEN 1 ELSE 0 END AS profile_complete,
  CASE WHEN (up.phone_number IS NOT NULL AND up.phone_number != '')
       THEN 1 ELSE 0 END AS phone_verified,
  CASE WHEN (u.email IS NOT NULL AND u.email != '')
       THEN 1 ELSE 0 END AS email_verified,
  up.is_verified AS id_verified,
  (
    SELECT COUNT(*)
    FROM api_barterinterest bi
    WHERE bi.status = 'completed'
      AND (bi.requester_id = u.id OR bi.receiver_id = u.id)
  ) AS successful_trades
FROM auth_user u
LEFT JOIN api_userprofile up ON up.user_id = u.id;

-- ============================================================
-- NOTE: SQLite doesn't support materialized views or stored
-- procedures. For production with PostgreSQL, these should be
-- converted to materialized views with refresh triggers and
-- proper RPC functions.
-- ============================================================
