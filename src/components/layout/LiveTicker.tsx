'use client';

import React from 'react';
import { useInventory } from '@/context/InventoryContext';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Activity, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveTickerProps {
  mode?: 'gold' | 'diamonds' | 'all';
}

export function LiveTicker({ mode = 'all' }: LiveTickerProps) {
  const { tickerMovements, goldSpotPrice } = useInventory();

  // Duplicate for seamless infinite scroll
  const repeatedMovements = [...tickerMovements, ...tickerMovements];

  return (
    <div className="w-full bg-[#131b2e] text-white border-b border-[#3f465c]/30 h-10 flex items-center overflow-hidden select-none relative z-20">
      {/* Static Label on Left */}
      <div className="flex items-center gap-2 px-4 shrink-0 bg-[#131b2e] z-20 border-r border-[#3f465c]/40 h-full shadow-[4px_0_12px_rgba(19,27,46,0.8)]">
        <span className="w-2 h-2 rounded-full bg-[#fed65b] animate-pulse"></span>
        <span className="text-[11px] font-mono font-bold text-[#fed65b] uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#d4af37]" />
          Live Ticker
        </span>
      </div>

      {/* Infinite ticker wrapper with gradient fades */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#131b2e] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#131b2e] to-transparent z-10 pointer-events-none" />

        <div className="animate-ticker items-center text-xs font-mono">
          {repeatedMovements.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center mx-6 shrink-0 gap-2">
              {item.type === 'IN' && (
                <span className="flex items-center text-[#a6f2d1] font-bold text-[11px]">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> IN
                </span>
              )}
              {item.type === 'OUT' && (
                <span className="flex items-center text-rose-300 font-bold text-[11px]">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> OUT
                </span>
              )}
              {item.type === 'TR' && (
                <span className="flex items-center text-[#fed65b] font-bold text-[11px]">
                  <ArrowRight className="w-3.5 h-3.5 mr-0.5" /> TRANSIT
                </span>
              )}
              {item.type === 'PRICE' && (
                <span className="flex items-center text-[#fed65b] font-bold text-[11px]">
                  <Activity className="w-3.5 h-3.5 mr-0.5" /> SPOT
                </span>
              )}

              <span className="font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
                {item.tagNo}
              </span>

              <span className="text-slate-300 text-xs">
                {item.description}
              </span>

              <span className="text-[10px] text-slate-400">({item.timeAgo})</span>
              <span className="text-slate-600 ml-4 font-normal">◆</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
