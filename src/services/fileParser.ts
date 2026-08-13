import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { NormalizedTransaction, ImportType } from '../types';

export interface ColumnMapping {
  externalReference: string;
  transactionDate: string;
  amount: string;
  transactionType: string;
  bankOrWallet: string;
  floatSource: string;
  region: string;
  shop: string;
  dsa: string;
  description: string;
}

export const defaultColumnMappings: Record<ImportType, ColumnMapping> = {
  BANK_STATEMENT: {
    externalReference: 'Reference Number',
    transactionDate: 'Value Date',
    amount: 'Credit Amount (ETB)',
    transactionType: 'Transaction Type',
    bankOrWallet: 'Bank Name',
    floatSource: 'Float Source',
    region: 'Region',
    shop: 'Shop Name',
    dsa: 'DSA Name',
    description: 'Narration / Description',
  },
  MOBILE_MONEY: {
    externalReference: 'Transaction ID',
    transactionDate: 'Date Time',
    amount: 'Amount ETB',
    transactionType: 'Type',
    bankOrWallet: 'Provider',
    floatSource: 'Float Tag',
    region: 'Region Code',
    shop: 'Shop Code',
    dsa: 'DSA Code',
    description: 'Remarks',
  },
  UM_FLOAT: {
    externalReference: 'UM Transfer Ref',
    transactionDate: 'Transfer Date',
    amount: 'UM Amount',
    transactionType: 'Type',
    bankOrWallet: 'Portal System',
    floatSource: 'Float Type',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Details',
  },
  DD_FLOAT: {
    externalReference: 'DD Transfer Ref',
    transactionDate: 'Transfer Date',
    amount: 'DD Amount',
    transactionType: 'Type',
    bankOrWallet: 'Wallet System',
    floatSource: 'Float Type',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Details',
  },
  AIRTIME_EVD: {
    externalReference: 'Batch ID',
    transactionDate: 'Sale Date',
    amount: 'Total Airtime Value',
    transactionType: 'Distribution Type',
    bankOrWallet: 'Channel',
    floatSource: 'Float Type',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA Agent',
    description: 'Batch Summary',
  },
  DAILY_SALES: {
    externalReference: 'Deposit Slip / Ref',
    transactionDate: 'Report Date',
    amount: 'Cash Collected',
    transactionType: 'Sales Type',
    bankOrWallet: 'Bank Deposited',
    floatSource: 'Float Source',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Notes',
  },
  DEPOSIT_REPORT: {
    externalReference: 'Bank Slip No',
    transactionDate: 'Deposit Date',
    amount: 'Amount Deposited',
    transactionType: 'Deposit Type',
    bankOrWallet: 'Bank Account',
    floatSource: 'Float Type',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Branch Notes',
  },
  COMMISSION_REPORT: {
    externalReference: 'Commission Voucher',
    transactionDate: 'Period Date',
    amount: 'Commission Amount',
    transactionType: 'Commission Category',
    bankOrWallet: 'Payable Bank',
    floatSource: 'Float Type',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Tier Basis',
  },
  BALANCE_REPORT: {
    externalReference: 'Balance Snapshot ID',
    transactionDate: 'As Of Date',
    amount: 'Ending Balance',
    transactionType: 'Balance Type',
    bankOrWallet: 'Account',
    floatSource: 'Float Source',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Balance Notes',
  },
  MANUAL_ADJUSTMENT: {
    externalReference: 'Memo Reference',
    transactionDate: 'Adjustment Date',
    amount: 'Adjustment Amount',
    transactionType: 'Category',
    bankOrWallet: 'Account',
    floatSource: 'Float Source',
    region: 'Region',
    shop: 'Shop',
    dsa: 'DSA',
    description: 'Reason',
  },
};

export async function parseUploadedFile(
  file: File
): Promise<{ headers: string[]; data: any[] }> {
  return new Promise((resolve, reject) => {
    const isCsv = file.name.endsWith('.csv');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({ headers, data: results.data });
        },
        error: (err) => reject(err),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length === 0) {
            resolve({ headers: [], data: [] });
            return;
          }

          const headers = (jsonData[0] || []).map((h) => String(h || '').trim());
          const rows = jsonData.slice(1).map((row) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              obj[h] = row[idx] !== undefined ? row[idx] : '';
            });
            return obj;
          });

          resolve({ headers, data: rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

export function normalizeImportedRows(
  rawData: any[],
  mapping: ColumnMapping,
  importType: ImportType,
  importBatchId: string,
  createdBy: string
): {
  validTransactions: NormalizedTransaction[];
  rejectedRows: { rowNumber: number; reason: string; rowData: any }[];
} {
  const validTransactions: NormalizedTransaction[] = [];
  const rejectedRows: { rowNumber: number; reason: string; rowData: any }[] = [];

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const rawRef = String(row[mapping.externalReference] || '').trim();
    const rawDate = String(row[mapping.transactionDate] || '').trim();
    const rawAmountStr = String(row[mapping.amount] || '').replace(/,/g, '').trim();
    const amount = parseFloat(rawAmountStr);

    if (!rawRef) {
      rejectedRows.push({ rowNumber: rowNum, reason: 'Missing external reference number', rowData: row });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      rejectedRows.push({ rowNumber: rowNum, reason: `Invalid transaction amount: ${rawAmountStr}`, rowData: row });
      return;
    }

    const floatSourceRaw = String(row[mapping.floatSource] || '').toUpperCase();
    const floatSource = floatSourceRaw.includes('UM')
      ? 'UM'
      : floatSourceRaw.includes('DD')
      ? 'DD'
      : importType.includes('UM')
      ? 'UM'
      : importType.includes('DD')
      ? 'DD'
      : 'NONE';

    const direction =
      importType === 'BANK_STATEMENT' || importType === 'DEPOSIT_REPORT' || importType === 'DAILY_SALES'
        ? 'IN'
        : 'OUT';

    const txType =
      importType === 'COMMISSION_REPORT'
        ? 'COMMISSION'
        : direction === 'IN'
        ? 'DEPOSIT'
        : 'TRANSFER';

    validTransactions.push({
      id: `TX-IMP-${Date.now()}-${rowNum}`,
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-ETH-01',
      country_code: 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: rawDate || new Date().toISOString().split('T')[0],
      time_zone: 'Africa/Addis_Ababa',
      source_system: String(row[mapping.bankOrWallet] || importType).trim() || importType,
      external_reference: rawRef,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
      transactionDate: rawDate || new Date().toISOString().split('T')[0],
      postingDate: rawDate || new Date().toISOString().split('T')[0],
      amount,
      currency: 'ETB',
      direction,
      transactionType: txType,
      bankOrWallet: String(row[mapping.bankOrWallet] || '').trim(),
      floatSource,
      regionName: String(row[mapping.region] || '').trim(),
      shopName: String(row[mapping.shop] || '').trim(),
      dsaName: String(row[mapping.dsa] || '').trim(),
      description: String(row[mapping.description] || `${importType} record`).trim(),
      status: 'UNRECONCILED',
      importBatchId,
      createdAt: new Date().toISOString(),
      createdBy,
    });
  });

  return { validTransactions, rejectedRows };
}
