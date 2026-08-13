import React, { useState } from 'react';
import {
  NormalizedTransaction,
  ExceptionRecord,
  DailyShopReport,
  ReconciliationSummary,
  Region,
  Shop,
  UserScope,
} from '../../types';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Clock,
  Building2,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Zap,
  User,
  AlertCircle,
  Link,
} from 'lucide-react';

interface DashboardViewProps {
  summary: ReconciliationSummary;
  transactions: NormalizedTransaction[];
  exceptions: ExceptionRecord[];
  reports: DailyShopReport[];
  regions: Region[];
  shops: Shop[];
  userScope: UserScope;
  onSelectShopFilter: (shopId: string) => void;
  onNavigateToEngine: () => void;
  onNavigateToExceptions: () => void;
  onNavigateToDailyReports: () => void;
  onNavigateToApprovals: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  transactions,
  exceptions,
  reports,
  regions,
  shops,
  userScope,
  onSelectShopFilter,
  onNavigateToEngine,
  onNavigateToExceptions,
  onNavigateToDailyReports,
  onNavigateToApprovals,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedShop, setSelectedShop] = useState<string>('ALL');
  const [selectedFloat, setSelectedFloat] = useState<'ALL' | 'UM' | 'DD'>('ALL');

  // Collapsible state for secondary widgets
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);
  const [showHeatmapDetails, setShowHeatmapDetails] = useState<boolean>(false);

  // Modal drilldown state
  const [drillDownTitle, setDrillDownTitle] = useState<string | null>(null);
  const [drillDownTxs, setDrillDownTxs] = useState<NormalizedTransaction[]>([]);

  const isDsaUser = userScope.role === 'DSA';

  const handleFilterChange = (shopId: string) => {
    setSelectedShop(shopId);
    onSelectShopFilter(shopId === 'ALL' ? '' : shopId);
  };

  const openDrillDown = (title: string, filteredList: NormalizedTransaction[]) => {
    setDrillDownTitle(title);
    setDrillDownTxs(filteredList);
  };

  const isNetGapBalanced = Math.abs(summary.netGap) === 0;

  // Unmatched & Action counts
  const pendingProposedMatches = transactions.filter((t) => t.status === 'UNRECONCILED');
  const pendingShortages = exceptions.filter((e) => e.status === 'OPEN' || e.status === 'UNDER_INVESTIGATION');
  const pendingReportsCount = reports.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6">
      {/* DSA DEDICATED SPECIFIC DASHBOARD VIEW */}
      {isDsaUser ? (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Direct Sales Agent (DSA) Dashboard — {userScope.userName}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Outlet: Bole Main Shop (SHP-BOL) • Agent ID: DSA-101
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-sans block text-xs">Active Float Allocation</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">ETB 250,000</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">UM Float: ETB 150k • DD Float: ETB 100k</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-sans block text-xs">Today's Daily Report Status</span>
                <p className="text-lg font-bold text-amber-400 mt-1">PENDING SUBMISSION</p>
                <button
                  onClick={onNavigateToDailyReports}
                  className="mt-2 text-emerald-400 font-sans font-bold hover:underline flex items-center space-x-1"
                >
                  <span>Submit Today's Sales & Deposits →</span>
                </button>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-sans block text-xs">Assigned Exceptions</span>
                <p className="text-lg font-bold text-white mt-1">0 Active Shortages</p>
                <p className="text-[11px] text-emerald-400 font-sans mt-0.5">All float deposits reconciled</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Priority: NEEDS ACTION TODAY BANNER */}
          <div className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
                <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Needs Action Today (Requires Operational Attention)
                </h2>
              </div>
              <span className="text-xs font-bold font-mono bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                {pendingProposedMatches.length + pendingShortages.length + pendingReportsCount} Critical Items
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-xs">
              {/* Card 1: Unmatched Matches Queue */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Unmatched Queue ({pendingProposedMatches.length})
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      Priority 1
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    ETB {summary.unmatchedAmount.toLocaleString()} float transfers awaiting rule matching or manual link.
                  </p>
                </div>

                <button
                  onClick={onNavigateToEngine}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Review Unmatched Queue →</span>
                </button>
              </div>

              {/* Card 2: Shortages & Exceptions */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-500/30 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Open Shortages ({pendingShortages.length})
                    </span>
                    <span className="bg-rose-100 text-rose-900 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      Risk
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    ETB {summary.shortageAmount.toLocaleString()} in unapproved cash shortages & over-reporting incidents.
                  </p>
                </div>

                <button
                  onClick={onNavigateToExceptions}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Investigate Shortages →</span>
                </button>
              </div>

              {/* Card 3: Unapproved Daily Reports */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-sky-200 dark:border-sky-500/30 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Pending Approvals ({pendingReportsCount})
                    </span>
                    <span className="bg-sky-100 text-sky-900 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      Maker-Checker
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Daily shop reports and manual adjustments awaiting Finance Manager approval.
                  </p>
                </div>

                <button
                  onClick={onNavigateToApprovals}
                  className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Review Approvals Queue →</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI METRIC CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Reconciliation Rate"
              value={`${summary.reconciliationRate}%`}
              subtitle={`ETB ${summary.reconciledAmount.toLocaleString()} Reconciled`}
              statusType={summary.reconciliationRate >= 90 ? 'success' : 'warning'}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              trend="+4.2% vs last week"
              isPositive={true}
            />

            <StatCard
              title="Unmatched Queue"
              value={summary.unmatchedCount}
              subtitle={`Total Value: ETB ${summary.unmatchedAmount.toLocaleString()}`}
              statusType="warning"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              onDrillDown={() =>
                openDrillDown(
                  'Unmatched Transactions Queue',
                  transactions.filter((t) => t.status === 'UNRECONCILED')
                )
              }
            />

            <StatCard
              title="Shortages Detected"
              value={summary.shortageCount}
              subtitle={`Shortage Loss: ETB ${summary.shortageAmount.toLocaleString()}`}
              statusType="danger"
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              onDrillDown={() =>
                openDrillDown(
                  'Shortages & Exception Transactions',
                  transactions.filter((t) => t.status === 'EXCEPTION')
                )
              }
            />

            <StatCard
              title="High-Risk Shops"
              value={summary.highRiskShopsCount}
              subtitle="Shops with >2d aging issues or missing reports"
              statusType="danger"
              icon={<Building2 className="w-5 h-5 text-rose-600" />}
              onDrillDown={onNavigateToExceptions}
            />
          </div>

          {/* COLLAPSIBLE CORE FORMULA NET GAP BANNER */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Net Gap Formula Calculation</h3>
                  <p className="text-xs text-slate-400">Net Gap = Transfer − Deposit − Commission − Ending Balance</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="font-mono text-xl font-bold text-emerald-400">
                  ETB {summary.netGap.toLocaleString()}
                </span>
                <button
                  onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 border border-slate-700 px-2.5 py-1 rounded-lg"
                >
                  <span>{showFormulaDetails ? 'Hide Details' : 'Show Formula Breakdown'}</span>
                  {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showFormulaDetails && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">1. MTD Transfers (Out)</span>
                  <p className="text-sm font-bold text-sky-400 mt-1">ETB {summary.mtdTransfer.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">2. MTD Deposits (In)</span>
                  <p className="text-sm font-bold text-emerald-400 mt-1">ETB {summary.mtdDeposit.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">3. Commission</span>
                  <p className="text-sm font-bold text-purple-400 mt-1">ETB {summary.commission.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">4. Ending Float</span>
                  <p className="text-sm font-bold text-amber-400 mt-1">ETB {summary.totalEndingBalance.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* COLLAPSIBLE SHOP RISK HEATMAP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Shop Performance & Risk Heatmap</h3>
                <p className="text-xs text-slate-500">Hierarchy: Region → Shop → Risk Status & Missing Reports</p>
              </div>
              <button
                onClick={() => setShowHeatmapDetails(!showHeatmapDetails)}
                className="text-xs text-slate-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>{showHeatmapDetails ? 'Collapse Table' : 'Expand Shop List'}</span>
                {showHeatmapDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showHeatmapDetails && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Shop Name</th>
                      <th className="py-2.5 px-3">Region</th>
                      <th className="py-2.5 px-3">Latest Deposit</th>
                      <th className="py-2.5 px-3 text-right">Shortage</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shops.map((shop) => {
                      const shopExc = exceptions.filter((e) => e.shopId === shop.id);
                      const hasHighRisk = shopExc.some((e) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL');
                      const shortageSum = shopExc.reduce((sum, e) => sum + e.differenceAmount, 0);

                      return (
                        <tr key={shop.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{shop.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {shop.regionId === 'REG-ADD' ? 'Addis Ababa' : 'Oromia'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">Aug 08, 2026</td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              shortageSum > 0 ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            {shortageSum > 0 ? `ETB ${shortageSum.toLocaleString()}` : 'ETB 0'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <StatusBadge
                              status={hasHighRisk ? 'HIGH RISK' : shopExc.length > 0 ? 'WARNING' : 'HEALTHY'}
                              type={hasHighRisk ? 'risk' : shopExc.length > 0 ? 'warning' : 'reconciled'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* DRILL-DOWN TRANSACTIONS MODAL */}
      <Modal
        isOpen={drillDownTitle !== null}
        onClose={() => setDrillDownTitle(null)}
        title={drillDownTitle || 'Transaction Records Drilldown'}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Showing {drillDownTxs.length} underlying transaction records for detailed inspection.
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Ref No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Shop / DSA</th>
                  <th className="p-2.5">Float</th>
                  <th className="p-2.5 text-right">Amount (ETB)</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drillDownTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 font-mono">
                    <td className="p-2.5 font-bold text-slate-900">{tx.external_reference}</td>
                    <td className="p-2.5 text-slate-600">{tx.transactionDate}</td>
                    <td className="p-2.5 font-sans text-slate-800">
                      {tx.shopName || 'Shop'} • {tx.dsaName || 'DSA'}
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={tx.floatSource} />
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      ETB {tx.amount.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center font-sans">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
