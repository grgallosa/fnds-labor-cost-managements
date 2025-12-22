
import React, { useState, useRef } from 'react';
import { User, PaymentProfile, PaymentMethod } from '../../types';
import { Camera, User as UserIcon, Phone, Mail, Smartphone, UserCircle } from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  profile: PaymentProfile;
  setProfiles: React.Dispatch<React.SetStateAction<PaymentProfile[]>>;
  userId: string;
}

export default function EmployeeProfile({ user, onUpdateUser, profile, setProfiles, userId }: Props) {
  const [name, setName] = useState(user.name);
  const [contact, setContact] = useState(user.contact);
  
  // GCash Fields
  const [walletNumber, setWalletNumber] = useState(profile.walletIdentifier || '');
  const [walletName, setWalletName] = useState(profile.walletHolderName || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Save User Info
    onUpdateUser({ ...user, name, contact });
    
    // Save Payment Profile
    setProfiles(prev => {
      const otherProfiles = prev.filter(p => p.userId !== userId);
      const updatedProfile: PaymentProfile = {
        userId,
        defaultMethod: PaymentMethod.EWALLET,
        walletProvider: 'GCash',
        walletIdentifier: walletNumber,
        walletHolderName: walletName
      };
      return [...otherProfiles, updatedProfile];
    });

    alert('Profile & Wallet Updated Successfully');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} className="text-gray-300" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white active:scale-90 transition-all"
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Verified Laborer</p>
      </div>

      <div className="space-y-6 pb-12">
        {/* Personal Details Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon size={14} className="text-indigo-500" />
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal Details</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
              <input 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contact Phone</label>
              <input 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                value={contact} onChange={e => setContact(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} className="text-blue-500" />
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GCash Configuration</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">GCash Number</label>
              <input 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                placeholder="09xx xxx xxxx"
                value={walletNumber} 
                onChange={e => setWalletNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">GCash Account Name</label>
              <input 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                placeholder="Full Name as per GCash"
                value={walletName} 
                onChange={e => setWalletName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] hover:bg-black"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
}
