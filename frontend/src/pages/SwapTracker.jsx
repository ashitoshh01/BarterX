import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Check, X, Star, MessageCircle, FileText, Package, Truck, MapPin, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── Stage metadata ───────────────────────────────────────────────────────────
const STAGES = ["preparing", "shipped", "out_for_delivery", "delivered"];
const STAGE_LABELS = {
  preparing: "Preparing for Shipment",
  shipped: "Items Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Items Received — Delivered",
};
const STAGE_ICONS = {
  preparing: <Package size={20} strokeWidth={2.5} />,
  shipped: <Truck size={20} strokeWidth={2.5} />,
  out_for_delivery: <MapPin size={20} strokeWidth={2.5} />,
  delivered: <ShieldCheck size={20} strokeWidth={2.5} />,
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ trade, otherUsername, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a rating."); return; }
    setLoading(true);
    try {
      await onSubmit({ rating, comment, tradeId: trade.id });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="nb-card w-full max-w-md bg-[var(--surface)] p-6 space-y-5" data-testid="review-modal">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Rate your experience</div>
            <div className="font-display text-2xl mt-0.5">Leave a Review</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full nb-border-2 hover:tint-pink">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        <div>
          <div className="font-mono2 text-xs uppercase font-bold mb-2">Rating for @{otherUsername}</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-lg nb-border-2 text-lg flex items-center justify-center transition-all ${rating >= n ? "tint-amber nb-shadow" : "bg-[var(--surface-2)]"}`}
                data-testid={`review-star-${n}`}
              >
                ⭐
              </button>
            ))}
            <span className="ml-2 self-center font-bold font-mono2 text-sm">{rating}/5</span>
          </div>
        </div>

        <div>
          <label className="font-mono2 text-xs uppercase font-bold block mb-1.5">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the swap experience?"
            rows={3}
            className="w-full nb-border-2 rounded-lg p-3 bg-[var(--surface)] text-sm font-medium focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full nb-btn tint-lime py-3 font-bold rounded-lg text-sm disabled:opacity-50"
          data-testid="review-submit"
        >
          {loading ? "Submitting…" : "Submit Review ⭐"}
        </button>
      </div>
    </div>
  );
};

// ─── PIN Entry (Receiver) ─────────────────────────────────────────────────────
const PinEntryCard = ({ onConfirm, loading }) => {
  const [pin, setPin] = useState("");

  return (
    <div className="nb-border-2 rounded-lg p-4 tint-amber space-y-3" data-testid="pin-entry">
      <div className="font-mono2 text-xs uppercase font-bold">Confirm Delivery</div>
      <div className="text-sm font-medium">Ask the requester for the 4-digit handshake PIN to confirm you've received the items.</div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="____"
          className="w-24 nb-border-2 rounded-lg p-2.5 bg-[var(--surface)] text-center text-xl font-mono2 font-bold tracking-widest focus:outline-none"
          data-testid="pin-input"
        />
        <button
          onClick={() => onConfirm(pin)}
          disabled={pin.length !== 4 || loading}
          className="nb-btn tint-lime px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex-1"
          data-testid="pin-confirm"
        >
          {loading ? "Verifying…" : "Confirm Delivery"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SwapTracker = () => {
  const { trades, setTrades, user, submitReview, chats, startListingChat } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Find by trade ID
  const trade = trades.find((t) => String(t.id) === String(id));

  // Determine user role
  const isRequester = trade && (
    trade.requester === user?.id ||
    trade.requester_username === user?.id ||
    String(trade.requester) === String(user?.pk) ||
    trade.requester_username === user?.handle?.replace("@", "")
  );
  const isReceiver = !isRequester && trade;

  const currentStageIndex = trade ? STAGES.indexOf(trade.logistics_status) : -1;

  const handleUpdateLogistics = async (status, pin = null) => {
    if (!trade) return;
    setUpdating(true);
    try {
      const body = { logistics_status: status };
      if (pin) body.handshake_pin = pin;
      const res = await api.post(`/trades/${trade.id}/update_logistics/`, body);
      setTrades((prev) =>
        prev.map((t) =>
          t.id === trade.id
            ? { ...t, ...res.data, logistics_status: res.data.logistics_status, status: res.data.status }
            : t
        )
      );
      if (status === "delivered") {
        toast.success("🎉 Trade completed! The swap is done.");
      } else {
        toast.success(`Logistics updated: ${STAGE_LABELS[status]}`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to update logistics.";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliveryWithPin = async (pin) => {
    if (!pin || pin.length !== 4) {
      toast.error("Please enter a 4-digit PIN.");
      return;
    }
    await handleUpdateLogistics("delivered", pin);
  };

  const handleReviewSubmit = async ({ rating, comment, tradeId }) => {
    const otherUsername = isRequester ? trade.receiver_username : trade.requester_username;
    const otherUserId = isRequester ? trade.receiver : trade.requester;
    await submitReview({
      reviewedUserId: otherUserId,
      rating,
      comment,
      tradeId,
    });
    setReviewSubmitted(true);
  };

  const handleChat = async () => {
    // Look for an existing chat room linked to this trade's proposal
    const existingChat = chats.find((c) => {
      const otherUsername = isRequester ? trade.receiver_username : trade.requester_username;
      return c.with === otherUsername;
    });
    if (existingChat) {
      navigate(`/app/chat/${existingChat.id}`);
      return;
    }
    try {
      const itemId = trade.requested_listing;
      if (itemId) {
        const roomId = await startListingChat(itemId);
        navigate(`/app/chat/${roomId}`);
      } else {
        navigate("/app/chat");
      }
    } catch {
      navigate("/app/chat");
    }
  };

  if (!trade) {
    return (
      <div className="space-y-6">
        <SectionTitle>Track this swap.</SectionTitle>
        <div className="nb-card p-8 text-center bg-[var(--surface)]">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-display text-xl mb-2">Trade not found</div>
          <div className="text-sm text-[var(--text-3)] mb-4">
            Trade #{id} could not be located. It may still be loading — try refreshing.
          </div>
          <Link to="/app/proposals">
            <NbButton>← Back to Proposals</NbButton>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = trade.status === "completed";
  const otherUsername = isRequester ? (trade.receiver_username || trade.receiver_display_name) : (trade.requester_username || trade.requester_display_name);

  return (
    <div className="space-y-6" data-testid="tracker-page">
      <SectionTitle kicker={`SWAP #${trade.id}`}>Track this swap.</SectionTitle>

      {/* Completed Banner */}
      {isCompleted && (
        <div className="nb-card p-5 tint-lime flex items-center gap-4" data-testid="trade-completed-banner">
          <div className="text-3xl">🎉</div>
          <div>
            <div className="font-display text-xl">Trade Completed!</div>
            <div className="text-sm font-medium">Coins have been settled and items exchanged.</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* ── Left: Logistics Timeline ── */}
        <div className="md:col-span-2 nb-card p-6 bg-[var(--surface)]">
          <div className="font-mono2 text-xs uppercase font-bold mb-4 text-[var(--text-3)]">
            Your role: <span className="text-[var(--text-1)]">{isRequester ? "Requester (Shipper)" : "Receiver"}</span>
          </div>

          <div className="space-y-0">
            {STAGES.map((stageId, i) => {
              const isDone = i < currentStageIndex || isCompleted;
              const isCurrent = i === currentStageIndex && !isCompleted;
              const isPending = !isDone && !isCurrent;

              // Determine if this user can advance this stage
              // Requester advances: preparing→shipped→out_for_delivery
              // Receiver advances: out_for_delivery→delivered (with PIN)
              const canAdvance = (() => {
                if (!isCurrent || isCompleted) return false;
                if (stageId === "preparing" || stageId === "shipped") return isRequester;
                if (stageId === "out_for_delivery") return isRequester;
                if (stageId === "delivered") return isReceiver;
                return false;
              })();

              const nextStage = STAGES[i + 1];

              return (
                <div key={stageId} className="flex gap-4" data-testid={`tracker-stage-${i}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full nb-border-2 flex items-center justify-center shrink-0 ${
                      isDone ? "tint-lime" : isCurrent ? "tint-amber nb-shadow" : "bg-[var(--surface-2)]"
                    }`}>
                      {isDone ? <Check size={22} strokeWidth={3} /> : STAGE_ICONS[stageId]}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`w-1 flex-1 my-1 min-h-[40px] ${isDone ? "bg-black" : "bg-neutral-300"}`} />
                    )}
                  </div>

                  <div className="pb-8 pt-1 flex-1">
                    <div className={`font-display text-xl ${isPending ? "text-[var(--text-3)]" : ""}`}>
                      {STAGE_LABELS[stageId]}
                    </div>
                    <div className="text-xs font-mono2 mt-0.5 text-[var(--text-3)]">
                      {(isDone || isCurrent) ? new Date(trade.updated_at || trade.created_at).toLocaleDateString() : "—"}
                    </div>

                    {/* Advance button for requester stages */}
                    {canAdvance && stageId !== "out_for_delivery" && nextStage && (
                      <div className="mt-3">
                        <NbButton
                          size="sm"
                          onClick={() => handleUpdateLogistics(nextStage)}
                          disabled={updating}
                          data-testid={`advance-to-${nextStage}`}
                        >
                          {updating ? "Updating…" : `Mark as ${STAGE_LABELS[nextStage]}`}
                        </NbButton>
                      </div>
                    )}

                    {/* Out for delivery → receiver enters PIN, requester shows button */}
                    {isCurrent && stageId === "out_for_delivery" && isRequester && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-[var(--text-3)] mb-2">
                          Share your handshake PIN with the receiver, then wait for them to confirm delivery.
                        </div>
                      </div>
                    )}

                    {/* Receiver PIN entry for delivery */}
                    {isCurrent && stageId === "out_for_delivery" && isReceiver && (
                      <div className="mt-3">
                        <PinEntryCard onConfirm={handleDeliveryWithPin} loading={updating} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review section at the bottom after completion */}
          {isCompleted && !reviewSubmitted && (
            <div className="mt-6 border-t-2 border-[var(--border)] pt-5" data-testid="review-section">
              <div className="font-mono2 text-xs uppercase font-bold mb-1">How was your experience?</div>
              <div className="text-sm text-[var(--text-3)] mb-3">Rate your swap partner @{otherUsername}</div>
              <NbButton
                onClick={() => setShowReview(true)}
                className="tint-amber"
                data-testid="leave-review-btn"
              >
                ⭐ Leave a Review
              </NbButton>
            </div>
          )}
          {isCompleted && reviewSubmitted && (
            <div className="mt-6 border-t-2 border-[var(--border)] pt-5 text-sm font-medium text-[var(--text-3)]">
              ✅ Review submitted. Thank you!
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="space-y-3">
          {/* Trade status */}
          <div className={`nb-card p-4 ${isCompleted ? "tint-lime" : "tint-amber"}`}>
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Trade Status</div>
            <div className="font-display text-lg mt-1">
              {isCompleted ? "✅ Completed" : `Trade #${trade.id}`}
            </div>
            <div className="text-xs font-mono2 mt-1 capitalize">{trade.logistics_status?.replace(/_/g, " ")}</div>
          </div>

          {/* Handshake PIN — only requester/shipper sees this */}
          {trade.handshake_pin && isRequester && (
            <div className="nb-card p-4 bg-[var(--text)] text-white space-y-2" data-testid="pin-display">
              <div className="font-mono2 text-xs uppercase text-neutral-400">Handshake PIN</div>
              <div className="font-display text-4xl tracking-widest text-[var(--lime)]" data-testid="pin-value">
                {trade.handshake_pin}
              </div>
              <div className="text-xs text-neutral-300 font-medium">
                Share this PIN with the receiver when handing over the item. They must enter it to confirm delivery.
              </div>
            </div>
          )}

          {/* Coins info */}
          {trade.proposal?.coins_offered !== undefined && trade.proposal?.coins_offered !== 0 && (
            <div className="nb-card p-4 bg-[var(--surface)]">
              <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Coin Settlement</div>
              <div className="font-bold text-sm mt-1">
                {isCompleted ? "✅ Settled" : "⏳ On completion"}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={handleChat}
            className="w-full nb-btn bg-[var(--surface)] nb-border-2 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            data-testid="tracker-chat"
          >
            <MessageCircle size={16} strokeWidth={3} /> Message swapper
          </button>

          {trade.contract_id ? (
            <Link to={`/app/contracts`} state={{ highlightId: trade.contract_id }}>
              <button className="w-full nb-btn bg-[var(--surface)] nb-border-2 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2" data-testid="tracker-contract">
                <FileText size={16} strokeWidth={3} /> View Contract
              </button>
            </Link>
          ) : (
            <Link to="/app/contracts">
              <button className="w-full nb-btn bg-[var(--surface)] nb-border-2 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2" data-testid="tracker-contract">
                <FileText size={16} strokeWidth={3} /> View Contract
              </button>
            </Link>
          )}

          <Link to="/app/proposals">
            <button className="w-full nb-btn bg-[var(--surface)] nb-border-2 py-2.5 rounded-lg text-sm font-bold text-[var(--text-3)]">
              ← Back to Proposals
            </button>
          </Link>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <ReviewModal
          trade={trade}
          otherUsername={otherUsername}
          onClose={() => setShowReview(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default SwapTracker;
