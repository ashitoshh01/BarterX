# Project Context — Barter Marketplace

## What this is
A full-stack cashless P2P barter exchange platform. Users trade physical goods, digital assets, and services without money. Core systems: AI-assisted matching, trade proposals/negotiation, digital contracts, escrow-tracked shipment, real-time chat, virtual coin wallet, trust/verification, and dispute resolution.

## Tech Stack
- **Frontend**: React 19, React Router v7 (SPA). Custom "Neobrutalism" design system (bold borders, hard shadows, high-contrast fills). Framer Motion for animation. Sonner for toast notifications.
- **Backend**: Django + Django REST Framework. RESTful JSON APIs.
- **Real-time**: Django Channels over WebSocket at `ws/chat/?token=...` — chat messages, typing indicators, presence, live proposal updates, notification push, wallet balance sync.
- **State management**: Centralized `AppContext.jsx` (React Context) — owns auth state, API sync, image upload parsing, and the WebSocket connection/listeners. Components should read from context/hooks, not call `fetch` directly wherever avoidable.

## App Structure — `/app/` (authenticated layout: `AppLayout`)

```
/app/
├── /feed            → Main Marketplace Feed & Spotlight
├── /explore         → Filtered Search & Discovery Catalog
├── /listing/:id     → Single Item Detail View
├── /create          → Post New Item/Service Listing
├── /edit/:id        → Modify Active Item/Service Listing
├── /matches         → AI Barter Matchmaker & Loops
├── /proposals       → Trade Offer Negotiations Hub
├── /chat            → Active Conversation List
├── /chat/:id        → Real-time Chat & Trade Offer Drawer
├── /tracker/:id     → Active Swap Shipment & Stage Tracker
├── /contracts       → Digital Barter Contracts & PDF Generator
├── /logistics       → Delivery Verification & Carrier Hub
├── /verification    → Trust Score, Identity & KYC Portal
├── /wallet          → Barter Coin (◈) Balance & Ledger
├── /notifications   → System & Activity Notifications Feed
├── /profile         → User Profile, Stats & Level Progression
├── /disputes        → Trade Dispute Resolution Portal
└── /service-swap    → Skill & Service Bartering Exchange
```

## Backend API Surface (expected)

| Endpoint | Methods | Used by |
|---|---|---|
| `/api/items/` | GET, POST, PUT, PATCH, DELETE | Feed, Explore, Create/Edit, Service Swap |
| `/api/categories/` | GET | Explore, Create/Edit |
| `/api/recommendations/matches/` | GET | Feed, Matches |
| `/api/interests/` | GET, POST, PATCH | Proposals, Listing Detail |
| `/api/chatrooms/` | GET, POST | Chat |
| `ws/chat/?token=...` | WebSocket | Chat, Notifications, Proposals, Wallet |
| `/api/trades/` | GET, POST, PATCH | Logistics |
| `/api/trades/:id/` | GET, PATCH | Tracker |
| `/api/contracts/` | GET, POST, PATCH | Contracts |
| `/api/profiles/` | GET, PATCH | Verification, Listing Detail (Trust Score) |
| `/api/wallet/transactions/` | GET, POST | Wallet |
| `/api/notifications/` | GET, PATCH | Notifications |
| `/api/profile/` | GET, PATCH | Profile |
| `/api/disputes/` | GET, POST, PATCH | Disputes |

## Core Domain Concepts

- **Item**: a physical product or digital service listing. Fields include title, description, category, condition (`New/Like New/Good/Fair`), location, estimated value, images, "wants in return", owner.
- **Interest / Proposal**: an offer from one user on another user's item. Lifecycle: `Pending → Negotiating → Countered → Accepted / Declined / Cancelled`.
- **Trade**: created when a Proposal is `Accepted`. Drives Contract, Tracker, Logistics, and Escrow state.
- **Contract**: auto-generated agreement text tied to a Trade, requires dual digital signature before it's "Legally Signed."
- **Tracker**: 5-stage pipeline per Trade — `Proposal Accepted → Contract Signed → Shipped → Delivered/Inspected → Completed (Trust Score awarded)`.
- **Trust Score (0–100)**: computed from verified phone + Govt ID/KYC + institutional ID + completed swaps + review average. Drives badges (`Verified Swapper`, `Power Trader`, `Top Rated`, `Fast Shipper`).
- **Wallet**: ◈ Barter Coin balance, ledger of earned/spent coins, used for boosts, tips, service payment, or bridging valuation gaps in a trade.
- **Barter Loop**: a multi-party (3-way/4-way) cycle of wants detected across listings, resolving circular trade dependencies that a 1-to-1 match can't.
- **Dispute**: opened against a Trade, reasons include not-as-described, not-received, damaged, fraudulent; has an evidence uploader and an admin-escalation path.

## Known State (fill this in / keep updated)
> Update this section as modules move from mocked → partial → done, so the agent always has current ground truth instead of re-discovering it every session.

| Module | Status | Notes |
|---|---|---|
| Feed | Done | Displays "For You", "Trending" (by views), and "Near You" (location matching). |
| Explore | Done | Filtered search, discovery, and saving items. |
| Listing Detail | Done | View detailed item parameters, trust score, and initiate trade offers. |
| Create/Edit | Done | Complete posting form with image upload support and price calculator. |
| Matches | Done | AI-based matching using Google GenAI SDK (Gemini) over `/recommendations/matches/`. |
| Proposals | Done | Dual negotiation flow (`BarterInterest`) supporting counter-offers and status transitions. |
| Chat | Done | Real-time Django Channels WebSockets support for text, typing, and status syncing. |
| Tracker | Done | Swap tracker tracking logistics stages from accepted to completed. |
| Contracts | Done | Digital signature flow with ReportLab PDF contract generation. |
| Logistics | Done | Delivery carrier tracking, verification updates. |
| Verification | Done | Trust score calculation (0-100) and user details/KYC. |
| Wallet | Done | BarterX Coin system with transaction ledger and Razorpay integration (real or simulated). |
| Notifications | Done | Live WS push notifications and persistent ledger. |
| Profile | Done | Stats, badges, user bio/profile details and ratings. |
| Disputes | Done | Create disputes on trades with evidence file upload and tracking. |
| Service Swap | Done | Skill and service exchange filtering. |

## Non-Goals / Out of Scope (for now)
- Real payment processing for Coin Store purchases (stub server-side, don't fake success).
- Real third-party courier API integration unless credentials are provided.
- Real e-signature provider (DocuSign etc.) unless specified — typed-name + timestamp + IP is acceptable interim.