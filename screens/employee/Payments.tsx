
import React, { useState } from 'react';
import { PaymentRequest, Task, PaymentStatus, WithdrawalRequest, WithdrawalStatus, PaymentProfile, PaymentMethod } from '../../types';
import { CheckCircle2, Clock, Wallet, ArrowUpRight, Landmark, Smartphone, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  requests: PaymentRequest[];
  withdrawals: WithdrawalRequest[];
  setWithdrawals: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  tasks: Task[];
  userId: string;
  profile: PaymentProfile;
}

export default function EmployeePayments({ requests, withdrawals, setWithdrawals, tasks, userId, profile }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>(profile.defaultMethod);
  const [activeTab, setActiveTab] = useState<'EARNINGS' | 'HISTORY'>('EARNINGS');
  const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null);

  const userEarnings = requests.filter(r => r.employeeId === userId && r.status === PaymentStatus.PAID);
  const userWithdrawals = withdrawals.filter(w => w.employeeId === userId);
  
  const totalEarned = userEarnings.reduce((acc, r) => acc + r.amount, 0);
  const totalWithdrawn = userWithdrawals.reduce((acc, w) => acc + (w.status === WithdrawalStatus.PAID ? w.amount : 0), 0);
  const totalPending = userWithdrawals.reduce((acc, w) => acc + (w.status === WithdrawalStatus.PENDING ? w.amount : 0), 0);
  
  const currentBalance = totalEarned - totalWithdrawn - totalPending;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > currentBalance) return;

    const newWithdrawal: WithdrawalRequest = {
      id: `w${Date.now()}`,
      employeeId: userId,
      amount: amount,
      status: WithdrawalStatus.PENDING,
      createdAt: new Date().toISOString(),
      methodSnapshot: withdrawMethod === PaymentMethod.EWALLET 
        ? `${profile.walletProvider || 'E-Wallet'}: ${profile.walletIdentifier || '...'}`
        : 'Cash'
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    setIsRequesting(false);
    setWithdrawAmount('');
    setActiveTab('HISTORY');
  };

  const handleSetMax = () => {
    setWithdrawAmount(currentBalance.toFixed(2));
  };

  const toggleExpand = (id: string) => {
    setExpandedWithdrawal(expandedWithdrawal === id ? null : id);
  };

  return (
    <div className="p-6">
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg mb-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Wallet size={12} className="text-indigo-400" />
          Current Balance
        </p>
        <p className="text-3xl font-normal mb-6">₱{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        <button 
          onClick={() => setIsRequesting(true)}
          disabled={currentBalance <= 0}
          className="w-full bg-white text-gray-900 py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <ArrowUpRight size={18} />
          Withdraw Funds
        </button>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('EARNINGS')}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'EARNINGS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
          }`}
        >
          My Earnings
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'HISTORY' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
          }`}
        >
          History
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'EARNINGS' ? (
          userEarnings.length === 0 ? <p className="text-center py-10 text-xs text-gray-400 font-medium">No earnings yet</p> :
          userEarnings.map(req => (
            <div key={req.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Task Credit</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(req.paidAt!).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">+₱{req.amount.toFixed(2)}</p>
            </div>
          ))
        ) : (
          userWithdrawals.length === 0 ? <p className="text-center py-10 text-xs text-gray-400 font-medium">No withdrawal history</p> :
          userWithdrawals.map(w => {
            const isExpanded = expandedWithdrawal === w.id;
            return (
              <div 
                key={w.id} 
                className={`bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${
                  w.status === WithdrawalStatus.REJECTED ? 'border-red-100' : 'border-gray-100'
                }`}
              >
                <div 
                  onClick={() => toggleExpand(w.id)}
                  className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      w.status === WithdrawalStatus.PAID ? 'bg-indigo-50 text-indigo-600' : 
                      w.status === WithdrawalStatus.REJECTED ? 'bg-red-50 text-red-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {w.status === WithdrawalStatus.PAID ? <CheckCircle2 size={16} /> : 
                       w.status === WithdrawalStatus.REJECTED ? <AlertTriangle size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Withdrawal</h4>
                      <div className="flex items-center gap-2">
                        <p className={`text-[9px] font-bold uppercase tracking-tighter ${
                          w.status === WithdrawalStatus.PAID ? 'text-green-600' : 
                          w.status === WithdrawalStatus.REJECTED ? 'text-red-600' :
                          'text-orange-500'
                        }`}>
                          {w.status}
                        </p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(w.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">-₱{w.amount.toFixed(2)}</p>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top duration-200">
                    <div className="pt-3 border-t border-gray-50 space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Method Details</p>
                        <p className="text-[11px] font-medium text-gray-700">{w.methodSnapshot}</p>
                      </div>
                      
                      {w.status === WithdrawalStatus.REJECTED && w.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-[8px] font-bold text-red-600 uppercase mb-1">Decline Reason</p>
                          <p className="text-[11px] font-semibold text-red-900 leading-relaxed italic">"{w.rejectionReason}"</p>
                        </div>
                      )}
                      
                      {w.status === WithdrawalStatus.PAID && w.processedAt && (
                        <div className="p-3 bg-indigo-50/50 rounded-lg">
                          <p className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Processed On</p>
                          <p className="text-[11px] font-medium text-indigo-900">{new Date(w.processedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isRequesting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Withdrawal Request</h3>
              <button onClick={() => setIsRequesting(false)} className="text-gray-400 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWithdrawMethod(PaymentMethod.CASH)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    withdrawMethod === PaymentMethod.CASH ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}
                >
                  <Landmark size={20} />
                  <span className="text-[10px] font-bold uppercase">Cash</span>
                </button>
                <button
                  onClick={() => setWithdrawMethod(PaymentMethod.EWALLET)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    withdrawMethod === PaymentMethod.EWALLET ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}
                >
                  <Smartphone size={20} />
                  <span className="text-[10px] font-bold uppercase">GCash</span>
                </button>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2 ml-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount to withdraw</label>
                  <button 
                    onClick={handleSetMax}
                    className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-2xl font-normal outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1">Max available: <span className="text-gray-600 font-bold">₱{currentBalance.toFixed(2)}</span></p>
              </div>
              <button 
                onClick={handleWithdraw} 
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
