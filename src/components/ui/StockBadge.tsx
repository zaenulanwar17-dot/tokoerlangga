import React from 'react';
import { StockStatus } from '../../domain/types';

interface StockBadgeProps {
  status: StockStatus;
  availableCount?: number;
  unit?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ status, availableCount, unit = 'pcs' }) => {
  if (status === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-danger border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
        Habis
      </span>
    );
  }

  if (status === 'LOW_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-warning border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
        {availableCount !== undefined ? `Sisa ${availableCount} ${unit}` : 'Stok Menipis'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-success border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
      {availableCount !== undefined ? `${availableCount} ${unit} tersedia` : 'Tersedia'}
    </span>
  );
};
