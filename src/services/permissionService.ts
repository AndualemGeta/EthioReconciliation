import {
  UserRole,
  UserScope,
  ManualAdjustment,
  DailyShopReport,
  ReconciliationPeriod,
  MatchRecord,
  NormalizedTransaction,
  ExceptionRecord,
} from '../types';

export interface ScopeFilterable {
  tenant_id?: string;
  legal_entity_id?: string;
  companyId?: string;
  regionId?: string;
  shopId?: string;
  dsaId?: string;
  createdBy?: string;
  submittedBy?: string;
}

export class PermissionService {
  /**
   * Check if a role has general permission for a given action
   */
  static canPerform(role: UserRole, action: string): boolean {
    if (role === 'AUDITOR') {
      // Auditor is strictly read-only: no create, edit, approve, reject, lock, import, export, or integration
      const allowedAuditorActions = ['VIEW_AUDIT_LOGS', 'VIEW_REPORTS', 'VIEW_DATA'];
      return allowedAuditorActions.includes(action);
    }

    switch (action) {
      case 'IMPORT_DATA':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'RECONCILIATION_OFFICER'].includes(role);

      case 'CREATE_MATCH':
      case 'RUN_ENGINE':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'RECONCILIATION_OFFICER'].includes(role);

      case 'CONFIRM_MATCH':
      case 'REJECT_MATCH':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'RECONCILIATION_OFFICER'].includes(role);

      case 'CREATE_ADJUSTMENT':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'RECONCILIATION_OFFICER', 'SHOP_MANAGER'].includes(role);

      case 'APPROVE_ADJUSTMENT':
      case 'REJECT_ADJUSTMENT':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER'].includes(role);

      case 'SUBMIT_SHOP_REPORT':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'SHOP_MANAGER', 'DSA'].includes(role);

      case 'APPROVE_SHOP_REPORT':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'REGIONAL_MANAGER'].includes(role);

      case 'MANAGE_MASTER_DATA':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role);

      case 'MANAGE_INTEGRATION':
      case 'VIEW_SECRETS':
      case 'UPDATE_ODOO_CREDENTIALS':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role);

      case 'LOCK_PERIOD':
      case 'REOPEN_PERIOD':
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER'].includes(role);

      case 'EXPORT_DATA':
        // Auditor is explicitly blocked from exporting data
        return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER', 'RECONCILIATION_OFFICER', 'REGIONAL_MANAGER', 'SHOP_MANAGER', 'DSA'].includes(role);

      default:
        return true;
    }
  }

  /**
   * Maker-Checker Rule Enforcement: A user must never approve, reject, or finalize their own adjustment
   */
  static canUserApproveAdjustment(
    userScope: UserScope,
    adjustment: ManualAdjustment,
    period?: ReconciliationPeriod
  ): { allowed: boolean; reason?: string } {
    if (period && period.status === 'LOCKED') {
      return { allowed: false, reason: 'Financial period is locked. All financial mutations are rejected.' };
    }

    if (!this.canPerform(userScope.role, 'APPROVE_ADJUSTMENT')) {
      return { allowed: false, reason: 'Your role does not have authorization to approve adjustments.' };
    }

    if (
      adjustment.createdBy === userScope.userName ||
      adjustment.createdBy === userScope.userId
    ) {
      return {
        allowed: false,
        reason: 'Maker-Checker policy violation: You cannot approve or finalize an adjustment created by yourself.',
      };
    }

    return { allowed: true };
  }

  /**
   * Maker-Checker Rule Enforcement for Daily Shop Reports
   */
  static canUserApproveReport(
    userScope: UserScope,
    report: DailyShopReport,
    period?: ReconciliationPeriod
  ): { allowed: boolean; reason?: string } {
    if (period && period.status === 'LOCKED') {
      return { allowed: false, reason: 'Financial period is locked. All financial mutations are rejected.' };
    }

    if (!this.canPerform(userScope.role, 'APPROVE_SHOP_REPORT')) {
      return { allowed: false, reason: 'Your role does not have authorization to approve daily shop reports.' };
    }

    if (
      report.submittedBy === userScope.userName ||
      report.submittedBy === userScope.userId
    ) {
      return {
        allowed: false,
        reason: 'Maker-Checker policy violation: You cannot approve a report submitted by yourself.',
      };
    }

    return { allowed: true };
  }

  /**
   * Row-level access control: Filter items strictly based on user scope
   */
  static filterByScope<T extends ScopeFilterable>(items: T[], userScope: UserScope): T[] {
    return items.filter((item) => {
      // 1. Tenant Check
      if (item.tenant_id && userScope.tenantId && item.tenant_id !== userScope.tenantId) {
        return false;
      }

      // 2. Legal Entity / Company Check
      const itemLe = item.legal_entity_id || item.companyId;
      if (itemLe && userScope.legalEntityId) {
        if (
          itemLe !== userScope.legalEntityId &&
          !userScope.authorizedLegalEntityIds?.includes(itemLe)
        ) {
          return false;
        }
      }

      // 3. Role-based Scope Restrictions
      if (userScope.role === 'DSA') {
        // DSA is restricted strictly to assigned shop and own records
        if (userScope.dsaId && item.dsaId && item.dsaId !== userScope.dsaId) {
          return false;
        }
        if (userScope.shopId && item.shopId && item.shopId !== userScope.shopId) {
          return false;
        }
      } else if (userScope.role === 'SHOP_MANAGER') {
        // Shop Manager is restricted strictly to assigned shop
        if (userScope.shopId && item.shopId && item.shopId !== userScope.shopId) {
          return false;
        }
      } else if (userScope.role === 'REGIONAL_MANAGER') {
        // Regional Manager is restricted strictly to assigned region
        if (userScope.regionId && item.regionId && item.regionId !== userScope.regionId) {
          return false;
        }
      }

      return true;
    });
  }
}
