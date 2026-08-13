import React, { useState } from 'react';
import {
  NormalizedTransaction,
  MatchRecord,
  MatchType,
  UserScope,
} from '../../types';
import { runMatchingEngine } from '../../services/reconciliationEngine';
import { PermissionService } from '../../services/permissionService';
import { StatusBadge } from '../common/StatusBadge';
import {
  GitCompare,
  Sliders,
  CheckCircle2,
  XCircle,
  Link,
  Sparkles,
  ArrowRightLeft,
  ShieldAlert,
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Loader2,
  Info,
  DollarSign,
} from 'lucide-react';

interface ReconciliationEngineViewProps {
  transactions: NormalizedTransaction[];
  matches: MatchRecord[];
  userScope: UserScope;
  onMatchesUpdated: (
    newMatches: MatchRecord[],
    updatedTxs: NormalizedTransaction[]
  ) => void;
  onConfirmMatch: (matchId: string) => void;
  onRejectMatch: (matchId: string) => void;
}

export const ReconciliationEngineView: React.FC<ReconciliationEngineViewProps> = ({
  transactions,
  matches,
  userScope,
  onMatchesUpdated,
  onConfirmMatch,
  onRejectMatch,
}) => {
  const [dateToleranceDays, setDateToleranceDays] = useState<number>(3);
  const [amountToleranceETB, setAmountToleranceETB] = useState<number>(0);

  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [engineNotification, setEngineNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
    stats?: {
      exact: number;
      strong: number;
      fuzzy: number;
      totalNew: number;
      remainingUnmatched: number;
    };
  } | null>(null);

  // Manual matching 4-step guided flow selection state
  const [selectedTx1, setSelectedTx1] = useState<NormalizedTransaction | null>(null);
  const [selectedTx2, setSelectedTx2] = useState<NormalizedTransaction | null>(null);

  const canMatch = PermissionService.canPerform(userScope.role, 'CREATE_MATCH');

  const handleRunEngine = () => {
    if (!canMatch || isEngineRunning) return;
    setIsEngineRunning(true);
    setEngineNotification(null);

    setTimeout(() => {
      // Run matching engine on scoped transactions
      const scopedTxs = PermissionService.filterByScope<NormalizedTransaction>(
        transactions,
        userScope
      );

      const result = runMatchingEngine(
        scopedTxs,
        dateToleranceDays,
        amountToleranceETB
      );

      // Merge updated scoped transactions back into full transaction array
      const updatedMap = new Map(result.updatedTransactions.map((t) => [t.id, t]));
      const fullUpdatedTxs = transactions.map((t) => updatedMap.get(t.id) || t);

      const mergedMatches = [...result.newMatches, ...matches];
      onMatchesUpdated(mergedMatches, fullUpdatedTxs);

      setIsEngineRunning(false);

      // Statistics breakdown
      const exactCount = result.newMatches.filter((m) => m.matchType === 'EXACT').length;
      const strongCount = result.newMatches.filter((m) => m.matchType === 'STRONG').length;
      const fuzzyCount = result.newMatches.filter((m) => m.matchType === 'FUZZY').length;
      const totalNew = result.newMatches.length;

      const remainingUnmatched = fullUpdatedTxs.filter(
        (t) => t.status === 'UNRECONCILED'
      ).length;

      if (totalNew > 0) {
        setEngineNotification({
          type: 'success',
          title: `Engine Execution Success: ${totalNew} New Match Candidate${totalNew > 1 ? 's' : ''} Created!`,
          message: `Generated ${exactCount} Exact (Auto-Confirmed) match${exactCount === 1 ? '' : 'es'}, ${strongCount} Strong (Proposed) match${strongCount === 1 ? '' : 'es'}, and ${fuzzyCount} Fuzzy match${fuzzyCount === 1 ? '' : 'es'}.`,
          stats: {
            exact: exactCount,
            strong: strongCount,
            fuzzy: fuzzyCount,
            totalNew,
            remainingUnmatched,
          },
        });
      } else {
        setEngineNotification({
          type: 'info',
          title: 'Engine Execution Complete: No New Match Candidates Found',
          message: `Evaluated ${scopedTxs.length} records. All eligible float transfers and bank deposits are already reconciled, or no unreconciled pairs met the current rules (Date Tolerance: ${dateToleranceDays} days, Amount Variance: ±${amountToleranceETB} ETB). You can adjust tolerances or use the Guided Manual Matching workflow below.`,
          stats: {
            exact: 0,
            strong: 0,
            fuzzy: 0,
            totalNew: 0,
            remainingUnmatched,
          },
        });
      }
    }, 400);
  };

  const proposedMatches = matches.filter((m) => m.status === 'PROPOSED');

  // Filter unmatched transactions by user scope
  const scopedTransactions = PermissionService.filterByScope<NormalizedTransaction>(transactions, userScope);

  const unreconciledTransfers = scopedTransactions.filter(
    (t) => t.status === 'UNRECONCILED' && t.direction === 'OUT'
  );
  const unreconciledDeposits = scopedTransactions.filter(
    (t) => t.status === 'UNRECONCILED' && t.direction === 'IN'
  );

  const handleManualConnect = () => {
    if (!selectedTx1 || !selectedTx2 || !canMatch) return;

    const diff = Math.abs(selectedTx1.amount - selectedTx2.amount);
    const confidence = diff === 0 ? 100 : Math.max(50, 100 - diff / 100);

    const manualMatch: MatchRecord = {
      id: `MATCH-MANUAL-${Date.now()}`,
      matchType: 'MANUAL',
      confidenceScore: Math.round(confidence),
      sourceTransactionIds: [selectedTx1.id],
      targetTransactionIds: [selectedTx2.id],
      totalSourceAmount: selectedTx1.amount,
      totalTargetAmount: selectedTx2.amount,
      differenceAmount: diff,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      createdBy: `${userScope.userName} (${userScope.role})`,
      notes: `Manual link authorized between Transfer ${selectedTx1.externalReference} and Deposit ${selectedTx2.externalReference}.`,
    };

    const updatedTxs = transactions.map((t) => {
      if (t.id === selectedTx1.id || t.id === selectedTx2.id) {
        return { ...t, status: 'RECONCILED' as const };
      }
      return t;
    });

    onMatchesUpdated([manualMatch, ...matches], updatedTxs);
    setSelectedTx1(null);
    setSelectedTx2(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Engine Runner Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Rules-Based Reconciliation Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explainable matching hierarchy: Priority 1 (Exact Ref & Amount) → Priority 2 (Date Tolerance) → Priority 3 (Fuzzy).
          </p>
        </div>

        {/* Tolerances & Trigger Button */}
        {canMatch ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Date Tolerance:</span>
              <select
                value={dateToleranceDays}
                onChange={(e) => setDateToleranceDays(Number(e.target.value))}
                className="bg-slate-950 font-bold text-emerald-400 px-2 py-1 rounded focus:outline-none cursor-pointer"
              >
                <option value={0}>0 Days (Exact Date)</option>
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days (Default)</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days</option>
              </select>
            </div>

            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Amount Variance:</span>
              <select
                value={amountToleranceETB}
                onChange={(e) => setAmountToleranceETB(Number(e.target.value))}
                className="bg-slate-950 font-bold text-emerald-400 px-2 py-1 rounded focus:outline-none cursor-pointer"
              >
                <option value={0}>±0 ETB (Exact)</option>
                <option value={10}>±10 ETB</option>
                <option value={50}>±50 ETB</option>
                <option value={100}>±100 ETB</option>
                <option value={500}>±500 ETB</option>
              </select>
            </div>

            <button
              disabled={isEngineRunning}
              onClick={handleRunEngine}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              {isEngineRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  <span>Running Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Matching Engine</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 text-slate-400 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Auditor Read-Only (Matching Disabled)</span>
          </div>
        )}
      </div>

      {/* ENGINE EXECUTION NOTIFICATION BANNER */}
      {engineNotification && (
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
            engineNotification.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-800/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {engineNotification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">
                  {engineNotification.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {engineNotification.message}
                </p>

                {engineNotification.stats && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
                    <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                      {engineNotification.stats.exact} Exact Auto-Confirmed
                    </span>
                    <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                      {engineNotification.stats.strong} Strong Proposed
                    </span>
                    <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                      {engineNotification.stats.fuzzy} Fuzzy Candidates
                    </span>
                    <span className="bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                      {engineNotification.stats.remainingUnmatched} Unmatched Remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setEngineNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MATCHING RULE HIERARCHY CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-emerald-700 uppercase">Priority 1: Exact Match</span>
          <p className="text-slate-600 mt-0.5">100% confidence • Exact Ref & Amount</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-amber-700 uppercase">Priority 2: Strong Match</span>
          <p className="text-slate-600 mt-0.5">92% confidence • Shop & Date tolerance</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-purple-700 uppercase">Priority 3: Fuzzy Match</span>
          <p className="text-slate-600 mt-0.5">75% confidence • Partial Ref or close amount</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-sky-700 uppercase">Priority 4: Manual Match</span>
          <p className="text-slate-600 mt-0.5">Authorized link with audit memo</p>
        </div>
      </div>

      {/* PROPOSED MATCHES CONFIRMATION QUEUE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Proposed Matches Awaiting Confirmation ({proposedMatches.length})
            </h3>
            <p className="text-xs text-slate-500">
              Matches proposed by tolerance and fuzzy rules require user verification.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-bold">
            {proposedMatches.length} Proposed
          </span>
        </div>

        {proposedMatches.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No proposed matches awaiting review. Run the engine or inspect unmatched items below.
          </div>
        ) : (
          <div className="space-y-3">
            {proposedMatches.map((m) => {
              const txSource = transactions.find((t) => t.id === m.sourceTransactionIds[0]);
              const txTarget = transactions.find((t) => t.id === m.targetTransactionIds[0]);

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-amber-900">{m.matchType} MATCH</span>
                      <span className="bg-amber-200 text-amber-900 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                        {m.confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1 font-mono">
                      <span className="font-bold text-slate-900">
                        Transfer: {txSource?.external_reference || 'TRF-01'} (ETB{' '}
                        {txSource?.amount.toLocaleString()})
                      </span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-bold text-slate-900">
                        Deposit: {txTarget?.external_reference || 'DEP-01'} (ETB{' '}
                        {txTarget?.amount.toLocaleString()})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 pt-0.5">{m.notes}</p>
                  </div>

                  {canMatch && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onRejectMatch(m.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => onConfirmMatch(m.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Match</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GUIDED 4-STEP MANUAL MATCHING TOOL & UNMATCHED LIST */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Wizard Step Bar */}
        <div className="border-b pb-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Link className="w-4 h-4 text-emerald-600" />
            <span>Guided Manual Matching Workflow</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Follow the 4-step sequence to link unmatched float transfers with bank deposits.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs font-medium">
            <div
              className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                selectedTx1
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedTx1 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-300 text-slate-700'}`}>
                1
              </span>
              <span>1. Select Transfer</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                selectedTx2
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedTx2 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-300 text-slate-700'}`}>
                2
              </span>
              <span>2. Select Deposit</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                selectedTx1 && selectedTx2
                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedTx1 && selectedTx2 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-300 text-slate-700'}`}>
                3
              </span>
              <span>3. Review Values</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                selectedTx1 && selectedTx2
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedTx1 && selectedTx2 ? 'bg-white text-emerald-950 font-bold' : 'bg-slate-300 text-slate-700'}`}>
                4
              </span>
              <span>4. Authorize Match</span>
            </div>
          </div>
        </div>

        {/* Selected Items Comparison Header */}
        {(selectedTx1 || selectedTx2) && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold font-sans text-xs">
                Candidate Selection Comparison
              </span>
              {(selectedTx1 && selectedTx2) && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  Ready to Link (Variance: ETB {Math.abs(selectedTx1.amount - selectedTx2.amount).toLocaleString()})
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 text-[11px] block font-sans">
                  Step 1 Selected Transfer:
                </span>
                {selectedTx1 ? (
                  <>
                    <p className="font-bold text-white text-sm">{selectedTx1.external_reference}</p>
                    <p className="text-emerald-400 font-bold">ETB {selectedTx1.amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-[11px] font-sans">
                      {selectedTx1.shopName || 'Bole Shop'} • {selectedTx1.transactionDate} ({selectedTx1.floatSource})
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 italic font-sans text-[11px]">No transfer selected yet</p>
                )}
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 text-[11px] block font-sans">
                  Step 2 Selected Deposit:
                </span>
                {selectedTx2 ? (
                  <>
                    <p className="font-bold text-white text-sm">{selectedTx2.external_reference}</p>
                    <p className="text-emerald-400 font-bold">ETB {selectedTx2.amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-[11px] font-sans">
                      {selectedTx2.shopName || 'Adama Hub'} • {selectedTx2.transactionDate} ({selectedTx2.source_system})
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 italic font-sans text-[11px]">No deposit selected yet</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setSelectedTx1(null);
                  setSelectedTx2(null);
                }}
                className="text-slate-400 hover:text-white font-sans text-xs underline"
              >
                Clear Selection
              </button>

              <button
                disabled={!selectedTx1 || !selectedTx2 || !canMatch}
                onClick={handleManualConnect}
                className="disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>Confirm & Authorize Link</span>
              </button>
            </div>
          </div>
        )}

        {/* Unmatched Tables Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Step 1: Unmatched Float Transfers (Out) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Unmatched Float Transfers ({unreconciledTransfers.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">Click card to select</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {unreconciledTransfers.map((tx) => {
                const isSelected = selectedTx1?.id === tx.id;
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx1(isSelected ? null : tx)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 font-bold text-emerald-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{tx.external_reference}</span>
                        <StatusBadge status={tx.floatSource} />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
                        <span>{tx.shopName || 'Bole Shop'}</span>
                        <span>{tx.transactionDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-emerald-700 font-bold block font-mono text-sm">
                        ETB {tx.amount.toLocaleString()}
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full mt-1">
                          <Check className="w-3 h-3" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold hover:text-slate-700">
                          Select →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Unmatched Bank Deposits (In) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Unmatched Bank Deposits ({unreconciledDeposits.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">Click card to select</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {unreconciledDeposits.map((tx) => {
                const isSelected = selectedTx2?.id === tx.id;
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx2(isSelected ? null : tx)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 font-bold text-emerald-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{tx.external_reference}</span>
                        <StatusBadge status={tx.source_system} />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
                        <span>{tx.shopName || 'Adama Hub'}</span>
                        <span>{tx.transactionDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-emerald-700 font-bold block font-mono text-sm">
                        ETB {tx.amount.toLocaleString()}
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full mt-1">
                          <Check className="w-3 h-3" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold hover:text-slate-700">
                          Select →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
