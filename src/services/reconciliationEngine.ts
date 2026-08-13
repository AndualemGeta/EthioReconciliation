import {
  NormalizedTransaction,
  MatchRecord,
  MatchType,
  ExceptionRecord,
  ReconciliationSummary,
  DailyShopReport,
} from '../types';

/**
 * Calculates the Core Reconciliation Formula:
 * Net Gap = MTD Transfer - MTD Deposit - Commission - Ending Balance
 */
export function calculateReconciliationSummary(
  transactions: NormalizedTransaction[],
  reports: DailyShopReport[],
  filterShopId?: string,
  filterRegionId?: string,
  filterFloatSource?: 'UM' | 'DD'
): ReconciliationSummary {
  let filteredTx = transactions;
  let filteredReports = reports;

  if (filterShopId) {
    filteredTx = filteredTx.filter((t) => t.shopId === filterShopId);
    filteredReports = filteredReports.filter((r) => r.shopId === filterShopId);
  } else if (filterRegionId) {
    filteredTx = filteredTx.filter((t) => t.regionId === filterRegionId);
    filteredReports = filteredReports.filter((r) => r.regionId === filterRegionId);
  }

  if (filterFloatSource) {
    filteredTx = filteredTx.filter((t) => t.floatSource === filterFloatSource);
  }

  // 1. MTD Transfers (OUT direction, TRANSFER type or float movement)
  const mtdTransfer = filteredTx
    .filter((t) => t.transactionType === 'TRANSFER' && t.direction === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. MTD Deposits (IN direction, DEPOSIT type)
  const mtdDeposit = filteredTx
    .filter((t) => t.transactionType === 'DEPOSIT' && t.direction === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Commission (IN direction or COMMISSION type)
  const commission = filteredTx
    .filter((t) => t.transactionType === 'COMMISSION')
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Ending Balances from Latest Daily Shop Reports
  let umEndingBalance = 0;
  let ddEndingBalance = 0;

  // Map latest report per shop
  const latestReportsByShop = new Map<string, DailyShopReport>();
  filteredReports.forEach((r) => {
    const existing = latestReportsByShop.get(r.shopId);
    if (!existing || new Date(r.reportDate) > new Date(existing.reportDate)) {
      latestReportsByShop.set(r.shopId, r);
    }
  });

  latestReportsByShop.forEach((rep) => {
    umEndingBalance += rep.umEndingBalance || 0;
    ddEndingBalance += rep.ddEndingBalance || 0;
  });

  const totalEndingBalance =
    filterFloatSource === 'UM'
      ? umEndingBalance
      : filterFloatSource === 'DD'
      ? ddEndingBalance
      : umEndingBalance + ddEndingBalance;

  // Net Gap calculation:
  // Net Gap = MTD Transfer - MTD Deposit - Commission - Ending Balance
  const netGap = mtdTransfer - mtdDeposit - commission - totalEndingBalance;

  // Unmatched stats
  const unmatchedTx = filteredTx.filter((t) => t.status === 'UNRECONCILED');
  const unmatchedCount = unmatchedTx.length;
  const unmatchedAmount = unmatchedTx.reduce((sum, t) => sum + t.amount, 0);

  // Reconciled stats
  const reconciledTx = filteredTx.filter((t) => t.status === 'RECONCILED' || t.status === 'PROPOSED');
  const reconciledAmount = reconciledTx.reduce((sum, t) => sum + t.amount, 0);
  const totalVolume = filteredTx.reduce((sum, t) => sum + t.amount, 0) || 1;
  const reconciliationRate = Math.min(100, Math.round((reconciledAmount / totalVolume) * 100));

  // Exceptions stats
  const shortages = filteredTx.filter((t) => t.status === 'EXCEPTION' && t.amount > 0);
  const shortageCount = shortages.length;
  const shortageAmount = shortages.reduce((sum, t) => sum + t.amount, 0);

  return {
    mtdTransfer,
    mtdDeposit,
    commission,
    umEndingBalance,
    ddEndingBalance,
    totalEndingBalance,
    netGap,
    reconciledAmount,
    reconciliationRate,
    unmatchedCount,
    unmatchedAmount,
    shortageCount,
    shortageAmount,
    overReportingCount: 1,
    overReportingAmount: 50000,
    missingReportsCount: 1,
    highRiskShopsCount: 2,
  };
}

/**
 * Runs rule-based matching engine across unreconciled transactions.
 */
export function runMatchingEngine(
  transactions: NormalizedTransaction[],
  dateToleranceDays: number = 3,
  amountToleranceETB: number = 0
): {
  newMatches: MatchRecord[];
  updatedTransactions: NormalizedTransaction[];
} {
  // Create shallow clones of transaction objects to ensure React immutability
  const updatedTransactions = transactions.map((t) => ({ ...t }));
  const newMatches: MatchRecord[] = [];

  const unreconciledTransfers = updatedTransactions.filter(
    (t) =>
      (t.status === 'UNRECONCILED' || !t.status) &&
      t.direction === 'OUT' &&
      t.transactionType !== 'COMMISSION'
  );

  const unreconciledDeposits = updatedTransactions.filter(
    (t) =>
      (t.status === 'UNRECONCILED' || !t.status) &&
      t.direction === 'IN' &&
      t.transactionType !== 'COMMISSION'
  );

  unreconciledTransfers.forEach((trf) => {
    // Skip if already reconciled/proposed in this run
    if (trf.status !== 'UNRECONCILED' && trf.status) return;

    // Priority 1: Exact Match (same ref & same amount & same float source)
    const exactMatchIndex = unreconciledDeposits.findIndex((dep) => {
      if (dep.status !== 'UNRECONCILED' && dep.status) return false;
      const trfRef = (trf.external_reference || '').trim().toLowerCase();
      const depRef = (dep.external_reference || '').trim().toLowerCase();
      const refMatch = trfRef !== '' && trfRef === depRef;
      const amountMatch = Math.abs(trf.amount - dep.amount) <= amountToleranceETB;
      const floatMatch =
        !trf.floatSource ||
        !dep.floatSource ||
        trf.floatSource === 'NONE' ||
        dep.floatSource === 'NONE' ||
        trf.floatSource === dep.floatSource;

      return refMatch && amountMatch && floatMatch;
    });

    if (exactMatchIndex !== -1) {
      const matchedDeposit = unreconciledDeposits[exactMatchIndex];

      // Mark both reconciled
      trf.status = 'RECONCILED';
      matchedDeposit.status = 'RECONCILED';

      newMatches.push({
        id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        matchType: 'EXACT',
        confidenceScore: 100,
        sourceTransactionIds: [trf.id],
        targetTransactionIds: [matchedDeposit.id],
        totalSourceAmount: trf.amount,
        totalTargetAmount: matchedDeposit.amount,
        differenceAmount: Math.abs(trf.amount - matchedDeposit.amount),
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        createdBy: 'Auto Matching Engine (Exact Ref Rule)',
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'Auto Rule Engine',
      });
      return;
    }

    // Priority 2: Strong Match (same amount, same shop or DSA, date within tolerance)
    const strongMatchIndex = unreconciledDeposits.findIndex((dep) => {
      if (dep.status !== 'UNRECONCILED' && dep.status) return false;
      const amountMatch = Math.abs(trf.amount - dep.amount) <= amountToleranceETB;
      const shopMatch =
        !trf.shopId || !dep.shopId || trf.shopId === dep.shopId || trf.dsaId === dep.dsaId;
      const dateDiff =
        Math.abs(
          new Date(trf.transactionDate).getTime() - new Date(dep.transactionDate).getTime()
        ) /
        (1000 * 3600 * 24);
      const floatMatch =
        !trf.floatSource ||
        !dep.floatSource ||
        trf.floatSource === 'NONE' ||
        dep.floatSource === 'NONE' ||
        trf.floatSource === dep.floatSource;

      return amountMatch && shopMatch && dateDiff <= dateToleranceDays && floatMatch;
    });

    if (strongMatchIndex !== -1) {
      const matchedDeposit = unreconciledDeposits[strongMatchIndex];

      trf.status = 'PROPOSED';
      matchedDeposit.status = 'PROPOSED';

      newMatches.push({
        id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        matchType: 'STRONG',
        confidenceScore: 92,
        sourceTransactionIds: [trf.id],
        targetTransactionIds: [matchedDeposit.id],
        totalSourceAmount: trf.amount,
        totalTargetAmount: matchedDeposit.amount,
        differenceAmount: Math.abs(trf.amount - matchedDeposit.amount),
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        createdBy: `Auto Engine (Shop Match + Date Tolerance ${dateToleranceDays}d)`,
        notes: `Proposed match between ${trf.external_reference} and ${matchedDeposit.external_reference} for shop ${trf.shopName || 'Central'}.`,
      });
      return;
    }

    // Priority 3: Fuzzy Match (Partial Reference match or amount close)
    const fuzzyMatchIndex = unreconciledDeposits.findIndex((dep) => {
      if (dep.status !== 'UNRECONCILED' && dep.status) return false;
      const cleanRef1 = (trf.external_reference || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanRef2 = (dep.external_reference || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const partialRef =
        cleanRef1.length > 3 &&
        cleanRef2.length > 3 &&
        (cleanRef1.includes(cleanRef2) || cleanRef2.includes(cleanRef1));
      const amountDiff = Math.abs(trf.amount - dep.amount);
      const amountClose = amountDiff <= Math.max(50, trf.amount * 0.01); // 1% or 50 ETB

      const shopMatch = !trf.shopId || !dep.shopId || trf.shopId === dep.shopId;

      return (partialRef || amountClose) && shopMatch;
    });

    if (fuzzyMatchIndex !== -1) {
      const matchedDeposit = unreconciledDeposits[fuzzyMatchIndex];

      trf.status = 'PROPOSED';
      matchedDeposit.status = 'PROPOSED';

      newMatches.push({
        id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        matchType: 'FUZZY',
        confidenceScore: 75,
        sourceTransactionIds: [trf.id],
        targetTransactionIds: [matchedDeposit.id],
        totalSourceAmount: trf.amount,
        totalTargetAmount: matchedDeposit.amount,
        differenceAmount: Math.abs(trf.amount - matchedDeposit.amount),
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        createdBy: 'Auto Engine (Fuzzy Logic Rule)',
        notes: 'Fuzzy match candidate detected. Requires manual confirmation by Reconciliation Officer.',
      });
    }
  });

  return { newMatches, updatedTransactions };
}
