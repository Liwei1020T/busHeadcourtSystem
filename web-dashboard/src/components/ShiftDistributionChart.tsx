import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TYPOGRAPHY } from '@/lib/design-system/tokens';
import { HeadcountRow } from '../types';
import { useMemo } from 'react';

interface ShiftDistributionChartProps {
  rows: HeadcountRow[];
  loading?: boolean;
}

const SHIFT_COLORS = {
  morning: '#10b981',
  night: '#6366f1',
  unknown: '#9ca3af',
};

export default function ShiftDistributionChart({ rows, loading }: ShiftDistributionChartProps) {
  // Aggregate data by shift
  const chartData = useMemo(() => {
    const counts = {
      morning: 0,
      night: 0,
      unknown: 0,
    };
    
    rows.forEach(row => {
      const shift = row.shift as 'morning' | 'night' | 'unknown';
      if (counts.hasOwnProperty(shift)) {
        counts[shift] += row.present;
      }
    });
    
    return [
      { name: 'Morning Shift', value: counts.morning, color: SHIFT_COLORS.morning },
      { name: 'Night Shift', value: counts.night, color: SHIFT_COLORS.night },
      ...(counts.unknown > 0 ? [{ name: 'Unknown', value: counts.unknown, color: SHIFT_COLORS.unknown }] : []),
    ].filter(item => item.value > 0);
  }, [rows]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (loading || chartData.length === 0) {
    return null;
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
        Shift Distribution
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            formatter={(value: number) => [`${value} passengers`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Total: {total.toLocaleString()} passengers
      </p>
    </Card>
  );
}
