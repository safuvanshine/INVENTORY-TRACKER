'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { LiveTicker } from '@/components/layout/LiveTicker';
import { formatNumber } from '@/lib/utils';
import {
  ShoppingBag,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  MapPin,
  Clock,
  Scale
} from 'lucide-react';

export default function GoldSalePage() {
  const { goldItems, soldGoldItems, branches, markGoldItemSold } = useInventory();
  const { currentUser, isAdmin } = useAuth();

  // Branch lock: Staff user is strictly locked to their own branch; Admin can pick any branch
  const [selectedBranch, setSelectedBranch] = useState<string>('HO');
  const [scanInput, setScanInput] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [matchedItemId, setMatchedItemId] = useState<string | null>(null);
  const [sellingItem, setSellingItem] = useState<{
    id: string;
    tagNo: string;
    item: string;
    brand: string;
    weight: number;
    branch: string;
  } | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.branch) {
      setSelectedBranch(currentUser.branch);
    }
  }, [currentUser]);

  const activeBranch = isAdmin ? selectedBranch : (currentUser?.branch || 'HO');

  // Only Gold items belonging strictly to activeBranch (and not in pending transfer)
  const branchGoldItems = useMemo(() => {
    const bKey = activeBranch.trim().toUpperCase();
    return goldItems.filter(
      item =>
        (item.branch || '').trim().toUpperCase() === bKey &&
        !item.transferInfo
    );
  }, [goldItems, activeBranch]);

  // Filtered branch items by search
  const filteredBranchItems = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return branchGoldItems;
    return branchGoldItems.filter(
      i =>
        i.tagNo.toLowerCase().includes(q) ||
        i.item.toLowerCase().includes(q) ||
        (i.certificateNo && i.certificateNo.toLowerCase().includes(q)) ||
        (i.brand && i.brand.toLowerCase().includes(q))
    );
  }, [branchGoldItems, tableSearch]);

  // Today's date YYYY-MM-DD
  const todayKey = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Today's Sold items in this branch
  const todaysBranchSold = useMemo(() => {
    const bKey = activeBranch.trim().toUpperCase();
    return soldGoldItems.filter(
      s => s.soldDate === todayKey && s.branch.trim().toUpperCase() === bKey
    );
  }, [soldGoldItems, activeBranch, todayKey]);

  const totalBranchWeight = branchGoldItems.reduce((s, i) => s + (i.weight || 0), 0);
  const todaySoldWeight = todaysBranchSold.reduce((s, i) => s + (i.weight || 0), 0);

  // Barcode / Tag Scan Submit
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setMatchedItemId(null);

    const raw = scanInput.trim();
    if (!raw) return;
    const cleanTag = raw.toUpperCase();

    // 1. Check in this branch's gold stock
    const matchInBranch = branchGoldItems.find(i => i.tagNo.trim().toUpperCase() === cleanTag);
    if (matchInBranch) {
      setMatchedItemId(matchInBranch.id);
      setSellingItem({
        id: matchInBranch.id,
        tagNo: matchInBranch.tagNo,
        item: matchInBranch.item,
        brand: matchInBranch.brand,
        weight: matchInBranch.weight,
        branch: matchInBranch.branch
      });
      setScanInput('');
      return;
    }

    // 2. Check if tag exists in ANOTHER branch
    const matchInOtherBranch = goldItems.find(i => i.tagNo.trim().toUpperCase() === cleanTag);
    if (matchInOtherBranch) {
      if (matchInOtherBranch.transferInfo) {
        setScanError(
          `Tag "${raw}" is currently in transfer (${matchInOtherBranch.transferInfo.fromBranch} ➔ ${matchInOtherBranch.transferInfo.toBranch}) and cannot be sold.`
        );
      } else {
        setScanError(
          `Access Denied: Tag "${raw}" belongs to Branch ${matchInOtherBranch.branch}, NOT ${activeBranch}! You can only sell items in ${activeBranch}.`
        );
      }
      return;
    }

    // 3. Not found
    setScanError(`Tag "${raw}" not found in ${activeBranch} Gold stock.`);
  };

  const handleConfirmSold = () => {
    if (!sellingItem) return;
    markGoldItemSold(sellingItem.id, currentUser?.name || activeBranch);
    setSellingItem(null);
    setMatchedItemId(null);
    setScanError('');
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      <LiveTicker mode="gold" />

      <main className="p-5 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                Branch Gold Sales Counter
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0f172a] text-[#fed65b] text-[10px] font-mono font-bold uppercase">
                Branch: {activeBranch}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-headline">
              Gold Sale ({activeBranch})
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Scan barcode or select an item from {activeBranch} stock to mark it SOLD
            </p>
          </div>

          {/* Branch Selector (Editable only for Admin; Locked badge for Staff) */}
          <div className="flex items-center gap-2.5">
            {isAdmin ? (
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 shadow-xs">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={e => {
                    setSelectedBranch(e.target.value);
                    setScanError('');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900 text-[#fed65b] rounded-xl px-4 py-2.5 text-xs font-mono font-bold shadow-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked to Branch: {activeBranch}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Quick Barcode / Tag Number Scanner Box */}
        <section className="bg-[#0f172a] text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-headline text-white">
                  Quick Sell — Scan Barcode or Type Tag Number
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Only Gold items in <span className="text-[#fed65b] font-bold">{activeBranch}</span> can be marked SOLD here
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                <span className="text-slate-400">Available ({activeBranch}): </span>
                <span className="font-bold text-[#fed65b]">
                  {branchGoldItems.length} pcs ({formatNumber(totalBranchWeight, 3)} g)
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/50">
                <span className="text-emerald-300">Sold Today: </span>
                <span className="font-bold text-white">
                  {todaysBranchSold.length} pcs ({formatNumber(todaySoldWeight, 3)} g)
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={e => {
                  setScanInput(e.target.value);
                  if (scanError) setScanError('');
                }}
                placeholder={`Scan or enter ${activeBranch} Gold Tag Number (e.g. AU-LDN-001)...`}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-mono font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              Find & Mark Sold
            </button>
          </form>

          {scanError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </section>

        {/* Main Grid: Branch Available Gold Stock + Today's Sold in This Branch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Branch's Available Gold Stock (8 cols) */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-bold text-slate-900 font-headline">
                  {activeBranch} Available Gold Stock ({filteredBranchItems.length})
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  placeholder={`Search in ${activeBranch}...`}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[540px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-500 z-10">
                  <tr>
                    <th className="px-4 py-3">TAG NUMBER</th>
                    <th className="px-4 py-3">ITEM</th>
                    <th className="px-4 py-3">BRAND</th>
                    <th className="px-4 py-3 text-right">WEIGHT</th>
                    <th className="px-4 py-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredBranchItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-sans">
                        No available Gold items found in Branch {activeBranch}.
                      </td>
                    </tr>
                  ) : (
                    filteredBranchItems.map(item => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          matchedItemId === item.id
                            ? 'bg-emerald-50'
                            : item.holdInfo
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                            <span>{item.tagNo}</span>
                            {item.holdInfo && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                                HOLD
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-semibold text-slate-800 max-w-[180px] truncate">
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.brand}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatNumber(item.weight, 3)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">g</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setSellingItem({
                                id: item.id,
                                tagNo: item.tagNo,
                                item: item.item,
                                brand: item.brand,
                                weight: item.weight,
                                branch: item.branch
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            Sold
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* RIGHT: Today's Sold Items in This Branch (4 cols) */}
          <section className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-emerald-950 font-headline">
                  Sold Today in {activeBranch}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold">
                {todaysBranchSold.length} pcs
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
              {todaysBranchSold.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-slate-400 font-mono">
                  No Gold items marked SOLD today in {activeBranch} yet.
                </div>
              ) : (
                todaysBranchSold.map(sold => (
                  <div key={sold.id} className="p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-extrabold text-slate-900">{sold.tagNo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                          SOLD
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{sold.item}</p>
                      <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {sold.soldTime} • {sold.soldBy}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        {formatNumber(sold.weight, 3)} g
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Confirm Sold Modal */}
      {sellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-headline">Confirm Gold Item Sold</h3>
                <p className="text-xs text-slate-500 font-mono">Item will be recorded in Admin Sold History</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Tag Number:</span>
                <span className="font-bold text-slate-900">{sellingItem.tagNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-900">{sellingItem.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Brand:</span>
                <span className="font-bold text-slate-800">{sellingItem.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weight:</span>
                <span className="font-bold text-slate-900">{formatNumber(sellingItem.weight, 3)} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="font-bold text-emerald-700">{sellingItem.branch}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                autoFocus
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Confirm Sold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
