'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { X, UserPlus, Shield, User } from 'lucide-react';
import { UserAccount } from '@/lib/types';

interface ProvisionUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProvisionUserModal({ isOpen, onClose }: ProvisionUserModalProps) {
  const { addUser, branches } = useInventory();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('staff123');
  const [branch, setBranch] = useState(branches[0]?.name || 'HO');
  const [accountType, setAccountType] = useState<'user' | 'admin'>('user');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const generatedEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'}@shinegold.luxury`;

    addUser({
      name: cleanName,
      email: generatedEmail,
      password: password.trim() || 'staff123',
      role: accountType === 'admin' ? 'Master Admin' : 'Vault Manager',
      branch: branch || branches[0]?.name || 'HO',
      activeStatus: 'Active'
    });

    setName('');
    setPassword('staff123');
    setAccountType('user');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-[#fed65b] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline">Add New User</h3>
              <p className="text-xs text-slate-500 font-mono">Create Staff or Branch Login</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
              Full Name / Staff Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Branch 1 or Staff Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
              Account Access Type *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  accountType === 'user'
                    ? 'border-[#0f172a] bg-[#0f172a] text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                User (Staff)
              </button>
              <button
                type="button"
                onClick={() => setAccountType('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  accountType === 'admin'
                    ? 'border-[#0f172a] bg-[#0f172a] text-[#fed65b] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-[#d4af37]" />
                Admin (Full Control)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5">
              {accountType === 'admin'
                ? 'Admin can upload Excel, delete data & manage users.'
                : 'User can view stock, scan/verify branch items & use AI.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
              Assigned Branch *
            </label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            >
              {branches.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
              Login Password / PIN *
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="e.g. staff123"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a] font-mono"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0f172a] text-[#fed65b] hover:bg-slate-800 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
