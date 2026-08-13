import React from 'react';

interface StatusBadgeProps {
  status?: string;
  type?: 'reconciled' | 'warning' | 'risk' | 'pending' | 'info' | 'critical';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = '', type }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-300';

  const s = (status || '').toString().toUpperCase();

  if (
    type === 'reconciled' ||
    s === 'RECONCILED' ||
    s === 'CONFIRMED' ||
    s === 'APPROVED' ||
    s === 'RESOLVED' ||
    s === 'VERIFIED' ||
    s === 'ACTIVE' ||
    s === 'OPEN'
  ) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (type === 'warning' || s === 'PROPOSED' || s === 'MEDIUM' || s === 'FLAGGED' || s === 'WARNING') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (
    type === 'risk' ||
    type === 'critical' ||
    s === 'HIGH' ||
    s === 'CRITICAL' ||
    s === 'SHORTAGE' ||
    s === 'EXCEPTION' ||
    s === 'REJECTED' ||
    s === 'FAILED' ||
    s === 'LOCKED'
  ) {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (type === 'pending' || s === 'UNRECONCILED' || s === 'UNDER_INVESTIGATION' || s === 'PENDING_APPROVAL' || s === 'SUBMITTED') {
    colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (s === 'UM') {
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (s === 'DD') {
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {status}
    </span>
  );
};
