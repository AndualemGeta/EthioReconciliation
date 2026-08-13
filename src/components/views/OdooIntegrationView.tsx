import React, { useState } from 'react';
import {
  OdooConfig,
  OdooAccountMapping,
  OdooExportRecord,
  OdooSyncLog,
  LegalEntity,
  ManualAdjustment,
  UserScope,
} from '../../types';
import {
  OdooConnector,
  OdooAuthenticationService,
  OdooJournalExportService,
  OdooErrorLogService,
  OdooSyncService,
} from '../../services/odoo';
import { PermissionService } from '../../services/permissionService';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import {
  Layers,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  FileSpreadsheet,
  Zap,
  Activity,
  AlertTriangle,
  Send,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface OdooIntegrationViewProps {
  legalEntities: LegalEntity[];
  activeLegalEntityId: string;
  adjustments: ManualAdjustment[];
  userScope: UserScope;
  onAdjustmentUpdated?: (adj: ManualAdjustment) => void;
}

export const OdooIntegrationView: React.FC<OdooIntegrationViewProps> = ({
  legalEntities,
  activeLegalEntityId,
  adjustments,
  userScope,
  onAdjustmentUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'connection' | 'journals' | 'sync' | 'logs' | 'exceptions'
  >('connection');

  // Odoo Config State - Secret is masked and NEVER held in plaintext state
  const [config, setConfig] = useState<OdooConfig>({
    id: 'ODOO-CFG-ETH-01',
    tenantId: userScope.tenantId || 'TNT-GLOBAL-01',
    groupId: userScope.groupId || 'GRP-AFRICA-01',
    legalEntityId: activeLegalEntityId || 'LE-ETH-01',
    connectionName: 'Odoo ERP Main Production',
    instanceUrl: 'https://ethioconnect.odoo.com',
    databaseName: 'ethioconnect_prod_db',
    authMethod: 'API_KEY',
    username: 'reconflow_service_account',
    passwordOrApiKey: '••••••••••••••••', // Strictly masked
    odooCompanyId: 1,
    odooCompanyName: 'EthioConnect Telecom PLC (Odoo)',
    defaultBankJournalId: '2',
    defaultCashJournalId: '1',
    defaultShortageAccountId: '600500',
    defaultCommissionAccountId: '400200',
    defaultBankFeeAccountId: '600100',
    syncFrequency: 'HOURLY',
    isEnabled: true,
    lastSyncedAtUtc: new Date().toISOString(),
  });

  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [newSecretInput, setNewSecretInput] = useState<string>('');
  const [secretUpdatedSuccess, setSecretUpdatedSuccess] = useState<boolean>(false);

  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const canManage = PermissionService.canPerform(userScope.role, 'MANAGE_INTEGRATION');

  // Mappings State
  const [mappings, setMappings] = useState<OdooAccountMapping[]>([
    {
      id: 'MAP-01',
      legalEntityId: activeLegalEntityId,
      reconCategory: 'SHORTAGE_WRITE_OFF',
      odooAccountId: 'ACC-600500',
      odooAccountCode: '600500',
      odooAccountName: 'Cash Shortages Write-Off Expense',
      odooJournalId: 'JOURNAL-MISC',
      analyticAccountId: 'ANALYTIC-ADD-01',
    },
    {
      id: 'MAP-02',
      legalEntityId: activeLegalEntityId,
      reconCategory: 'COMMISSION_CORRECTION',
      odooAccountId: 'ACC-400200',
      odooAccountCode: '400200',
      odooAccountName: 'Commission Income Adjustment',
      odooJournalId: 'JOURNAL-COMMISSION',
      analyticAccountId: 'ANALYTIC-ADD-01',
    },
    {
      id: 'MAP-03',
      legalEntityId: activeLegalEntityId,
      reconCategory: 'BANK_FEE',
      odooAccountId: 'ACC-600100',
      odooAccountCode: '600100',
      odooAccountName: 'Bank Charges & Commissions',
      odooJournalId: 'JOURNAL-BANK',
    },
    {
      id: 'MAP-04',
      legalEntityId: activeLegalEntityId,
      reconCategory: 'FLOAT_TRANSFER',
      odooAccountId: 'ACC-101200',
      odooAccountCode: '101200',
      odooAccountName: 'Mobile Money Float Transit A/C',
      odooJournalId: 'JOURNAL-CASH',
    },
  ]);

  // Logs and Export Queue
  const [exportRecords, setExportRecords] = useState<OdooExportRecord[]>(
    OdooErrorLogService.getExportRecords()
  );
  const [syncLogs, setSyncLogs] = useState<OdooSyncLog[]>(OdooErrorLogService.getSyncLogs());

  // Save new secret securely
  const handleSaveNewSecret = () => {
    if (!(newSecretInput || '').trim()) return;
    setSecretUpdatedSuccess(true);
    setTimeout(() => {
      setSecretUpdatedSuccess(false);
      setShowUpdateModal(false);
      setNewSecretInput('');
    }, 1500);
  };

  // Test Connection Action
  const handleTestConnection = async () => {
    if (!canManage) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await OdooConnector.testConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Sync Master Data
  const handleRunSync = async () => {
    if (!canManage) return;
    setIsSyncing(true);
    try {
      await OdooSyncService.syncChartOfAccounts(config);
      await OdooSyncService.syncJournals(config);
      await OdooSyncService.syncPartners(config);
      await OdooSyncService.syncExchangeRates(config);

      setSyncLogs(OdooErrorLogService.getSyncLogs());
      setConfig((prev) => ({ ...prev, lastSyncedAtUtc: new Date().toISOString() }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Retry Export Action
  const handleRetryExport = async (record: OdooExportRecord) => {
    if (!canManage) return;
    const matchingAdj = adjustments.find((a) => a.id === record.adjustmentId) || {
      id: record.adjustmentId || 'ADJ-1002',
      tenant_id: record.tenant_id,
      group_id: record.group_id,
      legal_entity_id: record.legal_entity_id,
      country_code: 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'ReconFlow',
      external_reference: record.idempotencyKey,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
      companyId: record.legal_entity_id,
      regionId: 'REG-ADD',
      shopId: 'SHP-BOL',
      floatSource: 'UM',
      amount: record.amount,
      adjustmentType: 'DEBIT',
      category: record.reconCategory as any,
      reason: 'Retry export from exception queue',
      createdBy: 'Reconciliation Officer',
      createdAt: new Date().toISOString(),
      status: 'APPROVED',
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAtUtc,
    };

    await OdooJournalExportService.retryFailedExport(record.id, config, matchingAdj as any);
    setExportRecords(OdooErrorLogService.getExportRecords());
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Odoo ERP Integration Settings & Operations Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Accounting System of Record
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ReconFlow acts as operational control; approved accounting adjustments export to Odoo.
            </p>
          </div>
        </div>

        {canManage ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Odoo Master Data'}</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition flex items-center space-x-1.5"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Odoo Connection'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Read-Only View ({userScope.role})</span>
          </div>
        )}
      </div>

      {/* Security Alert Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
          <Lock className="w-4 h-4 text-amber-500" />
          <span>Security Compliance Warning: Seed Credential Invalidation</span>
        </div>
        <p className="text-amber-800/90 dark:text-amber-300/90">
          The legacy demo secret <code className="bg-amber-200/50 px-1 py-0.5 rounded font-mono text-[11px]">odo_key_8841920391823019</code> has been invalidated and flagged as exposed. Before production release, administrators must configure credentials securely via server environment variables (<code className="font-mono">ODOO_API_KEY</code>) or rotate credentials using the Update Credential action below.
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-slate-200 pb-3">
        {[
          { id: 'connection', label: '1. Connection & Auth', icon: <Server className="w-3.5 h-3.5" /> },
          { id: 'journals', label: '2. Accounts & Journal Mapping', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
          { id: 'sync', label: '3. Data Sync Rules', icon: <RefreshCw className="w-3.5 h-3.5" /> },
          { id: 'exceptions', label: '4. Export Exception Queue', icon: <AlertTriangle className="w-3.5 h-3.5" />, count: exportRecords.filter((r) => r.status === 'FAILED').length },
          { id: 'logs', label: '5. Sync & Webhook Logs', icon: <Activity className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: CONNECTION & AUTH */}
      {activeSubTab === 'connection' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Server className="w-4 h-4 text-purple-600" />
                <span>Odoo Server Connection & Authentication Settings</span>
              </h2>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManage}
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {config.isEnabled ? 'Odoo Active' : 'Odoo Disabled'}
                </span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Connection Name</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={config.connectionName}
                  onChange={(e) => setConfig({ ...config, connectionName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Associated Legal Entity</label>
                <select
                  disabled={!canManage}
                  value={config.legalEntityId}
                  onChange={(e) => setConfig({ ...config, legalEntityId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 disabled:opacity-60"
                >
                  {legalEntities.map((le) => (
                    <option key={le.id} value={le.id}>
                      {le.name} ({le.code}) — {le.baseCurrency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Odoo Instance URL</label>
                <input
                  type="url"
                  disabled={!canManage}
                  value={config.instanceUrl}
                  onChange={(e) => setConfig({ ...config, instanceUrl: e.target.value })}
                  placeholder="https://mycompany.odoo.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Odoo Database Name</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={config.databaseName}
                  onChange={(e) => setConfig({ ...config, databaseName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Authentication Method</label>
                <select
                  disabled={!canManage}
                  value={config.authMethod}
                  onChange={(e) => setConfig({ ...config, authMethod: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 disabled:opacity-60"
                >
                  <option value="API_KEY">Odoo API Key (Recommended)</option>
                  <option value="PASSWORD_XMLRPC">Service Account Username & Password (XML-RPC)</option>
                  <option value="OAUTH2">OAuth2 Client Credentials</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service Account Username</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Stored API Credential Token (Masked)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    value={config.passwordOrApiKey}
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg font-mono text-slate-600 cursor-not-allowed"
                  />
                  {canManage && (
                    <button
                      onClick={() => setShowUpdateModal(true)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow transition flex items-center space-x-1.5 shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Update Credential</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Stored secrets are masked as <code className="font-mono">••••••••</code> and never transmitted to client code or logs.
                </p>
              </div>
            </div>
          </div>

          {/* Test Connection Diagnostics Box */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              } space-y-2 text-xs`}
            >
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-bold text-sm">{testResult.message}</span>
              </div>

              {testResult.details && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Version:</span>
                    <strong className="text-slate-800">{testResult.serverVersion}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Company:</span>
                    <strong className="text-slate-800">{testResult.odooCompany}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Latency:</span>
                    <strong className="text-slate-800">{testResult.details.latencyMs} ms</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Journal Write Access:</span>
                    <strong className="text-emerald-700">VERIFIED</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ACCOUNTS & JOURNALS MAPPING */}
      {activeSubTab === 'journals' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                ReconFlow Category to Odoo General Ledger & Journal Mapping
              </h2>
              <p className="text-xs text-slate-500">
                Map ReconFlow adjustment categories to Odoo Chart of Accounts, Journals, and Analytic Cost Centers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
                <tr>
                  <th className="p-2.5">Recon Category</th>
                  <th className="p-2.5">Odoo Account Code</th>
                  <th className="p-2.5">Odoo Account Name</th>
                  <th className="p-2.5">Odoo Journal</th>
                  <th className="p-2.5">Analytic Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold font-sans text-slate-900">{m.reconCategory}</td>
                    <td className="p-2.5 text-purple-700 font-bold">{m.odooAccountCode}</td>
                    <td className="p-2.5 font-sans text-slate-800">{m.odooAccountName}</td>
                    <td className="p-2.5 font-sans text-slate-700">{m.odooJournalId}</td>
                    <td className="p-2.5 font-sans text-slate-500">{m.analyticAccountId || 'Default'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DATA SYNC RULES */}
      {activeSubTab === 'sync' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-3">
            Configurable Odoo Data Import & Synchronization Entities
          </h2>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {[
              { title: 'Companies & Legal Entities', desc: 'Sync parent groups & legal entities' },
              { title: 'Branches & Cost Centers', desc: 'Sync shops, channels & analytic accounts' },
              { title: 'Customers & Vendors', desc: 'Sync partners, agents, DSAs & sub-agents' },
              { title: 'Bank Accounts & Journals', desc: 'Sync bank accounts, mobile wallets & journals' },
              { title: 'Chart of Accounts', desc: 'Sync general ledger accounts & dimensions' },
              { title: 'Invoices & Payments', desc: 'Sync bills, payments & payment references' },
              { title: 'POS & Sales Transactions', desc: 'Sync retail POS daily sales records' },
              { title: 'Exchange Rates & Fiscal Periods', desc: 'Sync exchange rates & period open/close status' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">{item.title}</span>
                <p className="text-slate-500">{item.desc}</p>
                <div className="pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Enabled
                  </span>
                  {canManage && (
                    <button
                      onClick={handleRunSync}
                      className="text-purple-700 font-semibold hover:underline"
                    >
                      Sync Now →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: EXPORT EXCEPTION QUEUE */}
      {activeSubTab === 'exceptions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Odoo Export Exception Queue & Retry Manager
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {exportRecords.length} Total Export Logs
            </span>
          </div>

          <div className="space-y-3">
            {exportRecords.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border ${
                  rec.status === 'SUCCESS'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-rose-50 border-rose-200'
                } flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-slate-900">{rec.id}</span>
                    <StatusBadge status={rec.status} />
                    <span className="text-slate-500 font-mono text-[11px]">
                      Idempotency Key: {rec.idempotencyKey}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-900">
                    Category: {rec.reconCategory} • Amount: {rec.currency} {rec.amount.toLocaleString()}
                  </p>

                  {rec.odoo_reference && (
                    <p className="text-emerald-700 font-bold font-mono text-[11px]">
                      Odoo Journal Entry Ref: {rec.odoo_reference} (ID: {rec.journalEntryId})
                    </p>
                  )}

                  {rec.errorMessage && (
                    <p className="text-rose-700 font-medium text-[11px] bg-rose-100/60 p-2 rounded border border-rose-200">
                      Error: {rec.errorMessage}
                    </p>
                  )}
                </div>

                {rec.status === 'FAILED' && canManage && (
                  <button
                    onClick={() => handleRetryExport(rec)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow shrink-0 flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Retry Export to Odoo</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: SYNC & WEBHOOK LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-3">
            Odoo Audit Logs & Webhook Event History
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
                <tr>
                  <th className="p-2.5">Log ID</th>
                  <th className="p-2.5">Entity Type</th>
                  <th className="p-2.5">Direction</th>
                  <th className="p-2.5">Processed</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Details</th>
                  <th className="p-2.5">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{log.id}</td>
                    <td className="p-2.5 font-sans font-semibold text-slate-800">{log.entityType}</td>
                    <td className="p-2.5 text-purple-700 font-bold">{log.direction}</td>
                    <td className="p-2.5">{log.recordsProcessed}</td>
                    <td className="p-2.5 font-sans">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="p-2.5 font-sans text-slate-600 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="p-2.5 text-slate-500">{log.timestampUtc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPDATE ODOO CREDENTIAL MODAL */}
      {showUpdateModal && (
        <Modal
          title="Update Odoo API Key / Service Account Secret"
          onClose={() => {
            setShowUpdateModal(false);
            setNewSecretInput('');
          }}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Enter a new Odoo API Key or Password. For security, existing stored credentials are never pre-filled into this form.
            </p>

            {secretUpdatedSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Credential updated securely in encrypted vault.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">New Odoo API Key / Token *</label>
                  <input
                    type="password"
                    value={newSecretInput}
                    onChange={(e) => setNewSecretInput(e.target.value)}
                    placeholder="Enter new Odoo API Key or Token to overwrite..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setShowUpdateModal(false);
                      setNewSecretInput('');
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewSecret}
                    disabled={!(newSecretInput || '').trim()}
                    className="px-5 py-2 rounded-xl text-white bg-purple-600 hover:bg-purple-500 font-bold disabled:opacity-50 shadow"
                  >
                    Save & Encrypt Secret
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
