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
| Feed | | |
| Explore | | |
| Listing Detail | | |
| Create/Edit | | |
| Matches | | |
| Proposals | | |
| Chat | | |
| Tracker | | |
| Contracts | | |
| Logistics | | |
| Verification | | |
| Wallet | | |
| Notifications | | |
| Profile | | |
| Disputes | | |
| Service Swap | | |

## Non-Goals / Out of Scope (for now)
- Real payment processing for Coin Store purchases (stub server-side, don't fake success).
- Real third-party courier API integration unless credentials are provided.
- Real e-signature provider (DocuSign etc.) unless specified — typed-name + timestamp + IP is acceptable interim.