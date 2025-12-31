
import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ArrowLeft, 
  Smartphone, 
  Mail, 
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
  Database,
  Terminal,
  MousePointer2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (email: string, password?: string) => void;
  onRegister: (data: any) => Promise<boolean>;
  onDemoLogin: (role: 'ADMIN' | 'EMPLOYEE') => void;
  onResendVerification?: (email: string) => Promise<void>;
}

export default function Login({ onLogin, onRegister, onResendVerification }: LoginProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'SUCCESS'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Signup extra fields
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashName, setGcashName] = useState('');

  // Check connection to Supabase on mount
  useEffect(() => {
    async function checkConn() {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        setDbStatus('online');
      } catch (e) {
        setDbStatus('offline');
      }
    }
    checkConn();
  }, []);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Check your email/password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name || !email || !password || !contact || !gcashNumber || !gcashName) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const success = await onRegister({
        name,
        email,
        password,
        contact,
        gcashNumber,
        gcashName
      });
      if (success) {
        setMode('SUCCESS');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!onResendVerification) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await onResendVerification(email);
      setResendStatus("Link resent! Note: Check your Spam folder.");
    } catch (err: any) {
      setResendStatus("Error: " + (err.message || "Could not resend."));
    } finally {
      setIsResending(false);
    }
  };

  if (mode === 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-y-auto max-h-[95vh] scrollbar-hide">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-bounce">
              <Inbox size={40} />
            </div>
          </div>
          
          <h2 className="text-xl font-black text-slate-900 mb-2">Check Your Inbox</h2>
          <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed px-4">
            Confirmation sent to: <br/>
            <span className="text-indigo-600 font-bold break-all">{email}</span>
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => handleLoginSubmit()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <CheckCircle2 size={18} />
              Confirmed? Log In Now
            </button>
            
            <button 
              disabled={isResending}
              onClick={handleResend}
              className="w-full py-4 bg-white border border-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-slate-50 transition-all"
            >
              {isResending ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
              <Database size={14} className="text-indigo-600" />
              Manual Admin Bypass
            </div>
            
            <div className="space-y-4">
              <div className="p-5 bg-slate-900 rounded-2xl shadow-inner border border-white/5">
                <p className="text-[10px] text-indigo-400 font-black uppercase mb-3 flex items-center gap-2 tracking-widest">
                  <Terminal size={14} /> The SQL Bypass (Fastest)
                </p>
                <p className="text-[9px] text-slate-400 mb-3 leading-relaxed">
                  Can't find the buttons? Go to your **Supabase Dashboard**, click **SQL Editor** in the sidebar, paste this, and hit **Run**:
                </p>
                <div className="relative group">
                  <code className="text-[9px] text-emerald-400 font-mono block bg-black/40 p-3 rounded border border-white/10 select-all leading-normal">
                    UPDATE auth.users <br/>
                    SET email_confirmed_at = now() <br/>
                    WHERE email = '{email}';
                  </code>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-3 flex items-center gap-1.5">
                  <MousePointer2 size={12} /> The UI Method
                </p>
                <ol className="text-[10px] text-slate-600 space-y-2.5 font-medium">
                  <li className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[8px] flex items-center justify-center shrink-0">1</span>
                    <span>Go to <b>Authentication > Users</b></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[8px] flex items-center justify-center shrink-0">2</span>
                    <span><b>Click on the email address itself</b> (this opens the user's specific page).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[8px] flex items-center justify-center shrink-0">3</span>
                    <span>Look for a <b>"Confirm User"</b> or <b>"Confirm Email"</b> button at the top right of that page.</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setMode('LOGIN')}
            className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            Cancel and Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === 'LOGIN' ? 'Sign In' : 'Register'}
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-100">
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                {dbStatus === 'online' ? 'Server Active' : dbStatus === 'checking' ? 'Connecting...' : 'Server Offline'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs font-bold text-red-500">
              <AlertCircle size={14} className="shrink-0" />
              {errorMessage}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Sign In <ChevronRight size={18} className="ml-1" /></>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('SIGNUP'); setErrorMessage(null); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                >
                  Create New Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 scrollbar-hide">
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white outline-none text-sm font-medium transition-all"
                    placeholder="Full Legal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    className="w-full px-5 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white outline-none text-sm font-medium transition-all"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    required
                    className="w-full px-5 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white outline-none text-sm font-medium transition-all"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <input
                    type="tel"
                    required
                    className="w-full px-5 py-3.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white outline-none text-sm font-medium transition-all"
                    placeholder="Mobile Number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-emerald-600 px-1">
                    <Smartphone size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">GCash Payout Info</span>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100/50 space-y-3">
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-md border border-emerald-100 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-medium"
                      placeholder="GCash Mobile Number"
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-md border border-emerald-100 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-medium"
                      placeholder="Account Holder Name"
                      value={gcashName}
                      onChange={(e) => setGcashName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setErrorMessage(null); }}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
