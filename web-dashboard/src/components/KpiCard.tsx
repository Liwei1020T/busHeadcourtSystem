import { Card } from '@/components/ui/card';
import { KPI_COLORS, TYPOGRAPHY } from '@/lib/design-system/tokens';

type KpiCardProps = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
};

export default function KpiCard({ title, value, subtitle, icon, color = 'blue' }: KpiCardProps) {
  const displayValue = value === null || value === undefined ? '-' : value;
  const colors = KPI_COLORS[color];
  
  return (
    <Card className={`p-6 border-l-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={TYPOGRAPHY.labelUppercase}>
            {title}
          </p>
          <p className={`mt-2 ${TYPOGRAPHY.kpiValue} text-gray-900`}>
            {displayValue}
          </p>
          {subtitle && (
            <p className={`mt-1 ${TYPOGRAPHY.kpiLabel}`}>
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
    </Card>
  );
}
