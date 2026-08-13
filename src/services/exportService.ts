import * as XLSX from 'xlsx';
import {
  NormalizedTransaction,
  ExceptionRecord,
  ReconciliationSummary,
  DailyShopReport,
  AuditLogEntry,
  ManualAdjustment,
} from '../types';

export function exportReconciliationToExcel(
  summary: ReconciliationSummary,
  transactions: NormalizedTransaction[],
  exceptions: ExceptionRecord[],
  reports: DailyShopReport[],
  adjustments: ManualAdjustment[],
  auditLogs: AuditLogEntry[],
  filename: string = 'ReconFlow_Ethiopia_Report.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary & Net Gap
  const summaryData = [
    ['RECONFLOW ETHIOPIA - RECONCILIATION REPORT', ''],
    ['Generated At:', new Date().toLocaleString()],
    ['Currency:', 'ETB (Ethiopian Birr)'],
    ['', ''],
    ['METRIC', 'AMOUNT (ETB)'],
    ['MTD Transfer (Total Float Sent)', summary.mtdTransfer],
    ['MTD Deposit (Total Bank Deposits)', summary.mtdDeposit],
    ['Commission Earned/Deducted', summary.commission],
    ['UM Ending Balance', summary.umEndingBalance],
    ['DD Ending Balance', summary.ddEndingBalance],
    ['Total Ending Balance', summary.totalEndingBalance],
    ['----------------------------------------', '------------'],
    ['NET GAP FORMULA (Transfer - Deposit - Commission - Ending Bal)', summary.netGap],
    ['Reconciled Volume', summary.reconciledAmount],
    ['Reconciliation Rate (%)', `${summary.reconciliationRate}%`],
    ['Unmatched Transactions Count', summary.unmatchedCount],
    ['Unmatched Amount (ETB)', summary.unmatchedAmount],
    ['Shortages Count', summary.shortageCount],
    ['Shortages Amount (ETB)', summary.shortageAmount],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: All Normalized Transactions
  const txHeaders = [
    'Transaction ID',
    'External Ref',
    'Date',
    'Amount (ETB)',
    'Direction',
    'Type',
    'Float Source',
    'Region',
    'Shop',
    'DSA',
    'Bank/Wallet',
    'Status',
    'Description',
  ];
  const txRows = transactions.map((t) => [
    t.id,
    t.external_reference,
    t.transactionDate,
    t.amount,
    t.direction,
    t.transactionType,
    t.floatSource,
    t.regionName || '',
    t.shopName || '',
    t.dsaName || '',
    t.source_system || '',
    t.status,
    t.description,
  ]);
  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // Sheet 3: Exceptions & Shortages
  const excHeaders = [
    'Exception ID',
    'Type',
    'Risk Level',
    'Title',
    'Expected Amount',
    'Actual Amount',
    'Difference (ETB)',
    'Float Source',
    'Shop',
    'Status',
    'Aging Days',
    'Assigned To',
  ];
  const excRows = exceptions.map((e) => [
    e.id,
    e.exceptionType,
    e.riskLevel,
    e.title,
    e.expectedAmount,
    e.actualAmount,
    e.differenceAmount,
    e.floatSource,
    e.shopId || '',
    e.status,
    e.agingDays,
    e.assignedTo || '',
  ]);
  const wsExc = XLSX.utils.aoa_to_sheet([excHeaders, ...excRows]);
  XLSX.utils.book_append_sheet(wb, wsExc, 'Exceptions & Risk');

  // Sheet 4: Daily Shop Reports
  const repHeaders = [
    'Report ID',
    'Date',
    'Shop',
    'DSA',
    'UM Opening',
    'DD Opening',
    'Transfers In',
    'Airtime Sold',
    'Cash Collected',
    'Deposits Made',
    'Commission',
    'UM Ending',
    'DD Ending',
    'Status',
  ];
  const repRows = reports.map((r) => [
    r.id,
    r.reportDate,
    r.shopId,
    r.dsaId || '',
    r.umOpeningBalance,
    r.ddOpeningBalance,
    r.transfersReceived,
    r.airtimeEvdSold,
    r.cashCollected,
    r.depositsMade,
    r.commissionEarned,
    r.umEndingBalance,
    r.ddEndingBalance,
    r.status,
  ]);
  const wsRep = XLSX.utils.aoa_to_sheet([repHeaders, ...repRows]);
  XLSX.utils.book_append_sheet(wb, wsRep, 'Daily Shop Reports');

  // Sheet 5: Manual Adjustments
  const adjHeaders = [
    'Adjustment ID',
    'Date',
    'Shop',
    'Float Source',
    'Type',
    'Amount (ETB)',
    'Category',
    'Reason',
    'Created By',
    'Status',
    'Approved By',
  ];
  const adjRows = adjustments.map((a) => [
    a.id,
    a.createdAt.split('T')[0],
    a.shopId,
    a.floatSource,
    a.adjustmentType,
    a.amount,
    a.category,
    a.reason,
    a.createdBy,
    a.status,
    a.approvedBy || 'N/A',
  ]);
  const wsAdj = XLSX.utils.aoa_to_sheet([adjHeaders, ...adjRows]);
  XLSX.utils.book_append_sheet(wb, wsAdj, 'Adjustments');

  // Sheet 6: Audit Logs
  const logHeaders = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Entity', 'Details'];
  const logRows = auditLogs.map((l) => [
    l.id,
    l.timestamp,
    l.userName,
    l.role,
    l.action,
    `${l.entityType}:${l.entityId}`,
    l.details,
  ]);
  const wsLogs = XLSX.utils.aoa_to_sheet([logHeaders, ...logRows]);
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Audit History');

  // Save File
  XLSX.writeFile(wb, filename);
}
