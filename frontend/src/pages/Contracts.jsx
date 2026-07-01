import React from "react";
import { Link } from "react-router-dom";
import { Check, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";

const Contracts = () => {
  const { contracts, users, setContracts } = useApp();

  const sign = (id) => {
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, signedB: true, status: "signed" } : c));
    toast.success("Contract signed 🖋️");
  };

  return (
    <div className="space-y-6" data-testid="contracts-page">
      <SectionTitle kicker="AGREEMENTS">Swap contracts.</SectionTitle>

      <div className="space-y-4">
        {contracts.map((c) => {
          const other = users[c.partyB === "u_me" ? c.partyA : c.partyB];
          return (
            <div key={c.id} className="nb-card p-6 bg-[var(--surface)]" data-testid={`contract-${c.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center">
                    <FileText size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">Contract {c.id}</div>
                    <div className="font-display text-2xl">Swap with {other?.name}</div>
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
                {!c.signedB && (
                  <NbButton onClick={() => sign(c.id)} data-testid={`contract-sign-${c.id}`}>
                    Sign contract
                  </NbButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Contracts;
