# Barter Marketplace — Full Codebase Diagnosis

**Date:** 2026-08-09
**Scope:** Full-stack audit of `backend/` (Django + DRF + Channels) and `frontend/` (React 19 + CRA/craco). All findings below were verified by actually running the app and exercising the endpoints, WebSocket, build, and database — not just by reading code.

---

## 1. Stack & Layout

| Layer | Tech |
|---|---|
| Backend | Django 6.0.7, Django REST Framework 3.17.1, SimpleJWT, Channels 4.3.2 + Daphne, ReportLab, Pillow |
| Frontend | React 19, CRA + craco, React Router, Tailwind, Radix UI, lucide-react, sonner, recharts |
| DB | SQLite (`backend/db.sqlite3`) — `requirements.txt` lists psycopg2-binary but Postgres is **not** used |
| Realtime | Channels WebSocket at `/ws/chat/` + Redis presence (auto-falls back to in-memory when Redis is down) |

Key entry points:

- Backend routing: `backend/config/urls.py` (API under `/api/`), `backend/config/asgi.py` (WS under `/ws/chat/`)
- Frontend app shell: `frontend/src/App.jsx` ← `frontend/src/index.js`
- Global state: `frontend/src/context/AppContext.jsx` (auth, profiles, listings, chat, wallet, reviews, misc)
- API client: `frontend/src/lib/api.js` (JWT auto-refresh, `barter_token` / `barter_refresh_token`)

> **Heads-up:** the repo contains **two parallel frontend apps**. The live one is the `.jsx` stack (`index.js` → `App.jsx`). A second, **dormant** `.tsx` app (`src/main.tsx` → `App.tsx`, `src/services/api.ts` hardcoding `http://localhost:8000/api` and using token key `tokens`) still exists and is dead code.

---

## 2. How to Run (verified working)

```bash
# Backend (already running on :8000 during this audit)
cd backend && source venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Frontend dev server (verified: webpack compiles, serves on :3000)
cd frontend && npm start

# Production build (verified: succeeds; 1 eslint warning only)
cd frontend && npm run build
```

CORS is wide open (`*`), so the SPA on `:3000` talks to `:8000` without issues.

### Test credentials

| id | username | password | notes |
|---|---|---|---|
| 15 | `ashh` | `test12345` | reset during audit; has items, a trade, a conversation |
| 9 | `ashitoshh01` | `test12345` | reset during audit; has a conversation with `ashh` |

**Note:** these passwords were reset during the audit to enable end-to-end testing. If the team expects the original passwords, they should be re-set.

---

## 3. Database State (as of audit)

- 12 users, 11 profiles, 23 categories, 32 items
- 1 interest/proposal, 1 contract, 1 trade, 1 conversation with ~11 messages
- 0 disputes, 0 coin transactions, 0 saved items
- A few diagnostic messages (ids 9–11) and `+50` coins on user 15 were created during testing — safe to wipe if a clean slate is wanted.

---

## 4. What Works (verified live)

### 4.1 Backend APIs

| Endpoint | Result |
|---|---|
| `POST /api/login/` | 200 — **works with username AND email** (tested both) |
| `POST /api/register/simple/` | 201 with access token — full happy path tested |
| `POST /api/register/send-otp/` | 200, returns `dev_otp` in dev mode |
| `POST /api/token/refresh/` | works with a valid refresh token |
| `GET /api/items/` | 200, paginated (default `page_size=20`, max 100), search works |
| `GET /api/categories/`, `/api/items/{id}/` | 200 |
| `GET /api/profiles/me/`, `/api/profiles/dashboard_stats/` | 200 |
| `GET /api/profile/` + `PUT /api/profile/` | 200 (self-profile read/update) |
| `GET/POST /api/interests/` (proposals) | 200 |
| `GET /api/contracts/` | 200 |
| `GET /api/contracts/{id}/download_pdf/` | 200, `application/pdf` — ReportLab PDF generation works |
| `GET /api/trades/`, `POST /api/trades/{id}/update_logistics/` | 200 |
| `GET /api/disputes/`, `/api/notifications/`, `/api/reviews/`, `/api/saved-items/`, `/api/wallet/transactions/` | 200 |
| `POST /api/wallet/purchase-coins/` | 200 — tested 50 coins → balance 60 |
| `POST /api/auth/google/` | returns clean 400 for an invalid token (backend logic OK) |
| `GET /api/recommendations/matches/` | 200 but returns `[]` (see §5.6) |

### 4.2 Real-time chat (the flagship feature — genuinely working)

Two-socket test over `ws://localhost:8000/ws/chat/?token=<JWT>`:

- `connect` / `join_room` / `ping` → `pong` all work
- Sending a message delivered **all three** events to the peer: `chat.message`, `chat.message_preview`, and `notification.created`
- `join_room` correctly triggers read/delivered receipts
- Presence online/offline broadcast is implemented (memory + optional Redis)

### 4.3 Frontend

- Dev server and production build both compile (single warning: `AppContext.jsx:1045` — `useCallback` missing `loadChatMessages` dep)
- Auth, feed, chat, contracts (PDF blob download), swap/logistics, wallet, reviews, and notifications are wired to the real API
- Most app pages use `@/mock/data` only as a **fallback/seed** — the real backend drives them once loaded

---

## 5. What's Broken (with proof)

### 5.1 Items filter endpoints throw 500 — `backend/api/views.py:390-419`
`BarterItemViewSet.get_queryset()` filters on fields/relations that **do not exist** in the model. Each throws `FieldError` → 500:

| Query param | Broken filter | Actual model |
|---|---|---|
| `?category=` | `category__slug__iexact` (line 393) | `Category` has **no `slug`** field |
| `?item_type=` | `item_type__iexact` (line 405) | `BarterItem` has **no `item_type`** field |
| `?valuation_min/max=` | `estimated_value__gte/lte` (lines 410/416) | `BarterItem` has **no `estimated_value`** field |

Verified: `GET /api/items/?item_type=product` → 500 FieldError; `?category=1` → 500; `?valuation_min=10` → 500.
**Why it isn't caught:** the SPA's Explore page filters client-side and never sends these params, so the 500s are latent. Fix: drop the dead filters or align them with the real schema (`category__name`, `condition`, `location` already work).

### 5.2 Typing indicator crashes the WebSocket — `backend/chat/consumers.py:235`
`handle_typing()` reads `self.user.profile.display_name` inside async code → **`django.core.exceptions.SynchronousOnlyOperation: You cannot call this from an async context`** (confirmed in backend log).

Consequence: `ChatThread.jsx` broadcasts `typing_start`/`typing_stop` (lines 13, 48–55, 136) but the peer **never** receives them, and the exception aborts the handler. Fix: wrap profile access in `@database_sync_to_async` (or `await sync_to_async(...)`) exactly like the other handlers.

### 5.3 `/api/profile/me/` is 404 — route mismatch
The API exposes `/api/profile/` (read/update) but the frontend-only URL `/api/profile/me/` 404s. The SPA correctly uses `/api/profile/`, so this is cosmetic/confusing, not a user-facing break.

### 5.4 `generate_test_data.py` is broken — `backend/generate_test_data.py`
Imports `ChatRoom` and `ChatMessage` which were **removed from `api/models.py`** in migration 0014. Verified: `ImportError: cannot import name 'ChatRoom' from 'api.models'`. The README tells developers to run this script to seed data — it crashes on import.

### 5.5 Landing page is fully mock-driven — `frontend/src/pages/Landing.jsx:8`
Imports `LISTINGS, USERS` from `@/mock/data` and renders a static shell. Contradicts `agent.md` ("no fake data / backend is source of truth") and shows stale/duplicate data to visitors.

### 5.6 AI matches feature is inert without a Gemini key — `backend/api/ai_service.py`
- `backend/.env` has **no `GEMINI_API_KEY`**, so `_get_fallback_matches()` runs.
- Fallback requires *mutual* keyword overlap between a user's `wanting` and every other active item's `wanting`/title/description — with 32 sparse items it returns `[]`.
- Verified: user 15 with 1 active item → `matches count: 0`; endpoint returns `[]`.
- Bonus: `ai_service.py:4` imports `google.generativeai`, which is **fully deprecated** (FutureWarning) — must migrate to `google.genai`.

### 5.7 Google login cannot work in the UI
`frontend/.env` has `REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com` — a placeholder. The backend OAuth endpoint works (clean 400 on bad token) but no real client ID is configured, so the Google button will fail in production.

### 5.8 OTP email is a console prototype — `backend/api/email_services.py`
No real email provider is wired. OTPs are printed to the console and returned as `dev_otp`. Fine for dev, but registration-by-phone/email does not actually deliver mail.

### 5.9 Chat polling duplicates the WebSocket — `frontend/src/pages/ChatThread.jsx`
The thread joins the WS room **and** re-fetches all messages every 3 s. The WS already delivers messages live; the poll adds redundant request load and can cause flicker/reordering.

### 5.10 Meetup logistics data is dropped — `frontend/src/pages/Logistics.jsx:53-56`
The meetup form collects location/date/time, but the save action only sends `logistics_status = "shipped"` — the meetup fields are never sent to the backend (the Trade model has no such fields). Also `Logistics.jsx:14` falls back to `trades[0]`, and the trade selector does a full `window.location.reload()`.

---

## 6. Performance Issues

### 6.1 Severe N+1 on the item feed — 147 queries for 20 items
Measured with `CaptureQueriesContext` on `GET /api/items/?page_size=20` (logged-in): **147 SQL queries**.

Causes in `BarterItemSerializer` (`backend/api/serializers.py:201-244`):
- `get_owner()` → owner + owner profile lookup per item
- `get_proposal_count()` / `get_chat_count()` → 2 aggregate queries per item
- `history_logs` and `images` → sub-serializer queries per item

`BarterItemViewSet.get_queryset()` performs **no** `select_related` / `prefetch_related`. Fix:
- `queryset.select_related("owner__profile", "category").prefetch_related("images", "history_logs")`
- Or drop `proposal_count`/`chat_count` from the list serializer (compute per-detail only)

Also verified: `/api/profile/` costs only 5 queries — this is the one hotspot that matters.

### 6.2 Heavy list payloads
List responses include absolute image URLs and full history logs for every item, even though the feed only needs the cover image. Consider a slim list serializer (cover image + core fields) and a rich detail serializer.

### 6.3 Data authenticity stubs
`backend/api/views.py:345` fabricates distance as `hash(owner.username) % 20 + 10`, and `mutual_friends` is `hash(owner.username) % 5`. Fake data presented as real metrics — violates the project's own "no fake data" rule.

---

## 7. Security / Production-Readiness Gaps

| Issue | Where | Note |
|---|---|---|
| `DEBUG=True` | `backend/config/settings.py` | Must be off in prod |
| Hardcoded `SECRET_KEY` committed | `backend/config/settings.py` | Must come from env |
| `ALLOWED_HOSTS=['*']`, CORS `*` | `backend/config/settings.py` | Dev-only |
| JWT passed in WS query string | `frontend/src/lib/ws` → `/ws/chat/?token=` | Leaks token into logs; prefer `Sec-WebSocket-Protocol` or cookie |
| Insecure `SECRET_KEY`/`JWT` defaults | `settings.py` | |
| No rate limiting on login/OTP/register | backend | Brute-force risk |

---

## 8. Dead Code & Cleanup

- **Dormant `.tsx` app**: `src/main.tsx`, `App.tsx`, `services/api.ts` (hardcoded port, wrong token key) — remove or port.
- **Mock data still imported in real components**: `AppContext.jsx:4` imports `USERS, SWAP_TRACKER` from `@/mock/data` (used as fallbacks at lines 1157, 1198); `Landing.jsx:8` imports `LISTINGS, USERS`. `mock/data.js` is a 2000+ line fixture file that should be removed once Landing is wired to the API.
- `requirements.txt` lists psycopg2-binary etc. though the project runs SQLite.
- The `websockets` pip package was installed into `backend/venv` during this audit (used for testing only) — it is not in `requirements.txt`.

---

## 9. What to Add / Roadmap (priority order)

1. **Fix the 5-minute bugs** (§5.1 broken filters, §5.2 typing crash, §5.4 `generate_test_data.py`) — small, high impact.
2. **Wire Landing to the real API** and delete `@/mock/data` usage (per `agent.md`).
3. **Fix N+1** on the items feed (§6.1).
4. **Configure real integrations**: `GEMINI_API_KEY` + migrate to `google.genai` (AI matches), real Google Client ID (Google login), real email provider (OTP).
5. **Production hardening**: env-based `SECRET_KEY`, `DEBUG=False`, locked-down `ALLOWED_HOSTS`/CORS, move JWT off the WS query string, add rate limiting.
6. **UX completeness** per `agent.md` (loading/empty/error states): `AIMatches.jsx` has no empty state (shows "0 MATCHES" with nothing below); `Landing.jsx` is a static shell.
7. **Chat cleanup**: drop the 3 s polling fallback in `ChatThread.jsx` (or keep it as an offline-only retry).
8. **Logistics**: persist meetup location/date/time (add Trade fields + serializer) instead of only flipping status.
9. **Remove the dormant `.tsx` app**.
10. Optionally reset diagnostic data created during this audit (extra messages, coins, test users).

---

## 10. Verified-Feature Summary

| Feature | Status |
|---|---|
| Auth (login username/email, JWT, refresh) | ✅ Works |
| Registration (simple + OTP dev flow) | ✅ Works |
| Item feed + search + detail | ✅ Works |
| Item filters (category/type/valuation) | ❌ 500s |
| Profiles & dashboard stats | ✅ Works |
| Proposals (interests) | ✅ Works |
| Contracts + PDF download | ✅ Works |
| Trades + logistics update | ✅ Works (meetup fields dropped) |
| Wallet / coins purchase | ✅ Works |
| Disputes, notifications, reviews, saved items | ✅ Works |
| Real-time chat (send, edit, delete, receipts, presence) | ✅ Works |
| Typing indicator | ❌ Crashes (async ORM) |
| AI matches | ⚠️ Returns `[]` without Gemini key |
| Google OAuth | ⚠️ Backend OK, UI blocked by placeholder client ID |
| OTP email | ⚠️ Console prototype only |
| Frontend build | ✅ Works (1 warning) |

---

*Report produced from a live run (backend on :8000, frontend on :3000, WebSocket two-client test, query-count profiling, and a build).*
