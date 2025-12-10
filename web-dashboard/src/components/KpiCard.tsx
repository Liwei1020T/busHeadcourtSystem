type KpiCardProps = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
};

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export default function KpiCard({ title, value, subtitle, icon, color = 'blue' }: KpiCardProps) {
  const displayValue = value === null || value === undefined ? '-' : value;
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {displayValue}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-full bg-gray-100">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
