import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  GitCompare,
  AlertTriangle,
  FileCheck,
  Building,
  CheckSquare,
  BarChart3,
  ShieldAlert,
  BookOpen,
  Layers,
  Users,
} from 'lucide-react';
import { UserRole } from '../../types';

export type ViewTab =
  | 'dashboard'
  | 'docs'
  | 'import'
  | 'engine'
  | 'exceptions'
  | 'daily_report'
  | 'master_data'
  | 'users'
  | 'adjustments'
  | 'odoo'
  | 'reports'
  | 'audit';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  unmatchedCount: number;
  exceptionCount: number;
  pendingApprovalsCount: number;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unmatchedCount,
  exceptionCount,
  pendingApprovalsCount,
  userRole = 'FINANCE_MANAGER',
}) => {
  const menuItems: {
    id: ViewTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    allowedRoles?: string[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'users',
      label: 'User Administration',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    },
    {
      id: 'docs',
      label: 'PRD & System Specs',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'import',
      label: 'Data Import Center',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      id: 'engine',
      label: 'Reconciliation Engine',
      icon: <GitCompare className="w-4 h-4" />,
      badge: unmatchedCount,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
    {
      id: 'exceptions',
      label: 'Exception & Risk Center',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: exceptionCount,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'daily_report',
      label: 'Daily Shop Reporting',
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: 'master_data',
      label: 'Master Data Setup',
      icon: <Building className="w-4 h-4" />,
    },
    {
      id: 'adjustments',
      label: 'Maker-Checker Approvals',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-sky-400 text-slate-950 font-bold',
    },
    {
      id: 'odoo',
      label: 'Odoo ERP Integration',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'Audit & Period Control',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(userRole);
  });


  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-3 px-1">
            Reconciliation Modules
          </p>
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold border-l-4 border-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom System Banner */}
      <div className="p-4 m-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Float Isolation:</span>
          <span className="text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
            UM / DD Active
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Maker-Checker:</span>
          <span className="text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
            Enforced
          </span>
        </div>
        <p className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/80 font-mono">
          ReconFlow Ethiopia v1.0 • B2B
        </p>
      </div>
    </aside>
  );
};
