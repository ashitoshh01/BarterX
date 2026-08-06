# Test Plan: Barter Marketplace

## 1. Business Cycles

### Cycle A: The "Happy Path" Barter (Interest-based)
1.  **Listing:** User A creates `BarterItem` (status='active').
2.  **Interest:** User B shows interest in User A's item (creates `BarterInterest`, status='pending').
3.  **Acceptance:** User A accepts interest (updates `BarterInterest` to 'accepted').
4.  **Communication:** System automatically creates `ChatRoom` and triggers `Notification`. Users exchange messages.
5.  **Deal:** Both users confirm the deal via `DealConfirmation`.
6.  **Completion:** System updates status to 'completed', updates trust/reward points, and updates coin balance.

### Cycle B: Coin Transaction
1.  **Earning:** User performs actions (e.g., successful trade) that earn coins.
2.  **Logging:** `CoinTransaction` record is created.
3.  **Balance:** `UserProfile.coin_balance` is updated.

## 2. Test Cases

| ID | Cycle | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| TC-01 | A | Successful Barter Completion | Item status 'completed', trust scores adjusted. |
| TC-02 | A | Interest Rejection | `BarterInterest` status 'rejected', no chat created. |
| TC-03 | B | Coin Balance Increase | `CoinTransaction` created, balance reflects increase. |
| TC-04 | A | Contract Auto-Creation & Dual Signature | Contract auto-created on interest acceptance; dual signature updates status to 'signed'. |
| TC-05 | A | Dispute Raising & Escalation | Dispute opened on trade with evidence; escalation updates status to 'escalated'. |
| TC-06 | B | Coin Transaction Ledger & Balance Sync | `CoinTransaction` logged and `UserProfile.coin_balance` updated via `add_coins`. |
| TC-07 | A | Trust Score Adjustment & Level Calculation | `adjust_trust()` remains within 0–100 bounds and updates `trust_level` ('high'/'medium'/'low'). |
| TC-08 | A | Dual Deal Confirmation Workflow | `DealConfirmation` `is_completed` evaluates to True only when both swappers confirm. |

## 3. Data Generation Strategy
- Generate 100+ users with varied `UserProfile` data.
- Generate 500+ `BarterItem` listings across all categories.
- Generate 200+ `BarterInterest` proposals in various states (pending, accepted, completed).
- Populate `ChatRoom` messages for accepted interests.
