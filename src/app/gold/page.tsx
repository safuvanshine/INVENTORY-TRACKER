'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { LiveTicker } from '@/components/layout/LiveTicker';
import { formatNumber, exportToCsv } from '@/lib/utils';
import {
  Scale,
  Building2,
  Search,
  Download,
  Layers,
  Coins,
  ShieldCheck,
  Truck,
  Filter,
  X,
  UploadCloud
} from 'lucide-react';
import { BulkUploadModal } from '@/components/modals/BulkUploadModal';

export default function GoldInventoryPage() {
  const {
    goldItems,
    selectedBranch,
    globalSearch,
    goldSpotPrice,
    totalGoldWeightKg
  } = useInventory();
  const { isAdmin } = useAuth();

  // Modals
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);

  // Local Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [weightFilter, setWeightFilter] = useState<string>('ALL');
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Dynamic unique brands extracted from goldItems (5th column — BRAND)
  const uniqueBrands = useMemo(() => {
    const brands = goldItems.map(item => item.brand).filter(Boolean);
    const unique = [...new Set(brands)].sort((a, b) => a.localeCompare(b));
    return unique;
  }, [goldItems]);

  // Dynamic unique weights extracted from goldItems (6th column — WEIGHT)
  const uniqueWeights = useMemo(() => {
    const weights = goldItems.map(item => item.weight).filter(w => w != null && !isNaN(w));
    const unique = [...new Set(weights)].sort((a, b) => a - b);
    return unique;
  }, [goldItems]);

  // Active Filter Calculation
  const filteredItems = useMemo(() => {
    return goldItems.filter(item => {
      // Global Search
      const searchTerms = (globalSearch || localSearch).toLowerCase().trim();
      if (searchTerms) {
        const matchesSearch =
          item.tagNo.toLowerCase().includes(searchTerms) ||
          item.certificateNo.toLowerCase().includes(searchTerms) ||
          item.item.toLowerCase().includes(searchTerms) ||
          item.description.toLowerCase().includes(searchTerms) ||
          item.brand.toLowerCase().includes(searchTerms) ||
          item.branch.toLowerCase().includes(searchTerms);
        if (!matchesSearch) return false;
      }

      // Branch Filter
      if (selectedBranch !== 'All Branches' && !item.branch.toLowerCase().includes(selectedBranch.toLowerCase().split(' ')[0])) {
        return false;
      }

      // Brand Filter
      if (selectedBrand !== 'ALL' && item.brand !== selectedBrand) {
        return false;
      }

      // Weight Filter — supports both ranges and exact weight match
      if (weightFilter !== 'ALL') {
        if (weightFilter === 'UNDER_1KG' && item.weight >= 1) return false;
        else if (weightFilter === '1KG_TO_5KG' && (item.weight < 1 || item.weight > 5)) return false;
        else if (weightFilter === '5KG_TO_10KG' && (item.weight < 5 || item.weight > 10)) return false;
        else if (weightFilter === 'OVER_10KG' && item.weight <= 10) return false;
        else if (weightFilter.startsWith('EXACT_')) {
          const exactVal = parseFloat(weightFilter.replace('EXACT_', ''));
          if (item.weight !== exactVal) return false;
        }
      }

      // Min - Max Weight Filter (kg) - exact same as Diamond
      if (minWeight && (item.weight || 0) < parseFloat(minWeight)) return false;
      if (maxWeight && (item.weight || 0) > parseFloat(maxWeight)) return false;

      return true;
    });
  }, [goldItems, globalSearch, localSearch, selectedBranch, selectedBrand, weightFilter, minWeight, maxWeight]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Count active filters
  const activeFilterCount = [
    selectedBrand !== 'ALL',
    weightFilter !== 'ALL',
    minWeight !== '' || maxWeight !== '',
    localSearch.trim() !== ''
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedBrand('ALL');
    setWeightFilter('ALL');
    setMinWeight('');
    setMaxWeight('');
    setLocalSearch('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportToCsv('shine_gold_inventory_manifest.csv', filteredItems);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      {/* Live Movement Ticker */}
      <LiveTicker mode="gold" />

      {/* Main Container */}
      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#fed65b]/20 text-[#735c00] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#fed65b]/50">
                Gold Bullion & Vault Specimen
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-headline">
              Gold Inventory
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Live Vault Reserves • Spot Reference: ${goldSpotPrice.toFixed(2)}/g
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
              Export Manifest
            </button>
          </div>
        </div>

        {/* Bento Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard
            title="Total Gold Weight"
            value={formatNumber(totalGoldWeightKg, 1)}
            unit="kg"
            trend={{ value: '+12.4 kg this week', positive: true }}
            icon={<Scale className="w-5 h-5" />}
            accentColor="gold"
          />

          <MetricCard
            title="Active Vaults"
            value="8"
            unit="/ 13 Branches"
            icon={<Building2 className="w-5 h-5" />}
            accentColor="emerald"
            extraContent={
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-800 font-mono shadow-sm">
                    LDN
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-800 font-mono shadow-sm">
                    GVA
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-800 font-mono shadow-sm">
                    NY
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-800 font-mono shadow-sm">
                    DXB
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono font-medium">+4 more active</span>
              </div>
            }
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)] flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search Tag No, Item, Brand, Branch..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              {/* Brand Filter — Dynamic from goldItems 5th column (BRAND) */}
              <select
                value={selectedBrand}
                onChange={e => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer min-w-[170px]"
              >
                <option value="ALL">All Refinery Brands ({uniqueBrands.length})</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              {/* Weight Presets Filter */}
              <select
                value={weightFilter}
                onChange={e => {
                  setWeightFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer min-w-[150px]"
              >
                <option value="ALL">All Presets</option>
                <optgroup label="── Weight Ranges ──">
                  <option value="UNDER_1KG">&lt; 1.0 kg</option>
                  <option value="1KG_TO_5KG">1.0 kg – 5.0 kg</option>
                  <option value="5KG_TO_10KG">5.0 kg – 10.0 kg</option>
                  <option value="OVER_10KG">&gt; 10.0 kg</option>
                </optgroup>
                <optgroup label="── Exact Weights ──">
                  {uniqueWeights.map(w => (
                    <option key={w} value={`EXACT_${w}`}>{formatNumber(w, 3)} kg</option>
                  ))}
                </optgroup>
              </select>

              {/* Quick Weight Range Inputs (Min - Max kg) - SAME AS DIAMOND */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Weight:</span>
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
                    className="w-12 bg-transparent text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
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
                    className="w-12 bg-transparent text-left font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10px] ml-1">kg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <span className="text-xs font-mono text-slate-500">
                Showing <span className="font-bold text-slate-900">{filteredItems.length}</span> vault items
              </span>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                <Filter className="w-3 h-3" />
                Active Filters:
              </div>

              {selectedBrand !== 'ALL' && (
                <button
                  onClick={() => { setSelectedBrand('ALL'); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fed65b]/15 text-[#735c00] text-[11px] font-bold border border-[#fed65b]/40 hover:bg-[#fed65b]/30 transition-all"
                >
                  Brand: {selectedBrand}
                  <X className="w-3 h-3" />
                </button>
              )}

              {weightFilter !== 'ALL' && (
                <button
                  onClick={() => { setWeightFilter('ALL'); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100 transition-all"
                >
                  Preset: {weightFilter.startsWith('EXACT_')
                    ? `${formatNumber(parseFloat(weightFilter.replace('EXACT_', '')), 3)} kg`
                    : weightFilter === 'UNDER_1KG' ? '< 1.0 kg'
                    : weightFilter === '1KG_TO_5KG' ? '1.0 – 5.0 kg'
                    : weightFilter === '5KG_TO_10KG' ? '5.0 – 10.0 kg'
                    : '> 10.0 kg'}
                  <X className="w-3 h-3" />
                </button>
              )}

              {(minWeight || maxWeight) && (
                <button
                  onClick={() => {
                    setMinWeight('');
                    setMaxWeight('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fed65b]/20 text-[#735c00] text-[11px] font-bold border border-[#fed65b]/50 hover:bg-[#fed65b]/30 transition-all"
                >
                  Weight Range: {minWeight || '0'} – {maxWeight || '∞'} kg
                  <X className="w-3 h-3" />
                </button>
              )}

              {localSearch.trim() !== '' && (
                <button
                  onClick={() => { setLocalSearch(''); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 hover:bg-slate-200 transition-all"
                >
                  Search: &quot;{localSearch}&quot;
                  <X className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* High-Density Data Table (Clean Read-Only View) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_4px_24px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  <th className="px-6 py-3.5 w-[140px]">1. TAG NUMBER</th>
                  <th className="px-6 py-3.5">2. ITEM</th>
                  <th className="px-6 py-3.5 w-[160px]">3. CERTIFICATE NUMBER</th>
                  <th className="px-6 py-3.5">4. DESCRIPTION</th>
                  <th className="px-6 py-3.5 w-[130px]">5. BRAND</th>
                  <th className="px-6 py-3.5 text-right w-[120px]">6. WEIGHT</th>
                  <th className="px-6 py-3.5 w-[180px]">7. BRANCH</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No gold assets matched your search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(item => (
                    <tr
                      key={item.id}
                      className="luxury-row hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 1. Tag Number */}
                      <td className="px-6 py-3.5 font-mono font-bold text-[#0f172a]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                          {item.tagNo}
                        </div>
                      </td>

                      {/* 2. Item */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#fed65b]/20 flex items-center justify-center text-[#735c00] shrink-0">
                            {item.item.toLowerCase().includes('coin') ? (
                              <Coins className="w-3.5 h-3.5" />
                            ) : (
                              <Layers className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">{item.item}</span>
                        </div>
                      </td>

                      {/* 3. Certificate Number */}
                      <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                        {item.certificateNo}
                      </td>

                      {/* 4. Description */}
                      <td className="px-6 py-3.5 text-slate-600 max-w-[240px] truncate">
                        {item.description}
                      </td>

                      {/* 5. Brand */}
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {item.brand}
                      </td>

                      {/* 6. Weight */}
                      <td className="px-6 py-3.5 font-mono font-bold text-right text-slate-900">
                        {formatNumber(item.weight, 3)} <span className="text-[10px] font-normal text-slate-400">kg</span>
                      </td>

                      {/* 7. Branch Location */}
                      <td className="px-6 py-3.5">
                        <Badge variant="gold" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />}>
                          {item.branch}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between mt-auto">
            <span className="text-xs text-slate-500 font-mono">
              Page {currentPage} of {totalPages} ({filteredItems.length} total entries)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    currentPage === idx + 1
                      ? 'bg-[#0f172a] text-[#fed65b]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        targetCategory="gold"
      />
    </div>
  );
}
