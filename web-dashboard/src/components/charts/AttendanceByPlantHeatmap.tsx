// web-dashboard/src/components/charts/AttendanceByPlantHeatmap.tsx

import { Calendar } from 'lucide-react';

type HeatmapDataPoint = {
  day: string;
  plant: string;
  attendanceRate: number;
};

type AttendanceByPlantHeatmapProps = {
  data: HeatmapDataPoint[];
  plants: string[];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getHeatColor(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500 text-white';
  if (rate >= 90) return 'bg-emerald-400 text-white';
  if (rate >= 85) return 'bg-emerald-300 text-emerald-900';
  if (rate >= 80) return 'bg-amber-300 text-amber-900';
  if (rate >= 70) return 'bg-amber-400 text-white';
  return 'bg-red-400 text-white';
}

export default function AttendanceByPlantHeatmap({ data, plants }: AttendanceByPlantHeatmapProps) {
  // Build a lookup map for quick access
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(`${d.plant}-${d.day}`, d.attendanceRate);
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-500" />
        Attendance by Plant (Weekly)
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-slate-500 font-medium py-2 px-1">Plant</th>
              {DAYS.map(day => (
                <th key={day} className="text-center text-slate-500 font-medium py-2 px-1">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.map(plant => (
              <tr key={plant}>
                <td className="font-semibold text-slate-700 py-1 px-1">{plant}</td>
                {DAYS.map(day => {
                  const rate = dataMap.get(`${plant}-${day}`) ?? 0;
                  return (
                    <td key={day} className="p-1">
                      <div
                        className={`rounded px-2 py-1.5 text-center font-mono font-medium ${getHeatColor(rate)}`}
                        title={`${plant} ${day}: ${rate.toFixed(1)}%`}
                      >
                        {rate.toFixed(0)}%
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
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs">
        <span className="text-slate-500">Attendance:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-400"></div>
          <span className="text-slate-500">&lt;70%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-amber-400"></div>
          <span className="text-slate-500">70-85%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-400"></div>
          <span className="text-slate-500">85-95%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-slate-500">&gt;95%</span>
        </div>
      </div>
    </div>
  );
}
