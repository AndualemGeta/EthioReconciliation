export type UserRole =
  | 'SUPER_ADMIN'
  | 'GROUP_ADMIN'
  | 'COMPANY_ADMIN'
  | 'FINANCE_MANAGER'
  | 'RECONCILIATION_OFFICER'
  | 'REGIONAL_MANAGER'
  | 'SHOP_MANAGER'
  | 'DSA'
  | 'AUDITOR';

export interface OrgTerminology {
  branchLabel: string; // e.g. "Shop", "Store", "Outlet", "Branch"
  agentLabel: string; // e.g. "DSA", "Sales Agent", "Cashier", "Merchant Agent"
  floatSourceLabel: string; // e.g. "UM / DD", "Wallet Type", "Settlement Account"
  mobileMoneyLabel: string; // e.g. "M-PESA/mobile-money", "Wallet Provider"
  currencyLabel: string; // e.g. "ETB", "KES", "USD"
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  createdAtUtc: string;
}

export interface GroupOrg {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
}

export interface LegalEntity {
  id: string;
  groupId: string;
  tenantId: string;
  name: string;
  code: string;
  countryCode: string; // ISO 2 char e.g., 'ET', 'KE', 'NG'
  baseCurrency: string; // e.g., 'ETB', 'KES', 'USD'
  fiscalYearStartMonth: number; // 1 to 12
  timeZone: string; // e.g., 'Africa/Addis_Ababa'
  taxId?: string;
  contactEmail: string;
  status: 'ACTIVE' | 'INACTIVE';
  terminology: OrgTerminology;
}

export interface CountryConfig {
  countryCode: string;
  countryName: string;
  defaultCurrency: string;
  defaultTimeZone: string;
  terminology: OrgTerminology;
}

export interface UserScope {
  userId: string;
  userName: string;
  role: UserRole;
  tenantId: string;
  groupId: string;
  companyId: string; // mapping to legalEntityId
  legalEntityId: string;
  countryCode: string;
  regionId?: string;
  shopId?: string;
  dsaId?: string;
  authorizedLegalEntityIds: string[];
}

export interface Company extends LegalEntity {}

export interface Region {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  name: string;
  code: string;
  managerName: string;
  phone: string;
  country_code: string;
  time_zone: string;
}

export interface Shop {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  regionId: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  country_code: string;
  time_zone: string;
}

export interface DSA {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  shopId: string;
  regionId: string;
  companyId: string;
  name: string;
  code: string;
  phone: string;
  assignedFloatLimit: number;
  country_code: string;
  time_zone: string;
}

export interface BankAccount {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  bankName: string; // e.g., CBE, Awash Bank, Bank of Abyssinia, Dashen Bank
  accountName: string;
  accountNumber: string; // Masked e.g. 1000****4589
  branch: string;
  currency: string;
  odooJournalId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MobileWallet {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  provider: string; // 'TELEBIRR' | 'M_PESA' | 'CBE_BIRR' | 'KACHA' | 'MTN_MOMO' | 'AIRTEL_MONEY'
  accountName: string;
  accountNumber: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type FloatSourceType = 'UM' | 'DD' | 'NONE';

export interface CommissionScheme {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  name: string;
  ratePercentage: number;
  flatFeePerTx?: number;
  channel: 'AIRTIME' | 'M_PESA' | 'TELEBIRR' | 'SHOP_SALES';
}

export interface RiskThresholds {
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  lowRiskMaxAmount: number;
  mediumRiskMaxAmount: number;
  highRiskMaxAmount: number;
  agingAlertDays: number;
  cutoffTime: string;
}

export type ImportType =
  | 'BANK_STATEMENT'
  | 'MOBILE_MONEY'
  | 'UM_FLOAT'
  | 'DD_FLOAT'
  | 'AIRTIME_EVD'
  | 'DAILY_SALES'
  | 'DEPOSIT_REPORT'
  | 'COMMISSION_REPORT'
  | 'BALANCE_REPORT'
  | 'MANUAL_ADJUSTMENT';

export interface ImportBatch {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  fileName: string;
  fileHash: string;
  importType: ImportType;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  totalAmount: number;
  status: 'COMPLETED' | 'FAILED' | 'WARNING';
  created_at_utc: string;
  updated_at_utc: string;
}

export interface NormalizedTransaction {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  country_code: string;
  base_currency: string;
  transaction_currency: string;
  exchange_rate: number;
  exchange_rate_date: string;
  time_zone: string;
  source_system: string;
  external_reference: string;
  odoo_reference?: string;
  created_at_utc: string;
  updated_at_utc: string;

  transactionDate: string; // YYYY-MM-DD
  postingDate: string;
  amount: number;
  currency: string;
  direction: 'IN' | 'OUT';
  transactionType: string; // TRANSFER, DEPOSIT, COMMISSION, SALES, FLOAT_TOPUP, ADJUSTMENT
  bankOrWallet?: string;
  floatSource: FloatSourceType;
  regionId?: string;
  regionName?: string;
  shopId?: string;
  shopName?: string;
  dsaId?: string;
  dsaName?: string;
  counterparty?: string;
  description: string;
  status: 'UNRECONCILED' | 'PROPOSED' | 'RECONCILED' | 'EXCEPTION';
  importBatchId: string;
  createdAt: string;
  createdBy: string;
}

export type MatchType = 'EXACT' | 'STRONG' | 'FUZZY' | 'AGGREGATED' | 'MANUAL';
export type MatchStatus = 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'REVERSED';

export interface MatchRecord {
  id: string;
  tenant_id?: string;
  group_id?: string;
  legal_entity_id?: string;
  matchType: MatchType;
  confidenceScore: number; // 0 to 100
  sourceTransactionIds: string[];
  targetTransactionIds: string[];
  totalSourceAmount: number;
  totalTargetAmount: number;
  differenceAmount: number;
  status: MatchStatus;
  createdAt: string;
  createdBy: string;
  confirmedAt?: string;
  confirmedBy?: string;
  notes?: string;
}

export type ExceptionType =
  | 'MISSING_DEPOSIT'
  | 'MISSING_REPORT'
  | 'UNMATCHED_TRANSFER'
  | 'UNMATCHED_DEPOSIT'
  | 'DUPLICATE_TRANSACTION'
  | 'SHORTAGE'
  | 'OVER_REPORTING'
  | 'INCORRECT_COMMISSION'
  | 'INVALID_BALANCE'
  | 'DELAYED_SETTLEMENT'
  | 'SUSPICIOUS_MOVEMENT'
  | 'PENDING_ADJUSTMENT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'ESCALATED' | 'REJECTED';

export interface ExceptionComment {
  id: string;
  exceptionId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  comment: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface ExceptionRecord {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  country_code: string;
  base_currency: string;
  transaction_currency: string;
  exchange_rate: number;
  exchange_rate_date: string;
  time_zone: string;
  source_system: string;
  external_reference: string;
  odoo_reference?: string;
  created_at_utc: string;
  updated_at_utc: string;

  companyId: string;
  regionId?: string;
  shopId?: string;
  dsaId?: string;
  exceptionType: ExceptionType;
  riskLevel: RiskLevel;
  title: string;
  summary: string;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  floatSource: FloatSourceType;
  relatedTransactionIds: string[];
  status: ExceptionStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  agingDays: number;
  rootCauseCategory?: string;
  resolutionAction?: string;
  comments: ExceptionComment[];
}

export interface DailyShopReport {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  country_code: string;
  base_currency: string;
  transaction_currency: string;
  exchange_rate: number;
  exchange_rate_date: string;
  time_zone: string;
  source_system: string;
  external_reference: string;
  odoo_reference?: string;
  created_at_utc: string;
  updated_at_utc: string;

  reportDate: string;
  regionId: string;
  shopId: string;
  dsaId?: string;
  umOpeningBalance: number;
  ddOpeningBalance: number;
  transfersReceived: number;
  airtimeEvdSold: number;
  cashCollected: number;
  depositsMade: number;
  commissionEarned: number;
  umEndingBalance: number;
  ddEndingBalance: number;
  depositReceiptUrl?: string;
  depositReceiptName?: string;
  notes?: string;
  submittedBy: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'FLAGGED';
  validationErrors?: string[];
}

export type AdjustmentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED_TO_ODOO';

export interface ManualAdjustment {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  country_code: string;
  base_currency: string;
  transaction_currency: string;
  exchange_rate: number;
  exchange_rate_date: string;
  time_zone: string;
  source_system: string;
  external_reference: string;
  odoo_reference?: string;
  created_at_utc: string;
  updated_at_utc: string;

  companyId: string;
  regionId: string;
  shopId: string;
  dsaId?: string;
  floatSource: FloatSourceType;
  amount: number;
  adjustmentType: 'CREDIT' | 'DEBIT';
  category: 'SHORTAGE_WRITE_OFF' | 'COMMISSION_CORRECTION' | 'BANK_FEE' | 'FLOAT_TRANSFER' | 'OTHER';
  reason: string;
  attachmentName?: string;
  createdBy: string;
  createdAt: string;
  status: AdjustmentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Odoo fields
  odooExportedAtUtc?: string;
  odooIdempotencyKey?: string;
}

export interface ReconciliationPeriod {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  companyId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'REOPENED';
  closedBy?: string;
  closedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  reopenReason?: string;
}

export interface AuditLogEntry {
  id: string;
  tenant_id?: string;
  group_id?: string;
  legal_entity_id?: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface ReconciliationSummary {
  mtdTransfer: number;
  mtdDeposit: number;
  commission: number;
  umEndingBalance: number;
  ddEndingBalance: number;
  totalEndingBalance: number;
  netGap: number;
  reconciledAmount: number;
  reconciliationRate: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  shortageCount: number;
  shortageAmount: number;
  overReportingCount: number;
  overReportingAmount: number;
  missingReportsCount: number;
  highRiskShopsCount: number;
}

// Odoo Integration Specific Types
export interface OdooConfig {
  id: string;
  tenantId: string;
  groupId: string;
  legalEntityId: string;
  connectionName: string;
  instanceUrl: string;
  databaseName: string;
  authMethod: 'API_KEY' | 'PASSWORD_XMLRPC' | 'OAUTH2';
  username: string;
  passwordOrApiKey: string; // masked in UI
  odooCompanyId: number;
  odooCompanyName: string;
  defaultBankJournalId: string;
  defaultCashJournalId: string;
  defaultShortageAccountId: string;
  defaultCommissionAccountId: string;
  defaultBankFeeAccountId: string;
  syncFrequency: 'REALTIME' | 'HOURLY' | 'DAILY' | 'MANUAL';
  isEnabled: boolean;
  lastSyncedAtUtc?: string;
}

export interface OdooAccountMapping {
  id: string;
  legalEntityId: string;
  reconCategory: string; // e.g. 'SHORTAGE_WRITE_OFF', 'COMMISSION_CORRECTION', 'BANK_FEE'
  odooAccountId: string;
  odooAccountCode: string;
  odooAccountName: string;
  odooJournalId: string;
  analyticAccountId?: string;
  taxId?: string;
}

export type OdooExportStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRIED';

export interface OdooExportRecord {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  adjustmentId?: string;
  transactionId?: string;
  idempotencyKey: string;
  odoo_reference?: string;
  journalEntryId?: string;
  amount: number;
  currency: string;
  reconCategory: string;
  status: OdooExportStatus;
  errorMessage?: string;
  requestPayload?: string;
  responsePayload?: string;
  approvedBy: string;
  approvedAtUtc: string;
  exportedAtUtc?: string;
  retryCount: number;
}

export interface OdooSyncLog {
  id: string;
  tenant_id: string;
  group_id: string;
  legal_entity_id: string;
  entityType:
    | 'COMPANIES'
    | 'BRANCHES'
    | 'CHART_OF_ACCOUNTS'
    | 'PARTNERS'
    | 'BANK_ACCOUNTS'
    | 'JOURNALS'
    | 'INVOICES'
    | 'PAYMENTS'
    | 'EXCHANGE_RATES'
    | 'POS_SALES';
  direction: 'INBOUND' | 'OUTBOUND';
  recordsProcessed: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
  timestampUtc: string;
}

// Authentication & User Management Types
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_ACTIVATION';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  groupId: string;
  companyId: string;
  legalEntityId: string;
  countryCode: string;
  regionId?: string;
  shopId?: string;
  dsaId?: string;
  authorizedLegalEntityIds: string[];
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: string; // ISO UTC string
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  tenantId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isRevoked: boolean;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  groupId: string;
  legalEntityId: string;
  regionId?: string;
  shopId?: string;
  tokenHash: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedBy: string;
  createdAt: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  userId?: string;
  tenantId?: string;
  timestamp: string; // ISO UTC string
  success: boolean;
  reason?: string;
  ipAddress: string;
  userAgent: string;
}

export interface MfaConfiguration {
  userId: string;
  isEnabled: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
}


