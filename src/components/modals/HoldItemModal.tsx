'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { X, Lock, Clock, MapPin } from 'lucide-react';

interface HoldItemModalProps {
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

export function HoldItemModal({ isOpen, onClose, item }: HoldItemModalProps) {
  const { holdItem, branches } = useInventory();
  const { currentUser } = useAuth();

  const [selectedBranch, setSelectedBranch] = useState<string>('HO');
  const [selectedDays, setSelectedDays] = useState<1 | 2 | 3>(2);

  useEffect(() => {
    if (item) {
      setSelectedBranch(currentUser?.branch || item.branch || branches[0]?.name || 'HO');
      setSelectedDays(2);
    }
  }, [item, currentUser, branches]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    holdItem(
      item.category,
      item.id,
      selectedBranch,
      selectedDays,
      currentUser?.name || selectedBranch
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
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline">Hold Item (Max 3 Days)</h3>
              <p className="text-xs text-slate-500 font-mono">Reserve item for branch customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selected Item Info Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold block">
                Selected Tag Number
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

          {/* Branch Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Hold for Branch *
            </label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            >
              {branches.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hold Duration (1, 2, or 3 Days) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Hold Duration (Maximum 3 Days) *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {([1, 2, 3] as const).map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`py-3 px-3 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                    selectedDays === days
                      ? 'border-[#0f172a] bg-[#0f172a] text-[#fed65b] shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base font-extrabold">{days}</span>
                  <span className="text-[10px] uppercase tracking-wider">
                    {days === 1 ? 'Day' : 'Days'}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-2">
              Tag <span className="font-bold text-slate-800">{item.tagNo}</span> will be marked on hold at{' '}
              <span className="font-bold text-slate-800">{selectedBranch}</span> for{' '}
              <span className="font-bold text-slate-800">
                {selectedDays} {selectedDays === 1 ? 'Day' : 'Days'}
              </span>
              . Admin will confirm with branch before releasing back to stock.
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
              <Lock className="w-3.5 h-3.5" />
              Hold for {selectedDays} {selectedDays === 1 ? 'Day' : 'Days'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
