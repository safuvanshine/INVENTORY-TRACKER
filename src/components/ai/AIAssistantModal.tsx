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
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Download,
  TableProperties,
  ChevronDown,
  ChevronUp,
  Square
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
interface BranchBreakdown { branch: string; count: number; carats?: number; weightGrams?: number; }

interface StructuredResult {
  type: 'inventory-result';
  summary: string;
  totalFound: number;
  totalCarats?: number;
  totalGrams?: number;
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

type VoiceLang = 'en-IN' | 'ml-IN' | 'hi-IN';

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

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Strict word-boundary branch extractor (prevents "show"/"hold" matching "HO" and "S12" matching "S1")
function extractRequestedBranch(q: string): string | null {
  const orderedCodes = ['s13', 's12', 's11', 's10', 's9', 's8', 's7', 's6', 's5', 's4', 's3', 's2', 's1', 'ho'];
  for (const code of orderedCodes) {
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    if (regex.test(q)) {
      return code.toUpperCase();
    }
  }
  // Also match "branch 1" -> "S1", "shop 2" -> "S2", "head office" -> "HO"
  const numBranch = q.match(/\b(?:branch|shop|store)\s*(\d{1,2})\b/i);
  if (numBranch) {
    const n = parseInt(numBranch[1], 10);
    if (n >= 1 && n <= 13) return `S${n}`;
  }
  if (/\bhead\s*office\b/i.test(q)) return 'HO';
  return null;
}

function isManglishOrMalayalam(q: string): boolean {
  return (
    /[\u0D00-\u0D7F]/.test(q) ||
    /\b(undo|undu|etra|ethra|evide|kanikku|parayu|innu|swarnam|cheyta|ulla|enthokke|ethokke|ayittund)\b/i.test(q)
  );
}

// ─── InventoryResultCard ──────────────────────────────────────────────────────

function InventoryResultCard({ result }: { result: StructuredResult }) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? result.items : result.items.slice(0, 5);
  const isDiamond = result.items.some(i => i.carat !== undefined && i.carat !== null);

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
            💎 {formatNumber(result.totalCarats, 2)} ct
          </span>
        )}
        {result.totalGrams != null && result.totalGrams > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#fed65b]/10 border border-[#fed65b]/30 text-[#fed65b] text-[11px] font-bold font-mono">
            🟡 {formatNumber(result.totalGrams, 3)} g
          </span>
        )}
        {result.totalValue != null && result.totalValue > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-[11px] font-bold font-mono">
            {formatUsd(result.totalValue)}
          </span>
        )}
      </div>

      {/* Summary text */}
      <p className="text-[12px] text-slate-200 leading-relaxed">{renderMarkdown(result.summary)}</p>

      {/* Branch Breakdown */}
      {result.branchBreakdown && result.branchBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.branchBreakdown.map((b, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
              📍 {b.branch}: {b.count}
              {isDiamond && b.carats ? ` (${formatNumber(b.carats, 2)} ct)` : ''}
              {!isDiamond && b.weightGrams ? ` (${formatNumber(b.weightGrams, 3)} g)` : ''}
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
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Item</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Brand</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400 font-bold">Weight</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">Branch</th>
                  {isDiamond && (
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-400 font-bold">Price</th>
                  )}
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
                        <td className="px-3 py-2 text-slate-200 max-w-[140px] truncate">{item.item || '—'}</td>
                        <td className="px-3 py-2 text-slate-300">{item.brand || '—'}</td>
                        <td className="px-3 py-2 text-right text-slate-200">{item.weight != null ? `${formatNumber(item.weight, 3)} g` : '—'}</td>
                      </>
                    )}
                    <td className="px-3 py-2 text-slate-300 font-bold text-[10px]">{item.branch || '—'}</td>
                    {isDiamond && (
                      <td className="px-3 py-2 text-right text-emerald-400 font-semibold">
                        {item.tagPrice != null ? formatUsd(item.tagPrice) : '—'}
                      </td>
                    )}
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
            Export CSV
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
    soldGoldItems,
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
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Voice / Speech
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>('en-IN');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const hasSentVoiceRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved API key & detect SpeechRecognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('SHINE_GEMINI_API_KEY');
      if (savedKey) { setGeminiApiKey(savedKey); setIsKeySaved(true); }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognition);
      // Preload browser speechSynthesis voices
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
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
      text: `Hello! I'm **RUBY**, your **SHINE AI Vault Copilot**.\n\n🔗 Live Synced — Search **Gold (g)**, **Diamonds (ct)**, **Tag Numbers**, **Branch Stock (HO, S1–S13)**, **Held Items**, **Transfers**, and **Sold Gold**.\n\n🎙️ **Voice Ready**: Tap the **Mic** button and speak in English, Manglish, or Malayalam!\n\n**Try asking:**\n• "Gold stock in S1"\n• "S1 il etra stock und?"\n• "Show held items" or "Today sold gold"\n• "VVS2 E pear shape diamond available?"`,
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

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Clean Text-to-Speech (automatically reads aloud when ttsEnabled or when user queried by voice)
  const speakText = useCallback((text: string, forceSpeak = false) => {
    if ((!ttsEnabled && !forceSpeak) || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown, emojis, bullets, and extra symbols for natural voice readout
      const clean = text
        .replace(/[*_#`•|]/g, ' ')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/➔/g, ' to ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 320);

      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();

      // Match Malayalam voice if Malayalam script present, else Indian/English voice
      const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(clean);
      let chosenVoice = null;
      if (hasMalayalamScript) {
        chosenVoice = voices.find(v => v.lang.toLowerCase().startsWith('ml'));
      } else {
        chosenVoice =
          voices.find(v => v.lang === 'en-IN') ||
          voices.find(v => v.lang.startsWith('en-GB')) ||
          voices.find(v => v.lang.startsWith('en'));
      }
      if (chosenVoice) utterance.voice = chosenVoice;
      utterance.lang = hasMalayalamScript ? 'ml-IN' : 'en-IN';
      utterance.rate = 1.02;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  // Stop voice & speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopSpeaking();
    }
  }, [isOpen, stopSpeaking]);

  // ── Smart Live Inventory Engine (Instant, Accurate, Bilingual EN + Manglish) ──
  const smartInventoryEngine = useCallback((query: string): { text?: string; structured?: StructuredResult } => {
    const q = query.toLowerCase().trim();
    const isML = isManglishOrMalayalam(q);
    const reqBranch = extractRequestedBranch(q);

    // 1. Direct Tag Number or Certificate lookup across Gold, Diamonds & Sold
    const tokens = query
      .trim()
      .split(/[\s,?!]+/)
      .filter(t => t.length >= 3 && /\d/.test(t) && !/^(s\d{1,2}|\d+(\.\d+)?(g|gm|gram|kg|ct|carat|k))$/i.test(t));

    if (tokens.length > 0) {
      for (const tok of tokens) {
        const tUp = tok.toUpperCase();
        const foundGold = goldItems.find(
          g => g.tagNo.toUpperCase() === tUp || g.tagNo.toUpperCase().includes(tUp) || g.certificateNo?.toUpperCase() === tUp
        );
        if (foundGold) {
          const statusNote = foundGold.holdInfo
            ? `🔒 **ON HOLD** at **${foundGold.holdInfo.branch}** (${foundGold.holdInfo.days} Days)`
            : foundGold.transferInfo
            ? `🚚 **IN TRANSFER** (${foundGold.transferInfo.fromBranch} ➔ ${foundGold.transferInfo.toBranch})`
            : `✅ **Available in Branch ${foundGold.branch}**`;
          return {
            structured: {
              type: 'inventory-result',
              summary: isML
                ? `Tag **${foundGold.tagNo}** (**${foundGold.item}**, ${formatNumber(foundGold.weight, 3)} g) **${foundGold.branch}** ബ്രാഞ്ചിൽ ഉണ്ട് — ${statusNote}`
                : `Found Gold Tag **${foundGold.tagNo}** (**${foundGold.item}**, ${formatNumber(foundGold.weight, 3)} g) in **${foundGold.branch}** — ${statusNote}`,
              totalFound: 1,
              totalGrams: foundGold.weight,
              items: [
                {
                  tagNo: foundGold.tagNo,
                  branch: foundGold.branch,
                  weight: foundGold.weight,
                  purity: foundGold.purity,
                  brand: foundGold.brand,
                  item: foundGold.item
                }
              ]
            }
          };
        }

        const foundDiamond = diamondItems.find(
          d => d.tagNo.toUpperCase() === tUp || d.tagNo.toUpperCase().includes(tUp) || d.certificateNo?.toUpperCase() === tUp
        );
        if (foundDiamond) {
          return {
            structured: {
              type: 'inventory-result',
              summary: isML
                ? `Diamond Tag **${foundDiamond.tagNo}** (${foundDiamond.carat} ct ${foundDiamond.shape} ${foundDiamond.clarity}/${foundDiamond.colour}) **${foundDiamond.branch}** ബ്രാഞ്ചിൽ ലഭ്യമാണ്.`
                : `Found Diamond Tag **${foundDiamond.tagNo}** (${foundDiamond.carat} ct ${foundDiamond.shape}, ${foundDiamond.clarity}/${foundDiamond.colour}) in **${foundDiamond.branch}**.`,
              totalFound: 1,
              totalCarats: foundDiamond.carat,
              totalValue: foundDiamond.tagPrice,
              items: [
                {
                  tagNo: foundDiamond.tagNo,
                  branch: foundDiamond.branch,
                  carat: foundDiamond.carat,
                  clarity: foundDiamond.clarity,
                  shape: foundDiamond.shape,
                  colour: foundDiamond.colour,
                  tagPrice: foundDiamond.tagPrice,
                  item: foundDiamond.item
                }
              ]
            }
          };
        }

        const foundSold = soldGoldItems.find(s => s.tagNo.toUpperCase() === tUp || s.tagNo.toUpperCase().includes(tUp));
        if (foundSold) {
          return {
            text: isML
              ? `🛍️ Tag **${foundSold.tagNo}** (**${foundSold.item}**, ${formatNumber(foundSold.weight, 3)} g) ഇതിനകം **${foundSold.branch}** ബ്രാഞ്ചിൽ **${foundSold.soldDateLabel}** (${foundSold.soldTime}) ന് **SOLD** ആയിട്ടുണ്ട് (By ${foundSold.soldBy}).`
              : `🛍️ Tag **${foundSold.tagNo}** (**${foundSold.item}**, ${formatNumber(foundSold.weight, 3)} g) was already marked **SOLD** in **${foundSold.branch}** on **${foundSold.soldDateLabel}** at ${foundSold.soldTime} (by ${foundSold.soldBy}).`
          };
        }
      }
    }

    // 2. Held Items Query
    if (/\b(hold|held|reserved)\b/i.test(q)) {
      const heldGold = goldItems.filter(i => i.holdInfo && (!reqBranch || i.holdInfo.branch.toUpperCase() === reqBranch));
      const heldDia = diamondItems.filter(i => i.holdInfo && (!reqBranch || i.holdInfo.branch.toUpperCase() === reqBranch));
      const totalHeld = heldGold.length + heldDia.length;

      if (totalHeld === 0) {
        return {
          text: isML
            ? `🔒 നിലവിൽ ${reqBranch ? `**${reqBranch}** ബ്രാഞ്ചിൽ ` : ''}ഒരു ഐറ്റവും **Hold**-ൽ ഇല്ല.`
            : `🔒 There are currently **0 items on Hold**${reqBranch ? ` in **${reqBranch}**` : ''}.`
        };
      }

      const lines = [
        ...heldGold.map(g => `• **${g.tagNo}** (${g.item}, ${formatNumber(g.weight, 3)} g) — Held in **${g.holdInfo!.branch}** for **${g.holdInfo!.days}D**`),
        ...heldDia.map(d => `• **${d.tagNo}** (${d.item}, ${formatNumber(d.carat, 2)} ct) — Held in **${d.holdInfo!.branch}** for **${d.holdInfo!.days}D**`)
      ];
      return {
        text: `🔒 **Active Held Items (${totalHeld}):**\n\n${lines.join('\n')}`
      };
    }

    // 3. Pending Transfers Query
    if (/\b(transfer|transfers|transit|incoming|pending transfer)\b/i.test(q)) {
      const trGold = goldItems.filter(i => i.transferInfo && (!reqBranch || i.transferInfo.toBranch.toUpperCase() === reqBranch || i.transferInfo.fromBranch.toUpperCase() === reqBranch));
      const trDia = diamondItems.filter(i => i.transferInfo && (!reqBranch || i.transferInfo.toBranch.toUpperCase() === reqBranch || i.transferInfo.fromBranch.toUpperCase() === reqBranch));
      const totalTr = trGold.length + trDia.length;

      if (totalTr === 0) {
        return {
          text: isML
            ? `🚚 നിലവിൽ പെൻഡിംഗ് ട്രാൻസ്ഫറുകൾ ഒന്നുമില്ല.`
            : `🚚 There are currently **0 pending branch transfers**.`
        };
      }

      const lines = [
        ...trGold.map(g => `• **${g.tagNo}** (${g.item}, ${formatNumber(g.weight, 3)} g) — **${g.transferInfo!.fromBranch} ➔ ${g.transferInfo!.toBranch}** (Waiting Accept)`),
        ...trDia.map(d => `• **${d.tagNo}** (${d.item}, ${formatNumber(d.carat, 2)} ct) — **${d.transferInfo!.fromBranch} ➔ ${d.transferInfo!.toBranch}** (Waiting Accept)`)
      ];
      return {
        text: `🚚 **Pending Branch Transfers (${totalTr}):**\n\n${lines.join('\n')}`
      };
    }

    // 4. Sold Gold Query
    if (/\b(sold|sale|sales|vittupoya)\b/i.test(q)) {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isTodayOnly = /\b(today|innu|ഇന്ന്)\b/i.test(q);

      const list = soldGoldItems.filter(s => {
        if (isTodayOnly && s.soldDate !== todayKey) return false;
        if (reqBranch && s.branch.toUpperCase() !== reqBranch) return false;
        return true;
      });

      const totalW = list.reduce((sum, s) => sum + (s.weight || 0), 0);
      if (list.length === 0) {
        return {
          text: isML
            ? `🛍️ ${isTodayOnly ? 'ഇന്ന് ' : ''}${reqBranch ? `**${reqBranch}** ബ്രാഞ്ചിൽ ` : ''}ഒരു Gold ഐറ്റവും **Sold** ആയിട്ടില്ല.`
            : `🛍️ No Gold items marked **SOLD**${isTodayOnly ? ' today' : ''}${reqBranch ? ` in **${reqBranch}**` : ''}.`
        };
      }

      const lines = list.slice(0, 10).map(
        s => `• **${s.tagNo}** (${s.item}, **${formatNumber(s.weight, 3)} g**) — **${s.branch}** • ${s.soldDateLabel} ${s.soldTime}`
      );
      return {
        text: `🛍️ **Sold Gold Report${isTodayOnly ? ' (Today)' : ''}${reqBranch ? ` • ${reqBranch}` : ''}:**\n\n• **Total Sold:** **${list.length} items** (**${formatNumber(totalW, 3)} g**)\n\n${lines.join('\n')}`
      };
    }

    // 5. Detect Explicit Gold vs Explicit Diamond intent (NEVER trigger diamond just on "available"/"undo")
    const dynamicGoldBrands = Array.from(new Set(goldItems.map(g => g.brand?.toLowerCase()).filter(Boolean)));
    const isExplicitGold =
      /\b(gold|swarnam|bar|bars|coin|coins|bullion|24k|22k|18k|14k|gram|grams|gm|pamp|valcambi|metalor|perth|auriz|auris|emirates|heraeus)\b/i.test(q) ||
      q.includes('സ്വർണ്ണം') ||
      dynamicGoldBrands.some(b => b && b.length >= 4 && q.includes(b));

    const isExplicitDiamond =
      /\b(diamond|diamonds|carat|carats|ct|clarity|shape|round|pear|oval|princess|cushion|emerald|radiant|asscher|marquise|heart|solitaire|vvs1|vvs2|vvs|vs1|vs2|si1|si2|fl|if|gia|igi|heera|natural|lab grown)\b/i.test(q) ||
      q.includes('ഡയമണ്ട്') ||
      q.includes('हीरा');

    // 6. Gold Inventory Search
    if (isExplicitGold && !isExplicitDiamond) {
      let filtered = [...goldItems];

      if (reqBranch) {
        filtered = filtered.filter(g => g.branch.trim().toUpperCase() === reqBranch);
      }

      for (const purity of ['24k', '22k', '18k', '14k']) {
        if (new RegExp(`\\b${purity}\\b`, 'i').test(q)) {
          filtered = filtered.filter(g => g.purity?.toLowerCase() === purity);
          break;
        }
      }

      for (const brand of dynamicGoldBrands) {
        if (brand && brand.length >= 3 && q.includes(brand)) {
          filtered = filtered.filter(
            g =>
              g.brand?.toLowerCase().includes(brand) ||
              g.item?.toLowerCase().includes(brand) ||
              g.description?.toLowerCase().includes(brand)
          );
          break;
        }
      }

      // Weight Range (e.g. "5 to 20 g" or "10-50g")
      const rangeMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|and)\s*(\d+(?:\.\d+)?)\s*(?:gram|grams|gm|g)?\b/i);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (!isNaN(min) && !isNaN(max)) {
          filtered = filtered.filter(g => g.weight >= min && g.weight <= max);
        }
      } else {
        // Exact gram matching (e.g. "50g", "10 gram")
        const gramMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:gram|grams|gm|g)\b/i);
        if (gramMatch) {
          const grams = parseFloat(gramMatch[1]);
          if (/\b(above|more than|over|greater)\b/i.test(q)) {
            filtered = filtered.filter(g => g.weight > grams);
          } else if (/\b(below|less than|under)\b/i.test(q)) {
            filtered = filtered.filter(g => g.weight < grams);
          } else {
            filtered = filtered.filter(
              g =>
                Math.abs(g.weight - grams) <= 0.25 ||
                g.item?.toLowerCase().includes(`${grams}g`) ||
                g.description?.toLowerCase().includes(`${grams}g`)
            );
          }
        }
      }

      const branchMap: Record<string, { count: number; weightGrams: number }> = {};
      filtered.forEach(g => {
        const b = g.branch || 'Unknown';
        if (!branchMap[b]) branchMap[b] = { count: 0, weightGrams: 0 };
        branchMap[b].count++;
        branchMap[b].weightGrams += g.weight || 0;
      });
      const branchBreakdown: BranchBreakdown[] = Object.entries(branchMap).map(([branch, v]) => ({
        branch,
        count: v.count,
        weightGrams: v.weightGrams
      }));

      const totalWeight = filtered.reduce((s, g) => s + (g.weight || 0), 0);
      const totalValue = filtered.reduce((s, g) => s + (g.weight || 0) * goldSpotPrice, 0);

      const summary =
        filtered.length > 0
          ? isML
            ? `✅ ${reqBranch ? `**${reqBranch}** ബ്രാഞ്ചിൽ ` : ''}**${filtered.length} Gold ഐറ്റങ്ങൾ** (ആകെ **${formatNumber(totalWeight, 3)} g**) ലഭ്യമാണ്.`
            : `✅ Found **${filtered.length} Gold item${filtered.length > 1 ? 's' : ''}** totaling **${formatNumber(totalWeight, 3)} g**${reqBranch ? ` in **${reqBranch}**` : ''}.`
          : isML
          ? `❌ നിങ്ങൾ തിരഞ്ഞ വിവരങ്ങൾക്കനുസരിച്ച് ${reqBranch ? `**${reqBranch}** ബ്രാഞ്ചിൽ ` : ''}Gold സ്റ്റോക്ക് ലഭ്യമല്ല.`
          : `❌ No Gold items matched your criteria${reqBranch ? ` in **${reqBranch}**` : ''}.`;

      return {
        structured: {
          type: 'inventory-result',
          summary,
          totalFound: filtered.length,
          totalGrams: totalWeight,
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

    // 7. Diamond Inventory Search
    if (isExplicitDiamond) {
      let filtered = [...diamondItems];

      const clarityKeys = ['vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'si3', 'fl', 'if', 'i1', 'i2', 'i3'];
      for (const key of clarityKeys) {
        if (new RegExp(`\\b${key}\\b`, 'i').test(q)) {
          filtered = filtered.filter(d => d.clarity?.toLowerCase() === key);
          break;
        }
      }

      const colourMatch =
        q.match(/\bcolou?r\s*:?\s*([d-m])\b/i) ||
        q.match(/\b([d-m])\s+(?:color|colour)\b/i) ||
        q.match(/\b(?:vvs1|vvs2|vs1|vs2|si1|si2|if|fl)\s+([d-m])\b/i);
      if (colourMatch) {
        const col = colourMatch[1].toUpperCase();
        filtered = filtered.filter(d => d.colour?.toUpperCase() === col);
      }

      const shapeKeys = ['round', 'pear', 'oval', 'princess', 'cushion', 'emerald', 'radiant', 'asscher', 'marquise', 'heart', 'trillion'];
      for (const shape of shapeKeys) {
        if (q.includes(shape)) {
          filtered = filtered.filter(d => d.shape?.toLowerCase().includes(shape));
          break;
        }
      }

      const rangeMatch =
        q.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|and)\s*(\d+(?:\.\d+)?)\s*(?:carat|ct)?/i) ||
        q.match(/(\d+(?:\.\d+)?)\s*(?:carat|ct)\s*(?:to|-)\s*(\d+(?:\.\d+)?)/i);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (!isNaN(min) && !isNaN(max)) {
          filtered = filtered.filter(d => d.carat >= min && d.carat <= max);
        }
      } else {
        const caratMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:carat|ct)\b/i);
        if (caratMatch) {
          const carat = parseFloat(caratMatch[1]);
          if (!isNaN(carat)) {
            if (/\b(above|more than|greater|over)\b/i.test(q)) {
              filtered = filtered.filter(d => d.carat > carat);
            } else if (/\b(below|less than|under)\b/i.test(q)) {
              filtered = filtered.filter(d => d.carat < carat);
            } else {
              filtered = filtered.filter(d => Math.abs(d.carat - carat) <= 0.15);
            }
          }
        }
      }

      if (reqBranch) {
        filtered = filtered.filter(d => d.branch.trim().toUpperCase() === reqBranch);
      }

      const branchMap: Record<string, { count: number; carats: number }> = {};
      filtered.forEach(d => {
        const b = d.branch || 'Unknown';
        if (!branchMap[b]) branchMap[b] = { count: 0, carats: 0 };
        branchMap[b].count++;
        branchMap[b].carats += d.carat || 0;
      });
      const branchBreakdown: BranchBreakdown[] = Object.entries(branchMap).map(([branch, v]) => ({
        branch,
        count: v.count,
        carats: v.carats
      }));

      const totalCarats = filtered.reduce((s, d) => s + (d.carat || 0), 0);
      const totalValue = filtered.reduce((s, d) => s + (d.tagPrice || 0), 0);

      const summary =
        filtered.length > 0
          ? isML
            ? `✅ ${reqBranch ? `**${reqBranch}** ബ്രാഞ്ചിൽ ` : ''}**${filtered.length} Diamond** (${formatNumber(totalCarats, 2)} ct) ലഭ്യമാണ്.`
            : `✅ Found **${filtered.length} matching Diamond${filtered.length > 1 ? 's' : ''}** (${formatNumber(totalCarats, 2)} ct total)${reqBranch ? ` in **${reqBranch}**` : ''}.`
          : isML
          ? `❌ നിങ്ങൾ തിരഞ്ഞ Diamond സ്റ്റോക്ക് നിലവിൽ ലഭ്യമല്ല.`
          : `❌ No matching Diamonds found for the specified criteria.`;

      return {
        structured: {
          type: 'inventory-result',
          summary,
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

    // 8. Specific Branch Stock Summary (e.g., "S1 stock", "S2 il etra und?", "Show HO")
    if (reqBranch) {
      const bGold = goldItems.filter(g => g.branch.trim().toUpperCase() === reqBranch);
      const bDia = diamondItems.filter(d => d.branch.trim().toUpperCase() === reqBranch);
      const bGoldGrams = bGold.reduce((s, g) => s + (g.weight || 0), 0);
      const bDiaCarats = bDia.reduce((s, d) => s + (d.carat || 0), 0);
      const bHeld = bGold.filter(g => g.holdInfo).length + bDia.filter(d => d.holdInfo).length;

      return {
        text: isML
          ? `📍 **Branch ${reqBranch} Live Stock:**\n\n• **Gold:** **${bGold.length} items** (**${formatNumber(bGoldGrams, 3)} g**)\n• **Diamonds:** **${bDia.length} stones** (**${formatNumber(bDiaCarats, 2)} ct**)\n• **On Hold:** **${bHeld} items**\n\nകൂടുതൽ അറിയാൻ *"Gold stock in ${reqBranch}"* അല്ലെങ്കിൽ *"Diamond stock in ${reqBranch}"* എന്ന് ചോദിക്കുക.`
          : `📍 **Branch ${reqBranch} Live Stock Summary:**\n\n• **Gold:** **${bGold.length} items** (**${formatNumber(bGoldGrams, 3)} g**)\n• **Diamonds:** **${bDia.length} stones** (**${formatNumber(bDiaCarats, 2)} ct**)\n• **On Hold:** **${bHeld} items**\n\nAsk *"Gold stock in ${reqBranch}"* or *"Diamond stock in ${reqBranch}"* for the full item list.`
      };
    }

    // 9. All Branches Breakdown Query
    if (/\b(branch|branches|shops|breakdown)\b/i.test(q)) {
      const branchCodes = ['HO', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13'];
      const lines = branchCodes
        .map(code => {
          const gCount = goldItems.filter(g => g.branch.trim().toUpperCase() === code).length;
          const gWt = goldItems.filter(g => g.branch.trim().toUpperCase() === code).reduce((s, g) => s + (g.weight || 0), 0);
          const dCount = diamondItems.filter(d => d.branch.trim().toUpperCase() === code).length;
          if (gCount === 0 && dCount === 0) return null;
          return `• **${code}**: Gold **${gCount}** (${formatNumber(gWt, 2)} g) | Diamonds **${dCount}**`;
        })
        .filter(Boolean);

      return {
        text: `🏢 **Live Branch Stock Breakdown:**\n\n${lines.length > 0 ? lines.join('\n') : 'No branch items currently loaded.'}`
      };
    }

    // 10. General Live Vault Summary
    const heldTotal = goldItems.filter(i => i.holdInfo).length + diamondItems.filter(i => i.holdInfo).length;
    const transferTotal = goldItems.filter(i => i.transferInfo).length + diamondItems.filter(i => i.transferInfo).length;
    const grandTotal = totalGoldValueUsd + totalDiamondValueUsd;

    return {
      text: isML
        ? `📊 **SHINE Live Vault Summary:**\n\n• **Total Gold:** **${formatNumber(totalGoldWeightKg, 3)} g** (${goldItems.length} items)\n• **Total Diamonds:** **${formatNumber(totalDiamondCarats, 2)} ct** (${diamondItems.length} stones)\n• **Held Items:** **${heldTotal}** | **Pending Transfers:** **${transferTotal}**\n• **Sold Gold History:** **${soldGoldItems.length} items**\n\nഉദാഹരണത്തിന് *"S1 gold stock"*, *"Held items"*, *"Today sold"*, അല്ലെങ്കിൽ ഒരു **Tag Number** ചോദിക്കൂ!`
        : `📊 **RUBY Live Vault Summary:**\n\n• **Total Gold**: **${formatNumber(totalGoldWeightKg, 3)} g** (${goldItems.length} lots) — **${formatUsd(totalGoldValueUsd)}**\n• **Gold Spot**: **$${goldSpotPrice.toFixed(2)}/g**\n• **Total Diamonds**: **${formatNumber(totalDiamondCarats, 2)} ct** (${diamondItems.length} stones) — **${formatUsd(totalDiamondValueUsd)}**\n• **Held Items**: **${heldTotal}** | **Pending Transfers**: **${transferTotal}** | **Sold Gold**: **${soldGoldItems.length}**\n• **Combined Value**: **${formatUsd(grandTotal)}**\n\nAsk about any **Tag Number**, **Branch (HO, S1–S13)**, **Gold (g)**, **Diamonds (ct)**, **Held**, **Transfer**, or **Sold** stock!`
    };
  }, [diamondItems, goldItems, soldGoldItems, totalGoldWeightKg, totalGoldValueUsd, totalDiamondCarats, totalDiamondValueUsd, goldSpotPrice]);

  // ── Send Message ─────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (textOverride?: string, isVoice = false) => {
    const userText = (textOverride ?? inputText).trim();
    if (!userText) return;

    stopSpeaking();

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
            allGold: goldItems,
            soldGold: soldGoldItems
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
      } else if (data.reply) {
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: 'text',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        // Seamless Smart RUBY Live Inventory Engine (zero ugly error notices!)
        const local = smartInventoryEngine(userText);
        aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          type: local.structured ? 'inventory-result' : 'text',
          text: local.text || local.structured?.summary || '',
          structured: local.structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      setMessages(prev => [...prev, aiMsg]);
      // Automatically speak back if TTS is ON or if user used Voice Chat
      speakText(aiMsg.text, isVoice);
    } catch {
      const local = smartInventoryEngine(userText);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: local.structured ? 'inventory-result' : 'text',
        text: local.text || local.structured?.summary || '',
        structured: local.structured,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      speakText(aiMsg.text, isVoice);
    } finally {
      setIsThinking(false);
    }
  }, [inputText, geminiApiKey, goldItems, diamondItems, soldGoldItems, alerts, totalGoldWeightKg, totalGoldValueUsd, goldSpotPrice, totalDiamondCarats, totalDiamondValueUsd, smartInventoryEngine, speakText, stopSpeaking]);

  // ── Voice / Speech Recognition (Fixed for Chrome, Edge & Mobile) ──────────
  const startListening = useCallback(() => {
    if (!voiceSupported) {
      setVoiceError('Voice input requires Chrome or Edge browser.');
      return;
    }

    stopSpeaking();
    setVoiceError('');
    latestTranscriptRef.current = '';
    hasSentVoiceRef.current = false;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        let fullText = '';
        let isFinalResult = false;
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinalResult = true;
          }
        }
        const cleaned = fullText.trim();
        latestTranscriptRef.current = cleaned;
        setVoiceTranscript(cleaned);

        if (isFinalResult && cleaned && !hasSentVoiceRef.current) {
          hasSentVoiceRef.current = true;
          setIsListening(false);
          setVoiceTranscript('');
          handleSendMessage(cleaned, true);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Mic permission blocked. Click the lock icon in browser bar and Allow Microphone.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No voice heard. Tap the Mic button and speak clearly.');
        } else if (event.error === 'network') {
          setVoiceError('Voice recognition needs internet access.');
        } else if (event.error !== 'aborted') {
          setVoiceError(`Mic error (${event.error}). Try tapping Mic again.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If user spoke words but browser ended before marking isFinal, still submit it!
        if (!hasSentVoiceRef.current && latestTranscriptRef.current.trim()) {
          hasSentVoiceRef.current = true;
          const textToSend = latestTranscriptRef.current.trim();
          latestTranscriptRef.current = '';
          setVoiceTranscript('');
          handleSendMessage(textToSend, true);
        } else {
          setVoiceTranscript('');
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Could not start microphone. Please allow mic permission.');
    }
  }, [voiceSupported, voiceLang, handleSendMessage, stopSpeaking]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const quickPrompts = [
    { label: '📊 Summary', query: 'Show total vault summary' },
    { label: '🟡 Gold Stock', query: 'Show all gold stock' },
    { label: '💎 Diamonds', query: 'Show all diamond stock' },
    { label: '🔒 Held Items', query: 'Show held items' },
    { label: '🛍️ Sold Today', query: 'Show today sold gold' },
    { label: '🚚 Transfers', query: 'Show pending transfers' },
    { label: '🏢 Branches', query: 'Show all branches breakdown' },
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
                : 'w-full h-[88vh] sm:max-w-[460px] sm:h-[710px]'
            }`}
          >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="px-4 py-3.5 bg-[#0d1220] border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
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
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Live Synced • {goldItems.length} Gold & {diamondItems.length} Diamonds
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-mono font-bold flex items-center gap-1 mr-1 cursor-pointer"
                    title="Stop voice readout"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    Stop
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showSettings ? 'text-[#fed65b] bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  title="Optional Gemini API Key"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (ttsEnabled) stopSpeaking();
                    setTtsEnabled(!ttsEnabled);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${ttsEnabled ? 'text-[#fed65b] bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  title={ttsEnabled ? 'Voice Readout ON (Click to Mute)' : 'Voice Readout OFF (Click to Enable)'}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden sm:flex cursor-pointer"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── API KEY SETTINGS ───────────────────────────────────────── */}
            {showSettings && (
              <div className="bg-[#0d1220] border-b border-slate-800 px-4 py-3 shrink-0">
                <p className="text-[11px] font-bold text-[#fed65b] font-mono mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Google Gemini API Key (Optional)
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy... (Paste Gemini API Key)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
                  />
                  <button onClick={handleSaveApiKey} className="px-3 py-1.5 rounded-lg bg-[#fed65b] text-[#0f172a] text-xs font-bold hover:bg-[#ffe28a] transition-colors cursor-pointer">
                    Save
                  </button>
                </div>
                {isKeySaved && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Gemini API Key saved
                  </p>
                )}
              </div>
            )}

            {/* ── VOICE STATUS & LANGUAGE BAR ────────────────────────────── */}
            <div className={`px-4 py-2 border-b border-slate-800/60 flex items-center justify-between gap-2 shrink-0 transition-colors ${isListening ? 'bg-rose-950/40' : 'bg-[#0d1220]'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {isListening ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                      <span className="absolute w-4 h-4 rounded-full bg-rose-500 opacity-30 animate-pulse-ring" />
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                    <span className="text-[11px] text-rose-400 font-mono font-semibold shrink-0">Listening...</span>
                    {voiceTranscript && (
                      <span className="text-[11px] text-white font-mono truncate">
                        &ldquo;{voiceTranscript}&rdquo;
                      </span>
                    )}
                  </div>
                ) : voiceError ? (
                  <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-mono truncate">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">{voiceError}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      {voiceSupported ? 'Mic Ready • Tap Mic to speak' : 'Voice unsupported in this browser'}
                    </span>
                  </div>
                )}
              </div>

              {/* Voice Language Switcher */}
              {voiceSupported && (
                <div className="flex items-center gap-1 shrink-0 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                  {(
                    [
                      { code: 'en-IN', label: 'EN' },
                      { code: 'ml-IN', label: 'ML' },
                      { code: 'hi-IN', label: 'HI' }
                    ] as const
                  ).map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setVoiceLang(lang.code)}
                      disabled={isListening}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        voiceLang === lang.code
                          ? 'bg-[#fed65b] text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`Voice recognition language: ${lang.code}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
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

                      <div className="mt-2 text-[9px] font-mono text-slate-500 flex items-center justify-end gap-1.5">
                        {msg.sender === 'ai' && (
                          <>
                            <button
                              type="button"
                              onClick={() => speakText(msg.text, true)}
                              className="text-slate-400 hover:text-[#fed65b] transition-colors cursor-pointer"
                              title="Play voice readout"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/40 font-bold">
                              RUBY • AI
                            </span>
                          </>
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
                    <span className="font-mono text-[11px] text-slate-400 ml-1">RUBY searching live stock...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── QUICK PROMPTS ─────────────────────────────────────────── */}
            <div className="px-3 py-2.5 border-t border-slate-800/60 bg-[#0d1220] flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap shrink-0">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">Quick:</span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-2.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 font-mono shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
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
                    value={isListening ? voiceTranscript : inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={isListening ? 'Speak now...' : 'Ask Ruby (e.g. S1 gold stock, Tag No, Held)...'}
                    className="w-full pl-4 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]/60 focus:bg-slate-900 font-mono transition-all"
                    disabled={isListening}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking || isListening}
                  className="w-9 h-9 rounded-xl bg-[#fed65b] text-slate-950 hover:bg-[#ffe28a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
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
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-rose-900/50'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isListening ? 'Stop listening & send' : 'Tap to speak (Voice Chat)'}
                  >
                    {isListening ? (
                      <>
                        <span className="absolute inset-0 rounded-xl bg-rose-500 opacity-30 animate-pulse-ring" />
                        <MicOff className="w-4 h-4 relative z-10" />
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
