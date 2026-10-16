import React from 'react';
import { PriceTier } from '../../domain/types';

interface PriceTierBadgeProps {
  tier: PriceTier;
  size?: 'sm' | 'md';
}

export const PriceTierBadge: React.FC<PriceTierBadgeProps> = ({ tier, size = 'sm' }) => {
  const configs: Record<PriceTier, { label: string; bg: string; text: string; border: string }> = {
    RETAIL: {
      label: 'Eceran',
      bg: 'bg-sage-50',
      text: 'text-sage-700',
      border: 'border-sage-300',
    },
    WHOLESALE_1: {
      label: 'Grosir 1',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    WHOLESALE_2: {
      label: 'Grosir 2 (Super)',
      bg: 'bg-magenta-50',
      text: 'text-magenta-700',
      border: 'border-magenta-300',
    },
  };

  const cfg = configs[tier] || configs.RETAIL;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      {cfg.label}
    </span>
  );
};
