import React, { useState } from 'react';
import {
  Company,
  Region,
  Shop,
  DSA,
  BankAccount,
  MobileWallet,
  RiskThresholds,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Building2,
  MapPin,
  Store,
  Users,
  Landmark,
  Wallet,
  Shield,
  Plus,
  Lock,
} from 'lucide-react';

interface MasterDataViewProps {
  company: Company;
  regions: Region[];
  shops: Shop[];
  dsas: DSA[];
  bankAccounts: BankAccount[];
  mobileWallets: MobileWallet[];
  riskThresholds: RiskThresholds;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  company,
  regions,
  shops,
  dsas,
  bankAccounts,
  mobileWallets,
  riskThresholds,
}) => {
  const [activeTab, setActiveTab] = useState<
    'company' | 'shops' | 'banks' | 'wallets' | 'risk'
  >('company');

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Master Data & Hierarchy Setup</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Tenants, Regions, Shops, DSAs, Bank Accounts, Wallets, and Risk Thresholds.
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'company', label: 'Tenant & Hierarchy', icon: <MapPin className="w-3.5 h-3.5" /> },
            { id: 'shops', label: 'Shops & DSAs', icon: <Store className="w-3.5 h-3.5" /> },
            { id: 'banks', label: 'Bank Accounts', icon: <Landmark className="w-3.5 h-3.5" /> },
            { id: 'wallets', label: 'Mobile Wallets', icon: <Wallet className="w-3.5 h-3.5" /> },
            { id: 'risk', label: 'Risk Thresholds', icon: <Shield className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TENANT & HIERARCHY TAB */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
              Company Tenant Information
            </h2>

            <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Company Name</span>
                <span className="text-slate-900 font-bold text-sm">{company.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Company Code</span>
                <span className="text-slate-900 font-bold text-sm">{company.code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Currency</span>
                <span className="text-emerald-700 font-bold text-sm">{company.currency} (Ethiopian Birr)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-bold text-slate-900">Configured Regions ({regions.length})</h2>
              <button className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold">
                + Add Region
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              {regions.map((r) => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-sm">{r.name} ({r.code})</span>
                  <p className="text-slate-600">Regional Manager: {r.managerName}</p>
                  <p className="text-slate-500 text-[11px]">Phone: {r.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHOPS & DSAs TAB */}
      {activeTab === 'shops' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Shops & DSAs Hierarchy ({shops.length} Shops, {dsas.length} DSAs)
            </h2>
            <button className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold">
              + Register New Shop
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {shops.map((shop) => {
              const shopDsas = dsas.filter((d) => d.shopId === shop.id);
              return (
                <div key={shop.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{shop.name}</span>
                    <StatusBadge status={shop.status} />
                  </div>
                  <p className="text-slate-600">Manager: {shop.managerName} ({shop.phone})</p>
                  <p className="text-slate-500 text-[11px]">{shop.location}</p>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700 text-[11px] uppercase block mb-1">
                      Assigned DSAs ({shopDsas.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {shopDsas.map((d) => (
                        <span key={d.id} className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
                          {d.name} (Limit ETB {d.assignedFloatLimit.toLocaleString()})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BANK ACCOUNTS TAB */}
      {activeTab === 'banks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Bank Accounts & Masking ({bankAccounts.length})
            </h2>
            <button className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold">
              + Connect Bank Account
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold text-slate-900 text-sm">{b.bankName}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-slate-800 font-bold">{b.accountName}</p>
                <p className="text-emerald-700 font-bold">Account: {b.accountNumber}</p>
                <p className="text-slate-500 font-sans text-[11px]">Branch: {b.branch}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE WALLETS TAB */}
      {activeTab === 'wallets' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Mobile-Money & Wallet Providers ({mobileWallets.length})
            </h2>
            <button className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold">
              + Register Wallet Account
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs font-mono">
            {mobileWallets.map((w) => (
              <div key={w.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-sm font-sans block">{w.provider}</span>
                <p className="text-slate-800 font-bold font-sans">{w.accountName}</p>
                <p className="text-purple-700 font-bold">{w.accountNumber}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RISK THRESHOLDS TAB */}
      {activeTab === 'risk' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            Company Risk & Aging Alert Thresholds
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 font-sans">Low Risk Limit:</span>
              <p className="text-sm font-bold text-slate-800">
                Up to ETB {riskThresholds.lowRiskMaxAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-amber-900 font-sans">Medium Risk Limit:</span>
              <p className="text-sm font-bold text-amber-900">
                Up to ETB {riskThresholds.mediumRiskMaxAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-rose-900 font-sans">High Risk Limit:</span>
              <p className="text-sm font-bold text-rose-900">
                Above ETB {riskThresholds.highRiskMaxAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 font-sans">Daily Report Cutoff Time:</span>
              <p className="text-sm font-bold text-slate-800">{riskThresholds.cutoffTime} ETB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
