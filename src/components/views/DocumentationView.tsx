import React, { useState } from 'react';
import {
  FileText,
  Database,
  Layers,
  ListChecks,
  SlidersHorizontal,
  CheckCircle2,
  Workflow,
  Sparkles,
  Shield,
  Calculator,
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [activeDocTab, setActiveDocTab] = useState<
    'prd' | 'stories' | 'arch' | 'schema' | 'rules' | 'roadmap'
  >('prd');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              ReconFlow Ethiopia — System Architecture & PRD
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete Product Requirements Document, Database ERD Schema, User Stories, and Rules Specification.
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-800 pt-4">
          {[
            { id: 'prd', label: '1. PRD Overview', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'stories', label: '2. User Stories', icon: <ListChecks className="w-3.5 h-3.5" /> },
            { id: 'arch', label: '3. System Architecture', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'schema', label: '4. Database ERD Schema', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'rules', label: '5. Reconciliation Rules', icon: <Calculator className="w-3.5 h-3.5" /> },
            { id: 'roadmap', label: '6. MVP Roadmap', icon: <Workflow className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDocTab(tab.id as any)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDocTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Doc Content Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {activeDocTab === 'prd' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Product Requirements Document (PRD)</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-semibold text-sm text-slate-900">1. Problem Statement</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ethiopian distributors, retailers, and NGOs receive funds through diverse channels (CBE, Awash Bank, Abyssinia, Telebirr, M-PESA, cash). Manual reconciliation via spreadsheets leads to unrecorded shortages, delayed float turnarounds, untracked commission leakages, and undetected fraudulent duplicate entries.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-semibold text-sm text-slate-900">2. Pilot Customer Scope</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A telecom distributor managing airtime/EVD distribution, M-PESA & Telebirr mobile-money float across a 4-tier hierarchy: <strong>Company → Region → Shop → DSA</strong>. Supports strict isolation between <strong>UM Float</strong> and <strong>DD Float</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-900">3. Core Product Functional Goals</h3>
              <ul className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <li className="flex items-start space-x-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Automated Import & Mapping:</strong> Flexible column mapper for Excel/CSV statements with saved templates.</span>
                </li>
                <li className="flex items-start space-x-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Rules-Based Matching:</strong> Exact reference matching, 0–3 day date tolerance, and fuzzy matching.</span>
                </li>
                <li className="flex items-start space-x-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Net Gap Formula:</strong> Real-time tracking of <code>Net Gap = MTD Transfer - MTD Deposit - Commission - Ending Balance</code>.</span>
                </li>
                <li className="flex items-start space-x-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Maker-Checker Adjustments:</strong> Creators cannot approve their own financial adjustments.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeDocTab === 'stories' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <ListChecks className="w-5 h-5 text-emerald-600" />
              <span>User Stories & Acceptance Criteria</span>
            </h2>

            <div className="space-y-4">
              {[
                {
                  role: 'Reconciliation Officer',
                  story: 'As a Reconciliation Officer, I want to import daily bank & wallet CSV statements so that transactions are normalized automatically.',
                  criteria: [
                    'Supports Excel (.xlsx) and CSV uploads',
                    'Allows mapping column names to normalized fields',
                    'Detects duplicate file uploads by file hash and period',
                  ],
                },
                {
                  role: 'Shop Manager',
                  story: 'As a Shop Manager, I want to submit daily sales, deposits, and float balances from my phone so that finance can verify my shop collection.',
                  criteria: [
                    'Mobile-friendly input form with auto-sum checks',
                    'Attachment upload for bank deposit receipt slips',
                    'Flags submissions made after the 18:30 ETB cutoff time',
                  ],
                },
                {
                  role: 'Finance Manager',
                  story: 'As a Finance Manager, I want to review shortages and approve manual adjustments with maker-checker rules so that closed periods remain audit-compliant.',
                  criteria: [
                    'Creator of adjustment cannot approve it',
                    'Reopening closed periods requires a mandatory audit reason',
                    'Generates immutable audit logs for every state change',
                  ],
                },
              ].map((us, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {us.role}
                    </span>
                    <span className="text-xs text-slate-400">Story #{idx + 1}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-900">{us.story}</p>
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Acceptance Criteria:</p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 mt-1">
                      {us.criteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDocTab === 'arch' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>System Architecture & Multi-Tenant Scope</span>
            </h2>

            <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 text-xs font-mono space-y-4">
              <p className="text-emerald-400 font-bold">// ARCHITECTURE OVERVIEW</p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div>[Client UI: React 19 + Vite + Tailwind CSS]</div>
                <div className="pl-4 text-slate-400">├── Organization & Role Scope Context</div>
                <div className="pl-4 text-slate-400">├── File Upload & Column Mapper (SheetJS + PapaParse)</div>
                <div className="pl-4 text-slate-400">├── Reconciliation Rules Engine (Exact, Tolerance, Fuzzy)</div>
                <div className="pl-4 text-slate-400">└── Excel Report Generator (Multi-sheet XLSX Export)</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div>[Core Data Persistence Layer]</div>
                <div className="pl-4 text-slate-400">├── LocalStorage Sync Engine / Postgre SQL / Prisma Ready</div>
                <div className="pl-4 text-slate-400">├── Immutable Audit Log Generator</div>
                <div className="pl-4 text-slate-400">└── Period Lock & Maker-Checker State Engine</div>
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'schema' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Database ERD & Normalized Schema</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                <span className="font-bold text-slate-900 text-sm">Table: NormalizedTransaction</span>
                <p className="text-slate-600 text-[11px]">
                  • id: String (PK)<br />
                  • external_reference: String<br />
                  • transaction_date: Date<br />
                  • amount: Decimal (ETB)<br />
                  • direction: IN | OUT<br />
                  • transaction_type: TRANSFER | DEPOSIT | COMMISSION<br />
                  • float_source: UM | DD | NONE<br />
                  • region_id, shop_id, dsa_id (FKs)<br />
                  • status: UNRECONCILED | PROPOSED | RECONCILED | EXCEPTION
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                <span className="font-bold text-slate-900 text-sm">Table: ExceptionRecord</span>
                <p className="text-slate-600 text-[11px]">
                  • id: String (PK)<br />
                  • exception_type: SHORTAGE | DUPLICATE | UNMATCHED<br />
                  • risk_level: LOW | MEDIUM | HIGH | CRITICAL<br />
                  • expected_amount vs actual_amount<br />
                  • difference_amount: Decimal<br />
                  • status: OPEN | INVESTIGATING | RESOLVED<br />
                  • float_source: UM | DD
                </p>
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'rules' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Reconciliation Rules & Net Gap Formula</span>
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-emerald-900 text-sm">Core Ethiopian Reconciliation Formula:</h3>
              <div className="bg-white p-3 rounded-xl border border-emerald-300 font-mono text-xs text-emerald-950 font-bold text-center">
                Net Gap = MTD Transfer − MTD Deposit − Commission − Ending Balance
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Where <strong>MTD Transfer</strong> is total electronic float issued, <strong>MTD Deposit</strong> is cash deposited into bank accounts, <strong>Commission</strong> is approved earnings, and <strong>Ending Balance</strong> is closing UM & DD float.
              </p>
            </div>
          </div>
        )}

        {activeDocTab === 'roadmap' && (
          <div className="space-y-6 text-slate-800">
            <h2 className="text-lg font-bold border-b pb-2 text-slate-900 flex items-center space-x-2">
              <Workflow className="w-5 h-5 text-emerald-600" />
              <span>MVP Implementation Roadmap</span>
            </h2>

            <div className="space-y-3">
              {[
                { phase: 'Phase 1 (Complete)', title: 'Core Master Data, Scope Control & Import Engine', desc: 'Company, Region, Shop, DSA hierarchy, Bank & Wallet accounts, Excel/CSV importer with column mapping.' },
                { phase: 'Phase 2 (Complete)', title: 'Reconciliation Rules Engine & Net Gap Dashboard', desc: 'Exact matching, 0-3 day date tolerance matching, Net Gap calculation, executive KPIs & drill-downs.' },
                { phase: 'Phase 3 (Complete)', title: 'Daily Shop Reporting & Maker-Checker Adjustments', desc: 'Mobile-friendly shop report form, receipt attachments, maker-checker approval controls & period locks.' },
                { phase: 'Phase 4 (Current)', title: 'Odoo ERP Integration & Automated Journal Exports', desc: 'Modular Odoo connector, bi-directional sync for Chart of Accounts and Journals, Maker-Checker approved adjustment exports, idempotency keys, and exception queue.' },
              ].map((p, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-xs bg-slate-900 text-white px-2 py-1 rounded shrink-0">
                    {p.phase}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                    <p className="text-xs text-slate-600">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
