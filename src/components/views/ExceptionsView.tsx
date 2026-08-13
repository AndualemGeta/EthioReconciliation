import React, { useState } from 'react';
import {
  ExceptionRecord,
  RiskLevel,
  ExceptionType,
  ExceptionStatus,
  UserScope,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import {
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  FileCheck,
  Building2,
} from 'lucide-react';

interface ExceptionsViewProps {
  exceptions: ExceptionRecord[];
  userScope: UserScope;
  onUpdateException: (updated: ExceptionRecord) => void;
  onCreateAdjustmentFromException?: (exc: ExceptionRecord) => void;
}

export const ExceptionsView: React.FC<ExceptionsViewProps> = ({
  exceptions,
  userScope,
  onUpdateException,
  onCreateAdjustmentFromException,
}) => {
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeException, setActiveException] = useState<ExceptionRecord | null>(null);

  // New comment input state
  const [newComment, setNewComment] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');

  const filteredExceptions = exceptions.filter((exc) => {
    if (selectedRisk !== 'ALL' && exc.riskLevel !== selectedRisk) return false;
    if (selectedType !== 'ALL' && exc.exceptionType !== selectedType) return false;
    return true;
  });

  const handleAddComment = () => {
    if (!activeException || !(newComment || '').trim()) return;

    const updatedComments = [
      ...activeException.comments,
      {
        id: `COM-${Date.now()}`,
        exceptionId: activeException.id,
        authorName: userScope.userName,
        authorRole: userScope.role,
        createdAt: new Date().toISOString(),
        comment: (newComment || '').trim(),
        attachmentName: attachmentName || undefined,
      },
    ];

    const updatedRecord: ExceptionRecord = {
      ...activeException,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
      status: 'UNDER_INVESTIGATION',
    };

    onUpdateException(updatedRecord);
    setActiveException(updatedRecord);
    setNewComment('');
    setAttachmentName('');
  };

  const handleResolveException = (actionReason: string) => {
    if (!activeException) return;

    const updatedRecord: ExceptionRecord = {
      ...activeException,
      status: 'RESOLVED',
      resolutionAction: actionReason,
      updatedAt: new Date().toISOString(),
    };

    onUpdateException(updatedRecord);
    setActiveException(null);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Exception & Risk Investigation Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Investigate shortages, duplicate entries, missing reports, and uncollected deposits.
          </p>
        </div>

        {/* Risk Level Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedRisk === risk
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* EXCEPTIONS QUEUE LIST */}
      <div className="space-y-3">
        {filteredExceptions.map((exc) => (
          <div
            key={exc.id}
            onClick={() => setActiveException(exc)}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <StatusBadge status={exc.riskLevel} type="risk" />
                <StatusBadge status={exc.exceptionType} />
                <span className="text-xs font-mono font-bold text-slate-900">{exc.id}</span>
                <span className="text-xs text-slate-400">• Aging {exc.agingDays} days</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{exc.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{exc.summary}</p>

              <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                <span>
                  Float Source: <strong className="text-slate-800">{exc.floatSource}</strong>
                </span>
                <span>
                  Assigned To: <strong className="text-slate-800">{exc.assignedTo || 'Unassigned'}</strong>
                </span>
                <span>
                  Comments: <strong className="text-slate-800">{exc.comments.length}</strong>
                </span>
              </div>
            </div>

            {/* Difference Amount Pill */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Shortage / Difference
              </span>
              <span className="text-lg font-black text-rose-600 font-mono">
                ETB {exc.differenceAmount.toLocaleString()}
              </span>
              <div className="mt-2">
                <span className="text-xs font-bold text-emerald-600 hover:underline">
                  Inspect & Resolve →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INVESTIGATION DRAWER / DETAIL MODAL */}
      <Modal
        isOpen={activeException !== null}
        onClose={() => setActiveException(null)}
        title={activeException?.title || 'Exception Details'}
        maxWidthClass="max-w-3xl"
      >
        {activeException && (
          <div className="space-y-6 text-xs text-slate-800">
            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 font-bold block">Expected Amount</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  ETB {activeException.expectedAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Actual Bank Slip / Deposit</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  ETB {activeException.actualAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Shortage / Difference</span>
                <span className="font-mono text-sm font-bold text-rose-600">
                  ETB {activeException.differenceAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Investigation Thread */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Investigation Conversation & Evidence Thread</span>
              </h4>

              {activeException.comments.length === 0 ? (
                <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No comments or evidence attached yet. Add notes below.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeException.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{c.comment}</p>
                      {c.attachmentName && (
                        <div className="pt-1 flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attachment: {c.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Input Form */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-xs text-emerald-400 block">
                Add Official Investigation Note / Evidence
              </span>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter investigation update, bank verification note, or sub-agent reason..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 h-20"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Attach Deposit Receipt Name (e.g. CBE_Slip_88102.pdf)"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-300 w-64 focus:outline-none"
                />

                <button
                  onClick={handleAddComment}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    handleResolveException('Verified with Bank Statement and resolved.')
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Exception Resolved</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
