import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Globe,
  UserCheck,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { User, Session } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User, session: Session, mustChangePassword: boolean) => void;
  onForgotPasswordClick: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onForgotPasswordClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [language, setLanguage] = useState<'EN' | 'AM'>('EN');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  // Translations
  const t = {
    EN: {
      title: 'ReconFlow Ethiopia',
      subtitle: 'Telecom & Mobile-Money Financial Reconciliation System',
      signInTitle: 'Sign in to your account',
      signInDesc: 'Enter your credentials to access your authorized reconciliation workspace.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'e.g. admin@reconflow.demo',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember this device for 30 days',
      forgotPassword: 'Forgot password?',
      signInBtn: 'Sign In to ReconFlow',
      signingIn: 'Authenticating...',
      demoHeader: 'Quick Demo Credentials Selector',
      demoSub: 'Select a pre-configured role account to test production authentication & scope permissions:',
      contactAdmin: 'Need help? Contact IT Security Desk: support@reconflow.et | +251 911 000 000',
      securityNotice: 'Protected by enterprise AES-256 encryption, rate limiting, and Maker-Checker auditing.',
    },
    AM: {
      title: 'ሪኮንፍሎው ኢትዮጵያ',
      subtitle: 'የቴሌኮም እና ሞባይል ገንዘብ ሂሳብ ማስታረቂያ ስርዓት',
      signInTitle: 'ወደ መለያዎ ይግቡ',
      signInDesc: 'ወደተፈቀደልዎ የስራ ቦታ ለመግባት የእርስዎን ኢሜይል እና የይለፍ ቃል ያስገቡ።',
      emailLabel: 'የኢሜይል አድራሻ',
      emailPlaceholder: 'ምሳሌ፦ admin@reconflow.demo',
      passwordLabel: 'የይለፍ ቃል',
      passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
      rememberMe: 'ለ30 ቀናት አስታውሰኝ',
      forgotPassword: 'የይለፍ ቃል ረስተዋል?',
      signInBtn: 'ወደ ሪኮንፍሎው ይግቡ',
      signingIn: 'በማረጋገጥ ላይ...',
      demoHeader: 'የሙከራ መለያዎች መምረጫ',
      demoSub: 'የተለያዩ የስራ ሃላፊነቶችን ለመሞከር ከታች ካሉት መለያዎች አንዱን ይምረጡ፦',
      contactAdmin: 'እርዳታ ይፈልጋሉ? የኢንፎርሜሽን ቴክኖሎጂ ደህንነት ክፍል፦ support@reconflow.et | +251 911 000 000',
      securityNotice: 'በከፍተኛ የኢንተርፕራይዝ የደህንነት ስርዓት የተጠበቀ ነው።',
    },
  }[language];

  const seedAccounts = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'admin@reconflow.demo', desc: 'Platform All-Tenants Access' },
    { role: 'COMPANY_ADMIN', label: 'Company Admin', email: 'company.admin@reconflow.demo', desc: 'Legal Entity & Setup Control' },
    { role: 'FINANCE_MANAGER', label: 'Finance Manager', email: 'finance.manager@reconflow.demo', desc: 'Approvals & Period Close' },
    { role: 'RECONCILIATION_OFFICER', label: 'Recon Officer', email: 'recon.officer@reconflow.demo', desc: 'Matching & Adjustments' },
    { role: 'REGIONAL_MANAGER', label: 'Regional Manager', email: 'regional.manager@reconflow.demo', desc: 'Oromia Regional Scope' },
    { role: 'SHOP_MANAGER', label: 'Shop Manager', email: 'shop.manager@reconflow.demo', desc: 'Bole Shop Outlet Scope' },
    { role: 'DSA', label: 'DSA / Field Agent', email: 'dsa.user@reconflow.demo', desc: 'Direct Sales Agent Scope' },
    { role: 'AUDITOR', label: 'Auditor', email: 'auditor@reconflow.demo', desc: 'Read-Only Audit Dashboard' },
  ];

  const handleQuickFill = (emailVal: string) => {
    setEmail(emailVal);
    setPassword('ReconFlow!2026');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!(email || '').trim() || !password) {
      setErrorMessage(
        language === 'AM'
          ? 'እባክዎ ኢሜይል እና የይለፍ ቃል ያስገቡ።'
          : 'Please enter both email address and password.'
      );
      return;
    }

    setIsLoading(true);

    // Simulate natural authentication latency with rate limit checking
    setTimeout(() => {
      const result = AuthService.login(
        email,
        password,
        rememberMe,
        '197.156.64.12',
        navigator.userAgent
      );

      setIsLoading(false);

      if (result.success && result.user && result.session) {
        onLoginSuccess(result.user, result.session, !!result.mustChangePassword);
      } else {
        setErrorMessage(
          result.message || 'Invalid email or password. Please try again or contact your administrator.'
        );
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar with Language Switcher */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            RF
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">ReconFlow</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[11px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                v2026.2
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage((prev) => (prev === 'EN' ? 'AM' : 'EN'))}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition font-semibold"
            title="Switch Language / ቋንቋ ይቀይሩ"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'EN' ? 'አማርኛ' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Card Wrapper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t.signInTitle}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t.signInDesc}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-rose-200">Authentication Failed</p>
                  <p className="text-rose-300/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer select-none">
                  {t.rememberMe}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.signingIn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.signInBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.securityNotice}</span>
            </div>
          </div>

          {/* Quick Demo Credentials Accordion */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t.demoHeader}</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                {showDemoCredentials ? 'Hide ▲' : 'Show Demo Seed Accounts ▼'}
              </span>
            </button>

            {showDemoCredentials && (
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <p className="text-[11px] text-slate-400">{t.demoSub}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {seedAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleQuickFill(acc.email)}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">
                          {acc.label}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{acc.email}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{acc.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>Seed Password: <strong className="text-amber-400">ReconFlow!2026</strong></span>
                  <span>(Forces Password Change on First Login)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center border-t border-slate-800/80 bg-slate-900/40 text-slate-500 text-[11px] space-y-1">
        <p>{t.contactAdmin}</p>
        <p>© 2026 EthioConnect Telecom & Distribution PLC. All rights reserved.</p>
      </footer>
    </div>
  );
};
