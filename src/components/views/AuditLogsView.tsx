import React, { useState } from 'react';
import { ReconciliationPeriod, AuditLogEntry, UserScope } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldAlert,
  Lock,
  Unlock,
  History,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';

interface AuditLogsViewProps {
  period: ReconciliationPeriod;
  auditLogs: AuditLogEntry[];
  userScope: UserScope;
  onLockPeriod: () => void;
  onReopenPeriod: (reason: string) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  period,
  auditLogs,
  userScope,
  onLockPeriod,
  onReopenPeriod,
}) => {
  const [reopenReason, setReopenReason] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(reopenReason || '').trim()) return;

    onReopenPeriod((reopenReason || '').trim());
    setReopenReason('');
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      (l.userName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (l.action || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (l.details || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>Audit Trail & Financial Period Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system logs, period locks, and authorized period reopening controls.
          </p>
        </div>

        {/* Period Lock Status Card */}
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {period.status === 'LOCKED' ? (
              <Lock className="w-5 h-5 text-rose-400" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">
                Period: {period.periodName}
              </p>
              <p className="text-xs font-bold text-white font-mono">{period.status}</p>
            </div>
          </div>

          {period.status === 'OPEN' || period.status === 'REOPENED' ? (
            <button
              onClick={onLockPeriod}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition"
            >
              Lock Period
            </button>
          ) : (
            <span className="text-[11px] text-rose-300 font-medium">Locked for editing</span>
          )}
        </div>
      </div>

      {/* REOPEN PERIOD FORM IF LOCKED */}
      {period.status === 'LOCKED' && (
        <form
          onSubmit={handleReopenSubmit}
          className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3"
        >
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Authorized Period Reopening Request</span>
          </div>

          <p className="text-xs text-amber-800">
            Reopening a closed financial period requires a mandatory audit justification statement.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter mandatory audit reason for reopening (e.g., Late CBE bank statement adjustment)..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="flex-1 bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow shrink-0"
            >
              Reopen Period with Audit Log
            </button>
          </div>
        </form>
      )}

      {/* IMMUTABLE AUDIT LOGS TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Immutable Audit Trail Log ({filteredLogs.length} Events)
          </h2>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">User & Role</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Target Entity</th>
                <th className="p-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-500 font-sans text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2.5 font-sans">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-500">{log.role}</span>
                  </td>
                  <td className="p-2.5 font-bold text-emerald-700 font-sans">{log.action}</td>
                  <td className="p-2.5 text-slate-800 font-sans">
                    {log.entityType}:{log.entityId}
                  </td>
                  <td className="p-2.5 font-sans text-slate-700 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
