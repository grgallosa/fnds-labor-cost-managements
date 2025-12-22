
import React, { useState } from 'react';
import { User, AccountStatus, UserRole, PaymentProfile, PaymentMethod } from '../../types';
import { CheckCircle2, XCircle, Search, UserCircle, Phone, Smartphone, Mail, AlertTriangle } from 'lucide-react';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  profiles: PaymentProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<PaymentProfile[]>>;
}

export default function UserApprovals({ users, setUsers, profiles, setProfiles }: Props) {
  const [filter, setFilter] = useState<AccountStatus | 'ALL'>(AccountStatus.PENDING);
  
  const pendingUsers = users.filter(u => u.role === UserRole.EMPLOYEE && (filter === 'ALL' ? true : u.accountStatus === filter));

  const handleAction = (userId: string, status: AccountStatus) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, accountStatus: status } : u
    ));
  };

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Account Applications</h2>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full">
          {([AccountStatus.PENDING, AccountStatus.APPROVED, AccountStatus.REJECTED, 'ALL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
                filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {f === 'PENDING' ? 'New' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
            <UserCircle size={32} className="mx-auto text-gray-100 mb-4" />
            <p className="text-xs text-gray-400 font-medium">No applications found</p>
          </div>
        ) : (
          pendingUsers.map(u => {
            const profile = profiles.find(p => p.userId === u.id);
            return (
              <div key={u.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-indigo-600 border border-indigo-50 font-bold text-lg">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{u.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                          <Mail size={10} /> {u.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                    u.accountStatus === AccountStatus.PENDING ? 'bg-orange-50 text-orange-600' :
                    u.accountStatus === AccountStatus.APPROVED ? 'bg-green-50 text-green-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {u.accountStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Phone size={10} /> Contact
                    </p>
                    <p className="text-xs font-semibold text-gray-700">{u.contact}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Smartphone size={10} /> GCash
                    </p>
                    <p className="text-xs font-semibold text-indigo-900">{profile?.walletIdentifier || 'Not set'}</p>
                  </div>
                </div>

                {u.accountStatus === AccountStatus.PENDING && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleAction(u.id, AccountStatus.REJECTED)}
                      className="py-3 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:bg-red-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(u.id, AccountStatus.APPROVED)}
                      className="py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-indigo-100"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
