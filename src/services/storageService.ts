import {
  NormalizedTransaction,
  ExceptionRecord,
  DailyShopReport,
  ManualAdjustment,
  ReconciliationPeriod,
  AuditLogEntry,
  MatchRecord,
  Company,
  Region,
  Shop,
  DSA,
  BankAccount,
  MobileWallet,
  UserScope,
  UserRole,
} from '../types';

import {
  initialCompany,
  initialRegions,
  initialShops,
  initialDSAs,
  initialBankAccounts,
  initialMobileWallets,
  initialPeriod,
  initialTransactions,
  initialExceptions,
  initialDailyReports,
  initialAdjustments,
  initialMatches,
  initialAuditLogs,
  defaultUserScopes,
} from '../data/seedData';

const KEYS = {
  COMPANY: 'reconflow_company',
  REGIONS: 'reconflow_regions',
  SHOPS: 'reconflow_shops',
  DSAS: 'reconflow_dsas',
  BANKS: 'reconflow_banks',
  WALLETS: 'reconflow_wallets',
  PERIOD: 'reconflow_period',
  TRANSACTIONS: 'reconflow_transactions',
  EXCEPTIONS: 'reconflow_exceptions',
  DAILY_REPORTS: 'reconflow_reports',
  ADJUSTMENTS: 'reconflow_adjustments',
  MATCHES: 'reconflow_matches',
  AUDIT_LOGS: 'reconflow_audit_logs',
  ACTIVE_ROLE: 'reconflow_active_role',
};

export class StorageService {
  static initSeedData(forceReset: boolean = false): void {
    if (forceReset || !localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.COMPANY, JSON.stringify(initialCompany));
      localStorage.setItem(KEYS.REGIONS, JSON.stringify(initialRegions));
      localStorage.setItem(KEYS.SHOPS, JSON.stringify(initialShops));
      localStorage.setItem(KEYS.DSAS, JSON.stringify(initialDSAs));
      localStorage.setItem(KEYS.BANKS, JSON.stringify(initialBankAccounts));
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(initialMobileWallets));
      localStorage.setItem(KEYS.PERIOD, JSON.stringify(initialPeriod));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
      localStorage.setItem(KEYS.EXCEPTIONS, JSON.stringify(initialExceptions));
      localStorage.setItem(KEYS.DAILY_REPORTS, JSON.stringify(initialDailyReports));
      localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(initialAdjustments));
      localStorage.setItem(KEYS.MATCHES, JSON.stringify(initialMatches));
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
      localStorage.setItem(KEYS.ACTIVE_ROLE, 'FINANCE_MANAGER');
    }
  }

  static getCompany(): Company {
    const raw = localStorage.getItem(KEYS.COMPANY);
    return raw ? JSON.parse(raw) : initialCompany;
  }

  static getRegions(): Region[] {
    const raw = localStorage.getItem(KEYS.REGIONS);
    return raw ? JSON.parse(raw) : initialRegions;
  }

  static getShops(): Shop[] {
    const raw = localStorage.getItem(KEYS.SHOPS);
    return raw ? JSON.parse(raw) : initialShops;
  }

  static getDSAs(): DSA[] {
    const raw = localStorage.getItem(KEYS.DSAS);
    return raw ? JSON.parse(raw) : initialDSAs;
  }

  static getBankAccounts(): BankAccount[] {
    const raw = localStorage.getItem(KEYS.BANKS);
    return raw ? JSON.parse(raw) : initialBankAccounts;
  }

  static getMobileWallets(): MobileWallet[] {
    const raw = localStorage.getItem(KEYS.WALLETS);
    return raw ? JSON.parse(raw) : initialMobileWallets;
  }

  static getPeriod(): ReconciliationPeriod {
    const raw = localStorage.getItem(KEYS.PERIOD);
    return raw ? JSON.parse(raw) : initialPeriod;
  }

  static savePeriod(period: ReconciliationPeriod): void {
    localStorage.setItem(KEYS.PERIOD, JSON.stringify(period));
  }

  static getTransactions(legalEntityId?: string, tenantId?: string): NormalizedTransaction[] {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    const txs: NormalizedTransaction[] = raw ? JSON.parse(raw) : initialTransactions;
    return txs.filter((t) => {
      if (tenantId && t.tenant_id && t.tenant_id !== tenantId) return false;
      if (legalEntityId && t.legal_entity_id && t.legal_entity_id !== legalEntityId) return false;
      return true;
    });
  }

  static saveTransactions(txs: NormalizedTransaction[]): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  static getExceptions(legalEntityId?: string, tenantId?: string): ExceptionRecord[] {
    const raw = localStorage.getItem(KEYS.EXCEPTIONS);
    const excs: ExceptionRecord[] = raw ? JSON.parse(raw) : initialExceptions;
    return excs.filter((e) => {
      if (tenantId && e.tenant_id && e.tenant_id !== tenantId) return false;
      if (legalEntityId && e.legal_entity_id && e.legal_entity_id !== legalEntityId) return false;
      return true;
    });
  }

  static saveExceptions(excs: ExceptionRecord[]): void {
    localStorage.setItem(KEYS.EXCEPTIONS, JSON.stringify(excs));
  }

  static getDailyReports(): DailyShopReport[] {
    const raw = localStorage.getItem(KEYS.DAILY_REPORTS);
    return raw ? JSON.parse(raw) : initialDailyReports;
  }

  static saveDailyReports(reports: DailyShopReport[]): void {
    localStorage.setItem(KEYS.DAILY_REPORTS, JSON.stringify(reports));
  }

  static getAdjustments(): ManualAdjustment[] {
    const raw = localStorage.getItem(KEYS.ADJUSTMENTS);
    return raw ? JSON.parse(raw) : initialAdjustments;
  }

  static saveAdjustments(adjs: ManualAdjustment[]): void {
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(adjs));
  }

  static getMatches(): MatchRecord[] {
    const raw = localStorage.getItem(KEYS.MATCHES);
    return raw ? JSON.parse(raw) : initialMatches;
  }

  static saveMatches(matches: MatchRecord[]): void {
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  }

  static getAuditLogs(): AuditLogEntry[] {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : initialAuditLogs;
  }

  static addAuditLog(
    user: UserScope,
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ): void {
    const logs = StorageService.getAuditLogs();
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.userId,
      userName: user.userName,
      role: user.role,
      action,
      entityType,
      entityId,
      details,
      ipAddress: '197.156.64.12',
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  static getActiveRole(): UserRole {
    return (localStorage.getItem(KEYS.ACTIVE_ROLE) as UserRole) || 'FINANCE_MANAGER';
  }

  static setActiveRole(role: UserRole): void {
    localStorage.setItem(KEYS.ACTIVE_ROLE, role);
  }

  static getUserScope(role: UserRole): UserScope {
    return defaultUserScopes[role] || defaultUserScopes['FINANCE_MANAGER'];
  }
}
