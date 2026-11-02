'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { formatUsd, formatNumber } from '@/lib/utils';
import {
  X,
  Send,
  Gem,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Download,
  TableProperties,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryResultItem {
  tagNo: string;
  branch: string;
  carat?: number;
  clarity?: string;
  shape?: string;
  colour?: string;
  tagPrice?: number;
  item?: string;
  weight?: number;
  purity?: string;
  brand?: string;
  description?: string;
}
interface BranchBreakdown { branch: string; count: number; carats?: number; weightKg?: number; }

interface StructuredResult {
  type: 'inventory-result';
  summary: string;
  totalFound: number;
  totalCarats?: number;
  totalValue?: number;
  items: InventoryResultItem[];
  branchBreakdown?: BranchBreakdown[];
}

type ChatMessageType = 'text' | 'inventory-result' | 'voice-query';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  type: ChatMessageType;
  text: string;
  structured?: StructuredResult;
  timestamp: string;
  isVoice?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportResultsCSV(items: InventoryResultItem[], filename: string) {
  if (!items.length) return;
  const headers = Object.keys(items[0]).join(',');
  const rows = items.map(item => Object.values(item).map(v => `"${v ?? ''}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Format markdown-lite **bold** for display
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── InventoryResultCard ──────────────────────────────────────────────────────

function InventoryResultCard({ result }: { result: StructuredResult }) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? result.items : result.items.slice(0, 5);
  const isDiamond = result.items.some(i => i.carat !== undefined);

  return (
    <div className="space-y-3 w-full">
      {/* Summary Badge Row */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {result.totalFound} {result.totalFound === 1 ? 'item' : 'items'} found
        </span>
        {result.totalCarats != null && result.totalCarats > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#fed65b]/10 border border-[#fed65b]/30 text-[#fed65b] text-[11px] font-bold font-mono">
            💎 {formatNumber(result.totalCarats, 2)} ct total
          </span>
        )}
        {result.totalValue != null && result.totalValue > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-[11px] font-bold font-mono">
            {formatUsd(result.totalValue)}
          </span>
        )}
      </div>

      {/* Summary text */}
      <p className="text-[12px] text-slate-200 leading-relaxed">{result.summary}</p>

      {/* Branch Breakdown */}
      {result.branchBreakdown && result.branchBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.branchBreakdown.map((b, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
              📍 {b.branch}: {b.count} {isDiamond && b.carats ? `(${formatNumber(b.carats, 2)}ct)` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Results Table */}
      {result.items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1220]">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-slate-700 bg-[#131b2e]">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tag</th>
                  {isDiamond ? (
                    <>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Shape</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400 font-bold">Carat</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Clarity</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Color</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Brand</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400 font-bold">Weight</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Purity</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Branch</th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400 font-bold">Price</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, i) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 text-[#fed65b] font-bold">{item.tagNo}</td>
                    {isDiamond ? (
                      <>
                        <td className="px-3 py-2 text-slate-300">{item.shape || '—'}</td>
                        <td className="px-3 py-2 text-right text-slate-200">{item.carat != null ? formatNumber(item.carat, 2) : '—'}</td>
                        <td className="px-3 py-2 text-slate-300">{item.clarity || '—'}</td>
                        <td className="px-3 py-2 text-slate-300">{item.colour || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-300">{item.brand || '—'}</td>
                        <td className="px-3 py-2 text-right text-slate-200">{item.weight != null ? `${formatNumber(item.weight, 3)} kg` : '—'}</td>
                        <td className="px-3 py-2 text-slate-300">{item.purity || '—'}</td>
                      </>
                    )}
                    <td className="px-3 py-2 text-slate-400 text-[10px]">{item.branch || '—'}</td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-semibold">
                      {item.tagPrice != null ? formatUsd(item.tagPrice) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.items.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 bg-[#131b2e] hover:bg-slate-800 transition-colors border-t border-slate-700"
            >
              {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Show Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show All {result.items.length} items</>}
            </button>
          )}
        </div>
      ) : (
        <div className="py-6 text-center rounded-xl border border-slate-700/40 bg-slate-900/50">
          <AlertCircle className="w-5 h-5 text-slate-500 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400 font-mono">No matching inventory found for the specified criteria.</p>
        </div>
      )}

      {/* Action Buttons */}
      {result.items.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('ruby-highlight-items', { detail: result.items.map(i => i.tagNo) }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fed65b]/10 border border-[#fed65b]/30 text-[#fed65b] text-[11px] font-semibold hover:bg-[#fed65b]/20 transition-colors"
          >
            <TableProperties className="w-3.5 h-3.5" />
            Highlight in Table
          </button>
          <button
            onClick={() => exportResultsCSV(result.items, `ruby-query-${Date.now()}.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Query
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIAssistantModal() {
  const {
    goldItems,
    diamondItems,
    alerts,
    goldSpotPrice,
    totalGoldWeightKg,
    totalGoldValueUsd,
    totalDiamondCarats,
    totalDiamondValueUsd
  } = useInventory();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Voice / Speech
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved API key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('SHINE_GEMINI_API_KEY');
      if (savedKey) { setGeminiApiKey(savedKey); setIsKeySaved(true); }
      // Check speech support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognition);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('SHINE_GEMINI_API_KEY', geminiApiKey.trim());
      setIsKeySaved(!!geminiApiKey.trim());
      setShowSettings(false);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      type: 'text',
      text: `Hello! I'm **RUBY**, your **SHINE AI Vault Copilot** powered by Google Gemini.\n\n🔗 Synced with your live vault inventory — ${diamondItems.length} diamonds & ${goldItems.length} gold items.\n\n🌐 **Multilingual**: Chat in English, Malayalam (Manglish), or Hindi!\n\n🎙️ **Voice Ready**: Tap the mic button or type your query below.\n\n**Try asking:**\n• "VVS2 E pear shape 1.5 to 2 carat diamond available?\"\n• "Show total vault valuation"\n• "Gold stock in London Mayfair"`,
      timestamp: 'Just now'
    }
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Keyboard shortcut + CustomEvent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-ai-assistant', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-ai-assistant', handleOpenEvent);
    };
  }, []);

  // TTS
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`•]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // ── Local Inventory Engine (fallback when no API key) ─────────────────────
  const localInventoryEngine = useCallback((query: string): { text?: string; structured?: StructuredResult } => {
    const q = query.toLowerCase().trim();

    // ── Diamond availability query ──
    const isDiamondQuery = q.includes('diamond') || q.includes('carat') || q.includes('clarity') ||
      q.includes('shape') || q.includes('round') || q.includes('pear') || q.includes('oval') ||
      q.includes('princess') || q.includes('cushion') || q.includes('emerald') ||
      q.includes('vvs') || q.includes('vs1') || q.includes('vs2') || q.includes('si1') || q.includes('si2') ||
      q.includes('ഡയമണ്ട്') || q.includes('heera') || q.includes('हीरा') ||
      q.includes('available') || q.includes('undo') || q.includes('undu');

    if (isDiamondQuery) {
      let filtered = [...diamondItems];

      // Clarity filters
      const clarityMap: Record<string, string[]> = {
        'if': ['IF'], 'fl': ['FL'], 'vvs1': ['VVS1'], 'vvs2': ['VVS2'],
        'vs1': ['VS1'], 'vs2': ['VS2'], 'si1': ['SI1'], 'si2': ['SI2'],
        'si3': ['SI3'], 'i1': ['I1'], 'i2': ['I2'], 'i3': ['I3']
      };
      let clarityFiltered = false;
      for (const [key, values] of Object.entries(clarityMap)) {
        if (q.includes(key)) {
          filtered = filtered.filter(d => values.some(v => d.clarity?.toUpperCase() === v));
          clarityFiltered = true;
          break;
        }
      }

      // Colour filters (single letters D E F G H I J K...)
      const colourMatch = q.match(/\b([d-m])\b(?!\w)/i) || q.match(/\bcolou?r\s*:?\s*([d-m])\b/i) || q.match(/\b([d-m])\s+(?:color|colour|colou?r)\b/i);
      if (colourMatch) {
        const col = colourMatch[1].toUpperCase();
        filtered = filtered.filter(d => d.colour?.toUpperCase() === col);
      }

      // Shape filters
      const shapeKeys = ['round', 'pear', 'oval', 'princess', 'cushion', 'emerald', 'radiant', 'asscher', 'marquise', 'heart', 'trillion'];
      for (const shape of shapeKeys) {
        if (q.includes(shape)) {
          filtered = filtered.filter(d => d.shape?.toLowerCase().includes(shape));
          break;
        }
      }

      // Carat range filters
      // Pattern: "1.5 to 2" or "1.5-2" or "between 1.5 and 2"
      const rangeMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|and)\s*(\d+(?:\.\d+)?)\s*(?:carat|ct|karat)?/i) ||
        q.match(/(\d+(?:\.\d+)?)\s*(?:carat|ct)\s*(?:to|-)\s*(\d+(?:\.\d+)?)/i);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (!isNaN(min) && !isNaN(max)) {
          filtered = filtered.filter(d => d.carat >= min && d.carat <= max);
        }
      } else {
        // Single carat threshold
        const caratMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:carat|ct)/i);
        if (caratMatch) {
          const carat = parseFloat(caratMatch[1]);
          if (!isNaN(carat)) {
            if (q.includes('above') || q.includes('more than') || q.includes('greater') || q.includes('over')) {
              filtered = filtered.filter(d => d.carat > carat);
            } else if (q.includes('below') || q.includes('less than') || q.includes('under')) {
              filtered = filtered.filter(d => d.carat < carat);
            } else {
              // exact ±0.1 tolerance
              filtered = filtered.filter(d => Math.abs(d.carat - carat) <= 0.1);
            }
          }
        }
      }

      // Branch filter
      const branchNames = ['london', 'geneva', 'dubai', 'paris', 'new york', 'zurich', 'milan', 'tokyo'];
      for (const branch of branchNames) {
        if (q.includes(branch)) {
          filtered = filtered.filter(d => d.branch.toLowerCase().includes(branch));
          break;
        }
      }

      // Build branch breakdown
      const branchMap: Record<string, { count: number; carats: number }> = {};
      filtered.forEach(d => {
        const b = d.branch || 'Unknown';
        if (!branchMap[b]) branchMap[b] = { count: 0, carats: 0 };
        branchMap[b].count++;
        branchMap[b].carats += d.carat || 0;
      });
      const branchBreakdown: BranchBreakdown[] = Object.entries(branchMap).map(([branch, v]) => ({
        branch, count: v.count, carats: v.carats
      }));

      const totalCarats = filtered.reduce((s, d) => s + (d.carat || 0), 0);
      const totalValue = filtered.reduce((s, d) => s + (d.tagPrice || 0), 0);

      const summaryParts: string[] = [];
      if (q.includes('available') || q.includes('undo') || q.includes('undu')) {
        summaryParts.push(filtered.length > 0 ? `✅ Yes! ${filtered.length} matching diamond${filtered.length > 1 ? 's' : ''} found in your vault.` : '❌ No matching diamonds found for the specified criteria.');
      } else {
        summaryParts.push(filtered.length > 0 ? `Found ${filtered.length} diamond${filtered.length > 1 ? 's' : ''} matching your query.` : 'No diamonds match the specified criteria.');
      }
      if (filtered.length > 0 && branchBreakdown.length > 0) {
        summaryParts.push(`Available across ${branchBreakdown.length} branch${branchBreakdown.length > 1 ? 'es' : ''}: ${branchBreakdown.map(b => b.branch.split(' ').slice(-2).join(' ')).join(', ')}.`);
      }

      return {
        structured: {
          type: 'inventory-result',
          summary: summaryParts.join(' '),
          totalFound: filtered.length,
          totalCarats,
          totalValue,
          items: filtered.map(d => ({
            tagNo: d.tagNo,
            branch: d.branch,
            carat: d.carat,
            clarity: d.clarity,
            shape: d.shape,
            colour: d.colour,
            tagPrice: d.tagPrice,
            item: d.item,
            description: d.description
          })),
          branchBreakdown
        }
      };
    }

    // ── Gold availability query ──
    if (q.includes('gold') || q.includes('swarnam') || q.includes('bar') || q.includes('pamp') ||
      q.includes('24k') || q.includes('22k') || q.includes('18k') || q.includes('valcambi') ||
      q.includes('auriz') || q.includes('auris') || q.includes('gram') || q.includes('gm') || q.includes('kg') ||
      q.includes('coin') || q.includes('bullion') || q.includes('pieces') || q.includes('piece')) {
      let filtered = [...goldItems];

      const branchNames = ['london', 'geneva', 'dubai', 'paris', 'new york', 'zurich', 'milan', 'tokyo'];
      for (const branch of branchNames) {
        if (q.includes(branch)) {
          filtered = filtered.filter(g => g.branch.toLowerCase().includes(branch));
          break;
        }
      }
      for (const purity of ['24k', '22k', '18k', '14k']) {
        if (q.includes(purity)) {
          filtered = filtered.filter(g => g.purity?.toLowerCase() === purity);
          break;
        }
      }
      for (const brand of ['pamp', 'valcambi', 'metalor', 'argor-heraeus', 'perth', 'auriz', 'auris', 'emirates']) {
        if (q.includes(brand)) {
          filtered = filtered.filter(g => 
            g.brand?.toLowerCase().includes(brand) ||
            g.item?.toLowerCase().includes(brand) ||
            g.description?.toLowerCase().includes(brand)
          );
          break;
        }
      }

      // Gram or Kg matching (e.g. "50 gram", "50g", "1 kg")
      const gramMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:gram|g|gm)\b/i);
      if (gramMatch) {
        const grams = parseFloat(gramMatch[1]);
        const kgVal = grams / 1000;
        filtered = filtered.filter(g => 
          Math.abs(g.weight - kgVal) < 0.001 || 
          Math.abs(g.weight - grams) < 0.1 ||
          g.description?.toLowerCase().includes(`${grams}g`) ||
          g.item?.toLowerCase().includes(`${grams}g`)
        );
      }

      const rangeMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:kg|g)?/i);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (!isNaN(min) && !isNaN(max)) {
          filtered = filtered.filter(g => g.weight >= min && g.weight <= max);
        }
      }

      const branchMap: Record<string, { count: number; weightKg: number }> = {};
      filtered.forEach(g => {
        const b = g.branch || 'Unknown';
        if (!branchMap[b]) branchMap[b] = { count: 0, weightKg: 0 };
        branchMap[b].count++;
        branchMap[b].weightKg += g.weight || 0;
      });
      const branchBreakdown: BranchBreakdown[] = Object.entries(branchMap).map(([branch, v]) => ({
        branch, count: v.count, weightKg: v.weightKg
      }));

      const totalWeight = filtered.reduce((s, g) => s + (g.weight || 0), 0);
      const totalValue = filtered.reduce((s, g) => s + (g.estValueUsd || g.weight * 1000 * goldSpotPrice), 0);

      return {
        structured: {
          type: 'inventory-result',
          summary: filtered.length > 0
            ? `Found ${filtered.length} gold item${filtered.length > 1 ? 's' : ''} (${formatNumber(totalWeight, 3)} kg total) matching your query.`
            : 'No gold items match the specified criteria.',
          totalFound: filtered.length,
          totalCarats: undefined,
          totalValue,
          items: filtered.map(g => ({
            tagNo: g.tagNo,
            branch: g.branch,
            weight: g.weight,
            purity: g.purity,
            brand: g.brand,
            item: g.item,
            description: g.description
          })),
          branchBreakdown
        }
      };
    }

    // ── General summary ──
    const grandTotal = totalGoldValueUsd + totalDiamondValueUsd;
    return {
      text: `📊 **RUBY Live Vault Summary:**\n\n• **Total Gold**: **${formatNumber(totalGoldWeightKg, 3)} kg** (${goldItems.length} lots) — **${formatUsd(totalGoldValueUsd)}**\n• **Gold Spot**: **$${goldSpotPrice.toFixed(2)}/g**\n• **Total Diamonds**: **${formatNumber(totalDiamondCarats, 2)} ct** (${diamondItems.length} stones) — **${formatUsd(totalDiamondValueUsd)}**\n• **Combined Vault Value**: **${formatUsd(grandTotal)}**\n• **Active Branches**: 8 Global Vaults synced.\n\nAsk me about specific diamond clarity, shape, carat range, branch stock, or gold holdings!`
    };
  }, [diamondItems, goldItems, totalGoldWeightKg, totalGoldValueUsd, totalDiamondCarats, totalDiamondValueUsd, goldSpotPrice]);

  // ── Send Message ─────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (textOverride?: string, isVoice = false) => {
    const userText = (textOverride ?? inputText).trim();
    if (!userText) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: isVoice ? 'voice-query' : 'text',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          userApiKey: geminiApiKey.trim() || undefined,
          inventoryContext: {
            totalGoldWeightKg,
            totalGoldValueUsd,
            goldSpotPrice,
            goldCount: goldItems.length,
            totalDiamondCarats,
            totalDiamondValueUsd,
            diamondCount: diamondItems.length,
            alertsCount: alerts.length,
            allDiamonds: diamondItems,
            allGold: goldItems
          }
        })
      });

      const data = await response.json();

      let aiMsg: ChatMessage;

      if (data.structured?.type === 'inventory-result') {
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: 'inventory-result',
          text: data.structured.summary,
          structured: data.structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        speakText(data.structured.summary);
      } else if (data.reply) {
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: 'text',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        speakText(data.reply);
      } else if (data.error && data.error !== 'NO_API_KEY') {
        // Show actual AI Error to user
        const local = localInventoryEngine(userText);
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: 'text',
          text: `⚠️ **Google Gemini Connection Notice:**\n\n\`${data.error}\`\n\n---\n**Offline Result:**\n${local.text || local.structured?.summary || 'No matching records in local storage.'}`,
          structured: local.structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        speakText('Gemini error occurred. Showing offline result.');
      } else {
        // Fallback to local engine
        const local = localInventoryEngine(userText);
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: local.structured ? 'inventory-result' : 'text',
          text: local.text || local.structured?.summary || '',
          structured: local.structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        speakText(aiMsg.text);
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const local = localInventoryEngine(userText);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: local.structured ? 'inventory-result' : 'text',
        text: local.text || local.structured?.summary || '',
        structured: local.structured,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      speakText(aiMsg.text);
    } finally {
      setIsThinking(false);
    }
  }, [inputText, geminiApiKey, goldItems, diamondItems, alerts, totalGoldWeightKg, totalGoldValueUsd, goldSpotPrice, totalDiamondCarats, totalDiamondValueUsd, localInventoryEngine, speakText]);

  // ── Voice / Speech Recognition ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => { setIsListening(true); setVoiceTranscript(''); };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setVoiceTranscript(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
        setVoiceTranscript('');
        if (transcript.trim()) {
          handleSendMessage(transcript.trim(), true);
        }
      }
    };
    recognition.onerror = () => { setIsListening(false); setVoiceTranscript(''); };
    recognition.onend = () => { setIsListening(false); };
    recognition.start();
  }, [voiceSupported, handleSendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceTranscript('');
  }, []);

  const quickPrompts = [
    { label: '📊 Total Stock', query: 'Show total vault valuation and inventory summary' },
    { label: '🟡 Gold Stock', query: 'Gold inventory status and total weight by branch' },
    { label: '💎 High-Carat', query: 'List all diamonds above 3 carat' },
    { label: '🔍 VVS2 Pear', query: 'VVS2 E pear shape 1.5 to 2 carat diamond available?' },
    { label: '🏢 Branches', query: 'Show all branch vault reserves breakdown' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            className={`bg-[#0a0f1c] border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 rounded-t-3xl sm:rounded-2xl ${
              isExpanded
                ? 'w-full h-[95vh] sm:max-w-4xl'
                : 'w-full h-[88vh] sm:max-w-[440px] sm:h-[700px]'
            }`}
          >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="px-4 py-3.5 bg-[#0d1220] border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Ruby gem avatar */}
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-red-500 to-rose-800 flex items-center justify-center shadow-lg shadow-rose-900/40">
                  <Gem className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0d1220]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-headline">Ruby</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                      VOICE AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Synced with Uploaded Inventory</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'text-[#fed65b] bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  title="Gemini API Key"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`p-1.5 rounded-lg transition-colors ${ttsEnabled ? 'text-[#fed65b] bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  title={ttsEnabled ? 'Mute voice' : 'Enable voice readout'}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors hidden sm:flex"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── API KEY SETTINGS ───────────────────────────────────────── */}
            {showSettings && (
              <div className="bg-[#0d1220] border-b border-slate-800 px-4 py-3 shrink-0">
                <p className="text-[11px] font-bold text-[#fed65b] font-mono mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Google Gemini API Key
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy... (Paste Gemini API Key)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
                  />
                  <button onClick={handleSaveApiKey} className="px-3 py-1.5 rounded-lg bg-[#fed65b] text-[#0f172a] text-xs font-bold hover:bg-[#ffe28a] transition-colors">
                    Save
                  </button>
                </div>
                {isKeySaved && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Gemini API Key connected
                  </p>
                )}
              </div>
            )}

            {/* ── VOICE STATUS BAR ───────────────────────────────────────── */}
            <div className={`px-4 py-2 border-b border-slate-800/60 flex items-center justify-between shrink-0 transition-colors ${isListening ? 'bg-rose-950/30' : 'bg-[#0d1220]'}`}>
              <div className="flex items-center gap-2">
                {isListening ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="absolute w-4 h-4 rounded-full bg-rose-500 opacity-30 animate-pulse-ring" />
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                    <span className="text-[11px] text-rose-400 font-mono font-semibold">Listening...</span>
                    {voiceTranscript && (
                      <span className="text-[11px] text-slate-300 font-mono truncate max-w-[160px]">"{voiceTranscript}"</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {voiceSupported ? 'Voice Support Active • Click mic or speak' : 'Voice Support Not Available'}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${isListening ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {isListening ? 'ACTIVE' : 'READY'}
              </span>
            </div>

            {/* ── CHAT MESSAGES ─────────────────────────────────────────── */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-[#0a0f1c]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Gem className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[88%] sm:max-w-[82%] ${msg.sender === 'user' ? '' : 'w-full'}`}>
                    {/* Voice query label */}
                    {msg.isVoice && msg.sender === 'user' && (
                      <p className="text-[10px] text-slate-500 font-mono mb-1 text-right flex items-center justify-end gap-1">
                        <Mic className="w-3 h-3" /> Voice Query
                      </p>
                    )}

                    <div className={`rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-[#1a2744] to-[#141d35] text-white rounded-tr-none border border-slate-700/50 px-4 py-3 font-medium'
                        : 'bg-[#111827] border border-slate-800/60 text-slate-200 rounded-tl-none px-4 py-3.5'
                    }`}>
                      {msg.type === 'inventory-result' && msg.structured ? (
                        <InventoryResultCard result={msg.structured} />
                      ) : (
                        <div className="whitespace-pre-line space-y-0.5 leading-relaxed">
                          {renderMarkdown(msg.text)}
                        </div>
                      )}

                      <div className="mt-2 text-[9px] font-mono text-slate-600 flex items-center justify-end gap-1.5">
                        {msg.sender === 'ai' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/40 font-bold">
                            RUBY • AI
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {msg.isVoice ? <Mic className="w-3.5 h-3.5 text-rose-400" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shrink-0">
                    <Gem className="w-3.5 h-3.5 animate-spin text-white" />
                  </div>
                  <div className="bg-[#111827] border border-slate-800/60 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] animate-bounce [animation-delay:0.4s]" />
                    <span className="font-mono text-[11px] text-slate-500 ml-1">RUBY analyzing vault data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── QUICK PROMPTS ─────────────────────────────────────────── */}
            <div className="px-3 py-2.5 border-t border-slate-800/60 bg-[#0d1220] flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap shrink-0">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider shrink-0">Quick:</span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-2.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 font-mono shrink-0 transition-colors flex items-center gap-1"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* ── INPUT BAR ─────────────────────────────────────────────── */}
            <div className="px-3 py-3 bg-[#0d1220] border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Ask Ruby or tap mic to speak..."
                    className="w-full pl-4 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:bg-slate-900 font-mono transition-all"
                    disabled={isListening}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking || isListening}
                  className="w-9 h-9 rounded-xl bg-[#fed65b] text-slate-950 hover:bg-[#ffe28a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>

                {/* Mic button */}
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isThinking}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-rose-900/50'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <>
                        <span className="absolute inset-0 rounded-xl bg-rose-500 opacity-30 animate-pulse-ring" />
                        <div className="flex items-end gap-[2px] h-4">
                          <span className="w-[3px] bg-white rounded-full mic-wave-bar" style={{ height: 4 }} />
                          <span className="w-[3px] bg-white rounded-full mic-wave-bar" style={{ height: 4 }} />
                          <span className="w-[3px] bg-white rounded-full mic-wave-bar" style={{ height: 4 }} />
                          <span className="w-[3px] bg-white rounded-full mic-wave-bar" style={{ height: 4 }} />
                        </div>
                      </>
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

