
import React, { useState, useEffect } from 'react';
import { UserRole, User, Task, PaymentRequest, PaymentProfile, TaskStatus, PaymentStatus, PaymentMethod, WithdrawalRequest, WithdrawalStatus, AccountStatus } from './types';
import Login from './screens/Login';
import AdminDashboard from './screens/admin/Dashboard';
import AdminTasks from './screens/admin/Tasks';
import AdminRequests from './screens/admin/Requests';
import UserApprovals from './screens/admin/UserApprovals';
import EmployeeTasks from './screens/employee/Tasks';
import EmployeePayments from './screens/employee/Payments';
import EmployeeProfile from './screens/employee/Profile';
import { Layout } from './components/Layout';

// Storage Keys
const KEYS = {
  USER: 'fnds_user',
  ALL_USERS: 'fnds_all_users',
  TASKS: 'fnds_tasks',
  REQUESTS: 'fnds_requests',
  WITHDRAWALS: 'fnds_withdrawals',
  PROFILES: 'fnds_profiles'
};

// Initial Data (Fallbacks)
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Alex Admin', email: 'admin@fnds.com', role: UserRole.ADMIN, contact: '+123456789', accountStatus: AccountStatus.APPROVED },
  { id: '2', name: 'John Doe', email: 'john@fnds.com', role: UserRole.EMPLOYEE, contact: '+987654321', accountStatus: AccountStatus.APPROVED },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Warehouse Inventory', description: 'Count and log all incoming stock in Section A.', amount: 150.00, date: new Date().toISOString(), location: 'Site A', status: TaskStatus.OPEN, createdBy: '1', createdAt: new Date().toISOString(), paymentMethod: PaymentMethod.CASH },
];

const INITIAL_PROFILES: PaymentProfile[] = [
  { userId: '2', defaultMethod: PaymentMethod.EWALLET, walletProvider: 'GCash', walletIdentifier: '09171234567', walletHolderName: 'John Doe' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(KEYS.ALL_USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activeTab, setActiveTab] = useState('home');

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(KEYS.TASKS);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [requests, setRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem(KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem(KEYS.WITHDRAWALS);
    return saved ? JSON.parse(saved) : [];
  });

  const [profiles, setProfiles] = useState<PaymentProfile[]>(() => {
    const saved = localStorage.getItem(KEYS.PROFILES);
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem(KEYS.ALL_USERS, JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(withdrawals)); }, [withdrawals]);
  useEffect(() => { localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => {
    if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.USER);
  }, [user]);

  const handleLogin = (email: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      if (foundUser.role === UserRole.EMPLOYEE && foundUser.accountStatus !== AccountStatus.APPROVED) {
        if (foundUser.accountStatus === AccountStatus.PENDING) {
          alert('Your account is still pending approval by Admin.');
        } else {
          alert('Your account application was rejected. Please contact support.');
        }
        return;
      }
      setUser(foundUser);
      setActiveTab('home');
    } else {
      alert('User not found. Try admin@fnds.com or sign up!');
    }
  };

  const handleRegister = (data: any) => {
    const newUserId = `u-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: data.name,
      email: data.email,
      role: UserRole.EMPLOYEE,
      contact: data.contact,
      accountStatus: AccountStatus.PENDING
    };

    const newProfile: PaymentProfile = {
      userId: newUserId,
      defaultMethod: PaymentMethod.EWALLET,
      walletProvider: 'GCash',
      walletIdentifier: data.gcashNumber,
      walletHolderName: data.gcashName
    };

    setAllUsers(prev => [...prev, newUser]);
    setProfiles(prev => [...prev, newProfile]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderContent = () => {
    if (user.role === UserRole.ADMIN) {
      switch (activeTab) {
        case 'home': return <AdminDashboard tasks={tasks} requests={requests} withdrawals={withdrawals} onNavigate={setActiveTab} />;
        case 'tasks': return <AdminTasks tasks={tasks} setTasks={setTasks} />;
        case 'requests': return (
          <AdminRequests 
            requests={requests} setRequests={setRequests} 
            withdrawals={withdrawals} setWithdrawals={setWithdrawals}
            tasks={tasks} setTasks={setTasks} 
            users={allUsers}
          />
        );
        case 'users': return <UserApprovals users={allUsers} setUsers={setAllUsers} profiles={profiles} setProfiles={setProfiles} />;
        default: return <AdminDashboard tasks={tasks} requests={requests} withdrawals={withdrawals} onNavigate={setActiveTab} />;
      }
    } else {
      const userProfile = profiles.find(p => p.userId === user.id) || { userId: user.id, defaultMethod: PaymentMethod.CASH };
      switch (activeTab) {
        case 'home': return <EmployeeTasks tasks={tasks} setTasks={setTasks} requests={requests} userId={user.id} setRequests={setRequests} profile={userProfile} />;
        case 'payments': return <EmployeePayments requests={requests} withdrawals={withdrawals} setWithdrawals={setWithdrawals} tasks={tasks} userId={user.id} profile={userProfile} />;
        case 'profile': return <EmployeeProfile user={user} onUpdateUser={handleUpdateUser} profile={userProfile} setProfiles={setProfiles} userId={user.id} />;
        default: return <EmployeeTasks tasks={tasks} setTasks={setTasks} requests={requests} userId={user.id} setRequests={setRequests} profile={userProfile} />;
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
