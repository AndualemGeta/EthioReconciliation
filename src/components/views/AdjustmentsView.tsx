import React, { useState } from 'react';
import { ManualAdjustment, Shop, UserScope } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

interface AdjustmentsViewProps {
  adjustments: ManualAdjustment[];
  shops: Shop[];
  userScope: UserScope;
  onCreateAdjustment: (adj: ManualAdjustment) => void;
  onApproveAdjustment: (adjId: string) => void;
  onRejectAdjustment: (adjId: string) => void;
}

export const AdjustmentsView: React.FC<AdjustmentsViewProps> = ({
  adjustments,
  shops,
  userScope,
  onCreateAdjustment,
  onApproveAdjustment,
  onRejectAdjustment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New adjustment form state
  const [shopId, setShopId] = useState<string>('SHP-BOL');
  const [floatSource, setFloatSource] = useState<'UM' | 'DD'>('UM');
  const [adjustmentType, setAdjustmentType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState<number>(1000);
  const [category, setCategory] = useState<ManualAdjustment['category']>('COMMISSION_CORRECTION');
  const [reason, setReason] = useState<string>('Retroactive commission adjustment.');
  const [attachmentName, setAttachmentName] = useState<string>('Approval_Memo.pdf');

  const pendingAdjustments = adjustments.filter((a) => a.status === 'PENDING_APPROVAL');
  const processedAdjustments = adjustments.filter((a) => a.status !== 'PENDING_APPROVAL');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newAdj: ManualAdjustment = {
      id: `ADJ-${Date.now()}`,
      tenant_id: userScope.tenantId || 'TNT-GLOBAL-01',
      group_id: userScope.groupId || 'GRP-AFRICA-01',
      legal_entity_id: userScope.legalEntityId || 'LE-ETH-01',
      country_code: userScope.countryCode || 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'ReconFlow UI',
      external_reference: `ADJ-${Date.now()}`,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
      companyId: userScope.companyId,
      regionId: shops.find((s) => s.id === shopId)?.regionId || 'REG-ADD',
      shopId,
      floatSource,
      amount,
      adjustmentType,
      category,
      reason,
      attachmentName: attachmentName || undefined,
      createdBy: userScope.userName,
      createdAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
    };

    onCreateAdjustment(newAdj);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>Maker-Checker Adjustment Approval Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maker-Checker Separation: Financial adjustments created by an officer cannot be self-approved.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Manual Adjustment</span>
        </button>
      </div>

      {/* PENDING APPROVAL QUEUE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Pending Adjustments Awaiting Checker Approval ({pendingAdjustments.length})
          </h2>
          <span className="text-xs bg-sky-100 text-sky-900 font-bold px-2.5 py-0.5 rounded-full">
            {pendingAdjustments.length} Pending
          </span>
        </div>

        {pendingAdjustments.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-6">
            No pending manual adjustments awaiting approval.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingAdjustments.map((adj) => {
              const isCreator = adj.createdBy === userScope.userName;

              return (
                <div
                  key={adj.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold font-mono text-slate-900">{adj.id}</span>
                      <StatusBadge status={adj.floatSource} />
                      <StatusBadge status={adj.category} />
                      <span className="text-slate-500">
                        Created by: <strong className="text-slate-800">{adj.createdBy}</strong>
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 pt-1">
                      {adj.adjustmentType} ETB {adj.amount.toLocaleString()} — {adj.reason}
                    </p>

                    {adj.attachmentName && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                        <Paperclip className="w-3 h-3" />
                        <span>Attachment: {adj.attachmentName}</span>
                      </p>
                    )}
                  </div>

                  {/* Approval Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {isCreator ? (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Maker-Checker: You created this and cannot self-approve</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onRejectAdjustment(adj.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => onApproveAdjustment(adj.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Adjustment</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PROCESSED ADJUSTMENTS HISTORY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b pb-3">
          Historical Adjustment Audit Log ({processedAdjustments.length})
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 font-right">Amount (ETB)</th>
                <th className="p-2.5">Created By</th>
                <th className="p-2.5">Approved By</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {processedAdjustments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{a.id}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-800">{a.category}</td>
                  <td className="p-2.5 font-bold text-emerald-700">
                    ETB {a.amount.toLocaleString()}
                  </td>
                  <td className="p-2.5 font-sans text-slate-700">{a.createdBy}</td>
                  <td className="p-2.5 font-sans text-slate-700">{a.approvedBy || 'N/A'}</td>
                  <td className="p-2.5 text-center font-sans">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADJUSTMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Manual Financial Adjustment"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Shop Branch</label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Float Source</label>
              <select
                value={floatSource}
                onChange={(e) => setFloatSource(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="UM">UM Float</option>
                <option value="DD">DD Float</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="CREDIT">CREDIT (+)</option>
                <option value="DEBIT">DEBIT (-)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Amount (ETB)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="SHORTAGE_WRITE_OFF">SHORTAGE WRITE OFF</option>
                <option value="COMMISSION_CORRECTION">COMMISSION CORRECTION</option>
                <option value="BANK_FEE">BANK FEE</option>
                <option value="FLOAT_TRANSFER">FLOAT TRANSFER</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Reason / Memo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              rows={2}
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
            >
              Submit Adjustment for Checker
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
