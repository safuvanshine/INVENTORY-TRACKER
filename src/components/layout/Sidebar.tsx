'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Gem,
  MapPin,
  ShieldCheck,
  Lock,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';

import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Gold Inventory',
    href: '/gold',
    icon: Layers,
    badge: '24K'
  },
  {
    name: 'Diamond Inventory',
    href: '/diamonds',
    icon: Gem,
    badge: 'GIA'
  },
  {
    name: 'Branch Status',
    href: '/branches',
    icon: MapPin,
    badge: '8 Vaults'
  },
  {
    name: 'Admin Section',
    href: '/admin',
    icon: ShieldCheck,
    badge: 'Live'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { totalGoldWeightKg, totalDiamondCarats } = useInventory();

  return (
    <aside className="hidden md:flex flex-col h-screen w-[240px] fixed left-0 top-0 bg-[#f7f9fb] border-r border-slate-200/80 z-50 select-none">
      {/* Brand Header with Official Logo */}
      <div className="px-5 py-4 border-b border-slate-200/60 bg-white">
        <Link href="/gold" className="flex flex-col items-center group">
          <div className="relative w-full h-16 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Shine Gold & Diamonds Logo"
              fill
              priority
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col flex-1 py-4 px-3 gap-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Core Operations
        </div>

        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/gold');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-white text-[#735c00] font-bold border-l-4 border-[#d4af37] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#d4af37]' : 'text-slate-500 group-hover:text-slate-800'
                  )}
                />
                <span className="text-[13px]">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold tracking-wider uppercase',
                    isActive
                      ? 'bg-[#fed65b]/20 text-[#735c00]'
                      : 'bg-slate-200/80 text-slate-500 group-hover:bg-slate-300/80'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Ask RUBY AI Assistant Quick Trigger Banner */}
        <div className="mt-4 mx-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-ai-assistant'));
              }
            }}
            className="w-full p-3 rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white border border-rose-500/40 hover:border-rose-400 shadow-md flex items-center gap-2.5 text-left group transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-red-600 to-[#fed65b] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Gem className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold font-headline text-white group-hover:text-rose-200 transition-colors flex items-center justify-between">
                <span>Ask RUBY</span>
                <span className="text-[9px] font-mono font-normal text-slate-400 bg-slate-800 px-1 rounded">⌘K</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">AI Copilot • Gemini</p>
            </div>
          </button>
        </div>

        {/* Vault Quick Telemetry Widget */}
        <div className="mt-4 mx-1 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
            <span>Vault Holdings</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Fine Gold</span>
              <span className="font-mono font-bold text-slate-900">
                {totalGoldWeightKg.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">kg</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#d4af37] h-full rounded-full" style={{ width: '74%' }}></div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500">Diamonds</span>
              <span className="font-mono font-bold text-slate-900">
                {totalDiamondCarats.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">ct</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#065f46] h-full rounded-full" style={{ width: '82%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Vault Status */}
      <div className="p-4 border-t border-slate-200/70 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-semibold text-slate-900 truncate">Secured Level 4</p>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">13 Multi-Vaults Sync</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
