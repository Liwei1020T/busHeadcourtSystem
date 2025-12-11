import { Card } from '@/components/ui/card';
import { KPI_COLORS, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

type KpiCardProps = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  onClick?: () => void;
};

export default function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue',
  onClick 
}: KpiCardProps) {
  const displayValue = value === null || value === undefined ? '-' : value;
  const numericValue = typeof value === 'number' ? value : 0;
  const isNumeric = typeof value === 'number';
  const colors = KPI_COLORS[color];
  
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card 
        className={`
          p-6 border-l-4 h-full
          bg-gradient-to-br ${colors.bg} ${colors.border}
          transition-shadow duration-300 hover:shadow-lg
          ${onClick ? 'cursor-pointer' : ''}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`${TYPOGRAPHY.labelUppercase} mb-2`}>
              {title}
            </p>
            <p className={`${TYPOGRAPHY.kpiValue} ${colors.text}`}>
              {isNumeric ? (
                <CountUp
                  end={numericValue}
                  duration={1.5}
                  separator=","
                  preserveValue
                />
              ) : (
                displayValue
              )}
            </p>
            {subtitle && (
              <p className={`mt-2 ${TYPOGRAPHY.kpiLabel}`}>
                {subtitle}
              </p>
            )}
            {onClick && (
              <p className="mt-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to filter →
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-full ${colors.bg}`}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
