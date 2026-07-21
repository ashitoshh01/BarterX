import React, { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import api from "@/lib/api";
import { toast } from "sonner";

const Disputes = () => {
  const { disputes, setDisputes, users } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reason: "", detail: "", against: "" });
  const [submitting, setSubmitting] = useState(false);

  // Exclude current user from the list
  const otherUsers = Object.values(users).filter(u => u.username !== users["u_me"]?.username);

  const file = async () => {
    if (!form.reason) { toast.error("Pick a reason"); return; }
    if (!form.against) { toast.error("Select a user to dispute against"); return; }
    
    setSubmitting(true);
    try {
      const res = await api.post("/disputes/", {
        against: form.against,
        reason: form.reason,
        detail: form.detail
      });
      
      const newD = {
        id: String(res.data.id),
        against: res.data.against_username,
        againstDisplay: res.data.against_name,
        reason: res.data.reason,
        detail: res.data.detail,
        status: res.data.status,
        opened: new Date(res.data.created_at).toLocaleDateString()
      };
      
      setDisputes([newD, ...disputes]);
      setOpen(false);
      setForm({ reason: "", detail: "", against: "" });
      toast.success("Dispute filed. Our team will reach out within 24h.");
    } catch (err) {
      toast.error("Failed to file dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="disputes-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle kicker="RESOLUTION CENTER" className="mb-0">Disputes.</SectionTitle>
        <NbButton onClick={() => setOpen(true)} data-testid="disputes-new">
          <AlertTriangle size={14} strokeWidth={3} /> Open dispute
        </NbButton>
      </div>

      <div className="nb-card p-5 tint-amber">
        <div className="font-display text-2xl mb-1">How disputes work</div>
        <p className="text-sm font-medium">
          If a swap goes sideways, file a dispute within 7 days. Our mediation team reviews evidence from both sides and issues a decision (refund, coin adjustment, or return).
        </p>
      </div>

      {disputes.length === 0 ? (
        <EmptyState emoji="🕊️" title="No disputes" subtitle="Happy swappers. Keep it up!" />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            return (
              <div key={d.id} className="nb-card p-4 bg-[var(--surface)]" data-testid={`dispute-${d.id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Dispute {d.id}</div>
                    <div className="font-display text-xl">Against {d.againstDisplay || d.against}</div>
                  </div>
                  <span className="nb-tag tint-pink">{d.status.toUpperCase()}</span>
                </div>
                <div className="text-sm font-bold">{d.reason}</div>
                <p className="text-sm text-[var(--text-2)] mt-1">{d.detail}</p>
                <div className="text-xs font-mono2 mt-2 text-[var(--text-3)]">Opened {d.opened}</div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="nb-card p-6 bg-[var(--surface)] w-full max-w-md" data-testid="dispute-modal">
            <div className="font-display text-2xl mb-4">Open a dispute</div>
            
            <div className="text-xs font-mono2 uppercase mb-2">Against User</div>
            <select value={form.against} onChange={(e) => setForm({ ...form, against: e.target.value })} className="nb-input mb-3">
              <option value="">Select a user</option>
              {otherUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
              ))}
            </select>
            
            <div className="text-xs font-mono2 uppercase mb-2">Reason</div>
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="nb-input mb-3" data-testid="dispute-reason">
              <option value="">Choose a reason</option>
              <option>Item not as described</option>
              <option>Item never arrived</option>
              <option>Damaged in transit</option>
              <option>Fake or counterfeit</option>
              <option>Other</option>
            </select>
            <div className="text-xs font-mono2 uppercase mb-2">Details</div>
            <textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} rows={4} className="nb-input resize-none mb-4" placeholder="What happened?" data-testid="dispute-detail" />
            <div className="flex gap-2">
              <NbButton variant="light" onClick={() => setOpen(false)} className="flex-1" disabled={submitting}>Cancel</NbButton>
              <NbButton onClick={file} className="flex-1" disabled={submitting} data-testid="dispute-submit">
                {submitting ? "Filing..." : <>File dispute <ArrowRight size={14} strokeWidth={3} /></>}
              </NbButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disputes;
