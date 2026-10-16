import React, { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-xl border border-dashed border-border my-4">
      <div className="p-3 bg-canvas text-muted rounded-full mb-3">
        {icon || <PackageOpen className="w-8 h-8 text-muted" />}
      </div>
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white shadow-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-sage-100/70 rounded ${className}`} />;
};
