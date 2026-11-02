import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon: React.ReactNode;
  accentColor?: 'gold' | 'navy' | 'emerald' | 'crimson';
  extraContent?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  subtext,
  trend,
  icon,
  accentColor = 'gold',
  extraContent,
  className
}: MetricCardProps) {
  const accentBgs = {
    gold: 'bg-[#fed65b]/10 group-hover:scale-110 text-[#d4af37]',
    navy: 'bg-[#131b2e]/10 group-hover:scale-110 text-[#0f172a]',
    emerald: 'bg-[#065f46]/10 group-hover:scale-110 text-[#065f46]',
    crimson: 'bg-[#ba1a1a]/10 group-hover:scale-110 text-[#ba1a1a]'
  };

  const iconColors = {
    gold: 'text-[#d4af37]',
    navy: 'text-[#0f172a]',
    emerald: 'text-[#065f46]',
    crimson: 'text-[#ba1a1a]'
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:border-slate-300',
        className
      )}
    >
      {/* Decorative ambient bloom */}
      <div
        className={cn(
          'absolute right-0 top-0 w-36 h-36 rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 pointer-events-none',
          accentBgs[accentColor]
        )}
      />

      <div className="flex justify-between items-start mb-3 relative z-10">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          {title}
        </h3>
        <div className={cn('p-2 rounded-lg bg-slate-50 transition-colors', iconColors[accentColor])}>
          {icon}
        </div>
      </div>

      <div className="relative z-10 flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold tracking-tight text-slate-900 font-headline">
          {value}
        </span>
        {unit && (
          <span className="text-base text-slate-500 font-medium">
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 relative z-10">
          <span className="inline-block">↑</span>
          <span>{trend.value}</span>
        </div>
      )}

      {subtext && !trend && (
        <div className="mt-3 text-xs text-slate-500 font-medium relative z-10">
          {subtext}
        </div>
      )}

      {extraContent && (
        <div className="mt-3 pt-3 border-t border-slate-100 relative z-10">
          {extraContent}
        </div>
      )}
    </div>
  );
}
