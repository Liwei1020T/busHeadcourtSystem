// web-dashboard/src/components/charts/AttendanceHeatmap.tsx

type HeatmapCell = {
  day: string;
  shift: string;
  value: number; // 0-100 attendance percentage
};

type AttendanceHeatmapProps = {
  data: HeatmapCell[];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = ['Morning', 'Night'];

function getHeatColor(value: number): string {
  if (value >= 95) return 'bg-emerald-500';
  if (value >= 90) return 'bg-emerald-400';
  if (value >= 85) return 'bg-emerald-300';
  if (value >= 80) return 'bg-amber-300';
  if (value >= 70) return 'bg-amber-400';
  if (value >= 60) return 'bg-red-300';
  return 'bg-red-400';
}

export default function AttendanceHeatmap({ data }: AttendanceHeatmapProps) {
  const getValue = (day: string, shift: string): number | null => {
    const cell = data.find((d) => d.day === day && d.shift === shift);
    return cell?.value ?? null;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
        Attendance Heatmap
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs text-slate-500 font-medium"></th>
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-xs text-slate-500 font-medium text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift}>
                <td className="p-2 text-xs text-slate-600 font-medium">{shift}</td>
                {DAYS.map((day) => {
                  const value = getValue(day, shift);
                  return (
                    <td key={day} className="p-1">
                      <div
                        className={`w-full h-8 rounded flex items-center justify-center text-xs font-semibold ${
                          value !== null
                            ? `${getHeatColor(value)} text-white`
                            : 'bg-slate-100 text-slate-400'
                        }`}
                        title={value !== null ? `${value.toFixed(1)}%` : 'No data'}
                      >
                        {value !== null ? `${Math.round(value)}%` : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs">
        <span className="text-slate-500">Low</span>
        <div className="flex gap-1">
          <span className="w-4 h-4 rounded bg-red-400" />
          <span className="w-4 h-4 rounded bg-amber-400" />
          <span className="w-4 h-4 rounded bg-emerald-300" />
          <span className="w-4 h-4 rounded bg-emerald-500" />
        </div>
        <span className="text-slate-500">High</span>
      </div>
    </div>
  );
}
