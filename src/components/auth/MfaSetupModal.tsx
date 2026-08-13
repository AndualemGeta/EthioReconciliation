import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Lock,
  Smartphone,
  AlertCircle,
  Key,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { User } from '../../types';
import { AuthService } from '../../services/authService';

interface MfaSetupModalProps {
  user: User;
  onClose: () => void;
  onMfaUpdated: (updatedUser: User) => void;
}

export const MfaSetupModal: React.FC<MfaSetupModalProps> = ({
  user,
  onClose,
  onMfaUpdated,
}) => {
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled);
  const [verificationCode, setVerificationCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const mfaSecret = user.mfaSecret || 'JBSWY3DPEHPK3PXP';
  const backupCodes = [
    '8392-1029',
    '4820-9182',
    '1029-4820',
    '9182-8392',
    '5719-2840',
    '3819-5029',
  ];

  const handleToggleMfa = () => {
    setErrMsg('');
    setSuccessMsg('');

    if (!mfaEnabled) {
      // Validate test 6-digit code
      if (verificationCode.length !== 6) {
        setErrMsg('Please enter a valid 6-digit verification code from your authenticator app.');
        return;
      }
    }

    const users = AuthService.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      const updatedMfa = !mfaEnabled;
      users[userIndex].mfaEnabled = updatedMfa;
      users[userIndex].mfaSecret = updatedMfa ? mfaSecret : undefined;
      localStorage.setItem('reconflow_auth_users', JSON.stringify(users));

      setMfaEnabled(updatedMfa);
      setSuccessMsg(
        updatedMfa
          ? 'Two-Factor Authentication (TOTP) successfully activated for your account.'
          : 'Two-Factor Authentication disabled.'
      );
      onMfaUpdated(users[userIndex]);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <Modal title="Two-Factor Authentication (TOTP MFA) Security" onClose={onClose}>
      <div className="space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${mfaEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Authenticator App (TOTP)</p>
              <p className="text-[11px] text-slate-400">
                Use Google Authenticator, Authy, or Microsoft Authenticator.
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              mfaEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {mfaEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errMsg}</span>
          </div>
        )}

        {!mfaEnabled ? (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-300">
              1. Scan this QR code or copy the secret key into your authenticator app:
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {/* QR Code Placeholder Graphic */}
              <div className="w-28 h-28 bg-white p-2 rounded-lg flex items-center justify-center shrink-0 shadow">
                <div className="w-full h-full border-2 border-slate-950 p-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 bg-slate-950" />
                    <div className="w-4 h-4 bg-slate-950" />
                  </div>
                  <div className="flex items-center justify-center font-mono text-[9px] font-black text-slate-950">
                    RECON
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 bg-slate-950" />
                    <div className="w-4 h-4 bg-slate-950" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs flex-1">
                <p className="font-semibold text-slate-300">Manual Entry Key:</p>
                <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-emerald-400 font-bold">
                  <span className="flex-1 select-all">{mfaSecret}</span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedSecret && <p className="text-[10px] text-emerald-400">Key copied to clipboard!</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                2. Enter 6-digit Code from Authenticator App to Verify
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000 (enter 123456 to test)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-center tracking-widest text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleMfa}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              Verify & Enable Two-Factor Authentication
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Emergency Backup Recovery Codes</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Keep these single-use recovery codes in a safe place. If you lose access to your phone, these allow emergency access to ReconFlow:
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-200 pt-1">
                {backupCodes.map((code) => (
                  <span key={code} className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-center">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMfa}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
