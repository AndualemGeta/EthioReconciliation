import React, { useState, useEffect } from 'react';
import {
  UserRole,
  UserScope,
  NormalizedTransaction,
  ExceptionRecord,
  DailyShopReport,
  ManualAdjustment,
  ReconciliationPeriod,
  AuditLogEntry,
  MatchRecord,
  ImportType,
  User,
  Session,
} from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { calculateReconciliationSummary } from './services/reconciliationEngine';
import { exportReconciliationToExcel } from './services/exportService';
import { ConfigProvider, useConfig } from './context/ConfigContext';

import { Header } from './components/common/Header';
import { Sidebar, ViewTab } from './components/common/Sidebar';

import { LoginView } from './components/auth/LoginView';
import { MustChangePasswordModal } from './components/auth/MustChangePasswordModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { MfaSetupModal } from './components/auth/MfaSetupModal';

import { DashboardView } from './components/views/DashboardView';
import { DocumentationView } from './components/views/DocumentationView';
import { ImportCenterView } from './components/views/ImportCenterView';
import { ReconciliationEngineView } from './components/views/ReconciliationEngineView';
import { ExceptionsView } from './components/views/ExceptionsView';
import { ShopReportingView } from './components/views/ShopReportingView';
import { MasterDataView } from './components/views/MasterDataView';
import { UserManagementView } from './components/views/UserManagementView';
import { AdjustmentsView } from './components/views/AdjustmentsView';
import { OdooIntegrationView } from './components/views/OdooIntegrationView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogsView } from './components/views/AuditLogsView';

function AppContent() {
  // Authentication & User States
  const [currentUser, setCurrentUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [showMfaModal, setShowMfaModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => currentUser?.role || 'FINANCE_MANAGER');
  const [filterShopId, setFilterShopId] = useState<string>('');

  const { allLegalEntities, activeLegalEntity } = useConfig();

  // Storage states
  const [company, setCompany] = useState(StorageService.getCompany());
  const [regions, setRegions] = useState(StorageService.getRegions());
  const [shops, setShops] = useState(StorageService.getShops());
  const [dsas, setDsas] = useState(StorageService.getDSAs());
  const [bankAccounts, setBankAccounts] = useState(StorageService.getBankAccounts());
  const [mobileWallets, setMobileWallets] = useState(StorageService.getMobileWallets());
  const [period, setPeriod] = useState(StorageService.getPeriod());

  const [transactions, setTransactions] = useState(StorageService.getTransactions());
  const [exceptions, setExceptions] = useState(StorageService.getExceptions());
  const [dailyReports, setDailyReports] = useState(StorageService.getDailyReports());
  const [adjustments, setAdjustments] = useState(StorageService.getAdjustments());
  const [matches, setMatches] = useState(StorageService.getMatches());
  const [auditLogs, setAuditLogs] = useState(StorageService.getAuditLogs());

  useEffect(() => {
    StorageService.initSeedData(false);
    AuthService.initAuthData();

    // Verify session
    const session = AuthService.getCurrentSession();
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      StorageService.setActiveRole(user.role);
      if (user.mustChangePassword) {
        setMustChangePassword(true);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User, session: Session, requirePasswordChange: boolean) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    StorageService.setActiveRole(user.role);
    setMustChangePassword(requirePasswordChange || user.mustChangePassword);

    StorageService.addAuditLog(
      StorageService.getUserScope(user.role),
      'USER_LOGIN',
      'Session',
      session.id,
      `User ${user.email} authenticated successfully.`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleLogout = () => {
    if (currentUser) {
      StorageService.addAuditLog(
        StorageService.getUserScope(currentRole),
        'USER_LOGOUT',
        'Session',
        currentUser.id,
        `User ${currentUser.email} logged out.`
      );
    }
    AuthService.logout();
    setCurrentUser(null);
    setMustChangePassword(false);
    setActiveTab('dashboard');
  };

  const handlePasswordChanged = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setMustChangePassword(false);
  };

  // If unauthenticated, show Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onForgotPasswordClick={() => setShowForgotPasswordModal(true)}
        />
        {showForgotPasswordModal && (
          <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
        )}
      </>
    );
  }

  const userScope: UserScope = {
    ...StorageService.getUserScope(currentRole),
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentRole,
    legalEntityId: currentUser.legalEntityId || 'LE-ETH-01',
    regionId: currentUser.regionId,
    shopId: currentUser.shopId,
    dsaId: currentUser.dsaId,
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    StorageService.setActiveRole(newRole);
  };

  const handleResetData = () => {
    if (confirm('Reset all demo data to initial Ethiopian telecom distributor seed state?')) {
      StorageService.initSeedData(true);
      AuthService.initAuthData();
      setCompany(StorageService.getCompany());
      setRegions(StorageService.getRegions());
      setShops(StorageService.getShops());
      setDsas(StorageService.getDSAs());
      setBankAccounts(StorageService.getBankAccounts());
      setMobileWallets(StorageService.getMobileWallets());
      setPeriod(StorageService.getPeriod());
      setTransactions(StorageService.getTransactions());
      setExceptions(StorageService.getExceptions());
      setDailyReports(StorageService.getDailyReports());
      setAdjustments(StorageService.getAdjustments());
      setMatches(StorageService.getMatches());
      setAuditLogs(StorageService.getAuditLogs());
    }
  };

  const summary = calculateReconciliationSummary(
    transactions,
    dailyReports,
    filterShopId
  );

  const handleExportExcel = () => {
    exportReconciliationToExcel(
      summary,
      transactions,
      exceptions,
      dailyReports,
      adjustments,
      auditLogs
    );
  };

  // Handlers
  const handleImportComplete = (
    newTxs: NormalizedTransaction[],
    importType: ImportType,
    fileName: string
  ) => {
    const updatedTxs = [...newTxs, ...transactions];
    setTransactions(updatedTxs);
    StorageService.saveTransactions(updatedTxs);

    StorageService.addAuditLog(
      userScope,
      'IMPORT_COMPLETED',
      'ImportBatch',
      fileName,
      `Imported ${newTxs.length} normalized records from ${importType} file ${fileName}.`
    );
    setAuditLogs(StorageService.getAuditLogs());

    setActiveTab('engine');
  };

  const handleMatchesUpdated = (
    newMatches: MatchRecord[],
    updatedTxs: NormalizedTransaction[]
  ) => {
    setMatches(newMatches);
    StorageService.saveMatches(newMatches);

    setTransactions(updatedTxs);
    StorageService.saveTransactions(updatedTxs);

    StorageService.addAuditLog(
      userScope,
      'RECONCILIATION_MATCH_EXECUTED',
      'MatchRecord',
      newMatches[0]?.id || 'BATCH',
      'Executed rule matching engine. Proposed and confirmed new match records.'
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleConfirmMatch = (matchId: string) => {
    const updatedMatches = matches.map((m) =>
      m.id === matchId ? { ...m, status: 'CONFIRMED' as const } : m
    );
    setMatches(updatedMatches);
    StorageService.saveMatches(updatedMatches);

    const matchObj = matches.find((m) => m.id === matchId);
    if (matchObj) {
      const updatedTxs = transactions.map((t) => {
        if (
          matchObj.sourceTransactionIds.includes(t.id) ||
          matchObj.targetTransactionIds.includes(t.id)
        ) {
          return { ...t, status: 'RECONCILED' as const };
        }
        return t;
      });
      setTransactions(updatedTxs);
      StorageService.saveTransactions(updatedTxs);
    }
  };

  const handleRejectMatch = (matchId: string) => {
    const updatedMatches = matches.map((m) =>
      m.id === matchId ? { ...m, status: 'REJECTED' as const } : m
    );
    setMatches(updatedMatches);
    StorageService.saveMatches(updatedMatches);
  };

  const handleUpdateException = (updatedExc: ExceptionRecord) => {
    const updatedList = exceptions.map((e) => (e.id === updatedExc.id ? updatedExc : e));
    setExceptions(updatedList);
    StorageService.saveExceptions(updatedList);

    StorageService.addAuditLog(
      userScope,
      'EXCEPTION_UPDATED',
      'ExceptionRecord',
      updatedExc.id,
      `Updated exception status to ${updatedExc.status}. Title: ${updatedExc.title}`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleSubmitDailyReport = (newReport: DailyShopReport) => {
    const updated = [newReport, ...dailyReports];
    setDailyReports(updated);
    StorageService.saveDailyReports(updated);

    StorageService.addAuditLog(
      userScope,
      'DAILY_SHOP_REPORT_SUBMITTED',
      'DailyShopReport',
      newReport.id,
      `Shop Manager submitted daily report for shop ${newReport.shopId} on date ${newReport.reportDate}.`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleCreateAdjustment = (newAdj: ManualAdjustment) => {
    const updated = [newAdj, ...adjustments];
    setAdjustments(updated);
    StorageService.saveAdjustments(updated);

    StorageService.addAuditLog(
      userScope,
      'ADJUSTMENT_CREATED',
      'ManualAdjustment',
      newAdj.id,
      `Created manual adjustment of ETB ${newAdj.amount} for category ${newAdj.category}. Pending checker approval.`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleApproveAdjustment = (adjId: string) => {
    const updated = adjustments.map((a) =>
      a.id === adjId
        ? {
            ...a,
            status: 'APPROVED' as const,
            approvedBy: userScope.userName,
            approvedAt: new Date().toISOString(),
          }
        : a
    );
    setAdjustments(updated);
    StorageService.saveAdjustments(updated);

    StorageService.addAuditLog(
      userScope,
      'ADJUSTMENT_APPROVED',
      'ManualAdjustment',
      adjId,
      `Checker approved adjustment ${adjId}. Maker-Checker rule verified.`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleRejectAdjustment = (adjId: string) => {
    const updated = adjustments.map((a) =>
      a.id === adjId ? { ...a, status: 'REJECTED' as const } : a
    );
    setAdjustments(updated);
    StorageService.saveAdjustments(updated);
  };

  const handleLockPeriod = () => {
    const updatedPeriod: ReconciliationPeriod = {
      ...period,
      status: 'LOCKED',
      closedBy: userScope.userName,
      closedAt: new Date().toISOString(),
    };
    setPeriod(updatedPeriod);
    StorageService.savePeriod(updatedPeriod);

    StorageService.addAuditLog(
      userScope,
      'PERIOD_LOCKED',
      'ReconciliationPeriod',
      period.id,
      `Locked financial reconciliation period ${period.periodName}.`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleReopenPeriod = (reason: string) => {
    const updatedPeriod: ReconciliationPeriod = {
      ...period,
      status: 'REOPENED',
      reopenedBy: userScope.userName,
      reopenedAt: new Date().toISOString(),
      reopenReason: reason,
    };
    setPeriod(updatedPeriod);
    StorageService.savePeriod(updatedPeriod);

    StorageService.addAuditLog(
      userScope,
      'PERIOD_REOPENED',
      'ReconciliationPeriod',
      period.id,
      `Reopened financial period ${period.periodName} with audit justification: "${reason}".`
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const unmatchedCount = transactions.filter((t) => t.status === 'UNRECONCILED').length;
  const exceptionCount = exceptions.filter((e) => e.status !== 'RESOLVED').length;
  const pendingApprovalsCount = adjustments.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Header Navbar */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        userScope={userScope}
        period={period}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onExportExcel={handleExportExcel}
        onNavigateToDocs={() => setActiveTab('docs')}
        onLogout={handleLogout}
        onOpenMfa={() => setShowMfaModal(true)}
      />

      {/* Main App Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unmatchedCount={unmatchedCount}
          exceptionCount={exceptionCount}
          pendingApprovalsCount={pendingApprovalsCount}
          userRole={currentRole}
        />

        {/* Right Tab Content View Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              transactions={transactions}
              exceptions={exceptions}
              reports={dailyReports}
              regions={regions}
              shops={shops}
              userScope={userScope}
              onSelectShopFilter={setFilterShopId}
              onNavigateToEngine={() => setActiveTab('engine')}
              onNavigateToExceptions={() => setActiveTab('exceptions')}
              onNavigateToDailyReports={() => setActiveTab('daily_report')}
              onNavigateToApprovals={() => setActiveTab('adjustments')}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView userScope={userScope} />
          )}

          {activeTab === 'docs' && <DocumentationView />}

          {activeTab === 'import' && (
            <ImportCenterView
              userScope={userScope}
              existingTransactions={transactions}
              onImportComplete={handleImportComplete}
            />
          )}

          {activeTab === 'engine' && (
            <ReconciliationEngineView
              transactions={transactions}
              matches={matches}
              userScope={userScope}
              onMatchesUpdated={handleMatchesUpdated}
              onConfirmMatch={handleConfirmMatch}
              onRejectMatch={handleRejectMatch}
            />
          )}

          {activeTab === 'exceptions' && (
            <ExceptionsView
              exceptions={exceptions}
              userScope={userScope}
              onUpdateException={handleUpdateException}
            />
          )}

          {activeTab === 'daily_report' && (
            <ShopReportingView
              userScope={userScope}
              regions={regions}
              shops={shops}
              dsas={dsas}
              reports={dailyReports}
              onSubmitReport={handleSubmitDailyReport}
            />
          )}

          {activeTab === 'master_data' && (
            <MasterDataView
              company={company}
              regions={regions}
              shops={shops}
              dsas={dsas}
              bankAccounts={bankAccounts}
              mobileWallets={mobileWallets}
              riskThresholds={StorageService.getUserScope(currentRole) ? (StorageService as any).initialRiskThresholds || { companyId: 'LE-ETH-01', lowRiskMaxAmount: 2000, mediumRiskMaxAmount: 15000, highRiskMaxAmount: 50000, agingAlertDays: 2, cutoffTime: '18:30' } : { companyId: 'LE-ETH-01', lowRiskMaxAmount: 2000, mediumRiskMaxAmount: 15000, highRiskMaxAmount: 50000, agingAlertDays: 2, cutoffTime: '18:30' }}
            />
          )}

          {activeTab === 'adjustments' && (
            <AdjustmentsView
              adjustments={adjustments}
              shops={shops}
              userScope={userScope}
              onCreateAdjustment={handleCreateAdjustment}
              onApproveAdjustment={handleApproveAdjustment}
              onRejectAdjustment={handleRejectAdjustment}
            />
          )}

          {activeTab === 'odoo' && (
            <OdooIntegrationView
              legalEntities={allLegalEntities}
              activeLegalEntityId={activeLegalEntity.id}
              adjustments={adjustments}
              userScope={userScope}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              summary={summary}
              transactions={transactions}
              exceptions={exceptions}
              reports={dailyReports}
              shops={shops}
              userScope={userScope}
              onExportExcel={handleExportExcel}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsView
              period={period}
              auditLogs={auditLogs}
              userScope={userScope}
              onLockPeriod={handleLockPeriod}
              onReopenPeriod={handleReopenPeriod}
            />
          )}
        </main>
      </div>

      {/* Must Change Password Modal */}
      {mustChangePassword && currentUser && (
        <MustChangePasswordModal
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* MFA Setup Modal */}
      {showMfaModal && currentUser && (
        <MfaSetupModal
          user={currentUser}
          onClose={() => setShowMfaModal(false)}
          onMfaUpdated={(updated) => setCurrentUser(updated)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}
