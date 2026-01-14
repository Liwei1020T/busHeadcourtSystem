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
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm font-medium">Status:</span>

        <button
          onClick={() => onFilterClick(activeFilter === 'critical' ? null : 'critical')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'critical'
              ? 'bg-red-500 text-white'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {counts.critical} Critical
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'warning' ? null : 'warning')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {counts.warning} Warning
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'normal' ? null : 'normal')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'normal'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {counts.normal} Normal
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 p-1"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
