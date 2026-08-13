import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { AuthService, validatePasswordPolicy } from '../../services/authService';
import { User } from '../../types';

interface MustChangePasswordModalProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({
  user,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('ReconFlow!2026');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy Checks
  const hasMinLen = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isDifferent = newPassword !== currentPassword && newPassword.length > 0;
  const matchesConfirm = newPassword === confirmPassword && confirmPassword.length > 0;

  const isFormValid =
    hasMinLen &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    isDifferent &&
    matchesConfirm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isFormValid) {
      setErrorMessage('Please ensure your new password satisfies all security criteria below.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = AuthService.changePassword(user.id, currentPassword, newPassword);
      setIsSubmitting(false);

      if (result.success) {
        const users = AuthService.getAllUsers();
        const updated = users.find((u) => u.id === user.id) || {
          ...user,
          mustChangePassword: false,
        };
        onPasswordChanged(updated);
      } else {
        setErrorMessage(result.message || 'Failed to update password. Please try again.');
      }
    }, 500);
  };

  return (
    <Modal
      title="Mandatory Security Update: Change Temporary Password"
      onClose={() => {}} // Cannot close without changing password
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-200 text-xs flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-100">Action Required Before Proceeding</p>
            <p className="text-amber-300/80 leading-relaxed">
              Your account is currently using a temporary or administrator-assigned password. To protect organizational financial records, you must set a strong custom password before entering ReconFlow.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Current Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Current / Temporary Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            New Secure Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 12 characters)"
              className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Password Policy Live Checklist */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
          <p className="font-bold text-slate-300">Password Policy Criteria:</p>
          <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono">
            <div className="flex items-center space-x-1.5">
              {hasMinLen ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={hasMinLen ? 'text-emerald-300' : ''}>At least 12 characters</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {hasUpper ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={hasUpper ? 'text-emerald-300' : ''}>Uppercase letter (A-Z)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {hasLower ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={hasLower ? 'text-emerald-300' : ''}>Lowercase letter (a-z)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {hasNumber ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={hasNumber ? 'text-emerald-300' : ''}>Number (0-9)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {hasSpecial ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={hasSpecial ? 'text-emerald-300' : ''}>Special character (!@#$)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {matchesConfirm ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={matchesConfirm ? 'text-emerald-300' : ''}>Passwords match</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {isSubmitting ? (
            <span>Updating Password...</span>
          ) : (
            <>
              <span>Update Password & Enter ReconFlow</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
