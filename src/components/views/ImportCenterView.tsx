import React, { useState } from 'react';
import { ImportType, NormalizedTransaction, UserScope } from '../../types';
import {
  defaultColumnMappings,
  parseUploadedFile,
  normalizeImportedRows,
  ColumnMapping,
} from '../../services/fileParser';
import { PermissionService } from '../../services/permissionService';
import { StatusBadge } from '../common/StatusBadge';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  ShieldAlert,
  FileX,
  AlertTriangle,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportCenterViewProps {
  userScope: UserScope;
  existingTransactions: NormalizedTransaction[];
  onImportComplete: (
    newTransactions: NormalizedTransaction[],
    importType: ImportType,
    fileName: string
  ) => void;
}

export const ImportCenterView: React.FC<ImportCenterViewProps> = ({
  userScope,
  existingTransactions,
  onImportComplete,
}) => {
  const [selectedImportType, setSelectedImportType] = useState<ImportType>('BANK_STATEMENT');
  const [step, setStep] = useState<'UPLOAD' | 'MAP' | 'PREVIEW'>('UPLOAD');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Current column mapping state
  const [mapping, setMapping] = useState<ColumnMapping>(
    defaultColumnMappings['BANK_STATEMENT']
  );

  // Parsing & validation results
  const [validTxs, setValidTxs] = useState<NormalizedTransaction[]>([]);
  const [rejectedRows, setRejectedRows] = useState<
    { rowNumber: number; reason: string; rowData: any }[]
  >([]);
  const [duplicateWarningCount, setDuplicateWarningCount] = useState<number>(0);

  const canImport = PermissionService.canPerform(userScope.role, 'IMPORT_DATA');

  const importTypesList: { id: ImportType; label: string; desc: string; requiredCols: string[] }[] = [
    {
      id: 'BANK_STATEMENT',
      label: 'Bank Statement',
      desc: 'CBE, Awash, Abyssinia, Dashen bank credit statements',
      requiredCols: ['Reference Number / Slip ID', 'Value Date', 'Credit Amount (ETB)'],
    },
    {
      id: 'MOBILE_MONEY',
      label: 'Mobile Money / M-PESA',
      desc: 'Telebirr & M-PESA Safaricom wallet transfer logs',
      requiredCols: ['Transaction Ref ID', 'Transfer Date', 'Amount (ETB)', 'Wallet ID'],
    },
    {
      id: 'UM_FLOAT',
      label: 'UM Float Report',
      desc: 'Unrestricted Mobile float distribution logs',
      requiredCols: ['Transfer Ref', 'Date', 'Amount', 'Target Shop / DSA'],
    },
    {
      id: 'DD_FLOAT',
      label: 'DD Float Report',
      desc: 'Direct Distributor float allocation logs',
      requiredCols: ['Allocation Ref', 'Date', 'Amount', 'Sub-Agent / DSA'],
    },
    {
      id: 'AIRTIME_EVD',
      label: 'Airtime / EVD Sales Report',
      desc: 'Electronic Airtime sales batch reports',
      requiredCols: ['Batch Ref', 'Sales Date', 'Total Value (ETB)', 'Shop Code'],
    },
    {
      id: 'DAILY_SALES',
      label: 'Shop Daily Cash Sales',
      desc: 'Shop daily cash collection summaries',
      requiredCols: ['Report Date', 'Shop Name', 'Total Cash Collected (ETB)'],
    },
    {
      id: 'DEPOSIT_REPORT',
      label: 'Stamped Deposit Receipts',
      desc: 'Stamped bank deposit slips from shops',
      requiredCols: ['Bank Deposit Slip No', 'Deposit Date', 'Amount Deposited'],
    },
    {
      id: 'COMMISSION_REPORT',
      label: 'Commission Vouchers',
      desc: 'Earned airtime & transaction commissions',
      requiredCols: ['Voucher ID', 'Period Date', 'Commission Amount'],
    },
  ];

  const activeTypeInfo = importTypesList.find((i) => i.id === selectedImportType) || importTypesList[0];

  const handleImportTypeChange = (type: ImportType) => {
    setSelectedImportType(type);
    setMapping(defaultColumnMappings[type] || defaultColumnMappings['BANK_STATEMENT']);
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    try {
      const parsed = await parseUploadedFile(file);
      setHeaders(parsed.headers);
      setRawData(parsed.data);

      // Auto-suggest mappings
      const updatedMap = { ...mapping };
      parsed.headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('ref') || lower.includes('id') || lower.includes('slip'))
          updatedMap.externalReference = h;
        if (lower.includes('date') || lower.includes('time')) updatedMap.transactionDate = h;
        if (lower.includes('amount') || lower.includes('credit') || lower.includes('etb'))
          updatedMap.amount = h;
        if (lower.includes('shop')) updatedMap.shop = h;
        if (lower.includes('dsa') || lower.includes('agent')) updatedMap.dsa = h;
      });
      setMapping(updatedMap);

      setStep('MAP');
    } catch (err) {
      alert('Error reading file. Please ensure valid Excel (.xlsx) or CSV (.csv) format.');
    }
  };

  // Demo file generator
  const loadDemoFile = (type: ImportType) => {
    setSelectedImportType(type);
    const demoHeaders = [
      'Reference Number',
      'Value Date',
      'Credit Amount (ETB)',
      'Bank Name',
      'Float Source',
      'Shop Name',
      'DSA Name',
      'Narration',
    ];
    const demoRows = [
      {
        'Reference Number': `DEMO-DEP-${Math.floor(10000 + Math.random() * 90000)}`,
        'Value Date': '2026-08-10',
        'Credit Amount (ETB)': '185000',
        'Bank Name': 'Commercial Bank of Ethiopia',
        'Float Source': 'UM',
        'Shop Name': userScope.shopId ? 'Bole Main Shop' : 'Bole Main Shop',
        'DSA Name': 'Abebe Bikila',
        Narration: 'CBE Cash Deposit Slip Bole',
      },
      {
        'Reference Number': `TLB-TRF-${Math.floor(10000 + Math.random() * 90000)}`,
        'Value Date': '2026-08-10',
        'Credit Amount (ETB)': '130000',
        'Bank Name': 'Telebirr Master Wallet',
        'Float Source': 'DD',
        'Shop Name': 'Adama Regional Hub',
        'DSA Name': 'Almaz Wolde',
        Narration: 'Telebirr Float Transfer Adama',
      },
      {
        'Reference Number': 'CBE-DEP-88410', // Existing reference to trigger duplicate detection!
        'Value Date': '2026-08-10',
        'Credit Amount (ETB)': '-2000', // Negative amount rejection test
        'Bank Name': 'Bank of Abyssinia',
        'Float Source': 'UM',
        'Shop Name': 'Mercato Distribution Hub',
        'DSA Name': 'Yohannes Tekle',
        Narration: 'Duplicate & Invalid Amount Test',
      },
    ];

    setUploadedFile(new File([''], `Sample_${type}_Import.xlsx`));
    setHeaders(demoHeaders);
    setRawData(demoRows);
    setMapping(defaultColumnMappings[type]);
    setStep('MAP');
  };

  const handleRunNormalization = () => {
    const batchId = `BATCH-${Date.now()}`;
    const result = normalizeImportedRows(
      rawData,
      mapping,
      selectedImportType,
      batchId,
      userScope.userName
    );

    // Duplicate detection against existing transaction store
    let duplicates = 0;
    const existingRefs = new Set(existingTransactions.map((t) => t.external_reference));

    const finalValid: NormalizedTransaction[] = [];
    const finalRejected = [...result.rejectedRows];

    result.validTransactions.forEach((tx, idx) => {
      if (existingRefs.has(tx.external_reference)) {
        duplicates++;
        finalRejected.push({
          rowNumber: idx + 2,
          reason: `Duplicate Record Error: External reference '${tx.external_reference}' was already imported into ReconFlow.`,
          rowData: tx,
        });
      } else {
        finalValid.push(tx);
      }
    });

    setDuplicateWarningCount(duplicates);
    setValidTxs(finalValid);
    setRejectedRows(finalRejected);
    setStep('PREVIEW');
  };

  const handleFinalizeImport = () => {
    onImportComplete(
      validTxs,
      selectedImportType,
      uploadedFile ? uploadedFile.name : 'Imported_Data.xlsx'
    );
  };

  // Download Rejected Rows CSV Report
  const handleDownloadRejectedCSV = () => {
    if (rejectedRows.length === 0) return;

    const exportRows = rejectedRows.map((r) => ({
      RowNumber: r.rowNumber,
      RejectionReason: r.reason,
      RawData: JSON.stringify(r.rowData),
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rejected Rows Report');
    XLSX.writeFile(
      wb,
      `ReconFlow_Import_Errors_${selectedImportType}_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            <span>Data Import & Column Mapping Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import Excel or CSV statements from banks, mobile money wallets, and daily shop reports.
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`px-3 py-1 rounded-full font-semibold ${
              step === 'UPLOAD'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            1. Select & Upload
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`px-3 py-1 rounded-full font-semibold ${
              step === 'MAP'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            2. Map Columns
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`px-3 py-1 rounded-full font-semibold ${
              step === 'PREVIEW'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            3. Validate & Commit
          </span>
        </div>
      </div>

      {!canImport && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold block">Access Restricted</span>
            <span>Your active role ({userScope.role}) does not have permission to import raw transaction files.</span>
          </div>
        </div>
      )}

      {/* STEP 1: UPLOAD & SELECT TYPE */}
      {step === 'UPLOAD' && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Import Type Selector List */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
              Select Statement / Report Type:
            </label>
            <div className="space-y-1.5">
              {importTypesList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleImportTypeChange(item.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                    selectedImportType === item.id
                      ? 'bg-emerald-600 border-emerald-600 font-bold text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className={`text-[11px] font-normal mt-0.5 ${selectedImportType === item.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* File Drag and Drop Box with Prominent Selected Info */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            {/* Prominent Active Selection Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Active Selected Import Category:
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  {activeTypeInfo.id}
                </span>
              </div>
              <h2 className="text-base font-bold">{activeTypeInfo.label}</h2>
              <p className="text-xs text-slate-300">{activeTypeInfo.desc}</p>

              {/* Required Columns Info */}
              <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-400 font-semibold block">Required Source Columns in File:</span>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {activeTypeInfo.requiredCols.map((col, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                      • {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Action Box */}
            <div className="border-2 border-dashed border-slate-300 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <FileSpreadsheet className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upload a <span className="text-emerald-700">{activeTypeInfo.label}</span> File to Continue
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) formats up to 50MB
                </p>
              </div>

              {canImport ? (
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition inline-flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>Browse & Upload File</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              ) : (
                <button disabled className="bg-slate-200 text-slate-500 text-xs font-semibold px-4 py-2 rounded-xl cursor-not-allowed">
                  Upload Disabled for Role
                </button>
              )}

              <div className="pt-4 border-t border-slate-200 w-full flex items-center justify-between text-xs text-slate-500">
                <span>Testing without an Excel file?</span>
                <button
                  disabled={!canImport}
                  onClick={() => loadDemoFile(selectedImportType)}
                  className="text-emerald-600 font-bold hover:underline disabled:opacity-50"
                >
                  ⚡ Quick Load Sample {selectedImportType} File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING SCREEN */}
      {step === 'MAP' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Column Mapping Configuration ({uploadedFile?.name})
              </h3>
              <p className="text-xs text-slate-500">
                Match your source file headers to ReconFlow normalized system fields.
              </p>
            </div>
            <button
              onClick={() => setStep('UPLOAD')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Choose Different File
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'externalReference', label: 'Reference Number / Bank Slip ID *', required: true },
              { key: 'transactionDate', label: 'Transaction Date / Value Date *', required: true },
              { key: 'amount', label: 'Credit Amount (ETB) *', required: true },
              { key: 'bankOrWallet', label: 'Bank Name / Provider', required: false },
              { key: 'floatSource', label: 'Float Tag (UM / DD)', required: false },
              { key: 'shop', label: 'Shop Name / Code', required: false },
              { key: 'dsa', label: 'DSA Agent Name', required: false },
              { key: 'description', label: 'Narration / Description', required: false },
            ].map((field) => (
              <div key={field.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  {field.label}
                </label>
                <select
                  value={(mapping as any)[field.key] || ''}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field.key]: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Header from File --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              onClick={() => setStep('UPLOAD')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleRunNormalization}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition flex items-center space-x-2"
            >
              <span>Validate & Normalize Records</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VALIDATION */}
      {step === 'PREVIEW' && (
        <div className="space-y-6">
          {/* Validation Summary Banner */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900">
              <span className="font-bold text-sm block">
                {validTxs.length} Valid Records Ready
              </span>
              <span>
                Total Amount: ETB{' '}
                {validTxs.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border text-xs ${
                rejectedRows.length > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm block">
                  {rejectedRows.length} Rejected Rows
                </span>
                {rejectedRows.length > 0 && (
                  <button
                    onClick={handleDownloadRejectedCSV}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report (.xlsx)</span>
                  </button>
                )}
              </div>
              <p className="mt-1">
                Rows with invalid format, negative values, or duplicate references.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Batch ID</p>
                <p className="font-mono text-xs font-bold text-emerald-400">
                  {validTxs[0]?.importBatchId || 'BATCH-NEW'}
                </p>
              </div>
              <button
                disabled={validTxs.length === 0}
                onClick={handleFinalizeImport}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow disabled:opacity-50"
              >
                Commit Import to Ledger
              </button>
            </div>
          </div>

          {/* Valid Records Preview Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">
              Normalized Records Preview ({validTxs.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
                  <tr>
                    <th className="p-2.5">Ref No</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 font-right">Amount (ETB)</th>
                    <th className="p-2.5">Float</th>
                    <th className="p-2.5">Shop / DSA</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 font-mono">
                      <td className="p-2.5 font-bold text-slate-900">{tx.external_reference}</td>
                      <td className="p-2.5 text-slate-600">{tx.transactionDate}</td>
                      <td className="p-2.5 font-bold text-emerald-700">
                        ETB {tx.amount.toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <StatusBadge status={tx.floatSource} />
                      </td>
                      <td className="p-2.5 font-sans text-slate-800">
                        {tx.shopName || 'Bole Main Shop'} • {tx.dsaName || 'Abebe'}
                      </td>
                      <td className="p-2.5 font-sans">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected Rows Table if any */}
          {rejectedRows.length > 0 && (
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-rose-900 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rejected Rows Handler ({rejectedRows.length})</span>
                </h3>
                <button
                  onClick={handleDownloadRejectedCSV}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-xl shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Excel Report</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-rose-200 rounded-xl bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-rose-100 text-rose-900 font-semibold border-b">
                    <tr>
                      <th className="p-2.5">Row #</th>
                      <th className="p-2.5">Rejection Reason</th>
                      <th className="p-2.5">Raw Data Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {rejectedRows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-bold text-rose-800">Row {r.rowNumber}</td>
                        <td className="p-2.5 text-rose-700 font-medium">{r.reason}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {JSON.stringify(r.rowData)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
