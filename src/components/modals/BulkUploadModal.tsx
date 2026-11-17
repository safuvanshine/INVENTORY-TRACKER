'use client';

import React, { useState, useRef } from 'react';
import { useInventory } from '@/context/InventoryContext';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layers,
  Gem,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  downloadExcelGoldTemplate,
  downloadExcelDiamondTemplate,
  parseNumericValue,
  formatUsd,
  formatNumber
} from '@/lib/utils';
import { GoldItem, DiamondItem } from '@/lib/types';
import confetti from 'canvas-confetti';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategory?: 'gold' | 'diamond';
}

/**
 * Helper to retrieve a field value from an Excel row object
 * using exact, normalized, or regex matching against keys.
 */
function getRowField(row: Record<string, any>, candidateKeywords: string[], regex?: RegExp): any {
  const entries = Object.entries(row);

  // 1. Exact or normalized matching (case-insensitive, strip non-alphanumerics)
  for (const [key, val] of entries) {
    if (val === undefined || val === null || String(val).trim() === '') continue;
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const cand of candidateKeywords) {
      const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanCand) {
        return val;
      }
    }
  }

  // 2. Contains matching
  for (const [key, val] of entries) {
    if (val === undefined || val === null || String(val).trim() === '') continue;
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const cand of candidateKeywords) {
      const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanCand.length >= 3 && cleanKey.includes(cleanCand)) {
        return val;
      }
    }
  }

  // 3. Regex matching against the original header key
  if (regex) {
    for (const [key, val] of entries) {
      if (val === undefined || val === null || String(val).trim() === '') continue;
      if (regex.test(key)) {
        return val;
      }
    }
  }

  return undefined;
}

export function BulkUploadModal({ isOpen, onClose, targetCategory = 'gold' }: BulkUploadModalProps) {
  const { bulkAddGold, bulkAddDiamonds, goldSpotPrice } = useInventory();
  const [category, setCategory] = useState<'gold' | 'diamond'>(targetCategory);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'upsert' | 'replace' | 'append'>('upsert');
  const [parsedGoldRows, setParsedGoldRows] = useState<Omit<GoldItem, 'id' | 'lastUpdated'>[]>([]);
  const [parsedDiamondRows, setParsedDiamondRows] = useState<Omit<DiamondItem, 'id' | 'lastUpdated'>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    if (category === 'gold') {
      downloadExcelGoldTemplate();
    } else {
      downloadExcelDiamondTemplate();
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg('');
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setErrorMsg('Excel document contains no readable sheets.');
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        setErrorMsg('Uploaded Excel sheet is empty. Please add rows.');
        return;
      }

      // Detect header row index (in case there is a title banner or empty rows at the top)
      let headerRowIndex = 0;
      let maxMatchedKeywords = 0;

      const diamondKeywords = ['tag', 'item', 'cert', 'desc', 'branch', 'carat', 'clarity', 'shape', 'color', 'colour', 'price', 'weight', 'cts', 'wt'];
      const goldKeywords = ['tag', 'item', 'cert', 'desc', 'brand', 'weight', 'branch', 'purity', 'gold'];
      const targetKeywords = category === 'gold' ? goldKeywords : diamondKeywords;

      for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;
        let matches = 0;
        for (const cell of row) {
          const text = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (targetKeywords.some(kw => text.includes(kw))) {
            matches++;
          }
        }
        if (matches > maxMatchedKeywords) {
          maxMatchedKeywords = matches;
          headerRowIndex = r;
        }
      }

      const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
      const dataRows = rawRows.slice(headerRowIndex + 1);

      // Convert data rows into objects
      const jsonData: Record<string, any>[] = [];
      dataRows.forEach(row => {
        if (!Array.isArray(row)) return;
        const isAllEmpty = row.every(cell => cell === null || cell === undefined || String(cell).trim() === '');
        if (isAllEmpty) return;

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          const key = h || `col_${idx}`;
          rowObj[key] = row[idx];
        });
        jsonData.push(rowObj);
      });

      if (jsonData.length === 0) {
        setErrorMsg('No data rows found below headers in the uploaded Excel sheet.');
        return;
      }

      if (category === 'gold') {
        const goldRows: Omit<GoldItem, 'id' | 'lastUpdated'>[] = jsonData.map((row, idx) => {
          const tagNo = String(
            getRowField(
              row,
              ['tag number', 'tag no', 'tagno', 'tag #', 'tag', 'item code', 'barcode', 'sku', 'lot no', 'lot'],
              /(?:tag.*no|tag.*num|barcode|sku)/i
            ) || `AU-LOT-${idx + 100}`
          ).trim();

          const item = String(
            getRowField(
              row,
              ['item', 'item name', 'product', 'product name', 'article', 'title', 'name', 'gold item'],
              /(?:item|product|article|title)/i
            ) || 'Bullion Bar 24K'
          ).trim();

          const certificateNo = String(
            getRowField(
              row,
              ['certificate number', 'certificate no', 'cert no', 'certificate', 'cert', 'report no', 'assay'],
              /(?:cert|report|assay)/i
            ) || 'PENDING-ASSAY'
          ).trim();

          const description = String(
            getRowField(
              row,
              ['description', 'item description', 'desc', 'details', 'specification', 'specs', 'notes'],
              /(?:desc|detail|remark|spec)/i
            ) || 'Fine Gold Bullion Asset'
          ).trim();

          const brand = String(
            getRowField(
              row,
              ['brand', 'refinery brand', 'refinery', 'maker', 'mint', 'hallmark'],
              /(?:brand|refinery|mint)/i
            ) || 'PAMP Suisse'
          ).trim();

          const rawWeight = getRowField(
            row,
            ['weight', 'weight (kg)', 'weightkg', 'weight (g)', 'weightg', 'wt', 'gross weight', 'net weight'],
            /(?:weight|wt)/i
          );
          const weight = parseNumericValue(rawWeight, 1.0);

          const branch = String(
            getRowField(
              row,
              ['branch', 'vault location', 'vault', 'location', 'store', 'showroom', 'hub'],
              /(?:branch|vault|location|store)/i
            ) || 'HO'
          ).trim();

          const purityCandidate = String(
            getRowField(row, ['purity', 'karat', 'karats', 'kt', 'fineness'], /(?:purity|karat)/i) || ''
          ).toUpperCase();

          let purity: '24K' | '22K' | '18K' | '14K' = '24K';
          if (purityCandidate.includes('22') || item.includes('22K')) purity = '22K';
          else if (purityCandidate.includes('18') || item.includes('18K')) purity = '18K';
          else if (purityCandidate.includes('14') || item.includes('14K')) purity = '14K';

          return {
            tagNo,
            item,
            certificateNo,
            description,
            brand,
            weight,
            branch,
            purity,
            status: 'In Vault',
            estValueUsd: weight * 1000 * goldSpotPrice
          };
        });

        setParsedGoldRows(goldRows);
      } else {
        const diamondRows: Omit<DiamondItem, 'id' | 'lastUpdated'>[] = jsonData.map((row, idx) => {
          // 1. TAG NUMBER
          const tagNo = String(
            getRowField(
              row,
              ['tag number', 'tag no', 'tagno', 'tag #', 'tag', 'item code', 'barcode', 'sku', 'lot no', 'lot', 'code', 'id'],
              /(?:tag.*no|tag.*num|barcode|sku|lot)/i
            ) || `DIA-${idx + 100}`
          ).trim();

          // 2. ITEM
          const item = String(
            getRowField(
              row,
              ['item', 'item name', 'product', 'product name', 'article', 'title', 'name', 'ornament'],
              /(?:item|product|article|title)/i
            ) || 'Diamond Solitaire Ring'
          ).trim();

          // 3. CERTIFICATE NUMBER
          const certificateNo = String(
            getRowField(
              row,
              ['certificate number', 'certificate no', 'cert no', 'certificate', 'cert number', 'cert', 'gia report', 'gia no', 'igi no', 'report no', 'dossier'],
              /(?:cert|report|gia|igi)/i
            ) || 'GIA-PENDING'
          ).trim();

          // 4. DESCRIPTION
          const description = String(
            getRowField(
              row,
              ['description', 'item description', 'desc', 'details', 'specification', 'specs', 'remarks', 'notes'],
              /(?:desc|detail|remark|spec)/i
            ) || 'Certified Diamond Specimen'
          ).trim();

          // 5. BRANCH
          const branch = String(
            getRowField(
              row,
              ['branch', 'branch name', 'vault location', 'vault', 'location', 'store', 'showroom', 'warehouse', 'hub', 'city'],
              /(?:branch|vault|location|store|hub)/i
            ) || 'HO'
          ).trim();

          // 6. CARAT - Robust Matching & Fallback
          const rawCarat = getRowField(
            row,
            [
              'carat', 'carats', 'carat wt', 'carat weight', 'caratwt', 'carats wt',
              'cts', 'cts.', 'ct', 'ct.', 'crt', 'crts',
              'dia wt', 'dia wt.', 'dia. wt', 'diamond wt', 'diamond weight',
              'stone wt', 'stone weight', 'st wt',
              'weight (ct)', 'weight (cts)', 'weight(ct)', 'weight(cts)', 'weight ct',
              'weight', 'wt'
            ],
            /(?:carat|cts?|crts?|dia.*wt|stone.*wt|weight.*ct)/i
          );

          let carat = parseNumericValue(rawCarat, 0);

          // If Carat was not found in columns or was 0, attempt to extract from item or description
          if (carat <= 0) {
            const descText = `${item} ${description}`;
            const caratMatch = descText.match(/(\d+(?:\.\d+)?)\s*(?:ct|cts|carat|carats)\b/i);
            if (caratMatch && caratMatch[1]) {
              carat = parseFloat(caratMatch[1]) || 1.0;
            } else {
              carat = 1.0;
            }
          }

          // 7. CLARITY
          const clarity = String(
            getRowField(
              row,
              ['clarity', 'clarity grade', 'diamond clarity', 'purity', 'clar'],
              /(?:clar)/i
            ) || 'VVS1'
          ).trim();

          // 8. SHAPE
          const shape = String(
            getRowField(
              row,
              ['shape', 'diamond shape', 'cut', 'cut shape', 'stone shape'],
              /(?:shape|cut)/i
            ) || 'Round Brilliant'
          ).trim();

          // 9. COLOUR
          const colour = String(
            getRowField(
              row,
              ['colour', 'color', 'diamond colour', 'diamond color', 'color grade', 'colour grade', 'shade'],
              /(?:colo?ur|shade)/i
            ) || 'D'
          ).trim();

          // 10. TAG PRICE - Robust Matching & Currency Parsing
          const rawTagPrice = getRowField(
            row,
            [
              'tag price', 'tagprice', 'tag_price', 'tag price ($)', 'tag price(usd)', 'tag price (aed)',
              'price', 'tag amount', 'tag amt', 'tagamount', 'tagamt',
              'selling price', 'sale price', 'retail price', 'total price',
              'msrp', 'rate', 'tag rate', 'amount', 'total amount', 'value', 'tag value', 'cost'
            ],
            /(?:tag.*price|tag.*amt|tag.*amount|selling.*price|retail.*price|price|amount|msrp|rate|value)/i
          );

          let tagPrice = parseNumericValue(rawTagPrice, 0);

          // If Tag Price was 0 or unparsed, check if price appears in description or item
          if (tagPrice <= 0) {
            const priceMatch = `${description} ${item}`.match(/\$\s*(\d[\d,]*(?:\.\d+)?)/);
            if (priceMatch && priceMatch[1]) {
              tagPrice = parseNumericValue(priceMatch[1], 15000);
            } else {
              tagPrice = 15000;
            }
          }

          const rawStoneType = String(
            getRowField(
              row,
              ['stone type', 'diamond type', 'type', 'origin', 'natural/lab', 'lab/natural'],
              /(?:stone.*type|origin)/i
            ) || ''
          );

          let stoneType: 'Natural' | 'Lab Grown' = 'Natural';
          if (
            rawStoneType.toLowerCase().includes('lab') ||
            description.toLowerCase().includes('lab') ||
            item.toLowerCase().includes('lab')
          ) {
            stoneType = 'Lab Grown';
          }

          return {
            tagNo,
            item,
            certificateNo,
            description,
            branch,
            carat,
            clarity,
            shape,
            colour,
            tagPrice,
            stoneType,
            status: 'In Vault'
          };
        });

        setParsedDiamondRows(diamondRows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv document.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    if (category === 'gold' && parsedGoldRows.length > 0) {
      bulkAddGold(parsedGoldRows, { mode: importMode });
      try { confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } }); } catch {}
      onClose();
    } else if (category === 'diamond' && parsedDiamondRows.length > 0) {
      bulkAddDiamonds(parsedDiamondRows, { mode: importMode });
      try { confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } }); } catch {}
      onClose();
    }
  };

  const totalParsedCount = category === 'gold' ? parsedGoldRows.length : parsedDiamondRows.length;
  const totalDiamondCaratSum = parsedDiamondRows.reduce((sum, r) => sum + (r.carat || 0), 0);
  const totalDiamondValueSum = parsedDiamondRows.reduce((sum, r) => sum + (r.tagPrice || 0), 0);
  const totalGoldWeightSum = parsedGoldRows.reduce((sum, r) => sum + (r.weight || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#f7f9fb] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-[#fed65b] flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-headline">Excel & CSV Bulk Intake</h3>
              <p className="text-xs text-slate-500 font-mono">
                {category === 'gold' ? '7 Gold Columns' : '10 Diamond Columns'} Manifest Pipeline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Category Selector Tabs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setCategory('gold');
                setFileName('');
                setParsedGoldRows([]);
                setParsedDiamondRows([]);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold font-headline transition-all ${
                category === 'gold'
                  ? 'border-[#d4af37] bg-[#fed65b]/10 text-[#735c00] ring-2 ring-[#fed65b]/30'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-[#d4af37]" />
              Gold Manifest (7 Columns)
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory('diamond');
                setFileName('');
                setParsedGoldRows([]);
                setParsedDiamondRows([]);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold font-headline transition-all ${
                category === 'diamond'
                  ? 'border-[#065f46] bg-emerald-50 text-[#065f46] ring-2 ring-[#065f46]/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Gem className="w-4 h-4 text-[#065f46]" />
              Diamond Manifest (10 Columns)
            </button>
          </div>

          {/* Download Official Excel Template Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Download Official {category === 'gold' ? 'Gold (7 Columns)' : 'Diamond (10 Columns)'} Template
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {category === 'gold'
                    ? 'TAG NUMBER, ITEM, CERTIFICATE NUMBER, DESCRIPTION, BRAND, WEIGHT, BRANCH'
                    : 'TAG NUMBER, ITEM, CERTIFICATE NUMBER, DESCRIPTION, BRANCH, CARAT, CLARITY, SHAPE, COLOUR, TAG PRICE'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#0f172a]" />
              Download .XLSX
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#d4af37] bg-[#fed65b]/10 scale-[0.99]'
                : 'border-slate-300 hover:border-[#0f172a] hover:bg-slate-50/80 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6 text-[#0f172a]" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              {fileName ? fileName : 'Choose Excel spreadsheet (.xlsx) or drag and drop here'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Parsed directly into live {category.toUpperCase()} vault registry with intelligent column detection
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Live Data Preview & Summary */}
          {totalParsedCount > 0 && (
            <div className="space-y-3">
              {/* Summary Metric Strip */}
              {category === 'diamond' ? (
                <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Stones</span>
                    <span className="font-bold text-slate-900 text-sm">{parsedDiamondRows.length} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Carat Weight</span>
                    <span className="font-bold text-emerald-900 text-sm">{formatNumber(totalDiamondCaratSum, 2)} ct</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Tag Value</span>
                    <span className="font-bold text-emerald-900 text-sm">{formatUsd(totalDiamondValueSum)}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Assets</span>
                    <span className="font-bold text-slate-900 text-sm">{parsedGoldRows.length} bars/lots</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Gold Weight</span>
                    <span className="font-bold text-amber-900 text-sm">{formatNumber(totalGoldWeightSum, 3)} g</span>
                  </div>
                </div>
              )}

              {/* Ingestion Mode Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Import Action Mode:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md font-semibold">
                    Smart Tag Resolution
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setImportMode('upsert')}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      importMode === 'upsert'
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">Smart Sync (Update)</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Updates existing Tag Numbers with accurate Carat & Price, adds new ones.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('replace')}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-white border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white/50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-bold text-rose-900 leading-tight">Replace All</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Wipes existing {category} records and loads this sheet as single source.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('append')}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-white border-slate-800 ring-2 ring-slate-400/20 shadow-xs'
                        : 'bg-white/50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-slate-800 focus:ring-slate-800"
                    />
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">Append as New</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Adds all rows as new records alongside existing inventory.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Parsed {totalParsedCount} rows from {fileName}</span>
                </div>
                <span className="text-slate-400">Previewing first 5 rows</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                <div className="overflow-x-auto max-h-48 custom-scrollbar">
                  <table className="w-full text-left border-collapse text-[11px] font-mono whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-200/80 border-b border-slate-300 font-bold uppercase text-slate-700">
                        {category === 'gold' ? (
                          <>
                            <th className="px-3 py-2">TAG NUMBER</th>
                            <th className="px-3 py-2">ITEM</th>
                            <th className="px-3 py-2">CERTIFICATE</th>
                            <th className="px-3 py-2">BRAND</th>
                            <th className="px-3 py-2 text-right">WEIGHT</th>
                            <th className="px-3 py-2">BRANCH</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2">TAG NUMBER</th>
                            <th className="px-3 py-2">ITEM</th>
                            <th className="px-3 py-2">CERTIFICATE</th>
                            <th className="px-3 py-2">SHAPE</th>
                            <th className="px-3 py-2 text-right bg-emerald-100/50 text-emerald-950 font-bold">CARAT</th>
                            <th className="px-3 py-2">CLARITY</th>
                            <th className="px-3 py-2">COLOUR</th>
                            <th className="px-3 py-2 text-right bg-emerald-100/50 text-emerald-950 font-bold">TAG PRICE</th>
                            <th className="px-3 py-2">BRANCH</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {category === 'gold'
                        ? parsedGoldRows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-bold text-[#0f172a]">{r.tagNo}</td>
                              <td className="px-3 py-2 text-slate-900 font-sans">{r.item}</td>
                              <td className="px-3 py-2 text-slate-500">{r.certificateNo}</td>
                              <td className="px-3 py-2 text-slate-700">{r.brand}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">{formatNumber(r.weight, 3)} g</td>
                              <td className="px-3 py-2 text-slate-600">{r.branch}</td>
                            </tr>
                          ))
                        : parsedDiamondRows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-bold text-[#0f172a]">{r.tagNo}</td>
                              <td className="px-3 py-2 text-slate-900 font-sans max-w-[150px] truncate">{r.item}</td>
                              <td className="px-3 py-2 text-slate-500">{r.certificateNo}</td>
                              <td className="px-3 py-2 text-slate-700">{r.shape}</td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-900 bg-emerald-50/40">
                                {formatNumber(r.carat, 2)} ct
                              </td>
                              <td className="px-3 py-2 text-slate-700">{r.clarity}</td>
                              <td className="px-3 py-2 text-slate-700">{r.colour}</td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-800 bg-emerald-50/40">
                                {formatUsd(r.tagPrice)}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{r.branch}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={totalParsedCount === 0}
              onClick={handleImport}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0f172a] text-[#fed65b] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 transition-all"
            >
              <FileCheck className="w-4 h-4 text-[#d4af37]" />
              {importMode === 'upsert' ? 'Sync' : importMode === 'replace' ? 'Replace with' : 'Ingest'}{' '}
              {totalParsedCount > 0 ? `${totalParsedCount} Records` : 'Excel Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
