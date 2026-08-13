import React, { useState } from 'react';
import { DailyShopReport, Region, Shop, DSA, UserScope } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Send,
  Clock,
  Calculator,
} from 'lucide-react';

interface ShopReportingViewProps {
  userScope: UserScope;
  regions: Region[];
  shops: Shop[];
  dsas: DSA[];
  reports: DailyShopReport[];
  onSubmitReport: (newReport: DailyShopReport) => void;
}

export const ShopReportingView: React.FC<ShopReportingViewProps> = ({
  userScope,
  regions,
  shops,
  dsas,
  reports,
  onSubmitReport,
}) => {
  const [reportDate, setReportDate] = useState<string>('2026-08-11');
  const [selectedShopId, setSelectedShopId] = useState<string>(
    userScope.shopId || 'SHP-BOL'
  );
  const [selectedDsaId, setSelectedDsaId] = useState<string>(
    userScope.dsaId || 'DSA-101'
  );

  const [umOpening, setUmOpening] = useState<number>(55000);
  const [ddOpening, setDdOpening] = useState<number>(20000);
  const [transfersRec, setTransfersRec] = useState<number>(100000);
  const [airtimeSold, setAirtimeSold] = useState<number>(95000);
  const [cashCollected, setCashCollected] = useState<number>(95000);
  const [depositsMade, setDepositsMade] = useState<number>(95000);
  const [commission, setCommission] = useState<number>(2850);
  const [umEnding, setUmEnding] = useState<number>(60000);
  const [ddEnding, setDdEnding] = useState<number>(20000);

  const [receiptName, setReceiptName] = useState<string>('CBE_Slip_Aug11.pdf');
  const [notes, setNotes] = useState<string>('Daily EVD sales completed cleanly.');

  // Calculated checks
  const expectedEndingUM = umOpening + transfersRec - airtimeSold;
  const endingUmDiff = umEnding - expectedEndingUM;
  const isShortage = cashCollected < airtimeSold || depositsMade < cashCollected;

  const currentShop = shops.find((s) => s.id === selectedShopId) || shops[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];
    if (cashCollected < airtimeSold) {
      validationErrors.push(
        `Cash collected (ETB ${cashCollected}) is less than airtime sold (ETB ${airtimeSold}). Shortage detected!`
      );
    }
    if (depositsMade < cashCollected) {
      validationErrors.push(
        `Deposits made (ETB ${depositsMade}) is less than cash collected (ETB ${cashCollected}). Unbanked cash remaining!`
      );
    }

    const newReport: DailyShopReport = {
      id: `REP-${Date.now()}`,
      tenant_id: userScope.tenantId || 'TNT-GLOBAL-01',
      group_id: userScope.groupId || 'GRP-AFRICA-01',
      legal_entity_id: userScope.legalEntityId || 'LE-ETH-01',
      country_code: userScope.countryCode || 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: reportDate,
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'Mobile Shop Form',
      external_reference: `REP-${Date.now()}`,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
      reportDate,
      regionId: currentShop?.regionId || 'REG-ADD',
      shopId: selectedShopId,
      dsaId: selectedDsaId,
      umOpeningBalance: umOpening,
      ddOpeningBalance: ddOpening,
      transfersReceived: transfersRec,
      airtimeEvdSold: airtimeSold,
      cashCollected,
      depositsMade,
      commissionEarned: commission,
      umEndingBalance: umEnding,
      ddEndingBalance: ddEnding,
      depositReceiptName: receiptName,
      depositReceiptUrl: receiptName,
      notes,
      submittedBy: userScope.userName,
      submittedAt: new Date().toISOString(),
      status: validationErrors.length > 0 ? 'FLAGGED' : 'VERIFIED',
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    };

    onSubmitReport(newReport);
    alert('Daily Shop Report successfully submitted and logged!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>Daily Shop & DSA Operations Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit daily opening/ending float balances, cash collections, and bank deposit receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Cutoff Time: 18:30 ETB</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* REPORT FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            1. Report Metadata & Shop Scope
          </h2>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shop Branch</label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned DSA</label>
              <select
                value={selectedDsaId}
                onChange={(e) => setSelectedDsaId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
              >
                {dsas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 pt-2">
            2. Float Movement & Cash Collection (ETB)
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2">
              <span className="font-bold text-purple-900 uppercase block">UM Float Balances</span>
              <div>
                <label className="text-slate-600 block">UM Opening Balance</label>
                <input
                  type="number"
                  value={umOpening}
                  onChange={(e) => setUmOpening(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 block">UM Ending Balance</label>
                <input
                  type="number"
                  value={umEnding}
                  onChange={(e) => setUmEnding(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
              <span className="font-bold text-indigo-900 uppercase block">DD Float Balances</span>
              <div>
                <label className="text-slate-600 block">DD Opening Balance</label>
                <input
                  type="number"
                  value={ddOpening}
                  onChange={(e) => setDdOpening(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 block">DD Ending Balance</label>
                <input
                  type="number"
                  value={ddEnding}
                  onChange={(e) => setDdEnding(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Float Received</label>
              <input
                type="number"
                value={transfersRec}
                onChange={(e) => setTransfersRec(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">EVD Airtime Sold</label>
              <input
                type="number"
                value={airtimeSold}
                onChange={(e) => setAirtimeSold(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cash Collected</label>
              <input
                type="number"
                value={cashCollected}
                onChange={(e) => setCashCollected(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deposits Made to Bank</label>
              <input
                type="number"
                value={depositsMade}
                onChange={(e) => setDepositsMade(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Commission Earned</label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deposit Slip File Ref</label>
              <input
                type="text"
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 text-xs block mb-1">Daily Notes / Explanations</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              rows={2}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Daily Shop Report</span>
            </button>
          </div>
        </form>

        {/* SIDEBAR RECENT REPORTS & VALIDATION CHECKS */}
        <div className="space-y-4">
          {/* Instant Validation Card */}
          <div
            className={`p-5 rounded-2xl border ${
              isShortage
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Calculator className="w-4 h-4" />
              <span>Instant Form Validation</span>
            </h3>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span>Expected Ending UM:</span>
                <span className="font-mono font-bold">ETB {expectedEndingUM.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Entered Ending UM:</span>
                <span className="font-mono font-bold">ETB {umEnding.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span>Balance Difference:</span>
                <span
                  className={`font-mono ${
                    endingUmDiff === 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  ETB {endingUmDiff.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Submission History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-slate-900">Recent Submitted Reports</h3>
            <div className="space-y-2 text-xs">
              {reports.slice(0, 3).map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center font-semibold">
                    <span>{r.reportDate}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Deposited: ETB {r.depositsMade.toLocaleString()} | UM End: ETB {r.umEndingBalance.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
