// web-dashboard/src/components/ModeToggle.tsx

type DashboardMode = 'live' | 'analytics' | 'trends';

type ModeToggleProps = {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1 gap-1 border border-slate-200">
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'live'
            ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        onClick={() => onChange('live')}
      >
        Live Ops
      </button>
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'analytics'
            ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        onClick={() => onChange('analytics')}
      >
        Analytics
      </button>
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'trends'
            ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        onClick={() => onChange('trends')}
      >
        Trends
      </button>
    </div>
  );
}

export type { DashboardMode };
