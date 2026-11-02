'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { LiveTicker } from '@/components/layout/LiveTicker';
import { formatNumber, formatUsd, exportToCsv } from '@/lib/utils';
import {
  Layers,
  Gem,
  CheckCircle2,
  Filter,
  Download,
  X,
  Search,
  Barcode,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCheck,
  Volume2,
  VolumeX,
  ScanLine,
  User,
  UserCheck
} from 'lucide-react';

const STANDARD_BRANCH_CODES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

interface VerifiedRecord {
  verifiedAt: string;
  verifiedBy: string;
}

// Helper to extract clean branch code (e.g. "Branch (S1)" -> "S1", "S1" -> "S1")
const extractBranchCode = (val: string = ''): string => {
  if (!val) return '';
  const clean = val.trim().toUpperCase();
  const match = clean.match(/\b(S\d+)\b/);
  if (match) return match[1];
  return clean.replace(/^BRANCH\s*\((.*)\)$/i, '$1').replace(/^BRANCH\s*/i, '').trim();
};

// Robust branch matcher preventing cross-branch bleed (e.g. S3 never matches S1)
const isItemInBranch = (
  itemBranch: string = '',
  itemTag: string = '',
  filterKey: string
): boolean => {
  if (!filterKey || filterKey === 'ALL') return true;

  const itemB = (itemBranch || '').trim().toLowerCase();
  const filterB = (filterKey || '').trim().toLowerCase();

  // Exact match
  if (itemB === filterB) return true;

  const itemCode = extractBranchCode(itemBranch);
  const filterCode = extractBranchCode(filterKey);

  // If both have branch codes like S1, S2, S3
  if (itemCode && filterCode) {
    return itemCode === filterCode;
  }

  // Fallback for custom branch strings
  return itemB === filterB || itemB.includes(filterB);
};

// Web Audio API feedback for barcode gun / rapid scanning
const playAudioFeedback = (type: 'success' | 'error') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // Ignore audio errors if audio context is blocked
  }
};

export default function BranchesPage() {
  const { goldItems, diamondItems, goldSpotPrice, showToast, addAuditLog } = useInventory();

  // Selection states
  const [selectedBranchKey, setSelectedBranchKey] = useState<string>('S1');
  const [tempBranchKey, setTempBranchKey] = useState<string>('S1');
  const [activeCategory, setActiveCategory] = useState<'gold' | 'diamonds'>('gold');

  // Auditor / Verifier Name state
  const [verifierName, setVerifierName] = useState<string>('Safuwan');

  // Load saved verifier name from localStorage on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('shine_audit_verifier_name');
      if (savedName) setVerifierName(savedName);
    } catch {
      // Ignore
    }
  }, []);

  const handleVerifierChange = (name: string) => {
    setVerifierName(name);
    try {
      localStorage.setItem('shine_audit_verifier_name', name);
    } catch {
      // Ignore
    }
  };

  // Applied verification criteria
  const [appliedCriteria, setAppliedCriteria] = useState<{ branch: string; category: 'gold' | 'diamonds' }>({
    branch: 'S1',
    category: 'gold'
  });
  const [isWorkspaceActive, setIsWorkspaceActive] = useState<boolean>(true);

  // Scanner & Search states
  const [scanInput, setScanInput] = useState<string>('');
  const [pendingSearch, setPendingSearch] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Verified items map: TagNo -> VerifiedRecord (verifiedAt + verifiedBy)
  const [verifiedTagsMap, setVerifiedTagsMap] = useState<Record<string, VerifiedRecord | string>>({});

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Extract all unique branch names from current gold and diamond inventory
  const dataBranches = useMemo(() => {
    const set = new Set<string>();
    goldItems.forEach(i => {
      if (i.branch && i.branch.trim()) set.add(i.branch.trim());
    });
    diamondItems.forEach(i => {
      if (i.branch && i.branch.trim()) set.add(i.branch.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [goldItems, diamondItems]);

  // Distinct custom branches from data that are not standard S1-S8 codes
  const customBranches = useMemo(() => {
    const stdCodes = new Set(STANDARD_BRANCH_CODES);
    return dataBranches.filter(
      b => !stdCodes.has(extractBranchCode(b))
    );
  }, [dataBranches]);

  // Dynamic totals for selected branch (before or after apply)
  const branchGoldItems = useMemo(() => {
    return goldItems.filter(item => isItemInBranch(item.branch, item.tagNo, selectedBranchKey));
  }, [goldItems, selectedBranchKey]);

  const branchDiamondItems = useMemo(() => {
    return diamondItems.filter(item => isItemInBranch(item.branch, item.tagNo, selectedBranchKey));
  }, [diamondItems, selectedBranchKey]);

  const branchGoldTotalKg = useMemo(() => {
    return branchGoldItems.reduce((sum, i) => sum + (i.weight || 0), 0);
  }, [branchGoldItems]);

  const branchDiamondTotalCt = useMemo(() => {
    return branchDiamondItems.reduce((sum, i) => sum + (i.carat || 0), 0);
  }, [branchDiamondItems]);

  // Active branch display label (Clean - without mock vault names)
  const activeBranchCode = useMemo(() => {
    if (selectedBranchKey === 'ALL') return 'ALL';
    return extractBranchCode(selectedBranchKey);
  }, [selectedBranchKey]);

  const activeBranchLabel = useMemo(() => {
    if (selectedBranchKey === 'ALL') return 'All Branches';
    return `Branch (${activeBranchCode})`;
  }, [selectedBranchKey, activeBranchCode]);

  // Persistence: load verified tags from localStorage when appliedCriteria changes
  useEffect(() => {
    const storageKey = `shine_audit_verified_${appliedCriteria.branch}_${appliedCriteria.category}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setVerifiedTagsMap(JSON.parse(saved));
      } else {
        setVerifiedTagsMap({});
      }
    } catch {
      setVerifiedTagsMap({});
    }
  }, [appliedCriteria]);

  // Save verified tags to localStorage
  const updateVerifiedMap = (newMap: Record<string, VerifiedRecord | string>) => {
    setVerifiedTagsMap(newMap);
    const storageKey = `shine_audit_verified_${appliedCriteria.branch}_${appliedCriteria.category}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMap));
    } catch {
      // Ignore quota errors
    }
  };

  // The master item pool based on applied criteria (Strict filtering)
  const appliedPool = useMemo(() => {
    if (appliedCriteria.category === 'gold') {
      return goldItems.filter(item => isItemInBranch(item.branch, item.tagNo, appliedCriteria.branch));
    } else {
      return diamondItems.filter(item => isItemInBranch(item.branch, item.tagNo, appliedCriteria.branch));
    }
  }, [goldItems, diamondItems, appliedCriteria]);

  // Left Box: Pending (Unverified) Items
  const pendingItems = useMemo(() => {
    return appliedPool.filter(item => !verifiedTagsMap[item.tagNo.trim().toUpperCase()]);
  }, [appliedPool, verifiedTagsMap]);

  // Left Box filtered by search
  const filteredPendingItems = useMemo(() => {
    if (!pendingSearch.trim()) return pendingItems;
    const q = pendingSearch.toLowerCase();
    return pendingItems.filter(
      item =>
        item.tagNo.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q) ||
        (item.certificateNo && item.certificateNo.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [pendingItems, pendingSearch]);

  // Right Box: Verified (Scanned) Items with Auditor Name
  const verifiedItems = useMemo(() => {
    return appliedPool
      .filter(item => Boolean(verifiedTagsMap[item.tagNo.trim().toUpperCase()]))
      .map(item => {
        const val = verifiedTagsMap[item.tagNo.trim().toUpperCase()];
        const verifiedAt = typeof val === 'object' && val !== null ? val.verifiedAt : (typeof val === 'string' ? val : 'Verified');
        const verifiedBy = typeof val === 'object' && val !== null ? val.verifiedBy : (verifierName || 'Auditor');

        return {
          ...item,
          verifiedAt,
          verifiedBy
        };
      });
  }, [appliedPool, verifiedTagsMap, verifierName]);

  // Balance & Reconciliation Totals
  const totalCount = appliedPool.length;
  const verifiedCount = verifiedItems.length;
  const balanceCount = pendingItems.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  // Weight / Carat balances
  const totalAppliedWeight = appliedCriteria.category === 'gold'
    ? appliedPool.reduce((sum, i: any) => sum + (i.weight || 0), 0)
    : appliedPool.reduce((sum, i: any) => sum + (i.carat || 0), 0);

  const verifiedWeight = appliedCriteria.category === 'gold'
    ? verifiedItems.reduce((sum, i: any) => sum + (i.weight || 0), 0)
    : verifiedItems.reduce((sum, i: any) => sum + (i.carat || 0), 0);

  const balanceWeight = Math.max(0, totalAppliedWeight - verifiedWeight);

  // Apply Selection Handler
  const handleApplySelection = () => {
    setSelectedBranchKey(tempBranchKey);
    setAppliedCriteria({
      branch: tempBranchKey,
      category: activeCategory
    });
    setIsWorkspaceActive(true);
    setScanFeedback(null);
    showToast(
      'Stock Verification Activated',
      `Ready to verify ${activeCategory.toUpperCase()} stock for Branch (${extractBranchCode(tempBranchKey)}).`,
      'info'
    );
    // Auto-focus scanner input
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  };

  // Fast Scan / Type Verification
  const processTagVerification = (tagToVerify: string) => {
    const rawTag = tagToVerify.trim();
    if (!rawTag) return;
    const cleanTag = rawTag.toUpperCase();

    // Check if already verified
    if (verifiedTagsMap[cleanTag]) {
      if (soundEnabled) playAudioFeedback('error');
      setScanFeedback({
        message: `Tag "${rawTag}" is ALREADY verified!`,
        type: 'warning'
      });
      return;
    }

    // Find in pending items
    const matchedItem = pendingItems.find(
      i => i.tagNo.trim().toUpperCase() === cleanTag
    );

    if (matchedItem) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const currentAuditor = verifierName.trim() || 'Safuwan';

      const nextMap: Record<string, VerifiedRecord | string> = {
        ...verifiedTagsMap,
        [cleanTag]: {
          verifiedAt: now,
          verifiedBy: currentAuditor
        }
      };
      updateVerifiedMap(nextMap);

      // Log to enterprise audit trail
      addAuditLog({
        user: currentAuditor,
        action: 'Stock Audit Verified',
        itemTag: matchedItem.tagNo,
        category: appliedCriteria.category === 'gold' ? 'Gold' : 'Diamond',
        branch: extractBranchCode(appliedCriteria.branch),
        details: `Verified ${matchedItem.item} (${(matchedItem as any).weight || (matchedItem as any).carat}) by ${currentAuditor}`
      });

      if (soundEnabled) playAudioFeedback('success');
      setScanFeedback({
        message: `✓ Successfully verified ${matchedItem.tagNo} (${matchedItem.item}) by ${currentAuditor}`,
        type: 'success'
      });

      setScanInput('');
    } else {
      // Check if tag exists anywhere in the branch pool or wrong category/branch
      const existsInOtherCategory =
        appliedCriteria.category === 'gold'
          ? diamondItems.some(i => i.tagNo.trim().toUpperCase() === cleanTag)
          : goldItems.some(i => i.tagNo.trim().toUpperCase() === cleanTag);

      if (soundEnabled) playAudioFeedback('error');

      if (existsInOtherCategory) {
        setScanFeedback({
          message: `❌ Tag "${rawTag}" belongs to ${appliedCriteria.category === 'gold' ? 'Diamonds' : 'Gold'}, not current selection!`,
          type: 'error'
        });
      } else {
        setScanFeedback({
          message: `❌ Tag "${rawTag}" not found in branch "${appliedCriteria.branch}" pending inventory.`,
          type: 'error'
        });
      }
    }
  };

  // Form Submit for barcode gun / typing
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processTagVerification(scanInput);
    scanInputRef.current?.focus();
  };

  // Undo single verified item (Move back from right to left)
  const handleUndoVerified = (tagNo: string) => {
    const cleanTag = tagNo.trim().toUpperCase();
    const nextMap = { ...verifiedTagsMap };
    delete nextMap[cleanTag];
    updateVerifiedMap(nextMap);
    setScanFeedback({
      message: `Returned ${tagNo} back to Pending stock.`,
      type: 'warning'
    });
    scanInputRef.current?.focus();
  };

  // Reset entire verification session for this branch & category
  const handleResetSession = () => {
    if (verifiedCount === 0) return;
    if (window.confirm(`Are you sure you want to reset all ${verifiedCount} verified scans for Branch (${extractBranchCode(appliedCriteria.branch)})? All items will return to Pending.`)) {
      updateVerifiedMap({});
      setScanFeedback({
        message: `All items reset to Pending stock.`,
        type: 'warning'
      });
      scanInputRef.current?.focus();
    }
  };

  // Export full reconciliation CSV (Verified + Pending status + Verified By)
  const handleExportReconciliation = () => {
    const exportData = appliedPool.map(item => {
      const isVerified = Boolean(verifiedTagsMap[item.tagNo.trim().toUpperCase()]);
      const vData = verifiedTagsMap[item.tagNo.trim().toUpperCase()];
      const vTime = typeof vData === 'object' && vData !== null ? vData.verifiedAt : (typeof vData === 'string' ? vData : 'Pending');
      const vBy = typeof vData === 'object' && vData !== null ? vData.verifiedBy : (isVerified ? verifierName : '—');

      return {
        'TAG NUMBER': item.tagNo,
        'ITEM': item.item,
        'CERTIFICATE NUMBER': item.certificateNo || 'N/A',
        'DESCRIPTION': item.description || '',
        'BRANCH': item.branch,
        'WEIGHT/CARAT': (item as any).weight || (item as any).carat || 0,
        'AUDIT STATUS': isVerified ? 'VERIFIED' : 'PENDING (MISSING)',
        'VERIFIED BY': isVerified ? vBy : '—',
        'VERIFIED AT': isVerified ? vTime : '—'
      };
    });

    exportToCsv(
      `${appliedCriteria.branch}_${appliedCriteria.category.toUpperCase()}_Physical_Stock_Audit_Reconciliation.csv`,
      exportData
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      <LiveTicker mode="all" />

      <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Page Header & Synchronized Branch Filter Chips */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0f172a] text-[#fed65b] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                  Physical Stock Audit
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Excel Reconciler v2.4
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-headline">
                Branch Overview
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Physical Inventory Verification, Real-Time Barcode Scanning & Balance Tracker
              </p>
            </div>

            {/* Quick Actions / Filter Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedBranchKey('ALL');
                  setTempBranchKey('ALL');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold font-mono text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Sound'}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            {/* Active Branch Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0f172a] text-white rounded-md text-xs font-mono font-bold shadow-sm">
              <span>Branch:{activeBranchCode}</span>
              <button
                onClick={() => {
                  setSelectedBranchKey('ALL');
                  setTempBranchKey('ALL');
                }}
                className="hover:text-red-400 transition-colors ml-0.5"
                title="Reset to ALL Branches"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-mono font-semibold">
              <span>STATUS: ALL</span>
            </div>

            {/* Category Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-[#735c00] border border-amber-200 rounded-md text-xs font-mono font-bold">
              <span>CATEGORY: {activeCategory.toUpperCase()}</span>
            </div>

            {/* Quick Switch Branch Buttons */}
            <div className="flex items-center gap-1 ml-auto flex-wrap">
              <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline">Quick Branch:</span>
              {['ALL', ...STANDARD_BRANCH_CODES].map(code => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedBranchKey(code);
                    setTempBranchKey(code);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    activeBranchCode === code || (code === 'ALL' && selectedBranchKey === 'ALL')
                      ? 'bg-[#d4af37] text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== VERIFY MY STOCK MAIN SECTION ===== */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          {/* Header row with branch selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-headline">Verify My Stock</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fed65b]/20 text-[#735c00] rounded-full font-mono text-[11px] font-bold mt-2 border border-[#fed65b]/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Showing {activeBranchLabel}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-sans">
                Select a branch and category to view current inventory levels.
              </p>
            </div>

            {/* Choose Your Branch Form Box (Clean without mock city/vault names) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm w-full lg:w-96">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono block">
                  Choose Your Branch
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {dataBranches.length} from Excel / System
                </span>
              </div>

              <div className="relative mb-2.5">
                <select
                  value={tempBranchKey}
                  onChange={e => {
                    setTempBranchKey(e.target.value);
                    setSelectedBranchKey(e.target.value);
                  }}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
                >
                  <option value="ALL">🌐 All Branches</option>

                  <optgroup label="── Branches (S1 – S8) ──">
                    {STANDARD_BRANCH_CODES.map(code => (
                      <option key={code} value={code}>
                        Branch ({code})
                      </option>
                    ))}
                  </optgroup>

                  {customBranches.length > 0 && (
                    <optgroup label="── Other Branches from Excel ──">
                      {customBranches.map(branchName => (
                        <option key={branchName} value={branchName}>
                          Branch ({branchName})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <button
                onClick={handleApplySelection}
                className="w-full bg-[#0f172a] hover:bg-slate-800 text-[#fed65b] py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                Apply Selection
              </button>
            </div>
          </div>

          {/* 2 Interactive Category Cards (GOLD & DIAMOND) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* GOLD CARD */}
            <div
              onClick={() => setActiveCategory('gold')}
              className={`bg-white rounded-xl p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all duration-200 border-2 shadow-sm ${
                activeCategory === 'gold'
                  ? 'border-[#d4af37] border-l-8 ring-4 ring-[#fed65b]/20 shadow-md bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#fed65b] text-[#735c00] flex items-center justify-center shadow-sm">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-bold text-xl text-slate-900">GOLD</h4>
                    {activeCategory === 'gold' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-slate-950 text-[10px] font-mono font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                    {branchGoldItems.length} active lots in {activeBranchCode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#735c00]">
                  Total Gold Stock
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-headline text-slate-900">
                  {formatNumber(branchGoldTotalKg, 2)}{' '}
                  <span className="text-xs font-normal text-slate-400 font-mono">kg</span>
                </p>
                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  ≈ {formatUsd(branchGoldTotalKg * 1000 * goldSpotPrice)}
                </p>
              </div>
            </div>

            {/* DIAMOND CARD */}
            <div
              onClick={() => setActiveCategory('diamonds')}
              className={`bg-white rounded-xl p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all duration-200 border-2 shadow-sm ${
                activeCategory === 'diamonds'
                  ? 'border-emerald-600 border-l-8 ring-4 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#065f46] text-white flex items-center justify-center shadow-sm">
                  <Gem className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-bold text-xl text-slate-900">Diamond</h4>
                    {activeCategory === 'diamonds' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                    {branchDiamondItems.length} certified stones in {activeBranchCode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                  Total Diamond Stock
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-headline text-slate-900">
                  {formatNumber(branchDiamondTotalCt, 2)}{' '}
                  <span className="text-xs font-normal text-slate-400 font-mono">ct</span>
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  GIA / IGI Specimen
                </p>
              </div>
            </div>
          </div>

          {/* ===== 2-BOX AUDIT & SCANNING WORKSPACE (Triggered by Apply Selection) ===== */}
          {isWorkspaceActive && (
            <div className="mt-4 pt-6 border-t border-slate-200 flex flex-col gap-5">
              {/* RECONCILIATION SUMMARY BAR & BALANCE REMAINING */}
              <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fed65b] text-[#0f172a] flex items-center justify-center font-bold font-mono text-lg shadow-sm">
                    {progressPercent}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#fed65b] uppercase tracking-wider">
                        Live Stock Audit Status
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        (Branch ({extractBranchCode(appliedCriteria.branch)}) • {appliedCriteria.category.toUpperCase()})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        Total: <span className="text-slate-300 font-mono">{totalCount} items</span>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm font-bold text-emerald-400">
                        Scanned: <span className="font-mono">{verifiedCount} items</span>
                      </span>
                      <span className="text-slate-500">•</span>
                      {/* CRITICAL BALANCE METRIC */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        BALANCE TO SCAN: {balanceCount} ITEMS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={handleExportReconciliation}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    Export Audit (.CSV)
                  </button>
                  <button
                    onClick={handleResetSession}
                    disabled={verifiedCount === 0}
                    className="px-3 py-2 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 text-xs font-mono font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    title="Reset all verified scans to pending"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Scans
                  </button>
                </div>
              </div>

              {/* TWO BOXES SIDE BY SIDE WITH EQUAL 50/50 WIDTH AND IDENTICAL HEIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* ======================================================== */}
                {/* LEFT BOX: PENDING STOCK (Criteria-based from Excel/Data) */}
                {/* ======================================================== */}
                <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col h-[680px]">
                  {/* Left Box Header */}
                  <div className="flex-shrink-0 p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h3 className="font-headline font-bold text-base text-slate-900">
                          1. Pending Stock ({extractBranchCode(appliedCriteria.branch)})
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[11px] font-bold border border-amber-200">
                          {balanceCount} Balance Left
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Items matching criteria waiting for physical scan or barcode verification.
                      </p>
                    </div>

                    {/* Pending search within list */}
                    <div className="relative w-full sm:w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={pendingSearch}
                        onChange={e => setPendingSearch(e.target.value)}
                        placeholder="Search Tag No..."
                        className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Left Box Table (Scrollable Middle Area) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                        {appliedCriteria.category === 'gold' ? (
                          <tr className="border-b border-slate-200 font-mono font-bold text-[10px] uppercase tracking-wider text-[#735c00]">
                            <th className="px-3.5 py-2.5">TAG NUMBER</th>
                            <th className="px-3.5 py-2.5">ITEM</th>
                            <th className="px-3.5 py-2.5">CERTIFICATE</th>
                            <th className="px-3.5 py-2.5">DESCRIPTION</th>
                            <th className="px-3.5 py-2.5">BRAND</th>
                            <th className="px-3.5 py-2.5 text-right">WEIGHT</th>
                            <th className="px-3.5 py-2.5 text-right">BRANCH</th>
                            <th className="px-3 py-2.5 text-center">ACTION</th>
                          </tr>
                        ) : (
                          <tr className="border-b border-slate-200 font-mono font-bold text-[10px] uppercase tracking-wider text-[#065f46]">
                            <th className="px-3.5 py-2.5">TAG NUMBER</th>
                            <th className="px-3.5 py-2.5">ITEM</th>
                            <th className="px-3.5 py-2.5">CERTIFICATE</th>
                            <th className="px-3.5 py-2.5">DESCRIPTION</th>
                            <th className="px-3.5 py-2.5 text-right">CARAT</th>
                            <th className="px-3.5 py-2.5 text-center">CLARITY</th>
                            <th className="px-3.5 py-2.5">SHAPE</th>
                            <th className="px-3.5 py-2.5 text-center">COLOUR</th>
                            <th className="px-3.5 py-2.5 text-right">PRICE</th>
                            <th className="px-3 py-2.5 text-center">ACTION</th>
                          </tr>
                        )}
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-mono">
                        {filteredPendingItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={appliedCriteria.category === 'gold' ? 8 : 10}
                              className="px-6 py-24 text-center text-slate-400 font-sans"
                            >
                              {pendingItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-emerald-700">
                                  <CheckCheck className="w-10 h-10 text-emerald-600" />
                                  <p className="font-bold text-sm">🎉 100% Stock Verified!</p>
                                  <p className="text-xs text-slate-500">
                                    All items for Branch ({extractBranchCode(appliedCriteria.branch)}) have been verified and moved to Scanned Stock.
                                  </p>
                                </div>
                              ) : (
                                `No items match search "${pendingSearch}".`
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredPendingItems.map(item => (
                            <tr
                              key={item.id}
                              className="hover:bg-amber-50/40 transition-colors group"
                            >
                              <td className="px-3.5 py-2.5 font-bold text-[#0f172a]">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                                  <span className="font-mono text-xs">{item.tagNo}</span>
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 font-sans font-semibold text-slate-900 text-xs">
                                {item.item}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {item.certificateNo || '—'}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 max-w-[140px] truncate font-sans text-xs">
                                {item.description}
                              </td>

                              {appliedCriteria.category === 'gold' ? (
                                <>
                                  <td className="px-3.5 py-2.5 font-medium text-slate-800 text-xs">
                                    {(item as any).brand || 'PAMP'}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                    {formatNumber((item as any).weight, 3)}{' '}
                                    <span className="text-[10px] font-normal text-slate-400">kg</span>
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                                      {item.branch}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                    {formatNumber((item as any).carat, 2)} ct
                                  </td>
                                  <td className="px-3.5 py-2.5 text-center">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                                      {(item as any).clarity}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5 text-slate-700 font-medium text-xs">
                                    {(item as any).shape}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-center font-bold text-emerald-800 text-xs">
                                    {(item as any).colour}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-800">
                                    {formatUsd((item as any).tagPrice)}
                                  </td>
                                </>
                              )}

                              {/* Action: Fast Click to Verify */}
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => processTagVerification(item.tagNo)}
                                  className="px-2 py-1 rounded bg-slate-900 hover:bg-[#d4af37] hover:text-slate-950 text-white text-[10px] font-mono font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                                  title="Verify and transfer to Scanned Stock"
                                >
                                  <span>Verify</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Left Box Footer */}
                  <div className="flex-shrink-0 p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>
                      Showing {filteredPendingItems.length} of {pendingItems.length} pending items
                    </span>
                    <span className="font-bold text-amber-700">
                      Balance: {formatNumber(balanceWeight, 2)} {appliedCriteria.category === 'gold' ? 'kg' : 'ct'}
                    </span>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* RIGHT BOX: SCANNING / TYPING & SCANNED STOCK (EQUAL SIZE)*/}
                {/* ======================================================== */}
                <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col h-[680px]">
                  {/* Right Box Header */}
                  <div className="flex-shrink-0 p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h3 className="font-headline font-bold text-base text-slate-900">
                          2. Scanned / Verified Stock
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold border border-emerald-200">
                          {verifiedCount} Verified
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {formatNumber(verifiedWeight, 2)} {appliedCriteria.category === 'gold' ? 'kg' : 'ct'}
                      </span>
                    </div>

                    {/* AUDITOR / VERIFIER NAME INPUT */}
                    <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-[#0f172a] text-[#fed65b] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Audited By:
                      </span>
                      <input
                        type="text"
                        value={verifierName}
                        onChange={e => handleVerifierChange(e.target.value)}
                        placeholder="Enter auditor name..."
                        className="bg-white border border-slate-300 rounded-md px-3 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 w-48 shadow-sm"
                      />
                    </div>

                    {/* BARCODE / TYPING INPUT FORM */}
                    <form onSubmit={handleScanSubmit} className="mt-3">
                      <div className="relative">
                        <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          ref={scanInputRef}
                          type="text"
                          value={scanInput}
                          onChange={e => setScanInput(e.target.value)}
                          placeholder="Scan Barcode or Type Tag No (e.g. SWGBR000082)..."
                          className="w-full bg-white border-2 border-slate-900 rounded-lg pl-10 pr-24 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow-inner"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-[#fed65b] rounded-md text-[11px] font-mono font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Scan</span>
                        </button>
                      </div>
                    </form>

                    {/* Scan Feedback Banner with Verifier Name */}
                    {scanFeedback && (
                      <div
                        className={`mt-2.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-between transition-all ${
                          scanFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : scanFeedback.type === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {scanFeedback.type === 'success' ? (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          )}
                          <span>{scanFeedback.message}</span>
                        </div>
                        <button
                          onClick={() => setScanFeedback(null)}
                          className="text-slate-400 hover:text-slate-600 ml-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scanned Items Table (Scrollable Middle Area) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                        <tr className="border-b border-slate-200 font-mono font-bold text-[10px] uppercase tracking-wider text-slate-700">
                          <th className="px-3 py-2.5 text-center">#</th>
                          <th className="px-3.5 py-2.5">TAG NUMBER</th>
                          <th className="px-3.5 py-2.5">DESCRIPTION</th>
                          <th className="px-3.5 py-2.5 text-right">
                            {appliedCriteria.category === 'gold' ? 'WEIGHT' : 'CARAT'}
                          </th>
                          <th className="px-3 py-2.5 text-center">VERIFIED BY</th>
                          <th className="px-3 py-2.5 text-center">TIME</th>
                          <th className="px-3 py-2.5 text-center">UNDO</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-mono">
                        {verifiedItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-24 text-center text-slate-400 font-sans">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Barcode className="w-10 h-10 text-slate-300" />
                                <p className="font-semibold text-sm text-slate-600">No items scanned yet</p>
                                <p className="text-xs text-slate-400 max-w-xs">
                                  Scan a barcode gun or type a tag number from the pending list and press Enter to verify.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          verifiedItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-400">
                                {index + 1}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span className="font-mono text-xs">{item.tagNo}</span>
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 max-w-[130px] truncate font-sans text-xs">
                                {item.item}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                {appliedCriteria.category === 'gold'
                                  ? `${formatNumber((item as any).weight, 3)} kg`
                                  : `${formatNumber((item as any).carat, 2)} ct`}
                              </td>
                              {/* VERIFIED BY COLUMN */}
                              <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-700">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{item.verifiedBy}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-[10px] text-slate-400 font-mono">
                                <div className="inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{item.verifiedAt}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => handleUndoVerified(item.tagNo)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                  title="Return item to Pending list"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Box Footer */}
                  <div className="flex-shrink-0 p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>{verifiedCount} verified in this session</span>
                    <button
                      onClick={handleExportReconciliation}
                      className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 font-mono uppercase"
                    >
                      <Download className="w-3 h-3" />
                      Export Manifest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
