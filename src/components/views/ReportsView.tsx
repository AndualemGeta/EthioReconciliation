import React, { useState } from 'react';
import {
  ReconciliationSummary,
  NormalizedTransaction,
  ExceptionRecord,
  DailyShopReport,
  Shop,
  UserScope,
} from '../../types';
import { PermissionService } from '../../services/permissionService';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface ReportsViewProps {
  summary: ReconciliationSummary;
  transactions: NormalizedTransaction[];
  exceptions: ExceptionRecord[];
  reports: DailyShopReport[];
  shops: Shop[];
  userScope: UserScope;
  onExportExcel: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  transactions,
  exceptions,
  reports,
  shops,
  userScope,
  onExportExcel,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'daily' | 'monthly' | 'float' | 'shortages' | 'missing' | 'commission'
  >('monthly');

  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'CURRENT_VIEW' | 'FULL_RECON' | 'APPROVED_ONLY'>('FULL_RECON');

  const canExport = PermissionService.canPerform(userScope.role, 'EXPORT_DATA');

  // Filter datasets by user scope
  const scopedTransactions = PermissionService.filterByScope<NormalizedTransaction>(transactions, userScope);
  const scopedExceptions = PermissionService.filterByScope<ExceptionRecord>(exceptions, userScope);
  const scopedReports = PermissionService.filterByScope<DailyShopReport>(reports, userScope);

  const handleTriggerExport = () => {
    if (!canExport) return;
    onExportExcel();
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Financial Reconciliation Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Produce audited daily/monthly summaries, float UM/DD analytics, shortages, and commission statements.
          </p>
        </div>

        {canExport ? (
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Financial Reports...</span>
          </button>
        ) : (
          <div className="bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Export Blocked (Auditor Role)</span>
          </div>
        )}
      </div>

      {/* Report Sub Navigation */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'monthly', label: 'Monthly Summary' },
          { id: 'daily', label: 'Daily Recon Summary' },
          { id: 'float', label: 'Float Source: UM vs DD' },
          { id: 'shortages', label: 'Shortages & Over-reporting' },
          { id: 'missing', label: 'Missing Reports Tracker' },
          { id: 'commission', label: 'Commission Reconciliation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold transition ${
              activeReportTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MONTHLY SUMMARY REPORT */}
      {activeReportTab === 'monthly' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            Monthly Reconciliation Statement — August 2026
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 font-sans block text-sm">
                Financial Volume Inflows & Outflows
              </span>
              <div className="flex justify-between border-b pb-1">
                <span>Total MTD Float Transfers Out:</span>
                <span className="font-bold text-sky-700">ETB {summary.mtdTransfer.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Total MTD Bank Deposits In:</span>
                <span className="font-bold text-emerald-700">ETB {summary.mtdDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Total Commission Deductions:</span>
                <span className="font-bold text-purple-700">ETB {summary.commission.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 font-sans block text-sm">
                Ending Balances & Net Gap
              </span>
              <div className="flex justify-between border-b pb-1">
                <span>UM Closing Float Balance:</span>
                <span className="font-bold text-purple-800">ETB {summary.umEndingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>DD Closing Float Balance:</span>
                <span className="font-bold text-indigo-800">ETB {summary.ddEndingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Combined Ending Float:</span>
                <span className="font-bold text-amber-800">ETB {summary.totalEndingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 text-sm font-sans">
                <span>Calculated Net Gap:</span>
                <span className={summary.netGap === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ETB {summary.netGap.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT SOURCE REPORT UM VS DD */}
      {activeReportTab === 'float' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            Float Source Comparison: UM (Unrestricted Mobile) vs DD (Direct Distributor)
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
              <span className="font-bold text-purple-900 font-sans text-sm block">UM Float Source</span>
              <p className="text-purple-950 font-bold">
                Transfers: ETB {scopedTransactions.filter((t) => t.floatSource === 'UM' && t.direction === 'OUT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </p>
              <p className="text-purple-900">
                Ending Balance: ETB {summary.umEndingBalance.toLocaleString()}
              </p>
              <p className="text-purple-800 font-sans text-[11px] pt-1">
                Note: UM balances are strictly isolated from DD float.
              </p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
              <span className="font-bold text-indigo-900 font-sans text-sm block">DD Float Source</span>
              <p className="text-indigo-950 font-bold">
                Transfers: ETB {scopedTransactions.filter((t) => t.floatSource === 'DD' && t.direction === 'OUT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </p>
              <p className="text-indigo-900">
                Ending Balance: ETB {summary.ddEndingBalance.toLocaleString()}
              </p>
              <p className="text-indigo-800 font-sans text-[11px] pt-1">
                Note: DD float transfers directly track M-PESA Safaricom distributor allocations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SHORTAGES REPORT */}
      {activeReportTab === 'shortages' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            Shortage & Over-Reporting Incident Statement
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
                <tr>
                  <th className="p-2.5">Incident ID</th>
                  <th className="p-2.5">Shop</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 font-right">Difference (ETB)</th>
                  <th className="p-2.5">Risk</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {scopedExceptions.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{e.id}</td>
                    <td className="p-2.5 font-sans text-slate-800">{e.shopId || 'Mercato'}</td>
                    <td className="p-2.5 font-sans text-slate-800">{e.exceptionType}</td>
                    <td className="p-2.5 font-bold text-rose-600">
                      ETB {e.differenceAmount.toLocaleString()}
                    </td>
                    <td className="p-2.5 font-sans">
                      <StatusBadge status={e.riskLevel} type="risk" />
                    </td>
                    <td className="p-2.5 text-center font-sans">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRECISE EXPORT SCOPE CONFIRMATION MODAL */}
      {showExportModal && (
        <Modal
          title="Configure Excel Financial Export Parameters"
          onClose={() => setShowExportModal(false)}
        >
          <div className="space-y-5 text-xs">
            {/* Scope Summary Preview Box */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 font-mono">
              <span className="text-emerald-400 font-bold font-sans text-xs uppercase block">
                Export Target & Authorization Scope Summary
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-sans block">User Role:</span>
                  <strong className="text-white">{userScope.userName} ({userScope.role})</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block">Legal Entity:</span>
                  <strong className="text-white">LE-ETH-01 (ETB)</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block">Date Range:</span>
                  <strong className="text-white">2026-08-01 to 2026-08-31</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block">Scoped Records:</span>
                  <strong className="text-emerald-400">{scopedTransactions.length} Txs • {scopedReports.length} Reports</strong>
                </div>
              </div>
            </div>

            {/* Export Mode Selection Buttons */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 block">Select Specific Export Mode:</label>
              <div className="space-y-2">
                <button
                  onClick={() => setExportMode('CURRENT_VIEW')}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    exportMode === 'CURRENT_VIEW'
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-bold">Export current view</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Export only the active tab data ({(activeReportTab || '').toUpperCase()})
                    </p>
                  </div>
                  {exportMode === 'CURRENT_VIEW' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => setExportMode('FULL_RECON')}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    exportMode === 'FULL_RECON'
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-bold">Export reconciliation report</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Complete multi-tab workbook with Executive Summary, Transactions, Exceptions, and Audit logs
                    </p>
                  </div>
                  {exportMode === 'FULL_RECON' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => setExportMode('APPROVED_ONLY')}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    exportMode === 'APPROVED_ONLY'
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-bold">Export approved reports</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Export verified shop daily reports and finalized accounting adjustments ready for archive
                    </p>
                  </div>
                  {exportMode === 'APPROVED_ONLY' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerExport}
                className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-bold shadow transition flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Generate & Download Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
