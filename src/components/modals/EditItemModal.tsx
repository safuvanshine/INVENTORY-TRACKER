'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { X, Edit, Save, Trash2 } from 'lucide-react';
import { GoldItem, DiamondItem } from '@/lib/types';
import { parseNumericValue } from '@/lib/utils';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GoldItem | DiamondItem | null;
  itemCategory: 'gold' | 'diamond';
}

export function EditItemModal({ isOpen, onClose, item, itemCategory }: EditItemModalProps) {
  const { updateGoldItem, updateDiamondItem, deleteGoldItem, deleteDiamondItem, goldSpotPrice } = useInventory();

  // Shared
  const [tagNo, setTagNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [certNo, setCertNo] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('');

  // Gold specific
  const [goldBrand, setGoldBrand] = useState('');
  const [goldWeight, setGoldWeight] = useState('');

  // Diamond specific
  const [diaCarat, setDiaCarat] = useState('');
  const [diaClarity, setDiaClarity] = useState('');
  const [diaShape, setDiaShape] = useState('');
  const [diaColour, setDiaColour] = useState('');
  const [diaPrice, setDiaPrice] = useState('');

  useEffect(() => {
    if (item) {
      setTagNo(item.tagNo);
      setItemName(item.item || '');
      setCertNo(item.certificateNo || '');
      setDescription(item.description || '');
      setBranch(item.branch || '');

      if (itemCategory === 'gold') {
        const g = item as GoldItem;
        setGoldBrand(g.brand || 'PAMP Suisse');
        setGoldWeight(g.weight ? g.weight.toString() : '1.0');
      } else {
        const d = item as DiamondItem;
        setDiaCarat(d.carat ? d.carat.toString() : '1.0');
        setDiaClarity(d.clarity || 'VVS1');
        setDiaShape(d.shape || 'Round Brilliant');
        setDiaColour(d.colour || 'D');
        setDiaPrice(d.tagPrice ? d.tagPrice.toString() : '10000');
      }
    }
  }, [item, itemCategory]);

  if (!isOpen || !item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemCategory === 'gold') {
      const w = parseNumericValue(goldWeight, 1.0);
      updateGoldItem(item.id, {
        tagNo,
        item: itemName,
        certificateNo: certNo,
        description,
        brand: goldBrand,
        weight: w,
        branch,
        estValueUsd: w * 1000 * goldSpotPrice
      });
    } else {
      updateDiamondItem(item.id, {
        tagNo,
        item: itemName,
        certificateNo: certNo,
        description,
        branch,
        carat: parseNumericValue(diaCarat, 1.0),
        clarity: diaClarity,
        shape: diaShape,
        colour: diaColour,
        tagPrice: parseNumericValue(diaPrice, 1000)
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${item.tagNo} from the vault registry?`)) {
      if (itemCategory === 'gold') {
        deleteGoldItem(item.id);
      } else {
        deleteDiamondItem(item.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-[#fed65b] flex items-center justify-center">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline">Edit Asset Record (Admin Only)</h3>
              <p className="text-xs text-slate-500 font-mono">{item.tagNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                1. TAG NUMBER
              </label>
              <input
                type="text"
                required
                value={tagNo}
                onChange={e => setTagNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                2. ITEM
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={e => setItemName(e.target.value)}
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
                value={certNo}
                onChange={e => setCertNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                {itemCategory === 'gold' ? '7. BRANCH' : '5. BRANCH'}
              </label>
              <input
                type="text"
                required
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          {itemCategory === 'gold' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  5. BRAND
                </label>
                <input
                  type="text"
                  value={goldBrand}
                  onChange={e => setGoldBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  6. WEIGHT (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={goldWeight}
                  onChange={e => setGoldWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  6. CARAT
                </label>
                <input
                  type="number"
                  step="0.01"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
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
          )}

          {itemCategory === 'diamond' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  9. COLOUR
                </label>
                <input
                  type="text"
                  value={diaColour}
                  onChange={e => setDiaColour(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
                  10. TAG PRICE ($)
                </label>
                <input
                  type="number"
                  value={diaPrice}
                  onChange={e => setDiaPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono mb-1">
              4. DESCRIPTION
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>

            <div className="flex gap-2">
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
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
