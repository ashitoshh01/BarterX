# Barter Marketplace — Comprehensive Feature Audit & Product Loop Roadmap

**Date:** 2026-08-09  
**Target File:** `FEATURE_AUDIT_AND_ROADMAP.md`  
**Purpose:** Detailed analysis of what is **Working (Completed)**, what is **Partially Implemented/Broken**, and what is **Completely Remaining** to finish the end-to-end cashless barter & coin exchange application cycle.

---

## 1. Core Vision & The Complete Problem-Solving Cycle

### The Problem
Traditional secondhand marketplaces force monetary transactions, cash negotiations, or payment gateway fees. Pure barter marketplaces fail when two users' items have unequal value (e.g. trading an iPhone for a bicycle). 

### The Solution
**Barter Marketplace** solves this by offering:
1. **Direct Item-for-Item Swaps** (1:1 Barter).
2. **Asymmetric Value Balancing with Barter Coins** (Item A + X Coins for Item B).
3. **Pure Coin Purchases** (Exchanging Barter Coins directly for items when no physical item is offered).
4. **Legal Escrow & Smart Contracts** (Digital signatures, PDF contracts, and automated coin escrow).
5. **Verified Logistics & Handshake PIN Delivery** (Secure physical meetup or parcel delivery verification).
6. **Trust Score & Reputation Loop** (Dynamic trust score, reviews, dispute resolution).

---

## 2. Master Feature Matrix: Completed vs. Broken vs. Remaining

| Feature Area | Sub-Feature / Capability | Status | Notes / Location |
|---|---|---|---|
| **Auth & Profiles** | Username & Email JWT Login | ✅ **Working** | `POST /api/login/` supports both |
| | Registration + Dev OTP | ✅ **Working** | `POST /api/register/simple/`, `send-otp/` |
| | Profile Read/Update & Avatar Upload | ✅ **Working** | `GET/PUT /api/profile/`, image upload works |
| | Trust Score Calculation | ✅ **Working** | Computed dynamically based on verification + trades |
| | Google OAuth Login | ⚠️ **Incomplete** | Backend endpoint OK; UI has placeholder Client ID |
| **Listings & Feed** | Listing Creation & Multi-Image | ✅ **Working** | `BarterItem` model, image storage working |
| | Listing Boost (with coins) | ✅ **Working** | Deducts 100 coins, sets expiration date |
| | Listing Feed & Detail View | ✅ **Working** | Backend pagination + SPA feed |
| | Item Search & Category List | ✅ **Working** | `GET /api/items/?search=`, `GET /api/categories/` |
| | Category / Type / Price Filters | ❌ **Broken (500)** | Filters reference non-existent DB fields |
| **Proposals & Deal Flow** | Interest / Proposal Creation | ✅ **Working** | `BarterInterest` model, offer item + coins |
| | Proposal State Transitions | ✅ **Working** | `pending` ➔ `accepted`/`declined`/`countered`/`cancelled` |
| | Auto Listing Reservation | ✅ **Working** | Reserves items upon proposal acceptance |
| | Pure Coin Purchase for Item | ❌ **Missing** | Cannot buy item purely with coins without physical item |
| | Dynamic Value Gap Calculator | ❌ **Missing** | Auto-suggesting coin difference based on item scores |
| **Contracts & Legal** | Contract Generation | ✅ **Working** | Auto-created upon proposal acceptance |
| | Digital Signature (Party A & B) | ✅ **Working** | Captures timestamp + client IP |
| | PDF Download | ✅ **Working** | ReportLab PDF engine generates official contract |
| **Logistics & Escrow** | Shipping Provider & Tracking Number | ✅ **Working** | `POST /api/trades/{id}/update_logistics/` |
| | Stage Transitions (shipped ➔ delivered)| ✅ **Working** | Validated forward-only progression |
| | Automated Coin Escrow Payout | ✅ **Working** | Transfers `coins_offered` upon `delivered` status |
| | Meetup Location / Date / Time Data | ❌ **Broken** | UI form collects data; backend drops it (no model fields) |
| | Handshake PIN / QR Delivery Verification | ❌ **Missing** | Deliveries complete without receiver PIN confirmation |
| **Wallet & Coin Exchange** | Coin Balance & Transaction Ledger | ✅ **Working** | `UserProfile.coin_balance`, `CoinTransaction` model |
| | Purchase Coins Backend Endpoint | ✅ **Working** | `POST /api/wallet/purchase-coins/` (simulated payment) |
| | Redeem Coins Backend Endpoint | ✅ **Working** | `POST /api/wallet/redeem-coins/` |
| | Frontend Buy/Redeem Coin Store UI | ❌ **Missing** | `Wallet.jsx` shows balance but lacks Buy/Redeem modal |
| | Real Payment Gateway Integration | ❌ **Missing** | Stripe / Razorpay integration for real money purchases |
| **Realtime Communication** | WebSocket Chat (Send, Edit, Delete) | ✅ **Working** | `/ws/chat/` + Channels consumer |
| | Read Receipts & Online Presence | ✅ **Working** | Auto receipts + Redis presence fallback |
| | In-App Notifications | ✅ **Working** | Triggered on proposals, acceptance, logistics |
| | Typing Indicator | ❌ **Broken (Crash)** | Async ORM exception in `handle_typing()` consumer |
| | System Messages in Chat Thread | ⚠️ **Incomplete** | Contract signed/logistics status update not posted in chat |
| **AI Matchmaker & Discovery** | AI Matchmaking Recommendations | ⚠️ **Incomplete** | Missing Gemini API Key; uses fallback search |
| | Deprecated AI SDK | ❌ **Deprecation** | Imports legacy `google.generativeai` |
| **Trust & Disputes** | Dispute Creation & Escalation | ✅ **Working** | File evidence uploads + escalation |
| | User Ratings & Reviews | ✅ **Working** | 1-5 star reviews + comments |
| | Auto Post-Trade Review Prompt | ❌ **Missing** | No prompt after trade delivery to rate swapper |
| **Code Quality & Infra** | Dev Server & Webpack Production Build | ✅ **Working** | Compiles cleanly |
| | Data Seeding Script | ❌ **Broken** | `generate_test_data.py` imports deleted `ChatRoom` |
| | N+1 Database Query Performance | ❌ **Performance Issue** | Item feed runs 147 SQL queries for 20 items |
| | Dead Code Removal | ❌ **Messy** | Dormant `.tsx` app exists alongside active `.jsx` app |

---

## 3. Deep-Dive Analysis of Gaps in the Application Cycle

### Gap 1: The Coin Exchange & Valuation Balance Loop (Incomplete)
- **What Exists:** You can offer coins *alongside* an item in a proposal (`coins_offered`). You can also boost listings for 100 coins, and the backend has API endpoints for `/api/wallet/purchase-coins/` and `/api/wallet/redeem-coins/`.
- **What is Missing:**
  1. **Pure Coin Barter:** If User A has no physical item that User B wants, User A should be able to make a "Pure Coin Proposal" (paying 100% in Barter Coins for User B's item).
  2. **Valuation Calculator:** When proposing a swap between Item A (Value ₹2,000) and Item B (Value ₹5,000), the app should automatically calculate the valuation gap (₹3,000 / 300 Coins) and suggest adding 300 coins to balance the barter.
  3. **Frontend Coin Store UI:** In `Wallet.jsx`, users can view their balance but cannot click a "Top Up / Buy Coins" button to trigger payment or purchase coin packs.

### Gap 2: Meetup & Secure Delivery Handshake (Incomplete)
- **What Exists:** Logistics tracking moves from `preparing` ➔ `shipped` ➔ `out_for_delivery` ➔ `delivered`. When marked `delivered`, coin escrow releases automatically.
- **What is Missing:**
  1. **Meetup Data Loss:** `frontend/src/pages/Logistics.jsx` asks users to pick a meetup place, date, and time. But when saved, this information is discarded because the backend `Trade` model only has `tracking_number` and `shipping_provider`.
  2. **Handshake Verification PIN:** Right now, the sender can click "Delivered" unilaterally without the receiver's consent. A complete barter platform requires a **4-digit secret PIN** or **QR code** generated when the deal is signed. Upon meeting or unboxing, the receiver gives the PIN to the sender to verify delivery.

### Gap 3: Post-Trade Completion & Trust Feedback Loop (Incomplete)
- **What Exists:** Users can manually navigate to user profiles to leave a 1-5 star review.
- **What is Missing:**
  1. Once a trade status becomes `completed`, the system should automatically trigger a **"Rate Your Trade Partner"** modal for both users.
  2. Submitting the rating should immediately update the target user's `average_rating`, increment their `trust_score` (+5 for positive swap), and award bonus reward points (+50 XP).

### Gap 4: Landing Page & Seeding Script (Incomplete)
- **What Exists:** The app works well once logged in.
- **What is Missing:**
  1. `Landing.jsx` is completely mock-driven (`import { LISTINGS, USERS } from "@/mock/data"`), ignoring live items from Django.
  2. `backend/generate_test_data.py` fails on import because it looks for `ChatRoom` (which was migrated to `Conversation`).

---

## 4. Actionable Execution Plan (Step-by-Step Roadmap)

### Phase 1: High-Impact Bug Fixes (Immediate)
- [ ] **Fix 500 Item Filters (`backend/api/views.py`)**: Fix `get_queryset()` in `BarterItemViewSet` so `category`, `item_type`, and `valuation_min/max` query params don't throw server errors.
- [ ] **Fix WebSocket Typing Crash (`backend/chat/consumers.py`)**: Wrap `self.user.profile.display_name` in `@database_sync_to_async` inside `handle_typing()`.
- [ ] **Fix Test Data Seeder (`backend/generate_test_data.py`)**: Update imports from `ChatRoom`/`ChatMessage` to `Conversation`/`Message`.
- [ ] **Eliminate N+1 Queries (`backend/api/views.py`)**: Add `select_related('owner__profile', 'category')` and `prefetch_related('images')` to `BarterItemViewSet`.

### Phase 2: Complete the Coin Exchange & Barter Valuation Loop
- [ ] **Enable Pure Coin Proposals**: Allow proposals where `offered_item` is `null` and `coins_offered > 0`. Update validation so items can be bought purely with coins.
- [ ] **Add Valuation Gap Calculator**: When a user creates a proposal in `ListingDetail.jsx`, compute `abs(item1.price - item2.price)` and display: *"Suggested balance top-up: X Barter Coins"*.
- [ ] **Build Wallet Coin Store Modal (`frontend/src/pages/Wallet.jsx`)**: Add a "Buy Coins" modal allowing users to select coin tiers (e.g. 50 Coins for $5, 200 Coins for $18), which calls `POST /api/wallet/purchase-coins/`.

### Phase 3: Secure Delivery Verification & Meetup Handshake
- [ ] **Update Trade Model for Meetup Logistics**: Add `meetup_location`, `meetup_datetime`, and `handshake_pin` fields to `Trade` in `backend/api/models.py`.
- [ ] **Implement Handshake Verification PIN**:
  - Generate a random 4-digit PIN when a trade contract is signed.
  - Show the PIN to the receiver.
  - Require the sender to enter the receiver's PIN on the `Logistics.jsx` screen to transition status to `delivered` and release coin escrow.

### Phase 4: Full App Lifecycle Integration & Polish
- [ ] **Connect Landing Page to Live API**: Replace `@/mock/data` imports in `Landing.jsx` with real items fetched from `GET /api/items/`.
- [ ] **Post-Trade Review Modal**: Open a popup when a trade completes encouraging users to rate their swapper.
- [ ] **Configure AI & Email Keys**: Add `GEMINI_API_KEY` to `backend/.env` and update `ai_service.py` to use `google.genai`.
- [ ] **Cleanup Dead TypeScript Files**: Remove unused dormant `.tsx` files in `frontend/src/pages/` to keep the codebase clean.

---

*Document generated as an actionable completion blueprint for Barter Marketplace.*
