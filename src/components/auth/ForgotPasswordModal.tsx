import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { AuthService } from '../../services/authService';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'REQUEST' | 'CONFIRM'>('REQUEST');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedSimToken, setGeneratedSimToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (!(email || '').trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = AuthService.requestPasswordReset(email);
      setIsSubmitting(false);

      setMessage(result.message);
      if (result.resetToken) {
        setGeneratedSimToken(result.resetToken);
        setResetToken(result.resetToken);
      }
    }, 500);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (!(resetToken || '').trim()) {
      setErrorMessage('Please enter the reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = AuthService.confirmPasswordReset(resetToken, newPassword);
      setIsSubmitting(false);

      if (result.success) {
        setMessage('Your password has been successfully reset. You can now log in with your new password.');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(result.message);
      }
    }, 500);
  };

  return (
    <Modal title="Password Recovery & Security Reset" onClose={onClose}>
      <div className="space-y-4">
        {/* Step Selector Tabs */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setStep('REQUEST')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition ${
              step === 'REQUEST' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Request Reset Link
          </button>
          <button
            type="button"
            onClick={() => setStep('CONFIRM')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition ${
              step === 'CONFIRM' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Reset Password with Token
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-200 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Security Notice</p>
              <p className="text-emerald-300/90 leading-relaxed">{message}</p>
            </div>
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered organization email address. We will issue a secure, single-use reset token valid for 30 minutes.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. finance.manager@reconflow.demo"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-md"
            >
              {isSubmitting ? <span>Generating Token...</span> : <span>Generate Password Reset Token</span>}
            </button>

            {generatedSimToken && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Dev/Demo Password Reset Simulation Token</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-amber-200 break-all">
                  {generatedSimToken}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('CONFIRM')}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition"
                >
                  Proceed to Step 2 with this Token →
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Reset Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token starting with rst_..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">New Password (Min 12 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new strong password"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-md"
            >
              {isSubmitting ? <span>Updating Password...</span> : <span>Confirm & Reset Password</span>}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
