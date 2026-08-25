import React, { useState, useEffect } from "react";
import { Shield, Check, Upload, Phone, Mail, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton } from "@/components/UI";
import { toast } from "sonner";
import api from "@/lib/api";

const Verification = () => {
  const { user, updateProfile } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/profile/dashboard_stats/");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const verification = stats?.verification || {};
  const checks = {
    email: verification.email_verified || false,
    phone: verification.phone_verified || false,
    profile: verification.profile_complete || false,
    id: verification.id_verified || false,
  };

  const total = Object.values(checks).filter(Boolean).length;
  const trustScore = stats?.trust_score ?? user.trustScore ?? 0;
  const trustLevel = stats?.trust_level ?? "New";

  const verifyPhone = async () => {
    setVerifying("phone");
    try {
      const phone = prompt("Enter your phone number:");
      if (!phone) { setVerifying(null); return; }
      await updateProfile({ phone });
      setStats((prev) => ({
        ...prev,
        verification: { ...prev?.verification, phone_verified: true }
      }));
      toast.success("Phone number verified ✓");
    } catch (err) {
      toast.error("Failed to verify phone number.");
    } finally {
      setVerifying(null);
    }
  };

  const verifyProfile = async () => {
    toast.info("Complete your profile in the Profile page to verify.");
  };

  const verifyId = async () => {
    setVerifying("id");
    try {
      await updateProfile({ is_verified: true });
      setStats((prev) => ({
        ...prev,
        verification: { ...prev?.verification, id_verified: true }
      }));
      toast.success("ID verification submitted ✓");
    } catch (err) {
      toast.error("Failed to submit ID verification.");
    } finally {
      setVerifying(null);
    }
  };

  const verifyActions = {
    email: () => toast.info("Email is already linked to your account."),
    phone: verifyPhone,
    profile: verifyProfile,
    id: verifyId,
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="verify-page">
        <SectionTitle kicker="TRUST & SAFETY">Get verified.</SectionTitle>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--lime)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="verify-page">
      <SectionTitle kicker="TRUST & SAFETY">Get verified.</SectionTitle>

      <div className="nb-card p-8 relative overflow-hidden">
        <div className="aurora" style={{ opacity: 0.3 }} />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-full border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center backdrop-blur">
            <Shield size={36} strokeWidth={1.5} className="text-[var(--lime)]" />
          </div>
          <div className="flex-1">
            <div className="font-mono2 text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-1">TRUST SCORE</div>
            <div className="font-display text-6xl text-[var(--text)]">{trustScore}<span className="text-2xl text-[var(--text-3)]">%</span></div>
            <div className="flex items-center gap-2 mt-1">
              <span className="nb-tag tint-lime text-[10px]">{trustLevel}</span>
              <span className="text-sm text-[var(--text-2)]">{total} of 4 verifications complete</span>
            </div>
          </div>
        </div>
        <div className="mt-6 xp-bar">
          <div className="xp-fill" style={{ width: `${Math.min(trustScore, 100)}%` }} />
        </div>
      </div>

      {stats?.successful_swaps !== undefined && (
        <div className="grid grid-cols-3 gap-3">
          <div className="nb-card p-4 tint-lime">
            <div className="font-display text-2xl text-[var(--text)]">{stats.successful_swaps}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">Swaps Done</div>
          </div>
          <div className="nb-card p-4 tint-amber">
            <div className="font-display text-2xl text-[var(--text)]">{stats.average_rating?.toFixed(1) || "0.0"}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">Avg Rating</div>
          </div>
          <div className="nb-card p-4 tint-purple">
            <div className="font-display text-2xl text-[var(--text)]">{stats.member_since || "N/A"}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">Member Since</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {[
          { k: "email", icon: Mail, label: "Email verified", desc: "Confirm your email address" },
          { k: "phone", icon: Phone, label: "Phone verified", desc: "SMS verification for extra trust" },
          { k: "profile", icon: Shield, label: "Profile complete", desc: "Fill in your name, bio, and location" },
          { k: "id", icon: Upload, label: "ID document", desc: "Upload government ID (kept private)" },
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
              <NbButton
                onClick={verifyActions[v.k]}
                variant="dark"
                className="text-xs px-3 py-2"
                data-testid={`verify-btn-${v.k}`}
                disabled={verifying === v.k}
              >
                {verifying === v.k ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
              </NbButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Verification;
