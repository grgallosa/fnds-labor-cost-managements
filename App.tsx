
import React, { useState, useEffect } from 'react';
import { UserRole, User, Task, PaymentRequest, PaymentProfile, TaskStatus, PaymentStatus, PaymentMethod, WithdrawalRequest, WithdrawalStatus, AccountStatus } from './types';
import { supabase } from './lib/supabase';
import Login from './screens/Login';
import AdminDashboard from './screens/admin/Dashboard';
import AdminTasks from './screens/admin/Tasks';
import AdminRequests from './screens/admin/Requests';
import UserApprovals from './screens/admin/UserApprovals';
import EmployeeTasks from './screens/employee/Tasks';
import EmployeePayments from './screens/employee/Payments';
import EmployeeProfile from './screens/employee/Profile';
import { Layout } from './components/Layout';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }

      if (profile) {
        setUser({
          ...profile,
          accountStatus: profile.account_status
        });
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            name: authUser.user_metadata.name || 'User',
            email: authUser.email || '',
            role: UserRole.EMPLOYEE,
            contact: authUser.user_metadata.contact || '',
            accountStatus: AccountStatus.PENDING
          });
        }
      }
    } catch (err) {
      console.error("fetchUserProfile failed:", err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session) {
          await fetchUserProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.accountStatus !== AccountStatus.APPROVED) return;

    const fetchData = async () => {
      try {
        const [tasksRes, requestsRes, withdrawalsRes, profilesRes] = await Promise.all([
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*')
        ]);

        if (tasksRes.data) {
          setTasks(tasksRes.data.map(t => ({
            ...t,
            createdBy: t.created_by,
            createdAt: t.created_at,
            assignedTo: t.assigned_to,
            isBatch: t.is_batch,
            subTasks: t.sub_tasks,
            completionPhoto: t.completion_photo,
            completionLocationVerified: t.completion_location_verified,
            rejectionReason: t.rejection_reason,
            paymentMethod: t.payment_method
          })));
        }
        
        if (requestsRes.data) {
          setRequests(requestsRes.data.map(r => ({
            ...r,
            taskId: r.task_id,
            employeeId: r.employee_id,
            createdAt: r.created_at,
            paidAt: r.paid_at
          })));
        }

        if (withdrawalsRes.data) {
          setWithdrawals(withdrawalsRes.data.map(w => ({
            ...w,
            employeeId: w.employee_id,
            createdAt: w.created_at,
            processedAt: w.processed_at,
            receiptImage: w.receipt_image,
            rejectionReason: w.rejection_reason,
            methodSnapshot: w.method_snapshot
          })));
        }

        if (profilesRes.data) {
          setAllUsers(profilesRes.data.map(u => ({
            ...u,
            accountStatus: u.account_status
          })));
        }
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };

    fetchData();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogin = async (email: string, password?: string) => {
    if (!password) {
      alert("Password is required.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await fetchUserProfile(data.user.id);
      setActiveTab('home');
    }
  };

  const handleDemoLogin = (role: 'ADMIN' | 'EMPLOYEE') => {
    if (role === 'ADMIN') {
      setUser({
        id: 'demo-admin-id',
        name: 'Demo Administrator',
        email: 'admin@demo.com',
        role: UserRole.ADMIN,
        contact: '+63 900 000 0000',
        accountStatus: AccountStatus.APPROVED
      });
    } else {
      setUser({
        id: 'demo-employee-id',
        name: 'Demo Employee',
        email: 'employee@demo.com',
        role: UserRole.EMPLOYEE,
        contact: '+63 900 111 2222',
        accountStatus: AccountStatus.APPROVED
      });
    }
    setActiveTab('home');
  };

  const handleRegister = async (data: any): Promise<boolean> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: data.name,
          contact: data.contact,
          gcash_number: data.gcashNumber,
          gcash_name: data.gcashName
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error("This email is already registered. Please sign in instead.");
      }
      throw authError;
    }

    if (authData.user) {
      try {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: data.name,
          email: data.email,
          contact: data.contact,
          role: UserRole.EMPLOYEE,
          account_status: AccountStatus.PENDING,
        });
      } catch (err) {
        console.warn("Profile sync delay:", err);
      }

      return true;
    }
    return false;
  };

  const handleResendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-600">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        onDemoLogin={handleDemoLogin} 
        onResendVerification={handleResendVerification}
      />
    );
  }

  if (user.role !== UserRole.ADMIN && user.accountStatus !== AccountStatus.APPROVED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8 flex justify-center">
            {user.accountStatus === AccountStatus.REJECTED ? (
              <div className="p-5 bg-red-50 text-red-500 rounded-full">
                <ShieldAlert size={48} />
              </div>
            ) : (
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                <Clock size={48} />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-black text-slate-900 mb-3">
            {user.accountStatus === AccountStatus.REJECTED ? 'Account Rejected' : 'Verification Pending'}
          </h2>
          
          <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
            {user.accountStatus === AccountStatus.REJECTED 
              ? `Your application was not approved. ${user.rejectionReason ? `Reason: ${user.rejectionReason}` : 'Please contact support for details.'}`
              : 'Your account has been created successfully. An administrator will review your details shortly.'}
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => fetchUserProfile(user.id)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <RefreshCw size={18} />
              Check Status
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (user.role === UserRole.ADMIN) {
      switch (activeTab) {
        case 'home': return <AdminDashboard tasks={tasks} requests={requests} withdrawals={withdrawals} onNavigate={setActiveTab} />;
        case 'tasks': return <AdminTasks tasks={tasks} setTasks={() => {}} />; 
        case 'requests': return <AdminRequests requests={requests} setRequests={() => {}} withdrawals={withdrawals} setWithdrawals={() => {}} tasks={tasks} setTasks={() => {}} users={allUsers} />;
        case 'users': return <UserApprovals users={allUsers} setUsers={() => {}} profiles={[]} setProfiles={() => {}} />;
        default: return <AdminDashboard tasks={tasks} requests={requests} withdrawals={withdrawals} onNavigate={setActiveTab} />;
      }
    } else {
      switch (activeTab) {
        case 'home': return <EmployeeTasks tasks={tasks} setTasks={() => {}} requests={requests} userId={user.id} setRequests={() => {}} profile={{ userId: user.id, defaultMethod: PaymentMethod.EWALLET }} />;
        case 'payments': return <EmployeePayments requests={requests} withdrawals={withdrawals} setWithdrawals={() => {}} tasks={tasks} userId={user.id} profile={{ userId: user.id, defaultMethod: PaymentMethod.EWALLET }} />;
        case 'profile': return <EmployeeProfile user={user} onUpdateUser={() => {}} profile={{ userId: user.id, defaultMethod: PaymentMethod.EWALLET }} setProfiles={() => {}} userId={user.id} />;
        default: return <EmployeeTasks tasks={tasks} setTasks={() => {}} requests={requests} userId={user.id} setRequests={() => {}} profile={{ userId: user.id, defaultMethod: PaymentMethod.EWALLET }} />;
      }
    }
  };

  return (
    <Layout 
      role={user.role} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}
      userName={user.name} avatar={user.avatar}
    >
      {renderContent()}
    </Layout>
  );
}
