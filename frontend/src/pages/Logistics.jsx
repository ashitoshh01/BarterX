import React, { useState } from "react";
import { Truck, MapPin, Package, User } from "lucide-react";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";

const Logistics = () => {
  const [method, setMethod] = useState("ship");
  const [form, setForm] = useState({
    name: "Lumen Reyes", address: "132 Bedford Ave, Brooklyn NY 11249",
    carrier: "USPS", tracking: "9400-1234-5678-9012",
    meetupLocation: "Prospect Park Coffee, Brooklyn",
    meetupDate: "2025-12-05", meetupTime: "3:00 PM",
  });

  const upd = (k, v) => setForm({ ...form, [k]: v });

  const save = () => toast.success("Logistics saved 📦");

  return (
    <div className="space-y-6" data-testid="logistics-page">
      <SectionTitle kicker="SHIPPING & MEETUP">Logistics.</SectionTitle>

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
            <input value={form.name} onChange={(e) => upd("name", e.target.value)} className="nb-input" data-testid="logistics-name" />
          </div>
          <div>
            <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Address</label>
            <textarea value={form.address} onChange={(e) => upd("address", e.target.value)} rows={2} className="nb-input resize-none" data-testid="logistics-address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Carrier</label>
              <select value={form.carrier} onChange={(e) => upd("carrier", e.target.value)} className="nb-input">
                {["USPS", "UPS", "FedEx", "DHL"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Tracking #</label>
              <input value={form.tracking} onChange={(e) => upd("tracking", e.target.value)} className="nb-input font-mono2" data-testid="logistics-tracking" />
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
            <input value={form.meetupLocation} onChange={(e) => upd("meetupLocation", e.target.value)} className="nb-input" data-testid="logistics-meetup-location" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Date</label>
              <input type="date" value={form.meetupDate} onChange={(e) => upd("meetupDate", e.target.value)} className="nb-input" />
            </div>
            <div>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Time</label>
              <input value={form.meetupTime} onChange={(e) => upd("meetupTime", e.target.value)} className="nb-input" />
            </div>
          </div>
          <div className="nb-border-2 rounded-lg tint-amber p-3 text-sm font-medium">
            📍 Choose public places. Verify the other swapper's trust score before meeting.
          </div>
        </div>
      )}

      <NbButton onClick={save} className="w-full py-4" data-testid="logistics-save">
        Save & notify swapper
      </NbButton>
    </div>
  );
};

export default Logistics;
