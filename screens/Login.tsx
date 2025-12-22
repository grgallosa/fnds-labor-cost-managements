
import React, { useState } from 'react';
import { Lock, UserPlus, ArrowLeft, Smartphone, UserCircle, Phone } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
  onRegister: (data: any) => void;
}

export default function Login({ onLogin, onRegister }: LoginProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  
  // Signup fields
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashName, setGcashName] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !contact || !gcashNumber || !gcashName) {
      alert("Please fill in all fields.");
      return;
    }
    onRegister({
      name,
      email,
      contact,
      gcashNumber,
      gcashName
    });
    setMode('LOGIN');
    setEmail(email);
    alert("Application submitted! Please wait for admin approval.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100">
            {mode === 'LOGIN' ? <Lock size={24} /> : <UserPlus size={24} />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {mode === 'LOGIN' ? 'Sign in to FNDS' : 'Join as Employee'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">Labor Cost Management System</p>
        </div>

        {mode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="mt-8 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email or Employee ID</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white font-medium"
                  placeholder="admin@fnds.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98] shadow-md shadow-indigo-100"
            >
              Log in to Dashboard
            </button>

            <button
              type="button"
              onClick={() => setMode('SIGNUP')}
              className="w-full flex justify-center py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Don't have an account? Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="mt-8 space-y-5">
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <UserCircle size={14} /> Basic Info
                </p>
                <div>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                    placeholder="Contact Number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Smartphone size={14} /> GCash Wallet
                </p>
                <div>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                    placeholder="GCash Number (09...)"
                    value={gcashNumber}
                    onChange={(e) => setGcashNumber(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                    placeholder="GCash Account Name"
                    value={gcashName}
                    onChange={(e) => setGcashName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-100"
              >
                Register Account
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="w-full flex justify-center py-4 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
            Admin Demo: admin@fnds.com <br/> 
            Approved Employee: john@fnds.com
          </p>
        </div>
      </div>
    </div>
  );
}
