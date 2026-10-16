import React from 'react';
import { OrderStatus } from '../../domain/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Draf', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  CONFIRMED: { label: 'Terkonfirmasi', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  PROCESSING: { label: 'Diproses Gudang', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
  READY_TO_SHIP: { label: 'Siap Kirim', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
  SHIPPED: { label: 'Dalam Pengiriman', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
  DELIVERED: { label: 'Terkirim', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
  COMPLETED: { label: 'Selesai', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  CANCELLED: { label: 'Dibatalkan', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status] || {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
};
