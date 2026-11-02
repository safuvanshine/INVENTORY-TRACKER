import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'gold' | 'emerald' | 'navy' | 'crimson' | 'neutral' | 'in-transit';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'neutral', children, icon, className, size = 'md' }: BadgeProps) {
  const variantStyles = {
    gold: 'bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/50',
    emerald: 'bg-[#002116] text-[#a6f2d1] border border-[#479175]/30',
    navy: 'bg-[#131b2e] text-[#dae2fd] border border-[#3f465c]/40',
    crimson: 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30',
    neutral: 'bg-[#eceef0] text-[#45464d] border border-[#c6c6cd]/50',
    'in-transit': 'bg-[#ffe088]/30 text-[#574500] border border-[#d4af37]/40'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 font-medium tracking-wide'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full transition-all',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
