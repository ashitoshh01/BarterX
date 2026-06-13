import { Shield, ArrowRightLeft, IndianRupee, Calendar } from 'lucide-react';
import type { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-[20px] border border-border p-5 animate-shimmer h-[110px]" />
        ))}
      </div>
    );
  }

  const trustLabel = stats.trustScore >= 80 ? 'Excellent' : stats.trustScore >= 60 ? 'Good' : stats.trustScore >= 40 ? 'Average' : 'Low';
  const trustColor = stats.trustScore >= 80 ? '#22C55E' : stats.trustScore >= 60 ? '#2563EB' : stats.trustScore >= 40 ? '#F59E0B' : '#EF4444';

  const cards = [
    {
      icon: <Shield size={20} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      label: 'Trust Score',
      value: stats.trustScore.toString(),
      suffix: <span className="text-sm font-semibold ml-2" style={{ color: trustColor }}>{trustLabel}</span>,
      sub: null,
      progress: stats.trustScore,
      progressColor: trustColor,
    },
    {
      icon: <ArrowRightLeft size={20} />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      label: 'Successful Swaps',
      value: stats.successfulSwaps.toString(),
      suffix: null,
      sub: stats.recentSwaps > 0 ? `+${stats.recentSwaps} this month` : null,
      subColor: '#22C55E',
      progress: null,
    },
    {
      icon: <IndianRupee size={20} />,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      label: 'Value Saved',
      value: `₹${stats.valueSaved.toLocaleString('en-IN')}`,
      suffix: null,
      sub: 'Approx. this year',
      subColor: '#64748B',
      progress: null,
    },
    {
      icon: <Calendar size={20} />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500',
      label: 'Member Since',
      value: `${stats.memberMonths} Month${stats.memberMonths !== 1 ? 's' : ''}`,
      suffix: null,
      sub: 'Active trader',
      subColor: '#64748B',
      progress: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-[20px] border border-border p-5 hover:shadow-md transition-shadow duration-300 animate-fadeUp"
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}>
              {card.icon}
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{card.label}</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-text-primary">{card.value}</span>
            {card.suffix}
          </div>
          {card.sub && (
            <p className="text-xs mt-1.5" style={{ color: card.subColor }}>{card.sub}</p>
          )}
          {card.progress !== null && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${card.progress}%`, backgroundColor: card.progressColor }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
