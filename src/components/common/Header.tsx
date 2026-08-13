import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  RotateCcw,
  FileSpreadsheet,
  Lock,
  Unlock,
  HelpCircle,
  ShieldAlert,
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserRole, UserScope, ReconciliationPeriod, User } from '../../types';
import { Modal } from './Modal';
import { PermissionService } from '../../services/permissionService';

interface HeaderProps {
  currentUser?: User | null;
  currentRole: UserRole;
  userScope: UserScope;
  period: ReconciliationPeriod;
  onRoleChange: (role: UserRole) => void;
  onResetData: () => void;
  onExportExcel: () => void;
  onNavigateToDocs: () => void;
  onLogout: () => void;
  onOpenMfa?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  userScope,
  period,
  onRoleChange,
  onResetData,
  onExportExcel,
  onNavigateToDocs,
  onLogout,
  onOpenMfa,
}) => {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);


  const roles: { role: UserRole; name: string; title: string; scopeDesc: string }[] = [
    {
      role: 'SUPER_ADMIN',
      name: 'Alemayehu Tadesse',
      title: 'Global System Administrator',
      scopeDesc: 'Full System & Tenant Administration Access',
    },
    {
      role: 'COMPANY_ADMIN',
      name: 'Bethlehem Alemu',
      title: 'EthioConnect Company Administrator',
      scopeDesc: 'Legal Entity Master Data & Integrations Control',
    },
    {
      role: 'FINANCE_MANAGER',
      name: 'Hiwot Desta',
      title: 'Finance Manager (Approver / Checker)',
      scopeDesc: 'Reconciliation Approvals & Period Control',
    },
    {
      role: 'RECONCILIATION_OFFICER',
      name: 'Sara Worku',
      title: 'Lead Reconciliation Officer (Maker)',
      scopeDesc: 'Data Import, Auto/Manual Matching & Adjustment Submissions',
    },
    {
      role: 'REGIONAL_MANAGER',
      name: 'Tolessa Desta',
      title: 'Regional Manager - Oromia Region',
      scopeDesc: 'Scoped to Oromia Regional Outlets',
    },
    {
      role: 'SHOP_MANAGER',
      name: 'Eleni Tesfaye',
      title: 'Shop Manager - Bole Main Outlet',
      scopeDesc: 'Scoped strictly to Bole Shop (SHP-BOL)',
    },
    {
      role: 'DSA',
      name: 'Abebe Bikila',
      title: 'Direct Sales Agent (DSA) - Bole',
      scopeDesc: 'Scoped strictly to Agent DSA-101 and Bole Shop',
    },
    {
      role: 'AUDITOR',
      name: 'Dr. Solomon Haile',
      title: 'Independent Financial Auditor',
      scopeDesc: 'Read-Only Audit Trail & Compliance Inspection',
    },
  ];

  const canExport = PermissionService.canPerform(currentRole, 'EXPORT_DATA');

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold tracking-wider shadow-md">
                RF
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-white tracking-tight">ReconFlow</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-medium border border-emerald-500/30">
                    Ethiopia
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Telecom & Mobile-Money Financial Reconciliation System
                </p>
              </div>
            </div>

            {/* Period Status Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1">
              {period.status === 'LOCKED' ? (
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="text-xs font-medium text-slate-300">{period.periodName}:</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  period.status === 'LOCKED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {period.status}
              </span>
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-3">
              {/* Docs Link */}
              <button
                onClick={onNavigateToDocs}
                className="inline-flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition"
                title="View Architecture & PRD Specs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline font-medium">PRD & Specs</span>
              </button>

              {/* Excel Export Button */}
              {canExport ? (
                <button
                  onClick={onExportExcel}
                  className="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md font-medium shadow transition"
                  title="Export Scoped Reconciliation Data to Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
              ) : (
                <div
                  className="inline-flex items-center space-x-1.5 text-xs bg-slate-800 text-slate-500 px-3 py-1.5 rounded-md font-medium border border-slate-700 cursor-not-allowed"
                  title="Auditor role is restricted from exporting financial records"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Export Blocked (Auditor)</span>
                </div>
              )}

              {/* MFA Setup Button */}
              {onOpenMfa && (
                <button
                  onClick={onOpenMfa}
                  className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 transition"
                  title="Configure Two-Factor Authentication (MFA)"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${currentUser?.mfaEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="hidden xl:inline">MFA {currentUser?.mfaEnabled ? 'On' : 'Off'}</span>
                </button>
              )}

              {/* Demo Persona Switcher Trigger */}
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 transition"
                title="Switch Demo Persona / Role Sandbox"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{userScope.userName.split(' ')[0]}</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  {currentRole}
                </span>
              </button>

              {/* Reset Seed Data */}
              <button
                onClick={onResetData}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition"
                title="Reset Demo Seed Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-md text-xs font-bold transition shadow-sm"
                title="Log out of ReconFlow"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* User Scope Banner */}
          <div className="bg-slate-950/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">
                EthioConnect Telecom & Distribution PLC
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">{userScope.userName}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                Active Scope:{' '}
                {userScope.dsaId
                  ? 'Agent DSA-101 (Bole)'
                  : userScope.shopId
                  ? 'Bole Shop (SHP-BOL)'
                  : userScope.regionId
                  ? 'Oromia Region (REG-ORO)'
                  : 'Company-Wide (All Regions)'}
              </span>
              <span className="text-slate-500 hidden sm:inline">
                Currency: <strong className="text-slate-300 font-sans">ETB</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Sandbox Persona Switcher Modal */}
      {showAuthModal && (
        <Modal
          title="Demo Sandbox Authentication & Persona Switcher"
          onClose={() => setShowAuthModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-200 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Non-Production Demo Authentication</p>
                <p className="text-amber-300/80 mt-0.5">
                  Select a pre-configured organizational persona to test RBAC permissions, Maker-Checker rules, and row-level data scope filtering.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = currentRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => {
                      onRoleChange(r.role);
                      setShowAuthModal(false);
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{r.name}</span>
                        <span className="bg-slate-800 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                          {r.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs font-normal">{r.title}</p>
                      <p className="text-[11px] text-slate-500 font-mono pt-0.5">{r.scopeDesc}</p>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                    ) : (
                      <button className="text-[11px] text-emerald-400 font-semibold hover:underline shrink-0 ml-2">
                        Switch →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
