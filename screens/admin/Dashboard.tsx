
import React from 'react';
import { Task, PaymentRequest, TaskStatus, PaymentStatus, WithdrawalRequest, WithdrawalStatus } from '../../types';
import { ChevronRight, Wallet, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  tasks: Task[];
  requests: PaymentRequest[];
  withdrawals: WithdrawalRequest[];
  onNavigate: (tab: string) => void;
}

export default function AdminDashboard({ tasks, requests, withdrawals, onNavigate }: Props) {
  const totalEarnedByEmployees = tasks
    .filter(t => t.status === TaskStatus.PAID)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPaidWithdrawals = withdrawals
    .filter(w => w.status === WithdrawalStatus.PAID)
    .reduce((acc, w) => acc + w.amount, 0);

  const totalPendingWithdrawals = withdrawals
    .filter(w => w.status === WithdrawalStatus.PENDING)
    .reduce((acc, w) => acc + w.amount, 0);

  const availableBalance = totalEarnedByEmployees - totalPaidWithdrawals - totalPendingWithdrawals;

  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 gap-4">
          <div 
            onClick={() => onNavigate('requests')}
            className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Available Balance</p>
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Wallet size={16} />
              </div>
            </div>
            <p className="text-2xl font-normal text-indigo-950">₱{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          
          <div 
            onClick={() => onNavigate('requests')}
            className="p-5 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pending Payouts</p>
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-normal text-orange-950">₱{totalPendingWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Distributed</p>
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-2xl font-normal text-emerald-950">₱{totalPaidWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Pending Requests</h2>
          <button onClick={() => onNavigate('requests')} className="text-[10px] font-bold text-indigo-600 uppercase">View All</button>
        </div>
        <div className="space-y-3">
          {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).slice(0, 3).map(w => (
            <div 
              key={w.id} 
              onClick={() => onNavigate('requests')}
              className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
                  <Wallet size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Withdrawal Request</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">₱{w.amount.toFixed(2)}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
          {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length === 0 && (
            <p className="text-center py-6 text-xs text-gray-400 font-medium italic">No pending items</p>
          )}
        </div>
      </div>
    </div>
  );
}
