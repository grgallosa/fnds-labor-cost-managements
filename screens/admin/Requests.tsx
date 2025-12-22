
import React, { useState, useRef } from 'react';
import { PaymentRequest, PaymentStatus, Task, TaskStatus, WithdrawalRequest, WithdrawalStatus, User, PaymentMethod } from '../../types';
import { CheckCircle2, Clock, Search, Wallet, FileText, Camera, X, AlertCircle, MapPin, MapPinned, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface Props {
  requests: PaymentRequest[];
  setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  withdrawals: WithdrawalRequest[];
  setWithdrawals: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
}

export default function AdminRequests({ requests, setRequests, withdrawals, setWithdrawals, tasks, setTasks, users }: Props) {
  const [tab, setTab] = useState<'CONFIRMATIONS' | 'WITHDRAWALS'>('CONFIRMATIONS');
  const [filter, setFilter] = useState<'PENDING' | 'PAID' | 'ALL'>('PENDING');
  
  const [processingWithdrawal, setProcessingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<Task | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);
  
  const [isRejectingWithdrawal, setIsRejectingWithdrawal] = useState(false);
  const [withdrawalRejectionReason, setWithdrawalRejectionReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirmTask = (task: Task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.PAID, rejectionReason: undefined } : t
    ));

    const newRequest: PaymentRequest = {
      id: `r${Date.now()}`,
      taskId: task.id,
      employeeId: task.assignedTo || 'unknown',
      amount: task.amount,
      method: task.paymentMethod || PaymentMethod.CASH, 
      paymentDetailsSnapshot: task.paymentMethod === PaymentMethod.EWALLET ? 'GCash' : 'Cash on Hand',
      status: PaymentStatus.PAID,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };
    setRequests(prev => [newRequest, ...prev]);
    setViewingProof(null);
    setIsDeclining(false);
    setDeclineReason('');
  };

  const handleDeclineTask = (task: Task) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining.');
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === task.id ? { 
        ...t, 
        status: TaskStatus.IN_PROGRESS, 
        rejectionReason: declineReason,
        completionPhoto: undefined,
        completionLocationVerified: false
      } : t
    ));
    setViewingProof(null);
    setIsDeclining(false);
    setDeclineReason('');
  };

  const handleWithdrawalAction = (status: WithdrawalStatus) => {
    if (!processingWithdrawal) return;

    if (status === WithdrawalStatus.REJECTED && !withdrawalRejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setWithdrawals(prev => prev.map(w => 
      w.id === processingWithdrawal.id 
        ? { 
            ...w, 
            status, 
            processedAt: new Date().toISOString(), 
            receiptImage: receiptBase64 || undefined,
            rejectionReason: status === WithdrawalStatus.REJECTED ? withdrawalRejectionReason : undefined
          } 
        : w
    ));
    
    setProcessingWithdrawal(null);
    setReceiptBase64(null);
    setIsRejectingWithdrawal(false);
    setWithdrawalRejectionReason('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const tasksToConfirm = tasks.filter(t => {
    if (filter === 'ALL') return t.status === TaskStatus.DONE || t.status === TaskStatus.PAID;
    if (filter === 'PAID') return t.status === TaskStatus.PAID;
    return t.status === TaskStatus.DONE;
  });

  const filteredWithdrawals = withdrawals.filter(w => 
    filter === 'ALL' ? true : (filter === 'PAID' ? w.status === WithdrawalStatus.PAID : w.status === WithdrawalStatus.PENDING)
  );

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setTab('CONFIRMATIONS')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all ${
              tab === 'CONFIRMATIONS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
            }`}
          >
            Confirm Tasks
          </button>
          <button 
            onClick={() => setTab('WITHDRAWALS')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all ${
              tab === 'WITHDRAWALS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
            }`}
          >
            Withdrawals
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          {(['PENDING', 'PAID', 'ALL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {f === 'PENDING' ? 'Waiting' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tab === 'CONFIRMATIONS' ? (
          tasksToConfirm.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            tasksToConfirm.map(task => {
              const assignedUser = users.find(u => u.id === task.assignedTo);
              return (
                <div key={task.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{task.title}</h3>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">By: {assignedUser?.name || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-normal text-indigo-600">₱{task.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {task.status === TaskStatus.DONE ? (
                    <button 
                      onClick={() => setViewingProof(task)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={16} />
                      Review Proof & Confirm
                    </button>
                  ) : (
                    <StatusBadge status="PAID" date={task.date} />
                  )}
                </div>
              );
            })
          )
        ) : (
          filteredWithdrawals.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            filteredWithdrawals.map(w => {
              const user = users.find(u => u.id === w.employeeId);
              return (
                <div key={w.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{user?.name || 'Employee'}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Withdrawal ID: {w.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-light text-orange-600">₱{w.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl mb-4 text-[11px] text-orange-900 border border-orange-100">
                    <p className="font-medium">{w.methodSnapshot}</p>
                  </div>
                  {w.status === WithdrawalStatus.PENDING ? (
                    <button 
                      onClick={() => setProcessingWithdrawal(w)}
                      className="w-full py-3 bg-orange-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition-all"
                    >
                      Process Withdrawal
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <StatusBadge status={w.status} date={w.processedAt} />
                      {w.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                          <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                          <p className="text-xs text-red-900 font-medium italic">"{w.rejectionReason}"</p>
                        </div>
                      )}
                      {w.receiptImage && (
                        <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-100">
                          <img src={w.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Task Proof Review Modal */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in slide-in-from-bottom sm:slide-in-from-top duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Review Task Proof</h3>
              <button 
                onClick={() => { setViewingProof(null); setIsDeclining(false); setDeclineReason(''); }} 
                className="text-gray-400 p-1 bg-gray-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {!isDeclining ? (
                <>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Task Name</p>
                    <p className="text-sm font-bold text-indigo-950">{viewingProof.title}</p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-indigo-600">
                      <p className="text-lg font-bold">₱{viewingProof.amount.toFixed(2)}</p>
                      <p className="text-[10px] font-bold uppercase bg-white/50 px-2 py-1 rounded-lg">
                        Via {viewingProof.paymentMethod === PaymentMethod.CASH ? 'Cash' : 'GCash'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-green-600">
                          <MapPinned size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-900">Location Verification</p>
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-tight">
                            {viewingProof.completionLocationVerified ? 'Verified' : 'Bypassed'}
                          </p>
                        </div>
                      </div>
                      {viewingProof.completionLocationVerified && <CheckCircle2 size={18} className="text-green-600" />}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Proof Photo</p>
                      <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                        {viewingProof.completionPhoto ? (
                          <img src={viewingProof.completionPhoto} alt="Work Proof" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <ImageIcon size={48} className="mb-2" />
                            <p className="text-xs">No photo submitted</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => handleConfirmTask(viewingProof)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 size={20} />
                      Confirm & Release Funds
                    </button>
                    <button 
                      onClick={() => setIsDeclining(true)}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={14} />
                      Decline Proof
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-in slide-in-from-right duration-300 space-y-6">
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Decline Evidence
                    </h4>
                    <p className="text-xs text-red-700 leading-relaxed">
                      This will revert the task to 'In Progress' and notify the employee that their submission was rejected.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Reason for Rejection *</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[100px]"
                      placeholder="e.g. Photo is blurry, incorrect location, etc."
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => handleDeclineTask(viewingProof)}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-xl shadow-red-100"
                    >
                      Confirm Decline
                    </button>
                    <button 
                      onClick={() => setIsDeclining(false)}
                      className="w-full py-2 text-sm font-bold text-gray-400 uppercase tracking-widest"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Processing Modal */}
      {processingWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{isRejectingWithdrawal ? 'Decline Payout' : 'Process Withdrawal'}</h3>
              <button 
                onClick={() => { 
                  setProcessingWithdrawal(null); 
                  setReceiptBase64(null); 
                  setIsRejectingWithdrawal(false); 
                  setWithdrawalRejectionReason(''); 
                }} 
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {!isRejectingWithdrawal ? (
                <>
                  <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Instructions</p>
                    <p className="text-xs text-orange-900 leading-relaxed">
                      Send <span className="font-bold">₱{processingWithdrawal.amount.toFixed(2)}</span> to the account provided. 
                      Then upload a receipt to complete.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        receiptBase64 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {receiptBase64 ? (
                        <img src={receiptBase64} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Camera size={32} className="text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400">Click to upload receipt</p>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button 
                        onClick={() => setIsRejectingWithdrawal(true)}
                        className="py-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 active:bg-gray-50"
                      >
                        Decline Payout
                      </button>
                      <button 
                        disabled={!receiptBase64}
                        onClick={() => handleWithdrawalAction(WithdrawalStatus.PAID)}
                        className={`py-3 rounded-xl text-xs font-semibold text-white transition-all ${
                          receiptBase64 ? 'bg-black active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-in slide-in-from-right duration-300 space-y-6">
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Decline Payout
                    </h4>
                    <p className="text-xs text-red-700 leading-relaxed">
                      This will inform the employee that their withdrawal request has been declined.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Reason for Rejection *</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[100px]"
                      placeholder="e.g. Account details invalid, insufficient documentation, etc."
                      value={withdrawalRejectionReason}
                      onChange={e => setWithdrawalRejectionReason(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => handleWithdrawalAction(WithdrawalStatus.REJECTED)}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-xl shadow-red-100"
                    >
                      Confirm Decline
                    </button>
                    <button 
                      onClick={() => setIsRejectingWithdrawal(false)}
                      className="w-full py-2 text-sm font-bold text-gray-400 uppercase tracking-widest"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="text-center py-20">
      <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={20} className="text-gray-300" />
      </div>
      <p className="text-xs text-gray-400">No {filter.toLowerCase()} items found</p>
    </div>
  );
}

function StatusBadge({ status, date }: { status: string, date?: string }) {
  const isPaid = status === 'PAID';
  const isRejected = status === 'REJECTED';
  return (
    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase w-fit px-3 py-1.5 rounded-lg border ${
      isPaid ? 'text-green-600 bg-green-50 border-green-100' : 
      isRejected ? 'text-red-600 bg-red-50 border-red-100' :
      'text-orange-600 bg-orange-50 border-orange-100'
    }`}>
      {isPaid ? <CheckCircle2 size={14} /> : (isRejected ? <AlertTriangle size={14} /> : <Clock size={14} />)}
      {status} {date ? `on ${new Date(date).toLocaleDateString()}` : ''}
    </div>
  );
}
