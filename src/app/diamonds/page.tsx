'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { LiveTicker } from '@/components/layout/LiveTicker';
import { formatUsd, formatNumber, exportToCsv } from '@/lib/utils';
import {
  Gem,
  Filter,
  Download,
  Search,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BarChart3,
  PieChart,
  Layers,
  X,
  Building2,
  Award,
  UploadCloud,
  Lock,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { BulkUploadModal } from '@/components/modals/BulkUploadModal';
import { HoldItemModal } from '@/components/modals/HoldItemModal';
import { TransferItemModal } from '@/components/modals/TransferItemModal';

export default function DiamondsPage() {
  const {
    diamondItems,
    selectedBranch,
    globalSearch,
    totalDiamondCarats,
    acceptTransfer,
    cancelTransfer
  } = useInventory();
  const { isAdmin, currentUser } = useAuth();

  // Modals state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);
  const [holdingItem, setHoldingItem] = useState<{
    id: string;
    tagNo: string;
    item: string;
    branch: string;
    category: 'gold' | 'diamond';
  } | null>(null);
  const [transferringItem, setTransferringItem] = useState<{
    id: string;
    tagNo: string;
    item: string;
    branch: string;
    category: 'gold' | 'diamond';
  } | null>(null);

  // Filters State
  const [selectedShape, setSelectedShape] = useState<string>('ALL');
  const [selectedClarity, setSelectedClarity] = useState<string>('ALL');
  const [selectedColour, setSelectedColour] = useState<string>('ALL');
  const [selectedStoneType, setSelectedStoneType] = useState<string>('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Dynamic unique filter options extracted from loaded diamondItems (Excel / live data)
  const uniqueShapes = useMemo(() => {
    const list = diamondItems.map(i => i.shape?.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [diamondItems]);

  const uniqueClarities = useMemo(() => {
    const list = diamondItems.map(i => i.clarity?.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [diamondItems]);

  const uniqueColours = useMemo(() => {
    const list = diamondItems.map(i => i.colour?.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [diamondItems]);

  const uniqueBranches = useMemo(() => {
    const list = diamondItems.map(i => i.branch?.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [diamondItems]);

  // Visual Chart Distributions: Shape Breakdown
  const shapeDistribution = useMemo(() => {
    const map: { [key: string]: { count: number; totalCarat: number; totalValue: number } } = {};
    diamondItems.forEach(item => {
      const s = item.shape?.trim() || 'Other';
      if (!map[s]) {
        map[s] = { count: 0, totalCarat: 0, totalValue: 0 };
      }
      map[s].count += 1;
      map[s].totalCarat += item.carat || 0;
      map[s].totalValue += item.tagPrice || 0;
    });

    const totalCount = diamondItems.length || 1;
    return Object.entries(map)
      .map(([shape, data]) => ({
        shape,
        ...data,
        percentage: Math.round((data.count / totalCount) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [diamondItems]);

  // Clarity Distribution
  const clarityDistribution = useMemo(() => {
    const map: { [key: string]: number } = {};
    diamondItems.forEach(item => {
      const c = item.clarity?.trim() || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [diamondItems]);

  // Filter diamonds
  const filteredDiamonds = useMemo(() => {
    return diamondItems.filter(item => {
      // Global & Local Search
      const searchTerms = (globalSearch || localSearch).toLowerCase().trim();
      if (searchTerms) {
        const matches =
          item.tagNo.toLowerCase().includes(searchTerms) ||
          item.item.toLowerCase().includes(searchTerms) ||
          item.certificateNo.toLowerCase().includes(searchTerms) ||
          item.description.toLowerCase().includes(searchTerms) ||
          item.shape.toLowerCase().includes(searchTerms) ||
          item.branch.toLowerCase().includes(searchTerms) ||
          item.clarity.toLowerCase().includes(searchTerms) ||
          item.colour.toLowerCase().includes(searchTerms);
        if (!matches) return false;
      }

      // Global Navbar Branch Filter (also show items being transferred TO this branch so they can accept)
      if (selectedBranch !== 'All Branches') {
        const bKey = selectedBranch.trim().toLowerCase();
        const isCurrentBranch = item.branch.trim().toLowerCase() === bKey;
        const isIncomingToBranch = item.transferInfo?.toBranch.trim().toLowerCase() === bKey;
        if (!isCurrentBranch && !isIncomingToBranch) {
          return false;
        }
      }

      // Page Branch Filter
      if (selectedBranchFilter !== 'ALL' && item.branch !== selectedBranchFilter) {
        return false;
      }

      // Shape Filter
      if (selectedShape !== 'ALL' && item.shape !== selectedShape) {
        return false;
      }

      // Clarity Filter
      if (selectedClarity !== 'ALL' && item.clarity !== selectedClarity) {
        return false;
      }

      // Colour Filter
      if (selectedColour !== 'ALL' && item.colour !== selectedColour) {
        return false;
      }

      // Stone Type (Natural / Lab Grown)
      if (selectedStoneType !== 'ALL') {
        const isLab = item.description?.toLowerCase().includes('lab') || item.item?.toLowerCase().includes('lab') || item.stoneType === 'Lab Grown';
        if (selectedStoneType === 'Lab Grown' && !isLab) return false;
        if (selectedStoneType === 'Natural' && isLab) return false;
      }

      // Carat weight range
      if (minWeight && (item.carat || 0) < parseFloat(minWeight)) return false;
      if (maxWeight && (item.carat || 0) > parseFloat(maxWeight)) return false;

      return true;
    });
  }, [
    diamondItems,
    globalSearch,
    localSearch,
    selectedBranch,
    selectedBranchFilter,
    selectedShape,
    selectedClarity,
    selectedColour,
    selectedStoneType,
    minWeight,
    maxWeight
  ]);

  // Aggregated totals of filtered items
  const filteredCarats = useMemo(() => {
    return filteredDiamonds.reduce((sum, item) => sum + (item.carat || 0), 0);
  }, [filteredDiamonds]);

  const totalPages = Math.ceil(filteredDiamonds.length / itemsPerPage) || 1;
  const paginatedItems = filteredDiamonds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Active filters count
  const activeFiltersCount = [
    selectedShape !== 'ALL',
    selectedClarity !== 'ALL',
    selectedColour !== 'ALL',
    selectedBranchFilter !== 'ALL',
    selectedStoneType !== 'ALL',
    minWeight !== '' || maxWeight !== '',
    localSearch.trim() !== ''
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedShape('ALL');
    setSelectedClarity('ALL');
    setSelectedColour('ALL');
    setSelectedBranchFilter('ALL');
    setSelectedStoneType('ALL');
    setMinWeight('');
    setMaxWeight('');
    setLocalSearch('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportToCsv('shine_diamonds_inventory_manifest.csv', filteredDiamonds);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      {/* Live Market Ticker */}
      <LiveTicker mode="diamonds" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-200">
                Certified Precious Gemstones & Solitaires
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-headline">
              Diamond Inventory
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              GIA & IGI Verified Lots • Total Weight: {formatNumber(totalDiamondCarats, 2)} ct
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0f172a] text-[#fed65b] text-xs font-bold hover:bg-slate-800 shadow-md flex items-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#d4af37]" />
                Bulk Intake (Excel / CSV)
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Diamonds Manifest
            </button>
          </div>
        </div>

        {/* Bento Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard
            title="Total Carat Weight"
            value={formatNumber(filteredCarats, 2)}
            unit="ct"
            trend={{ value: `${filteredDiamonds.length} Certified Stones`, positive: true }}
            icon={<Gem className="w-5 h-5" />}
            accentColor="emerald"
          />

          <MetricCard
            title="Shape Varieties"
            value={uniqueShapes.length.toString()}
            unit="Shapes Logged"
            icon={<Award className="w-5 h-5" />}
            accentColor="gold"
            extraContent={
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Top Cut:</span>
                <span className="font-bold text-slate-900">
                  {shapeDistribution[0]?.shape || 'None'} ({shapeDistribution[0]?.count || 0} pcs)
                </span>
              </div>
            }
          />
        </div>

        {/* ===== VISUAL CHART: UPLOADED DIAMOND INVENTORY BREAKDOWN ===== */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-slate-900">
                  Inventory Distribution & Cut Breakdown
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Visual summary of shapes and grades currently loaded in vault database
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {diamondItems.length} Uploaded Items Analyzed
            </span>
          </div>

          {/* Shape Distribution Horizontal Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shapeDistribution.slice(0, 6).map((item, idx) => (
              <div
                key={item.shape}
                onClick={() => {
                  setSelectedShape(selectedShape === item.shape ? 'ALL' : item.shape);
                  setCurrentPage(1);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedShape === item.shape
                    ? 'border-[#065f46] bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-bold text-slate-900">{item.shape}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
                    {item.count} pcs ({item.percentage}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
                  <div
                    className="bg-[#065f46] h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{formatNumber(item.totalCarat, 2)} ct total</span>
                  <span className="font-semibold text-emerald-800">{formatUsd(item.totalValue)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Clarity & Colour Spectrum Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Clarity Spectrum:</span>
              {clarityDistribution.map(([grade, count]) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedClarity(selectedClarity === grade ? 'ALL' : grade);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    selectedClarity === grade
                      ? 'bg-[#0f172a] text-[#fed65b]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {grade}: <span className="font-normal">{count}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Colour Grades:</span>
              {uniqueColours.slice(0, 6).map(colour => (
                <button
                  key={colour}
                  onClick={() => {
                    setSelectedColour(selectedColour === colour ? 'ALL' : colour);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    selectedColour === colour
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-[#065f46] border border-emerald-200'
                  }`}
                >
                  Grade {colour}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Global Dynamic Filters & Search Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={e => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Tag, Cert, Shape..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>

            {/* Dynamic Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dynamic Shape Filter */}
              <select
                value={selectedShape}
                onChange={e => {
                  setSelectedShape(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Shapes ({uniqueShapes.length})</option>
                {uniqueShapes.map(shape => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </select>

              {/* Dynamic Clarity Filter */}
              <select
                value={selectedClarity}
                onChange={e => {
                  setSelectedClarity(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Clarity ({uniqueClarities.length})</option>
                {uniqueClarities.map(clarity => (
                  <option key={clarity} value={clarity}>
                    {clarity}
                  </option>
                ))}
              </select>

              {/* Dynamic Colour Filter */}
              <select
                value={selectedColour}
                onChange={e => {
                  setSelectedColour(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Colours ({uniqueColours.length})</option>
                {uniqueColours.map(colour => (
                  <option key={colour} value={colour}>
                    Color {colour}
                  </option>
                ))}
              </select>

              {/* Dynamic Branch Filter */}
              <select
                value={selectedBranchFilter}
                onChange={e => {
                  setSelectedBranchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches ({uniqueBranches.length})</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Stone Type Filter */}
              <select
                value={selectedStoneType}
                onChange={e => {
                  setSelectedStoneType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Stone Types</option>
                <option value="Natural">Natural Diamond</option>
                <option value="Lab Grown">Lab Grown</option>
              </select>
            </div>

            {/* Quick Carat Range Inputs */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Carat:</span>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={minWeight}
                  onChange={e => {
                    setMinWeight(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-10 bg-transparent text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400 mx-1">-</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={maxWeight}
                  onChange={e => {
                    setMaxWeight(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-10 bg-transparent text-left font-mono text-xs font-bold text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400 text-[10px] ml-1">ct</span>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-[11px] font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Active:
              </span>

              {selectedShape !== 'ALL' && (
                <button
                  onClick={() => setSelectedShape('ALL')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                >
                  Shape: {selectedShape} <X className="w-3 h-3" />
                </button>
              )}

              {selectedClarity !== 'ALL' && (
                <button
                  onClick={() => setSelectedClarity('ALL')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Clarity: {selectedClarity} <X className="w-3 h-3" />
                </button>
              )}

              {selectedColour !== 'ALL' && (
                <button
                  onClick={() => setSelectedColour('ALL')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Colour: {selectedColour} <X className="w-3 h-3" />
                </button>
              )}

              {selectedBranchFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedBranchFilter('ALL')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Branch: {selectedBranchFilter} <X className="w-3 h-3" />
                </button>
              )}

              {selectedStoneType !== 'ALL' && (
                <button
                  onClick={() => setSelectedStoneType('ALL')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Type: {selectedStoneType} <X className="w-3 h-3" />
                </button>
              )}

              {(minWeight || maxWeight) && (
                <button
                  onClick={() => {
                    setMinWeight('');
                    setMaxWeight('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Carat: {minWeight || '0'} - {maxWeight || '∞'} ct <X className="w-3 h-3" />
                </button>
              )}

              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                >
                  Search: &quot;{localSearch}&quot; <X className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-1"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* High-Density Data Table (10 Exact User Columns with Fixed Right Column Visibility) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0px_4px_24px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left border-collapse min-w-[1050px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono sticky top-0 z-10">
                  <th className="px-4 py-3.5 w-[130px]">1. TAG NUMBER</th>
                  <th className="px-4 py-3.5 w-[170px]">2. ITEM</th>
                  <th className="px-4 py-3.5 w-[150px]">3. CERTIFICATE NO</th>
                  <th className="px-4 py-3.5 w-[180px]">4. DESCRIPTION</th>
                  <th className="px-4 py-3.5 w-[130px]">5. BRANCH</th>
                  <th className="px-4 py-3.5 text-right w-[100px]">6. CARAT</th>
                  <th className="px-4 py-3.5 text-center w-[90px]">7. CLARITY</th>
                  <th className="px-4 py-3.5 w-[120px]">8. SHAPE</th>
                  <th className="px-4 py-3.5 text-center w-[80px]">9. COLOUR</th>
                  <th className="px-5 py-3.5 text-right w-[130px] bg-slate-100/60 font-bold text-emerald-900">
                    10. TAG PRICE
                  </th>
                  <th className="px-5 py-3.5 text-right w-[160px]">
                    11. HOLD / STATUS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-sans">
                      No diamond specimens matched your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(item => (
                    <tr
                      key={item.id}
                      className={`luxury-row transition-colors ${
                        item.holdInfo ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Tag Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0f172a]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#065f46]"></span>
                          {item.tagNo}
                        </div>
                      </td>

                      {/* 2. Item */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-[170px] truncate">
                        {item.item}
                      </td>

                      {/* 3. Certificate Number */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">
                        {item.certificateNo}
                      </td>

                      {/* 4. Description */}
                      <td className="px-4 py-3.5 text-slate-600 max-w-[180px] truncate font-sans">
                        {item.description}
                      </td>

                      {/* 5. Branch */}
                      <td className="px-4 py-3.5">
                        <Badge variant="emerald">
                          {item.branch}
                        </Badge>
                      </td>

                      {/* 6. Carat */}
                      <td className="px-4 py-3.5 font-mono font-bold text-right text-slate-900">
                        {formatNumber(item.carat, 2)} <span className="text-[10px] font-normal text-slate-400">ct</span>
                      </td>

                      {/* 7. Clarity */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {item.clarity}
                        </span>
                      </td>

                      {/* 8. Shape */}
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {item.shape}
                      </td>

                      {/* 9. Colour */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-[#065f46]">
                        {item.colour}
                      </td>

                      {/* 10. Tag Price (Distinct, Prominent, Never Cut Off) */}
                      <td className="px-5 py-3.5 font-mono font-bold text-right text-emerald-800 bg-emerald-50/20">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs shadow-xs">
                          {formatUsd(item.tagPrice)}
                        </span>
                      </td>

                      {/* 11. Hold & Transfer Action / Status */}
                      <td className="px-5 py-3.5 text-right">
                        {item.transferInfo ? (
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-mono font-bold">
                              <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                              {item.transferInfo.fromBranch} ➔ {item.transferInfo.toBranch}
                            </span>
                            {(isAdmin ||
                              currentUser?.branch?.toUpperCase() === item.transferInfo.toBranch.toUpperCase()) && (
                              <button
                                onClick={() =>
                                  acceptTransfer('diamond', item.id, currentUser?.name || item.transferInfo!.toBranch)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold shadow-xs transition-all cursor-pointer"
                                title={`Accept into ${item.transferInfo.toBranch} stock`}
                              >
                                <Check className="w-3 h-3" />
                                Accept ({item.transferInfo.toBranch})
                              </button>
                            )}
                            <button
                              onClick={() =>
                                cancelTransfer('diamond', item.id, currentUser?.name || item.branch)
                              }
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel Transfer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : item.holdInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold">
                            <Lock className="w-3 h-3 text-amber-700" />
                            ON HOLD • {item.holdInfo.branch} ({item.holdInfo.days}D)
                          </span>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setHoldingItem({
                                  id: item.id,
                                  tagNo: item.tagNo,
                                  item: item.item,
                                  branch: item.branch,
                                  category: 'diamond'
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#fed65b] text-[11px] font-mono font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <Lock className="w-3 h-3" />
                              Hold
                            </button>
                            <button
                              onClick={() =>
                                setTransferringItem({
                                  id: item.id,
                                  tagNo: item.tagNo,
                                  item: item.item,
                                  branch: item.branch,
                                  category: 'diamond'
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-mono font-bold transition-all cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-slate-600" />
                              Transfer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50 mt-auto">
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredDiamonds.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredDiamonds.length)} of {filteredDiamonds.length} stones
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 border border-slate-200 rounded-lg hover:bg-white transition-colors text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 border border-slate-200 rounded-lg hover:bg-white transition-colors text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        targetCategory="diamond"
      />

      {/* Hold Item Modal */}
      <HoldItemModal
        isOpen={!!holdingItem}
        onClose={() => setHoldingItem(null)}
        item={holdingItem}
      />

      {/* Transfer Item Modal */}
      <TransferItemModal
        isOpen={!!transferringItem}
        onClose={() => setTransferringItem(null)}
        item={transferringItem}
      />
    </div>
  );
}
