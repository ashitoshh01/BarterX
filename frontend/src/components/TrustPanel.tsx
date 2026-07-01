import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import type { DashboardStats } from '../types';
import type { VerificationStatus } from '../services/api';

interface TrustPanelProps {
  stats: DashboardStats | null;
  verification: VerificationStatus | null;
  loading: boolean;
}

export default function TrustPanel({ stats, verification, loading }: TrustPanelProps) {
  if (loading || !stats || !verification) {
    return (
      <div className="bg-white rounded-[20px] border border-border p-5 animate-shimmer h-[320px]" />
    );
  }

  const score = stats.trustScore;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#2563EB' : score >= 40 ? '#F59E0B' : '#EF4444';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Low';

  const checks = [
    { label: 'Profile Complete', done: verification.profileComplete },
    { label: 'Phone Verified', done: verification.phoneVerified },
    { label: 'Email Verified', done: verification.emailVerified },
    { label: 'ID Verified', done: verification.idVerified },
    { label: `${verification.successfulTrades} Successful Trades`, done: verification.successfulTrades > 0 },
  ];

  return (
    <div className="bg-white rounded-[20px] border border-border p-5 animate-fadeUp">
      <h3 className="text-sm font-bold text-text-primary mb-4">Trust at a glance</h3>

      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-[130px] h-[130px]">
          <svg className="trust-circle w-full h-full" viewBox="0 0 120 120">
            <circle className="trust-circle-bg" cx="60" cy="60" r={radius} />
            <circle
              className="trust-circle-progress"
              cx="60" cy="60" r={radius}
              style={{
                stroke: scoreColor,
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-text-primary">{score}</span>
            <span className="text-xs font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="flex flex-col gap-2.5 mb-4">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            {check.done ? (
              <CheckCircle size={16} className="text-success flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-warning flex-shrink-0" />
            )}
            <span className={`text-xs ${check.done ? 'text-text-primary' : 'text-text-secondary'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        to="/profile"
        className="w-full h-9 rounded-xl border border-border text-sm font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 no-underline"
      >
        Improve your score <ArrowRight size={14} />
      </Link>
    </div>
  );
}
