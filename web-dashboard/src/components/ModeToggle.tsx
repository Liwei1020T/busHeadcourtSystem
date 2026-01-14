// web-dashboard/src/components/ModeToggle.tsx

type DashboardMode = 'live' | 'analytics';

type ModeToggleProps = {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'live'
            ? 'bg-cyan-500 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
        onClick={() => onChange('live')}
      >
        Live Ops
      </button>
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'analytics'
            ? 'bg-cyan-500 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
        onClick={() => onChange('analytics')}
      >
        Analytics
      </button>
    </div>
  );
}

export type { DashboardMode };
