import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
  statusType?: 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
  onDrillDown?: () => void;
  highlighted?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  isPositive,
  statusType = 'info',
  icon,
  onDrillDown,
  highlighted = false,
}) => {
  let borderClass = 'border-slate-200 bg-white';
  let titleClass = 'text-slate-600';
  let valueClass = 'text-slate-900';

  if (highlighted) {
    borderClass = 'border-emerald-300 bg-emerald-50/50 shadow-sm';
  } else if (statusType === 'danger') {
    borderClass = 'border-rose-200 bg-rose-50/40';
    valueClass = 'text-rose-700';
  } else if (statusType === 'warning') {
    borderClass = 'border-amber-200 bg-amber-50/40';
    valueClass = 'text-amber-800';
  } else if (statusType === 'success') {
    borderClass = 'border-emerald-200 bg-emerald-50/40';
    valueClass = 'text-emerald-800';
  }

  return (
    <div
      onClick={onDrillDown}
      className={`p-4 rounded-xl border ${borderClass} transition ${
        onDrillDown ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium uppercase tracking-wider ${titleClass}`}>
          {title}
        </p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <p className={`text-xl font-bold tracking-tight ${valueClass}`}>{value}</p>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}

      {onDrillDown && (
        <p className="mt-2 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center">
          Click to inspect transactions →
        </p>
      )}
    </div>
  );
};
