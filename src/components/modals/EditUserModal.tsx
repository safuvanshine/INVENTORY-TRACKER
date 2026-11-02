'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { X, Pencil, UserCheck } from 'lucide-react';
import { UserAccount } from '@/lib/types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const { updateUser, branches } = useInventory();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserAccount['role']>('Vault Manager');
  const [branch, setBranch] = useState('');
  const [activeStatus, setActiveStatus] = useState<UserAccount['activeStatus']>('Active');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setBranch(user.branch || (branches[0]?.name ?? 'London Mayfair Vault'));
      setActiveStatus(user.activeStatus);
    }
  }, [user, branches]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    updateUser(user.id, {
      name: name.trim(),
      email: email.trim(),
      role,
      branch,
      activeStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-[#fed65b] flex items-center justify-center shadow-xs">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline">Edit User Account</h3>
              <p className="text-xs text-slate-500 font-mono">Update Personnel Name & Access Role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Safuwan"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
              Enterprise Email *
            </label>
            <input
              type="email"
              required
              placeholder="name@shinegold.luxury"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                Security Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              >
                <option value="Vault Manager">Vault Manager</option>
                <option value="Compliance Officer">Compliance Officer</option>
                <option value="Auditor">Auditor</option>
                <option value="Operator">Operator</option>
                <option value="Master Admin">Master Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                Assigned Branch
              </label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
              Account Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Active', 'Idle', 'Offline'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    activeStatus === status
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'Active'
                        ? 'bg-emerald-400'
                        : status === 'Idle'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#0f172a] text-[#fed65b] hover:bg-slate-800 shadow-md flex items-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
