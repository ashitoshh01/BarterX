import React from "react";
import { Link } from "react-router-dom";
import { Check, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";
import api from "@/lib/api";

const Contracts = () => {
  const { contracts, setContracts } = useApp();

  const sign = async (id) => {
    try {
      const res = await api.post(`/contracts/${id}/sign/`);
      setContracts((prev) => prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            signedA: res.data.signed_a,
            signedB: res.data.signed_b,
            status: res.data.status
          };
        }
        return c;
      }));
      toast.success("Contract signed 🖋️");
    } catch (err) {
      toast.error("Failed to sign contract.");
    }
  };

  const downloadPdf = (id) => {
    const token = localStorage.getItem("barter_token");
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
    window.open(`${backendUrl}/api/contracts/${id}/download_pdf/?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6" data-testid="contracts-page">
      <SectionTitle kicker="AGREEMENTS">Swap contracts.</SectionTitle>

      <div className="space-y-4">
        {contracts.map((c) => {
          const otherName = c.direction === 'A' ? c.partyBDisplay : c.partyADisplay;
          return (
            <div key={c.id} className="nb-card p-6 bg-[var(--surface)]" data-testid={`contract-${c.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center">
                    <FileText size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Contract {c.id}</div>
                    <div className="font-display text-2xl">Swap with {otherName}</div>
                  </div>
                </div>
                <span className={`nb-tag ${c.status === "signed" ? "tint-lime" : "tint-amber"}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {c.items.map((it, i) => (
                  <div key={i} className="nb-border-2 rounded-lg p-3 bg-[var(--surface-2)]">
                    <div className="text-xs font-mono2 uppercase text-[var(--text-3)]">Item {i + 1}</div>
                    <div className="font-bold text-sm">{it}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="text-xs font-mono2 uppercase font-bold mb-2">Terms</div>
                <ul className="space-y-2">
                  {c.terms.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm font-medium">
                      <Check size={16} strokeWidth={3} className="text-[var(--lime)] mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between border-t-2 border-white/10/10 pt-4">
                <div className="flex items-center gap-4">
                  <div className="text-xs">
                    <div className="font-mono2 uppercase text-[var(--text-3)]">Party A</div>
                    <div className="font-bold">{c.signedA ? "✓ Signed" : "Pending"}</div>
                  </div>
                  <div className="text-xs">
                    <div className="font-mono2 uppercase text-[var(--text-3)]">Party B</div>
                    <div className="font-bold">{c.signedB ? "✓ Signed" : "Pending"}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {((c.direction === 'A' && !c.signedA) || (c.direction === 'B' && !c.signedB)) && (
                    <NbButton onClick={() => sign(c.id)} data-testid={`contract-sign-${c.id}`}>
                      Sign contract
                    </NbButton>
                  )}
                  {c.status === 'signed' && (
                    <button 
                      onClick={() => downloadPdf(c.id)} 
                      className="nb-btn px-4 py-2 rounded-lg text-sm font-bold bg-white text-black"
                    >
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Contracts;
