// web-dashboard/src/components/AlertBanner.tsx

import { X } from 'lucide-react';
import { SeverityLevel } from '../lib/theme';

type StatusCounts = {
  critical: number;
  warning: number;
  normal: number;
};

type AlertBannerProps = {
  counts: StatusCounts;
  onFilterClick: (level: SeverityLevel | null) => void;
  activeFilter: SeverityLevel | null;
  onDismiss: () => void;
};

export default function AlertBanner({ counts, onFilterClick, activeFilter, onDismiss }: AlertBannerProps) {
  const hasIssues = counts.critical > 0 || counts.warning > 0;

  if (!hasIssues) return null;

  return (
    <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-red-800 text-sm font-medium">Status:</span>

        <button
          onClick={() => onFilterClick(activeFilter === 'critical' ? null : 'critical')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'critical'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'critical' ? 'bg-white' : 'bg-red-500'}`} />
          {counts.critical} Critical
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'warning' ? null : 'warning')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'warning'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'warning' ? 'bg-white' : 'bg-amber-500'}`} />
          {counts.warning} Warning
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'normal' ? null : 'normal')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'normal'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'normal' ? 'bg-white' : 'bg-emerald-500'}`} />
          {counts.normal} Normal
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 p-1 transition-colors"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
