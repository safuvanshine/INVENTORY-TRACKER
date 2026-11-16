'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { X, ArrowRightLeft, ArrowRight, MapPin } from 'lucide-react';

interface TransferItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    tagNo: string;
    item: string;
    branch: string;
    category: 'gold' | 'diamond';
  } | null;
}

export function TransferItemModal({ isOpen, onClose, item }: TransferItemModalProps) {
  const { initiateTransfer, branches } = useInventory();
  const { currentUser } = useAuth();

  const availableDestinationBranches = branches.filter(
    b => b.name.toUpperCase() !== (item?.branch || '').toUpperCase()
  );

  const [targetBranch, setTargetBranch] = useState<string>('S2');

  useEffect(() => {
    if (item) {
      const firstOther = branches.find(b => b.name.toUpperCase() !== item.branch.toUpperCase());
      setTargetBranch(firstOther?.name || 'HO');
    }
  }, [item, branches]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranch) return;
    initiateTransfer(
      item.category,
      item.id,
      targetBranch,
      currentUser?.name || item.branch
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-[#fed65b] flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline">Transfer Item to Branch</h3>
              <p className="text-xs text-slate-500 font-mono">Requires receiving branch acceptance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selected Item Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                Tag Number
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">{item.tagNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                Item
              </span>
              <span className="text-xs font-semibold text-slate-800">{item.item}</span>
            </div>
          </div>

          {/* Transfer Route Preview */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-center flex-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">From Branch</span>
              <span className="text-sm font-mono font-extrabold text-slate-900">{item.branch}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-center flex-1">
              <span className="text-[10px] font-mono uppercase text-blue-700 font-bold block">To Branch</span>
              <span className="text-sm font-mono font-extrabold text-blue-900">{targetBranch}</span>
            </div>
          </div>

          {/* Select Destination Branch */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Select Receiving Branch *
            </label>
            <select
              value={targetBranch}
              onChange={e => setTargetBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            >
              {availableDestinationBranches.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 font-mono mt-2 leading-relaxed">
              Tag <span className="font-bold text-slate-800">{item.tagNo}</span> will be sent to{' '}
              <span className="font-bold text-slate-800">{targetBranch}</span>. It will only be added into{' '}
              <span className="font-bold text-slate-800">{targetBranch}</span> stock after{' '}
              <span className="font-bold text-slate-800">{targetBranch}</span> clicks <strong>Accept</strong>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
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
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Send to {targetBranch}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
