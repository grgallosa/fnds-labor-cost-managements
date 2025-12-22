
import React from 'react';
import { UserRole } from '../types';
import { 
  Home, 
  ClipboardList, 
  CreditCard, 
  User as UserIcon, 
  LogOut,
  Users
} from 'lucide-react';

interface LayoutProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  userName: string;
  avatar?: string;
}

export const Layout: React.FC<LayoutProps> = ({ role, activeTab, onTabChange, onLogout, children, userName, avatar }) => {
  const tabs = role === UserRole.ADMIN 
    ? [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList },
        { id: 'requests', label: 'Wallet', icon: CreditCard },
        { id: 'users', label: 'Users', icon: Users },
      ]
    : [
        { id: 'home', label: 'Tasks', icon: ClipboardList },
        { id: 'payments', label: 'Earnings', icon: CreditCard },
        { id: 'profile', label: 'Profile', icon: UserIcon },
      ];

  return (
    <div className="flex flex-col min-h-screen pb-24 max-w-md mx-auto bg-gray-50 text-gray-900 relative">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
            {avatar ? (
              <img src={avatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={18} className="text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none mb-0.5">{userName}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors active:bg-gray-50"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 safe-bottom">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-indigo-600' : 'text-gray-300'
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
