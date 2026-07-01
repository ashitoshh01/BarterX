import React, { useState } from "react";
import { Shield, Check, Upload, Phone, Mail } from "lucide-react";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";

const Verification = () => {
  const [checks, setChecks] = useState({ email: true, phone: false, id: false, social: false });

  const verify = (k) => {
    setChecks({ ...checks, [k]: true });
    toast.success("Verified ✓");
  };

  const total = Object.values(checks).filter(Boolean).length;
  const trust = Math.round((total / 4) * 100);

  return (
    <div className="space-y-6" data-testid="verify-page">
      <SectionTitle kicker="TRUST & SAFETY">Get verified.</SectionTitle>

      <div className="nb-card p-8 relative overflow-hidden">
        <div className="aurora" style={{ opacity: 0.3 }} />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur">
            <Shield size={36} strokeWidth={1.5} className="text-[var(--lime)]" />
          </div>
          <div className="flex-1">
            <div className="font-mono2 text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-1">TRUST SCORE</div>
            <div className="font-display text-6xl text-white">{trust}<span className="text-2xl text-[var(--text-3)]">%</span></div>
            <div className="text-sm text-[var(--text-2)] mt-1">{total} of 4 verifications complete</div>
          </div>
        </div>
        <div className="mt-6 xp-bar">
          <div className="xp-fill" style={{ width: `${trust}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {[
          { k: "email", icon: Mail, label: "Email verified", desc: "Confirm your email address" },
          { k: "phone", icon: Phone, label: "Phone verified", desc: "SMS verification for extra trust" },
          { k: "id", icon: Upload, label: "ID document", desc: "Upload government ID (kept private)" },
          { k: "social", icon: Shield, label: "Social linked", desc: "Connect Instagram or X to boost trust" },
        ].map((v) => (
          <div key={v.k} className="nb-card p-4 flex items-center gap-4" data-testid={`verify-${v.k}`}>
            <div className={`w-12 h-12 rounded-lg nb-border-2 flex items-center justify-center ${checks[v.k] ? "tint-lime" : "bg-[var(--surface)]"}`}>
              {checks[v.k] ? <Check size={22} strokeWidth={3} /> : <v.icon size={22} strokeWidth={2.5} />}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg">{v.label}</div>
              <div className="text-xs text-[var(--text-2)] font-medium">{v.desc}</div>
            </div>
            {!checks[v.k] && (
              <NbButton onClick={() => verify(v.k)} variant="dark" className="text-xs px-3 py-2" data-testid={`verify-btn-${v.k}`}>
                Verify
              </NbButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Verification;
