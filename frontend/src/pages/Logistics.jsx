import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Truck, MapPin, Loader2, ShieldCheck, PackageCheck, Star, Package } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import ReviewModal from "@/components/ReviewModal";
import { toast } from "sonner";
import api from "@/lib/api";

const Logistics = () => {
  const { user, trades, setTrades, submitReview } = useApp();
  const [params] = useSearchParams();
  const tradeId = params.get("trade");

  const trade = tradeId ? trades.find((t) => String(t.id) === tradeId) : trades[0];

  const [method, setMethod] = useState("ship");
  const [form, setForm] = useState({
    name: "", address: "",
    carrier: "USPS", tracking: "",
    meetupLocation: "",
    meetupDate: "", meetupTime: "",
  });
  const [saving, setSaving] = useState(false);

  // Handshake PIN verification state
  const [pinInput, setPinInput] = useState("");
  const [delivering, setDelivering] = useState(false);

  // Post-trade review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Pre-fill from trade data if available
  useEffect(() => {
    if (trade) {
      let mDate = "";
      let mTime = "";
      if (trade.meetup_datetime) {
        const dt = new Date(trade.meetup_datetime);
        if (!isNaN(dt.getTime())) {
          mDate = dt.toISOString().split("T")[0];
          mTime = dt.toTimeString().slice(0, 5);
        }
      }
      setForm((prev) => ({
        ...prev,
        tracking: trade.tracking_number || "",
        carrier: trade.shipping_provider || "USPS",
        meetupLocation: trade.meetup_location || "",
        meetupDate: mDate,
        meetupTime: mTime,
      }));
      if (trade.meetup_location || trade.meetup_datetime) {
        setMethod("meet");
      }
      // Auto prompt review modal if trade completed & pending review
      if (trade.status === "completed" && trade.pending_review) {
        setShowReviewModal(true);
      }
    }
  }, [trade]);

  const upd = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    if (!trade) {
      toast.error("No active trade to update.");
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (method === "ship") {
        payload.tracking_number = form.tracking;
        payload.shipping_provider = form.carrier;
        if (!trade.logistics_status || trade.logistics_status === "preparing") {
          payload.logistics_status = "shipped";
        }
      } else {
        payload.meetup_location = form.meetupLocation;
        if (form.meetupDate) {
          const timePart = form.meetupTime ? `${form.meetupTime}:00` : "12:00:00";
          payload.meetup_datetime = `${form.meetupDate}T${timePart}`;
        }
        if (!trade.logistics_status || trade.logistics_status === "preparing") {
          payload.logistics_status = "shipped";
        }
      }

      const res = await api.post(`/trades/${trade.id}/update_logistics/`, payload);
      setTrades((prev) =>
        prev.map((t) => (t.id === trade.id ? { ...t, ...res.data } : t))
      );
      toast.success("Logistics saved & swapper notified");
    } catch (err) {
      toast.error("Failed to save logistics.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!trade) return;
    if (!pinInput || pinInput.trim().length !== 4) {
      toast.error("Please enter the 4-digit Handshake PIN.");
      return;
    }
    setDelivering(true);
    try {
      const res = await api.post(`/trades/${trade.id}/update_logistics/`, {
        logistics_status: "delivered",
        handshake_pin: pinInput.trim(),
      });
      setTrades((prev) =>
        prev.map((t) => (t.id === trade.id ? { ...t, ...res.data } : t))
      );
      toast.success("Delivery verified! Escrow released & trade completed.");
      setPinInput("");
      setShowReviewModal(true);
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid PIN or failed to mark delivered.";
      toast.error(msg);
    } finally {
      setDelivering(false);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="space-y-6" data-testid="logistics-page">
        <SectionTitle kicker="SHIPPING & MEETUP">Logistics.</SectionTitle>
        <EmptyState icon={Package} title="No active trades" subtitle="Complete a swap to manage shipping and meetup logistics." />
      </div>
    );
  }

  const isReceiver = user && (user.id === trade?.receiver || user.id === trade?.receiver?.id || user.id === trade?.receiver_id);
  const partnerId = user?.id === trade?.requester ? trade?.receiver : trade?.requester;
  const partnerName = partnerId ? `User #${partnerId}` : "Swapper";

  return (
    <div className="space-y-6" data-testid="logistics-page">
      <SectionTitle kicker="SHIPPING & MEETUP">Logistics.</SectionTitle>

      {/* Post-Trade Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        trade={trade}
        partnerId={partnerId}
        partnerName={partnerName}
        onSubmitReview={submitReview}
      />

      {/* Pending Review Prompt Banner */}
      {trade && trade.status === "completed" && trade.pending_review && (
        <div className="nb-card p-4 bg-[var(--surface-2)] border-2 border-[var(--lime)] flex items-center justify-between gap-3 tint-lime" data-testid="pending-review-prompt">
          <div className="flex items-center gap-2">
            <Star className="text-[var(--lime)] fill-[var(--lime)]" size={24} />
            <div>
              <div className="font-display text-sm text-[var(--text)]">Trade Completed!</div>
              <div className="text-xs font-mono2 text-[var(--text-3)]">Rate your trade partner to bump their Trust Score.</div>
            </div>
          </div>
          <NbButton
            onClick={() => setShowReviewModal(true)}
            className="bg-[var(--lime)] text-black font-bold text-xs py-1.5 px-4"
            data-testid="rate-partner-btn"
          >
            Rate Partner
          </NbButton>
        </div>
      )}

      {/* Trade selector if multiple */}
      {trades.length > 1 && (
        <div className="nb-card p-4 bg-[var(--surface)]">
          <div className="text-xs font-mono2 uppercase text-[var(--text-3)] mb-2">Select Trade</div>
          <select
            className="nb-input"
            value={trade?.id || ""}
            onChange={(e) => {
              const url = new URL(window.location);
              url.searchParams.set("trade", e.target.value);
              window.history.pushState({}, "", url);
              window.location.reload();
            }}
          >
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                Trade #{t.id} — {t.status} ({t.logistics_status || "preparing"})
              </option>
            ))}
          </select>
        </div>
      )}

      {trade && (
        <div className="nb-card p-4 tint-amber flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Trade #{trade.id}</div>
            <div className="font-display text-lg mt-1">
              Status: <span className="uppercase">{trade.logistics_status || "preparing"}</span>
            </div>
          </div>
          {trade.meetup_location && (
            <div className="text-xs font-mono2 bg-black/30 px-3 py-1.5 rounded text-amber-200 flex items-center gap-1">
              <MapPin size={12} /> {trade.meetup_location} {trade.meetup_datetime ? `· ${new Date(trade.meetup_datetime).toLocaleString()}` : ''}
            </div>
          )}
        </div>
      )}

      {/* Handshake PIN display for Receiver */}
      {trade && isReceiver && trade.handshake_pin && (
        <div className="nb-card p-6 bg-[var(--surface-2)] tint-lime border-2 border-[var(--lime)] space-y-2" data-testid="receiver-pin-card">
          <div className="flex items-center gap-2 font-mono2 text-xs uppercase text-[var(--lime)] font-bold">
            <ShieldCheck size={18} /> Handshake PIN (Receiver Security Code)
          </div>
          <p className="text-xs font-mono2 text-[var(--text-2)]">
            Provide this 4-digit PIN to the sender when you receive the package or meet up in person. They must enter this PIN to complete the trade.
          </p>
          <div className="font-display text-4xl tracking-widest text-[var(--lime)] bg-[var(--surface-3)] px-4 py-2 rounded-lg inline-block font-mono2" data-testid="handshake-pin-display">
            {trade.handshake_pin}
          </div>
        </div>
      )}

      {/* Mark Delivered & PIN entry action */}
      {trade && trade.status !== "completed" && trade.logistics_status !== "delivered" && (
        <div className="nb-card p-6 bg-[var(--surface)] space-y-4 border-2 border-[var(--border)]" data-testid="mark-delivered-card">
          <div className="flex items-center gap-2 font-mono2 text-xs uppercase font-bold text-[var(--text)]">
            <PackageCheck size={18} className="text-[var(--lime)]" /> Mark Trade as Delivered & Release Escrow
          </div>
          <p className="text-xs font-mono2 text-[var(--text-3)]">
            Enter the 4-digit Handshake PIN provided by the receiver to verify delivery and finalize the trade.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="4-digit PIN"
              className="nb-input font-mono2 text-center text-lg tracking-widest flex-1 bg-[var(--surface-2)]"
              data-testid="handshake-pin-input"
            />
            <NbButton
              onClick={handleMarkDelivered}
              disabled={delivering || pinInput.trim().length !== 4}
              className="bg-[var(--lime)] text-black font-bold py-2 px-6 text-sm"
              data-testid="mark-delivered-btn"
            >
              {delivering ? "Verifying..." : "Verify & Complete"}
            </NbButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethod("ship")}
          className={`nb-btn p-6 rounded-xl flex flex-col items-center gap-2 ${method === "ship" ? "bg-[var(--lime)] text-black" : "bg-[var(--surface)]"}`}
          data-testid="logistics-ship"
        >
          <Truck size={32} strokeWidth={2.5} />
          <span className="font-display text-xl">Ship it</span>
        </button>
        <button
          onClick={() => setMethod("meet")}
          className={`nb-btn p-6 rounded-xl flex flex-col items-center gap-2 ${method === "meet" ? "bg-[var(--lime)] text-black" : "bg-[var(--surface)]"}`}
          data-testid="logistics-meet"
        >
          <MapPin size={32} strokeWidth={2.5} />
          <span className="font-display text-xl">Meet up</span>
        </button>
      </div>

      {method === "ship" ? (
        <div className="nb-card p-6 bg-[var(--surface)] space-y-4">
          <div>
            <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Ship to name</label>
            <input value={form.name} onChange={(e) => upd("name", e.target.value)} className="nb-input" placeholder="Recipient name" data-testid="logistics-name" />
          </div>
          <div>
            <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Address</label>
            <textarea value={form.address} onChange={(e) => upd("address", e.target.value)} rows={2} className="nb-input resize-none" placeholder="Full shipping address" data-testid="logistics-address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Carrier</label>
              <select value={form.carrier} onChange={(e) => upd("carrier", e.target.value)} className="nb-input">
                {["USPS", "UPS", "FedEx", "DHL", "India Post", "DTDC", "BlueDart"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Tracking #</label>
              <input value={form.tracking} onChange={(e) => upd("tracking", e.target.value)} className="nb-input font-mono2" placeholder="Enter tracking number" data-testid="logistics-tracking" />
            </div>
          </div>
          <div className="nb-border-2 rounded-lg tint-lime p-3 text-sm font-medium">
            Shipping cost split 50/50 by default. Adjust in the contract.
          </div>
        </div>
      ) : (
        <div className="nb-card p-6 bg-[var(--surface)] space-y-4">
          <div>
            <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Meetup location</label>
            <input value={form.meetupLocation} onChange={(e) => upd("meetupLocation", e.target.value)} className="nb-input" placeholder="e.g. Starbucks, MG Road" data-testid="logistics-meetup-location" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Date</label>
              <input type="date" value={form.meetupDate} onChange={(e) => upd("meetupDate", e.target.value)} className="nb-input" />
            </div>
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Time</label>
              <input type="time" value={form.meetupTime} onChange={(e) => upd("meetupTime", e.target.value)} className="nb-input" />
            </div>
          </div>
          <div className="nb-border-2 rounded-lg tint-amber p-3 text-sm font-medium flex items-center gap-1.5">
            <MapPin size={14} className="shrink-0 text-[var(--amber)]" /> Choose public places. Verify the other swapper's trust score before meeting.
          </div>
        </div>
      )}

      <NbButton onClick={save} className="w-full py-4" disabled={saving} data-testid="logistics-save">
        {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save & notify swapper"}
      </NbButton>
    </div>
  );
};

export default Logistics;
