import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Truck, MapPin, Package, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import { toast } from "sonner";
import api from "@/lib/api";

const Logistics = () => {
  const { trades, setTrades } = useApp();
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

  // Pre-fill from trade data if available
  useEffect(() => {
    if (trade) {
      setForm((prev) => ({
        ...prev,
        tracking: trade.tracking_number || "",
        carrier: trade.shipping_provider || "USPS",
      }));
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
        // For meetup, mark as shipped (hand-off scheduled)
        payload.logistics_status = "shipped";
      }

      const res = await api.post(`/trades/${trade.id}/update_logistics/`, payload);
      setTrades((prev) =>
        prev.map((t) =>
          t.id === trade.id
            ? {
                ...t,
                logistics_status: res.data.logistics_status,
                tracking_number: res.data.tracking_number,
                shipping_provider: res.data.shipping_provider,
              }
            : t
        )
      );
      toast.success("Logistics saved & swapper notified 📦");
    } catch (err) {
      toast.error("Failed to save logistics.");
    } finally {
      setSaving(false);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="space-y-6" data-testid="logistics-page">
        <SectionTitle kicker="SHIPPING & MEETUP">Logistics.</SectionTitle>
        <EmptyState emoji="📦" title="No active trades" subtitle="Complete a swap to manage shipping and meetup logistics." />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="logistics-page">
      <SectionTitle kicker="SHIPPING & MEETUP">Logistics.</SectionTitle>

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
        <div className="nb-card p-4 tint-amber">
          <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Trade #{trade.id}</div>
          <div className="font-display text-lg mt-1">
            Status: <span className="uppercase">{trade.logistics_status || "preparing"}</span>
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
            📦 Shipping cost split 50/50 by default. Adjust in the contract.
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
          <div className="nb-border-2 rounded-lg tint-amber p-3 text-sm font-medium">
            📍 Choose public places. Verify the other swapper's trust score before meeting.
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
