
import React, { useState } from 'react';
import { User, AccountStatus, UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, XCircle, UserCircle, Phone, Smartphone, Mail, Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  users: User[];
  setUsers: (users: any) => void;
  profiles: any[];
  setProfiles: (profiles: any) => void;
}

export default function UserApprovals({ users }: Props) {
  const [filter, setFilter] = useState<AccountStatus | 'ALL'>(AccountStatus.PENDING);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const filteredUsers = users.filter(u => u.role === UserRole.EMPLOYEE && (filter === 'ALL' ? true : u.accountStatus === filter));

  const handleAction = async (userId: string, status: AccountStatus) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    setProcessingId(userId);
    try {
      // This deletes the profile from the public.profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert("Error deleting profile: " + err.message);
    } finally {
      setProcessingId(null);
    }
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
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
            <UserCircle size={32} className="mx-auto text-gray-100 mb-4" />
            <p className="text-xs text-gray-400 font-medium">No users found in this category</p>
          </div>
        ) : (
          filteredUsers.map(u => (
            <div key={u.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100 font-bold text-lg">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{u.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Mail size={10} /> {u.email}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setConfirmDeleteId(u.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-xs font-semibold text-gray-700">{u.contact || 'N/A'}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-xs font-bold uppercase ${
                    u.accountStatus === AccountStatus.APPROVED ? 'text-emerald-600' :
                    u.accountStatus === AccountStatus.REJECTED ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {u.accountStatus}
                  </p>
                </div>
              </div>

              {confirmDeleteId === u.id ? (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-red-700 uppercase">Delete this profile?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold text-slate-400">No</button>
                    <button onClick={() => handleDeleteProfile(u.id)} className="text-[10px] font-bold text-red-600 underline">Yes, Delete</button>
                  </div>
                </div>
              ) : u.accountStatus === AccountStatus.PENDING && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    disabled={processingId === u.id}
                    onClick={() => handleAction(u.id, AccountStatus.REJECTED)}
                    className="py-3 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button 
                    disabled={processingId === u.id}
                    onClick={() => handleAction(u.id, AccountStatus.APPROVED)}
                    className="py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-50"
                  >
                    {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
