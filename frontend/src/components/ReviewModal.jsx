import React, { useState } from "react";
import { Star, X, Loader2, Award } from "lucide-react";
import { NbButton } from "@/components/UI";
import { toast } from "sonner";

const ReviewModal = ({ isOpen, onClose, trade, partnerName, partnerId, onSubmitReview }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitReview({
        reviewedUserId: partnerId,
        rating,
        comment,
        tradeId: trade?.id,
      });
      onClose();
    } catch (err) {
      // Error handled in parent/context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="nb-card p-6 bg-[var(--surface)] max-w-md w-full border-2 border-[var(--lime)] space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-[var(--lime)]" size={24} />
            <h3 className="font-display text-xl text-white">Rate Your Trade Partner</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs font-mono2 text-[var(--text-2)]">
          How was your swap experience with <strong className="text-white">{partnerName || "your partner"}</strong>? Your rating boosts their Trust Score and maintains community safety!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-[var(--lime)] text-[var(--lime)]"
                        : "text-white/20"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-mono2 font-bold text-[var(--lime)]">
              {rating === 5 ? "5 Stars — Outstanding Swap! (+5 Trust Score)" :
               rating === 4 ? "4 Stars — Great Swap! (+5 Trust Score)" :
               rating === 3 ? "3 Stars — Average" :
               rating === 2 ? "2 Stars — Below Expectations" :
               "1 Star — Poor Experience"}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)] mb-1 block">
              Feedback Comment (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about item condition, communication, or prompt delivery..."
              className="nb-input w-full text-xs"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <NbButton type="button" variant="light" onClick={onClose} disabled={submitting}>
              Skip for now
            </NbButton>
            <NbButton
              type="submit"
              disabled={submitting}
              className="bg-[var(--lime)] text-black font-bold"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Submitting...</> : "Submit Review ⭐"}
            </NbButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
