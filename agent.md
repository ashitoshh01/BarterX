# Agent Instructions — Barter Marketplace

You are working inside an existing full-stack repo (React 19 + Django REST Framework + Django Channels). Read `context.md` first for architecture, routes, and domain model before making any change. These rules apply to every task in this repo unless the user explicitly overrides one for a specific request.

## 1. Before You Touch Code
- Locate the real files behind whatever route/module you're asked to work on (don't assume file names — search the repo).
- Check whether the current implementation is mocked, partial, or real. State this explicitly before proposing changes.
- If a task depends on a module that's still mocked upstream (e.g., Contracts depends on Trades), flag the dependency before starting.

## 2. Non-Negotiable Rules
- **No fake data left in place.** Never leave hardcoded arrays, fixture objects, `setTimeout`-simulated loading, or placeholder strings pretending to be live data. If you can't wire something to a real backend yet, say so — don't fake it.
- **No silent scope-cutting.** If something is too large/ambiguous for this pass, explicitly say "skipping X because Y" instead of leaving it half-done and looking finished.
- **Backend is source of truth.** Business rules (state machines, permissions, trust score, wallet balance changes) are enforced server-side, never only in the frontend.
- **Every list/detail view needs three states**: loading, empty, and error — not just the happy path.
- **Every write endpoint is permission-checked server-side** (users can only edit their own items, act on proposals addressed to them, sign contracts they're party to, etc.).
- **Every money-like operation (Wallet, escrow) must be atomic** — no race conditions on concurrent spend/award.
- **WebSocket events must degrade gracefully** — reconnect with backoff, and reflect connection state in the UI instead of failing silently.

## 3. Workflow Per Task
1. Restate what you understood the task to be, in 1–2 sentences.
2. List the files you're going to touch (frontend + backend) before editing.
3. Make the change.
4. Run/describe how you validated it (migration ran, endpoint tested, UI state checked).
5. Summarize: what changed, any new migrations, any follow-up needed, anything you deliberately left out of scope.

Do not skip step 1 or 5 even for small tasks — they're what let me trust the change without re-reading every diff.

## 4. Code Style & Conventions
- Match existing patterns in the repo (naming, folder layout, component structure) rather than introducing a new convention mid-project.
- Frontend data access goes through `AppContext.jsx` / existing hooks/services where those exist — don't scatter raw `fetch` calls through components.
- Keep API response shapes consistent across endpoints (same pagination envelope, same error format) — don't special-case parsing per module.
- Django: use serializers for validation, not manual dict-building in views. Use `Q` objects / `filter()` for search — don't fetch-all-then-filter-in-Python for anything paginated.
- Write migrations for every model change; never hand-edit the DB schema.

## 5. Testing / Definition of Done (apply per module/feature)
- [ ] No mock/hardcoded data remains
- [ ] Real model + serializer + view + URL route exist on the backend
- [ ] Frontend calls the real endpoint with loading/empty/error states
- [ ] Server-side permission checks in place
- [ ] Relevant WebSocket events fire where applicable
- [ ] You can manually walk through: create → refresh page → data persists

## 6. When You're Blocked
If a task needs something you don't have (API keys for a payment/courier/e-signature/OTP provider, a missing design asset, an ambiguous business rule), stop and ask rather than guessing or stubbing it in a way that looks finished. Implement the integration *seam* (interface, config placeholder, TODO with clear marker) so it's a one-step plug-in later.

## 7. Communication Style
- Be direct about what's broken or missing — don't soften a "this was never implemented" into "this could be improved."
- When giving status on multiple modules, use a table (Module | Status | Missing Pieces) rather than prose paragraphs.
- Flag any change that touches auth, permissions, or money/wallet logic explicitly, even if it's small — these need extra scrutiny.