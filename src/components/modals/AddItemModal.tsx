'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { X, Plus, Sparkles, Layers, Gem } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'gold' | 'diamond';
}

export function AddItemModal({ isOpen, onClose, defaultType = 'gold' }: AddItemModalProps) {
  const { addGoldItem, addDiamondItem, branches, goldSpotPrice } = useInventory();
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond'>(defaultType);

  // 7 Gold Fields
  const [goldTagNo, setGoldTagNo] = useState(`AU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [goldItem, setGoldItem] = useState('Bullion Bar 24K');
  const [goldCert, setGoldCert] = useState(`GIA-GLD-${Math.floor(100000 + Math.random() * 900000)}`);
  const [goldDesc, setGoldDesc] = useState('999.9 Fine Gold Bar Standard Assay');
  const [goldBrand, setGoldBrand] = useState('PAMP Suisse');
  const [goldWeight, setGoldWeight] = useState('12.400');
  const [goldBranch, setGoldBranch] = useState('London Mayfair Vault');

  // 10 Diamond Fields
  const [diaTagNo, setDiaTagNo] = useState(`DIA-${Math.floor(1000 + Math.random() * 9000)}`);
  const [diaItem, setDiaItem] = useState('Diamond Solitaire Ring');
  const [diaCert, setDiaCert] = useState(`GIA-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [diaDesc, setDiaDesc] = useState('Natural Round Brilliant Triple Ex Cut');
  const [diaBranch, setDiaBranch] = useState('Geneva Vault A');
  const [diaCarat, setDiaCarat] = useState('3.20');
  const [diaClarity, setDiaClarity] = useState('VVS1');
  const [diaShape, setDiaShape] = useState('Round Brilliant');
  const [diaColour, setDiaColour] = useState('D');
  const [diaPrice, setDiaPrice] = useState('124500');

  if (!isOpen) return null;

  const handleGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(goldWeight) || 1.0;
    addGoldItem({
      tagNo: goldTagNo,
      item: goldItem,
      certificateNo: goldCert,
      description: goldDesc,
      brand: goldBrand,
      weight: w,
      branch: goldBranch,
      purity: goldItem.includes('22K') ? '22K' : goldItem.includes('18K') ? '18K' : '24K',
      status: 'In Vault',
      estValueUsd: w * 1000 * goldSpotPrice
    });

    try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } }); } catch {}
    onClose();
  };

  const handleDiamondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDiamondItem({
      tagNo: diaTagNo,
      item: diaItem,
      certificateNo: diaCert,
      description: diaDesc,
      branch: diaBranch,
      carat: parseFloat(diaCarat) || 1.0,
      clarity: diaClarity,
      shape: diaShape,
      colour: diaColour,
      tagPrice: parseFloat(diaPrice) || 10000,
      stoneType: diaDesc.toLowerCase().includes('lab') ? 'Lab Grown' : 'Natural',
      status: 'In Vault'
    });

    try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } }); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-[#fed65b] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-headline">New Asset Entry</h3>
              <p className="text-xs text-slate-500 font-mono">Manual Intake Station</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('gold')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold font-headline border-b-2 transition-all ${
              activeTab === 'gold'
                ? 'border-[#d4af37] text-[#735c00] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Gold Asset (7 Columns)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diamond')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold font-headline border-b-2 transition-all ${
              activeTab === 'diamond'
                ? 'border-[#065f46] text-[#065f46] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gem className="w-4 h-4" />
            Diamond Lot (10 Columns)
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'gold' ? (
            <form onSubmit={handleGoldSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    1. TAG NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    value={goldTagNo}
                    onChange={e => setGoldTagNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    2. ITEM *
                  </label>
                  <input
                    type="text"
                    required
                    value={goldItem}
                    onChange={e => setGoldItem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    3. CERTIFICATE NUMBER
                  </label>
                  <input
                    type="text"
                    required
                    value={goldCert}
                    onChange={e => setGoldCert(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    5. BRAND
                  </label>
                  <select
                    value={goldBrand}
                    onChange={e => setGoldBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="PAMP Suisse">PAMP Suisse</option>
                    <option value="Valcambi">Valcambi</option>
                    <option value="Argor-Heraeus">Argor-Heraeus</option>
                    <option value="Perth Mint">Perth Mint</option>
                    <option value="Emirates Gold">Emirates Gold</option>
                    <option value="Heraeus">Heraeus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    6. WEIGHT (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={goldWeight}
                    onChange={e => setGoldWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    7. BRANCH *
                  </label>
                  <input
                    type="text"
                    required
                    value={goldBranch}
                    onChange={e => setGoldBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  4. DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={goldDesc}
                  onChange={e => setGoldDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#0f172a] text-[#fed65b] hover:bg-slate-800 shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  Save Gold Record
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleDiamondSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    1. TAG NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    value={diaTagNo}
                    onChange={e => setDiaTagNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    2. ITEM *
                  </label>
                  <input
                    type="text"
                    required
                    value={diaItem}
                    onChange={e => setDiaItem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    3. CERTIFICATE NUMBER
                  </label>
                  <input
                    type="text"
                    required
                    value={diaCert}
                    onChange={e => setDiaCert(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    5. BRANCH *
                  </label>
                  <input
                    type="text"
                    required
                    value={diaBranch}
                    onChange={e => setDiaBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    6. CARAT *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={diaCarat}
                    onChange={e => setDiaCarat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    7. CLARITY
                  </label>
                  <input
                    type="text"
                    value={diaClarity}
                    onChange={e => setDiaClarity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    8. SHAPE
                  </label>
                  <input
                    type="text"
                    value={diaShape}
                    onChange={e => setDiaShape(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    9. COLOUR
                  </label>
                  <input
                    type="text"
                    value={diaColour}
                    onChange={e => setDiaColour(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                    10. TAG PRICE ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={diaPrice}
                    onChange={e => setDiaPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  4. DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={diaDesc}
                  onChange={e => setDiaDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#065f46] text-white hover:bg-[#002116] shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#a6f2d1]" />
                  Save Diamond Record
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
